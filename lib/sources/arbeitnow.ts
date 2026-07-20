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
  if (params.keyword) url.searchParams.set("search", params.keyword);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Arbeitnow API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as ArbeitnowResponse;

  return json.data
    .filter((job) =>
      params.location
        ? job.location?.toLowerCase().includes(params.location.toLowerCase())
        : true
    )
    .map((job) => ({
      source: "arbeitnow",
      sourceId: job.slug,
      title: job.title,
      company: job.company_name,
      location: job.location || null,
      remote: job.remote,
      rawText: job.description,
      applyUrl: job.url,
      applyEmail: null,
    }));
}
