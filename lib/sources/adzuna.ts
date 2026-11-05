import type { RawPosting } from "./arbeitnow";

/**
 * Adzuna search API (Canada). Gated: no-ops unless ADZUNA_APP_ID and
 * ADZUNA_APP_KEY are set. Registry status stays "unverified" because the
 * free tier is for evaluation and a public launch needs a commercial
 * licence (see docs/sources.md). Cards must show "Jobs by Adzuna" linking
 * back. Results are redirect links with truncated descriptions.
 *
 * Quota: free-tier limits are reported inconsistently; check the Adzuna
 * dashboard. Sync runs every 3rd day, one call per saved search.
 */

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
}

export async function fetchAdzunaJobs(params: {
  keyword?: string;
  location?: string;
}): Promise<RawPosting[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const country = (process.env.ADZUNA_COUNTRY || "ca").toLowerCase();
  const url = new URL(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1`
  );
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", "50");
  url.searchParams.set("max_days_old", "7");
  if (params.keyword) url.searchParams.set("what", params.keyword);
  if (params.location) url.searchParams.set("where", params.location);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Adzuna API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as AdzunaResponse;

  return (json.results || []).map((job) => {
    const location = job.location?.display_name || null;
    return {
      source: "adzuna",
      sourceId: String(job.id),
      title: job.title,
      company: job.company?.display_name || "Unknown",
      location,
      remote: /remote/i.test(`${job.title} ${location || ""}`),
      rawText: job.description,
      applyUrl: job.redirect_url,
      applyEmail: null,
    };
  });
}
