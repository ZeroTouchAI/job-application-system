import type { RawPosting } from "./arbeitnow";
import { db } from "../db";
import { planBoardsRun } from "./budget";
import { isCanadian } from "./canada";
import { normalizePeriod, normalizeWorkMode } from "../salary";
import type { PostingExtras } from "../salary";

/**
 * Apify job-board source (Indeed + LinkedIn by default) via
 * agentx/all-jobs-scraper, chosen after a capped test on 2026-11-05:
 * clean Canadian output, official apply URLs on Indeed rows, and the only
 * candidate whose cost is fully predictable ($0.01 per run + $0.0035 per
 * result, platform usage paid by the actor author).
 *
 * NOTE: these boards' terms prohibit scraping. This is a deliberate choice by
 * the owner, off unless APIFY_TOKEN is set. See docs/scraping-policy.md.
 *
 * Env:
 *   APIFY_TOKEN              required, otherwise this source is a no-op
 *   APIFY_BOARDS_ACTOR       default "agentx~all-jobs-scraper"
 *   APIFY_BOARD_PLATFORMS    default "Indeed,LinkedIn" (comma separated)
 *   APIFY_COUNTRY            default "Canada"
 * Budget env: see ./budget.ts
 *
 * One run per saved search (keyword + location). Searches without a keyword
 * are skipped.
 */

const API = "https://api.apify.com/v2";
const POLL_MS = 10_000;
const MAX_WAIT_MS = 12 * 60_000;
const TERMINAL = new Set(["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]);

type Item = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

async function runActor(
  token: string,
  actorId: string,
  input: unknown,
  maxItems: number,
  maxChargeUsd: number
): Promise<Item[]> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const startUrl = new URL(`${API}/acts/${encodeURIComponent(actorId)}/runs`);
  startUrl.searchParams.set("maxItems", String(maxItems));
  startUrl.searchParams.set("maxTotalChargeUsd", maxChargeUsd.toFixed(3));

  const startRes = await fetch(startUrl.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  if (!startRes.ok) {
    throw new Error(`Apify start failed: ${startRes.status} ${startRes.statusText}`);
  }
  const started = (await startRes.json()) as {
    data: { id: string; defaultDatasetId: string };
  };
  const runId = started.data.id;
  const datasetId = started.data.defaultDatasetId;

  const deadline = Date.now() + MAX_WAIT_MS;
  let status = "RUNNING";
  let usageUsd: number | null = null;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const res = await fetch(`${API}/actor-runs/${runId}`, { headers });
    if (!res.ok) continue;
    const run = (await res.json()) as {
      data: { status: string; usageTotalUsd?: number };
    };
    status = run.data.status;
    usageUsd = run.data.usageTotalUsd ?? null;
    if (TERMINAL.has(status)) break;
  }

  console.log(
    `Apify run ${runId}: ${status}, cost ${usageUsd === null ? "unknown" : `$${usageUsd.toFixed(4)}`}`
  );

  // A run stopped by the spend cap ends ABORTED but still keeps what it
  // already produced, so read the dataset whatever the final status was.
  const itemsRes = await fetch(
    `${API}/datasets/${datasetId}/items?clean=true&limit=${maxItems}`,
    { headers }
  );
  if (!itemsRes.ok) {
    throw new Error(`Apify dataset read failed: ${itemsRes.status}`);
  }
  const items = (await itemsRes.json()) as Item[];
  return Array.isArray(items) ? items : [];
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function toPosting(item: Item): (RawPosting & PostingExtras) | null {
  const title = str(item["title"]);
  const platform = (str(item["platform"]) || "board").toLowerCase();
  const platformUrl = str(item["platform_url"]);
  const applyUrl = str(item["official_url"]) || platformUrl;
  if (!title || !applyUrl) return null;

  const loc = item["location"];
  let location: string | null = null;
  if (loc && typeof loc === "object") {
    const o = loc as Item;
    location =
      str(o["raw"]) ||
      [o["locality"], o["region"], o["country"]]
        .filter((p): p is string => typeof p === "string" && !!p)
        .join(", ") ||
      null;
  } else {
    location = str(loc);
  }

  const description = str(item["description"]);

  return {
    source: "apify",
    sourceId: `${platform}:${platformUrl || applyUrl}`,
    title,
    company: str(item["company_name"]) || "Unknown",
    location,
    remote: item["is_remote"] === true || normalizeWorkMode(str(item["work_mode"])) === "remote",
    rawText: description || title,
    applyUrl,
    applyEmail: null,
    salaryMin: num(item["salary_minimum"]),
    salaryMax: num(item["salary_maximum"]),
    salaryCurrency: str(item["salary_currency"]),
    salaryPeriod: normalizePeriod(str(item["salary_period"])),
    logoUrl: str(item["company_logo"]),
    postedAt: str(item["posted_date"]),
    workMode: normalizeWorkMode(str(item["work_mode"])),
  };
}

export async function fetchApifyJobs(): Promise<(RawPosting & PostingExtras)[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return []; // same no-op pattern as USAJobs

  const actorId = process.env.APIFY_BOARDS_ACTOR || "agentx~all-jobs-scraper";
  const platforms = (process.env.APIFY_BOARD_PLATFORMS || "Indeed,LinkedIn")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const country = process.env.APIFY_COUNTRY || "Canada";

  // Only pay for postings newer than the last daily run. The sync runs every
  // morning, so a 1 day window means every result is new that day.
  const sinceDays = Math.max(1, Math.floor(Number(process.env.APIFY_POSTED_SINCE_DAYS) || 1));
  const postedSince = new Date(Date.now() - sinceDays * 86_400_000).toISOString().slice(0, 10);

  // Distinct saved searches that have a keyword.
  const criteria = await db.searchCriteria.findMany();
  const seen = new Set<string>();
  const searches: { keyword: string; location: string }[] = [];
  for (const c of criteria as { niche: string; location: string | null }[]) {
    const keyword = c.niche?.trim();
    if (!keyword) continue;
    const location = c.location?.trim() || country;
    const key = `${keyword.toLowerCase()}|${location.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    searches.push({ keyword, location });
  }
  if (searches.length === 0) return [];

  const plan = planBoardsRun(searches.length, platforms.length);
  if (plan.searches === 0 || plan.maxItemsPerSearch < platforms.length) {
    console.warn("Apify: per-run budget too small for any search; skipping.");
    return [];
  }
  if (plan.searches < searches.length) {
    console.warn(
      `Apify: budget covers ${plan.searches} of ${searches.length} saved searches this run.`
    );
  }

  const out: (RawPosting & PostingExtras)[] = [];
  for (const search of searches.slice(0, plan.searches)) {
    try {
      const items = await runActor(
        token,
        actorId,
        {
          country,
          keyword: search.keyword,
          location: search.location,
          platforms,
          posted_since: postedSince,
          // Ask for CAD so pay is comparable across boards.
          currency: "CAD",
          // max_results is per platform for this actor.
          max_results: Math.max(1, Math.floor(plan.maxItemsPerSearch / platforms.length)),
        },
        plan.maxItemsPerSearch,
        plan.perSearchUsd
      );
      for (const item of items) {
        const posting = toPosting(item);
        if (posting && isCanadian(posting.location, posting.remote)) out.push(posting);
      }
    } catch (err) {
      console.error(`Apify search "${search.keyword}" failed:`, err);
    }
  }
  return out;
}
