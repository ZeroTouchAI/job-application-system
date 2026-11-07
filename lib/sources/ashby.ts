import type { RawPosting } from "./arbeitnow";
import { extractSalary, normalizePeriod, normalizeWorkMode } from "../salary";
import type { PostingExtras } from "../salary";

/**
 * Ashby's public Posting API. Keyless, per-company, documented by Ashby for
 * powering embedded careers pages:
 * https://developers.ashbyhq.com/docs/public-job-posting-api
 *
 * `boardName` is the slug in https://jobs.ashbyhq.com/<boardName>.
 * Free, so use this instead of paying an Apify actor for Ashby boards.
 */

interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  secondaryLocations?: { location?: string }[];
  address?: { postalAddress?: { addressCountry?: string } };
  isRemote?: boolean;
  workplaceType?: string;
  isListed?: boolean;
  descriptionPlain?: string;
  descriptionHtml?: string;
  jobUrl?: string;
  applyUrl?: string;
  publishedAt?: string;
  compensation?: {
    compensationTierSummary?: string;
    summaryComponents?: {
      compensationType?: string;
      interval?: string;
      currencyCode?: string;
      minValue?: number | null;
      maxValue?: number | null;
    }[];
  };
}

interface AshbyResponse {
  jobs?: AshbyJob[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchAshbyJobs(
  boardName: string
): Promise<(RawPosting & PostingExtras)[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(
    boardName
  )}?includeCompensation=true`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    // Unknown board slug: don't fail the whole sync over one bad name.
    if (res.status === 404) return [];
    throw new Error(`Ashby API error for board "${boardName}": ${res.status}`);
  }

  const json = (await res.json()) as AshbyResponse;

  return (json.jobs || [])
    .filter((job) => job.isListed !== false && job.title && (job.applyUrl || job.jobUrl))
    .map((job) => {
      const parts = [
        job.location,
        ...(job.secondaryLocations || []).map((l) => l.location),
        job.address?.postalAddress?.addressCountry,
      ].filter((p): p is string => !!p && p.trim().length > 0);
      const location = parts.length ? [...new Set(parts)].join(" | ") : null;

      const description =
        job.descriptionPlain ||
        (job.descriptionHtml ? stripHtml(job.descriptionHtml) : "");

      const comp = (job.compensation?.summaryComponents || []).find(
        (c) => (c.compensationType || "").toLowerCase() === "salary"
      );
      const fromSummary = extractSalary(job.compensation?.compensationTierSummary || "");

      return {
        source: "ashby",
        sourceId: `${boardName}:${job.id}`,
        title: job.title,
        company: boardName,
        location,
        remote: job.isRemote === true || /remote/i.test(job.workplaceType || ""),
        rawText: description || job.title,
        applyUrl: job.applyUrl || job.jobUrl || null,
        applyEmail: null,
        salaryMin: comp?.minValue ?? fromSummary?.min ?? null,
        salaryMax: comp?.maxValue ?? fromSummary?.max ?? null,
        salaryCurrency: comp?.currencyCode ?? fromSummary?.currency ?? null,
        salaryPeriod: normalizePeriod(comp?.interval) ?? fromSummary?.period ?? null,
        postedAt: job.publishedAt ?? null,
        workMode:
          normalizeWorkMode(job.workplaceType) ?? (job.isRemote === true ? "remote" : null),
      };
    });
}
