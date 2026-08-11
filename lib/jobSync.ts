import { db } from "./db";
import { fetchArbeitnowJobs } from "./sources/arbeitnow";
import { fetchGreenhouseJobs } from "./sources/greenhouse";
import { fetchLeverJobs } from "./sources/lever";
import { fetchUsaJobs } from "./sources/usajobs";
import { fetchRssJobs } from "./sources/rss";
import { extractListedApplyEmail } from "./sources/extractListedEmail";
import { scoreMatch, locationMatches } from "./engine/matchEngine";
import type { MatchResult } from "./engine/matchEngine";
import type { RawPosting } from "./sources/arbeitnow";
import type { JobPostingAnalysis, Profile } from "./profileSchema";

export interface JobSyncResult {
  postingsFetched: number;
  postingsUpserted: number;
  suggestionsCreated: number;
}

// Cap on concurrent application upserts per user, so a sync with a
// very large number of qualifying postings doesn't try to open
// hundreds of simultaneous DB connections at once.
const UPSERT_CONCURRENCY = 25;

async function collectAllPostings(): Promise<RawPosting[]> {
  const allCriteria = await db.searchCriteria.findMany();

  const defaultGreenhouse = (process.env.GREENHOUSE_DEFAULT_BOARDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaultLever = (process.env.LEVER_DEFAULT_BOARDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const greenhouseBoards = new Set(defaultGreenhouse);
  const leverBoards = new Set(defaultLever);

  for (const c of allCriteria) {
    c.greenhouseBoards.forEach((b: string) => greenhouseBoards.add(b));
    c.leverBoards.forEach((b: string) => leverBoards.add(b));
  }

  const results: RawPosting[] = [];

  // Arbeitnow: one call per distinct saved search (niche + location),
  // so each tracked role gets its own targeted results rather than
  // everything being blended into one generic query.
  const searches = allCriteria.length
    ? allCriteria.map((c: { niche: string; location: string | null }) => ({
        keyword: c.niche,
        location: c.location || undefined,
      }))
    : [{ keyword: undefined, location: undefined }];

  for (const search of searches) {
    try {
      const jobs = await fetchArbeitnowJobs(search);
      results.push(...jobs);
    } catch (err) {
      console.error("Arbeitnow fetch failed:", err);
    }
  }

  // USAJobs: same one-call-per-saved-search pattern as Arbeitnow. No-ops
  // (returns []) if USAJOBS_API_KEY/USAJOBS_USER_AGENT aren't set.
  for (const search of searches) {
    try {
      const jobs = await fetchUsaJobs(search);
      results.push(...jobs);
    } catch (err) {
      console.error("USAJobs fetch failed:", err);
    }
  }

  // RSS: any feed URLs a user has attached to one of their saved
  // searches — e.g. a saved-search feed from a regional job board.
  const rssFeeds = new Set<string>();
  for (const c of allCriteria) {
    c.rssFeeds.forEach((feedUrl: string) => rssFeeds.add(feedUrl));
  }
  for (const feedUrl of rssFeeds) {
    try {
      results.push(...(await fetchRssJobs(feedUrl)));
    } catch (err) {
      console.error(`RSS fetch failed for "${feedUrl}":`, err);
    }
  }

  for (const board of greenhouseBoards) {
    try {
      results.push(...(await fetchGreenhouseJobs(board)));
    } catch (err) {
      console.error(`Greenhouse fetch failed for "${board}":`, err);
    }
  }

  for (const company of leverBoards) {
    try {
      results.push(...(await fetchLeverJobs(company)));
    } catch (err) {
      console.error(`Lever fetch failed for "${company}":`, err);
    }
  }

  return results;
}

function rawPostingToAnalysis(raw: RawPosting): JobPostingAnalysis {
  // Lightweight keyword extraction. In production this step benefits
  // from an LLM pass (see lib/engine — a future jobPostingParser can
  // reuse the same Anthropic client as generateResume.ts). Kept
  // dependency-free here so a sync run stays fast and cheap.
  const words = raw.rawText
    .toLowerCase()
    .split(/[^a-z0-9+.#]+/)
    .filter((w) => w.length > 3);

  const uniqueWords = [...new Set(words)].slice(0, 40);

  return {
    title: raw.title,
    company: raw.company,
    requiredSkills: uniqueWords,
    preferredSkills: [],
    certificationsRequired: [],
    softwareRequired: [],
    atsKeywords: uniqueWords,
    rawText: raw.rawText,
  };
}

/** Runs an array of async tasks with at most `size` running concurrently. */
async function runInBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    await Promise.all(chunk.map(fn));
  }
}

/**
 * Decides whether a posting is allowed through for a given user, based
 * on their saved searches' location fields.
 *
 * Rules (per product decision): if the user has at least one saved
 * search with NO location set, treat that as "anywhere is fine" and
 * don't filter by location at all. Otherwise, a posting must either be
 * remote, or location-match at least one of the user's saved searches,
 * to be shown — this is a hard gate, not a scoring factor, so a great
 * skill match in the wrong city is excluded outright.
 */
function userAllowsPostingLocation(
  posting: { location: string | null; remote: boolean },
  criteria: { location: string | null }[]
): boolean {
  if (criteria.length === 0) return true; // no saved searches yet — nothing to filter by

  const locationCriteria = criteria.filter((c) => c.location && c.location.trim());
  if (locationCriteria.length === 0) return true; // every saved search is location-agnostic

  if (posting.remote) return true; // remote roles are accessible regardless of the posted location

  return locationCriteria.some((c) => locationMatches(posting.location, c.location as string));
}

/**
 * Runs a full job sync: fetches postings from all configured sources,
 * upserts them into the database, then re-scores them against every
 * user's profile.
 *
 * Shared between the CLI entry point (scripts/sync-jobs.ts, used by the
 * scheduled cron job — see .github/workflows/sync-jobs.yml) and the
 * manual "sync now" API route (app/api/jobs/sync/route.ts), so both
 * paths run identical logic instead of drifting apart.
 *
 * Callers own the Prisma connection lifecycle — this function does not
 * call db.$disconnect(). The API route reuses a long-lived client across
 * requests, so disconnecting here would break it; only the standalone
 * CLI script should disconnect after calling this.
 */
export async function runJobSync(): Promise<JobSyncResult> {
  const rawPostings = await collectAllPostings();

  let postingsUpserted = 0;
  const storedPostings: {
    id: string;
    location: string | null;
    remote: boolean;
    analysis: JobPostingAnalysis;
  }[] = [];

  for (const raw of rawPostings) {
    const applyEmail = extractListedApplyEmail(raw.rawText);

    const posting = await db.jobPosting.upsert({
      where: { source_sourceId: { source: raw.source, sourceId: raw.sourceId } },
      update: {
        title: raw.title,
        company: raw.company,
        location: raw.location,
        remote: raw.remote,
        rawText: raw.rawText,
        applyUrl: raw.applyUrl,
        applyEmail,
      },
      create: {
        source: raw.source,
        sourceId: raw.sourceId,
        title: raw.title,
        company: raw.company,
        location: raw.location,
        remote: raw.remote,
        rawText: raw.rawText,
        applyUrl: raw.applyUrl,
        applyEmail,
      },
    });

    postingsUpserted++;
    storedPostings.push({
      id: posting.id,
      location: raw.location,
      remote: raw.remote,
      analysis: rawPostingToAnalysis(raw),
    });
  }

  const usersWithProfiles = await db.user.findMany({
    include: { profile: true, searchCriteria: true },
  });

  let suggestionsCreated = 0;

  for (const user of usersWithProfiles) {
    if (!user.profile) continue;

    const profile: Profile = {
      fullName: user.profile.fullName ?? undefined,
      email: user.profile.email ?? undefined,
      phone: user.profile.phone ?? undefined,
      location: user.profile.location ?? undefined,
      linkedinUrl: user.profile.linkedinUrl ?? undefined,
      workExperience: user.profile.workExperience as Profile["workExperience"],
      certifications: user.profile.certifications as Profile["certifications"],
      technicalSkills: user.profile.technicalSkills as Profile["technicalSkills"],
      knownGaps: user.profile.knownGaps,
    };

    // Score everything up front and keep only postings above a minimal
    // relevance bar to avoid flooding the dashboard, AND that pass this
    // user's own saved-search location filter (see
    // userAllowsPostingLocation above) — a location is a hard
    // requirement, not something a good skill match can override.
    // NOTE: 15-point bar lowered from 40 while the match scoring is still
    // based on crude keyword overlap rather than a richer comparison - a
    // strict threshold here can hide genuinely relevant postings. Revisit
    // once matchEngine.ts scoring is improved (e.g. LLM-assisted).
    const qualifying: { id: string; match: MatchResult }[] = [];
    for (const { id, location, remote, analysis } of storedPostings) {
      if (!userAllowsPostingLocation({ location, remote }, user.searchCriteria)) continue;
      const match = scoreMatch(analysis, profile);
      if (match.matchScore < 15) continue;
      qualifying.push({ id, match });
    }

    if (qualifying.length === 0) {
      await db.user.update({
        where: { id: user.id },
        data: { lastSyncNewCount: 0, lastSyncAt: new Date() },
      });
      continue;
    }

    // One query for all of this user's existing applications among the
    // qualifying postings, instead of one findUnique() per posting, so
    // we can still report how many are genuinely NEW this run.
    const existingApps = await db.application.findMany({
      where: {
        userId: user.id,
        jobPostingId: { in: qualifying.map((q) => q.id) },
      },
      select: { jobPostingId: true },
    });
    const existingIds = new Set(existingApps.map((a) => a.jobPostingId));

    await runInBatches(qualifying, UPSERT_CONCURRENCY, async ({ id, match }) => {
      await db.application.upsert({
        where: { userId_jobPostingId: { userId: user.id, jobPostingId: id } },
        update: {
          matchScore: match.matchScore,
          keywordsMatched: match.keywordsMatched,
          keywordsMissing: match.keywordsMissing,
        },
        create: {
          userId: user.id,
          jobPostingId: id,
          matchScore: match.matchScore,
          keywordsMatched: match.keywordsMatched,
          keywordsMissing: match.keywordsMissing,
          status: "suggested",
        },
      });
    });

    const newForUser = qualifying.filter((q) => !existingIds.has(q.id)).length;
    suggestionsCreated += qualifying.length;

    await db.user.update({
      where: { id: user.id },
      data: { lastSyncNewCount: newForUser, lastSyncAt: new Date() },
    });
  }

  return {
    postingsFetched: rawPostings.length,
    postingsUpserted,
    suggestionsCreated,
  };
}
