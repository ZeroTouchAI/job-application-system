import type { RawPosting } from "./arbeitnow";
import { normalizeWorkMode } from "../salary";
import type { PostingExtras } from "../salary";

/**
 * Lever's public postings API. Per-company, unauthenticated, meant for
 * exactly this use case. No ToS conflict.
 *
 * Docs: https://github.com/lever/postings-api
 *
 * `company` is the Lever site slug, e.g. for https://jobs.lever.co/netflix
 * the slug is "netflix".
 */

interface LeverPosting {
  id: string;
  text: string; // job title
  categories: { location?: string; commitment?: string };
  descriptionPlain: string;
  hostedUrl: string;
  createdAt?: number;
  workplaceType?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  };
}

function isRemote(location?: string): boolean {
  return /remote/i.test(location || "");
}

function intervalToPeriod(interval?: string): string | null {
  const v = (interval || "").toLowerCase();
  if (v.includes("year")) return "year";
  if (v.includes("month")) return "month";
  if (v.includes("week")) return "week";
  if (v.includes("day")) return "day";
  if (v.includes("hour")) return "hour";
  return null;
}

export async function fetchLeverJobs(
  company: string
): Promise<(RawPosting & PostingExtras)[]> {
  const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Lever API error for company "${company}": ${res.status}`);
  }

  const postings = (await res.json()) as LeverPosting[];

  return postings.map((p) => ({
    source: "lever",
    sourceId: p.id,
    title: p.text,
    company,
    location: p.categories?.location || null,
    remote: isRemote(p.categories?.location),
    rawText: p.descriptionPlain,
    applyUrl: p.hostedUrl,
    applyEmail: null,
    salaryMin: p.salaryRange?.min ?? null,
    salaryMax: p.salaryRange?.max ?? null,
    salaryCurrency: p.salaryRange?.currency ?? null,
    salaryPeriod: intervalToPeriod(p.salaryRange?.interval),
    postedAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    workMode:
      normalizeWorkMode(p.workplaceType) ?? (isRemote(p.categories?.location) ? "remote" : null),
  }));
}
