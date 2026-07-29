/**
 * Arbeitnow — free, public Job Board API. No auth required for the
 * basic endpoint. See https://www.arbeitnow.com
 *
 * This is a legitimate aggregator API, explicitly offered for building
 * side projects on top of. No ToS conflict.
 */

export interface RawPosting {
  source: string;
  sourceId: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  rawText: string;
  applyUrl: string | null;
  applyEmail: string | null; // Arbeitnow never provides this — always null
}

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  location: string;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

export async function fetchArbeitnowJobs(params: {
  keyword?: string;
  location?: string;
}): Promise<RawPosting[]> {
  const url = new URL("https://www.arbeitnow.com/api/job-board-api");
  // NOTE: Arbeitnow's API does not actually support server-side search
  // or filtering (confirmed via their own community docs) — this param
  // is sent in case that changes, but don't rely on it. Filtering
  // happens client-side below instead.
  if (params.keyword) url.searchParams.set("search", params.keyword);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Arbeitnow API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as ArbeitnowResponse;

  const toPosting = (job: ArbeitnowJob): RawPosting => ({
    source: "arbeitnow",
    sourceId: job.slug,
    title: job.title,
    company: job.company_name,
    location: job.location || null,
    remote: job.remote,
    rawText: job.description,
    applyUrl: job.url,
    applyEmail: null,
  });

  let results = json.data;

  // Arbeitnow's board is heavily weighted toward Europe/remote-Europe.
  // A strict location substring match (e.g. "Toronto, ON") will
  // legitimately match zero listings there — that's not a bug, it's
  // just outside this source's coverage. Rather than silently return
  // nothing, fall back to the full unfiltered set so at least remote
  // and other postings still surface; downstream match-scoring against
  // the user's profile handles relevance from there.
  if (params.location) {
    const locationFiltered = results.filter((job) =>
      job.location?.toLowerCase().includes(params.location!.toLowerCase())
    );
    if (locationFiltered.length > 0) {
      results = locationFiltered;
    } else {
      console.warn(
        `Arbeitnow: no listings matched location "${params.location}" (this source is Europe-focused) — falling back to unfiltered results.`
      );
    }
  }

  // Since Arbeitnow doesn't filter by keyword server-side, do a light
  // client-side pass so a saved search's niche at least biases toward
  // relevant titles, without being so strict it zeroes out results.
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    const keywordFiltered = results.filter(
      (job) =>
        job.title.toLowerCase().includes(kw) ||
        job.description?.toLowerCase().includes(kw)
    );
    if (keywordFiltered.length > 0) {
      results = keywordFiltered;
    }
  }

  return results.map(toPosting);
}
