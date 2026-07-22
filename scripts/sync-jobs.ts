/**
 * Pulls new postings from all configured sources and upserts them into
 * the database, then re-scores them against every user's profile.
 *
 * Run manually with `npm run sync-jobs`, or on a schedule via any free
 * scheduler — e.g. a GitHub Actions cron workflow, a Railway cron job,
 * or a system crontab. This replaces the paid-automation-platform role
 * that Make.com plays in other projects, at no cost.
 *
 * Example GitHub Actions schedule (every 3 days):
 *   on:
 *     schedule:
 *       - cron: "0 8 *\/3 * *"
 */

import { db } from "../lib/db";
import { fetchArbeitnowJobs } from "../lib/sources/arbeitnow";
import { fetchGreenhouseJobs } from "../lib/sources/greenhouse";
import { fetchLeverJobs } from "../lib/sources/lever";
import { extractListedApplyEmail } from "../lib/sources/extractListedEmail";
import { scoreMatch } from "../lib/engine/matchEngine";
import type { RawPosting } from "../lib/sources/arbeitnow";
import type { JobPostingAnalysis, Profile } from "../lib/profileSchema";

async function collectAllPostings(): Promise<RawPosting[]> {
  const users = await db.user.findMany({
    select: {
      searchNiche: true,
      searchLocation: true,
      greenhouseBoards: true,
      leverBoards: true,
    },
  });

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
  const niches = new Set<string>();
  let anyLocation: string | undefined;

  for (const u of users) {
    u.greenhouseBoards.forEach((b: string) => greenhouseBoards.add(b));
    u.leverBoards.forEach((b: string) => leverBoards.add(b));
    if (u.searchNiche) niches.add(u.searchNiche);
    if (u.searchLocation) anyLocation = u.searchLocation;
  }

  const results: RawPosting[] = [];

  // Arbeitnow: one call per distinct niche keyword users have set.
  for (const niche of niches.size ? niches : [""]) {
    try {
      const jobs = await fetchArbeitnowJobs({
        keyword: niche || undefined,
        location: anyLocation,
      });
      results.push(...jobs);
    } catch (err) {
      console.error("Arbeitnow fetch failed:", err);
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
  // dependency-free here so the sync script runs fast and cheaply.
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

async function main() {
  console.log("Starting job sync...");
  const rawPostings = await collectAllPostings();
  console.log(`Fetched ${rawPostings.length} postings from all sources.`);

  let created = 0;
  const storedPostings: { id: string; analysis: JobPostingAnalysis }[] = [];

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

    created++;
    storedPostings.push({ id: posting.id, analysis: rawPostingToAnalysis(raw) });
  }

  console.log(`Upserted ${created} postings. Scoring against user profiles...`);

  const usersWithProfiles = await db.user.findMany({
    include: { profile: true },
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

    for (const { id, analysis } of storedPostings) {
      const match = scoreMatch(analysis, profile);

      // Only surface postings above a minimal relevance bar to avoid
      // flooding the dashboard.
      if (match.matchScore < 40) continue;

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
      suggestionsCreated++;
    }
  }

  console.log(`Sync complete. ${suggestionsCreated} suggestions updated/created.`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error("Job sync failed:", err);
  process.exit(1);
});
