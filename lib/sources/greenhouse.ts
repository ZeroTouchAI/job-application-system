import type { RawPosting } from "./arbeitnow";

/**
 * Greenhouse's public job-board API. Per-company, unauthenticated,
 * explicitly meant for pulling a company's own open roles onto a
 * careers page or into an aggregator. No ToS conflict.
 *
 * Docs: https://developers.greenhouse.io/job-board.html
 *
 * `boardToken` is the company's slug, e.g. for
 * https://boards.greenhouse.io/stripe the token is "stripe".
 */

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  content: string; // HTML job description
  absolute_url: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchGreenhouseJobs(
  boardToken: string
): Promise<RawPosting[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    // A 404 usually just means the board token is invalid/mistyped —
    // don't blow up the whole sync run over one bad slug.
    if (res.status === 404) return [];
    throw new Error(
      `Greenhouse API error for board "${boardToken}": ${res.status}`
    );
  }

  const json = (await res.json()) as GreenhouseResponse;

  return json.jobs.map((job) => ({
    source: "greenhouse",
    sourceId: `${boardToken}:${job.id}`,
    title: job.title,
    company: boardToken,
    location: job.location?.name || null,
    remote: /remote/i.test(job.location?.name || ""),
    rawText: stripHtml(job.content),
    applyUrl: job.absolute_url,
    applyEmail: null,
  }));
}
