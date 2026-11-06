/**
 * Salary, logo and posting-detail helpers. Pure functions only (no Prisma,
 * no Next) so both the sync script and client pages can import them.
 */

export interface SalaryInfo {
  min: number | null;
  max: number | null;
  currency: string | null;
  /** "year" | "month" | "week" | "day" | "hour" */
  period: string | null;
}

/** Optional extra fields a source may fill in on a posting. */
export interface PostingExtras {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  logoUrl?: string | null;
  /** ISO date string the employer or board published the job. */
  postedAt?: string | null;
  /** "remote" | "hybrid" | "onsite" */
  workMode?: string | null;
}

export function normalizePeriod(raw?: string | null): string | null {
  const v = (raw || "").toLowerCase();
  if (!v) return null;
  if (v.includes("year") || v.includes("annual")) return "year";
  if (v.includes("month")) return "month";
  if (v.includes("week")) return "week";
  if (v.includes("day")) return "day";
  if (v.includes("hour") || v.includes("hr")) return "hour";
  return null;
}

export function normalizeWorkMode(raw?: string | null): string | null {
  const v = (raw || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!v) return null;
  if (v.includes("hybrid")) return "hybrid";
  if (v.includes("remote")) return "remote";
  if (v.includes("onsite") || v.includes("inoffice") || v.includes("office")) return "onsite";
  return null;
}

function toNumber(token: string): number {
  const t = token.replace(/[,\s]/g, "").toLowerCase();
  return t.endsWith("k") ? parseFloat(t) * 1000 : parseFloat(t);
}

const YEARLY_RANGE =
  /\$\s?(\d{1,3}(?:,\d{3})+|\d{2,3}\s?[kK])\s*(?:CAD|USD|CDN)?\s*(?:-|\u2013|\u2014|to)\s*\$?\s?(\d{1,3}(?:,\d{3})+|\d{2,3}\s?[kK])/i;

const HOURLY_RANGE =
  /\$\s?(\d{2,3}(?:\.\d{1,2})?)\s*(?:-|\u2013|\u2014|to)\s*\$?\s?(\d{2,3}(?:\.\d{1,2})?)\s*(?:CAD|USD)?\s*(?:\/|per\s)\s*(?:hour|hr)\b/i;

/**
 * Conservative fallback for postings with no structured pay: looks for an
 * explicit "$80,000 - $120,000" or "$45 - $60 per hour" range in the text.
 * Returns null rather than guess.
 */
export function extractSalary(text: string): SalaryInfo | null {
  if (!text) return null;

  const hourly = HOURLY_RANGE.exec(text);
  if (hourly) {
    const min = toNumber(hourly[1]);
    const max = toNumber(hourly[2]);
    if (min >= 12 && max <= 300 && max >= min) {
      return { min, max, currency: currencyNear(text, hourly.index + hourly[0].length), period: "hour" };
    }
  }

  const yearly = YEARLY_RANGE.exec(text);
  if (yearly) {
    const min = toNumber(yearly[1]);
    const max = toNumber(yearly[2]);
    if (min >= 20_000 && max <= 1_000_000 && max >= min) {
      return { min, max, currency: currencyNear(text, yearly.index + yearly[0].length), period: "year" };
    }
  }
  return null;
}

function currencyNear(text: string, end: number): string {
  const window = text.slice(Math.max(0, end - 24), end + 12).toUpperCase();
  return window.includes("USD") ? "USD" : "CAD";
}

function compact(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

const PERIOD_SUFFIX: Record<string, string> = {
  hour: "/hr",
  day: "/day",
  week: "/wk",
  month: "/mo",
};

/** "$80K - $120K CAD", "$45 - $60/hr CAD", or null when no pay is known. */
export function formatSalary(s: {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
}): string | null {
  const min = s.salaryMin ?? null;
  const max = s.salaryMax ?? null;
  if (min === null && max === null) return null;
  const suffix = PERIOD_SUFFIX[s.salaryPeriod || ""] || "";
  const cur = s.salaryCurrency ? ` ${s.salaryCurrency}` : "";
  if (min !== null && max !== null && min !== max) {
    return `$${compact(min)} \u2013 $${compact(max)}${suffix}${cur}`;
  }
  return `$${compact((min ?? max) as number)}${suffix}${cur}`;
}

/** Posting columns -> the fields the UI cards need. */
export function cardExtras(p: {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  logoUrl?: string | null;
  workMode?: string | null;
  postedAt?: Date | null;
  fetchedAt?: Date;
}) {
  return {
    salaryText: formatSalary(p),
    logoUrl: p.logoUrl ?? null,
    workMode: p.workMode ?? null,
    postedAt: (p.postedAt ?? p.fetchedAt ?? new Date()).toISOString(),
  };
}

/** Structured pay if the source gave it, else a conservative text fallback. */
export function salaryFor(raw: PostingExtras & { rawText: string }): SalaryInfo {
  if (raw.salaryMin != null || raw.salaryMax != null) {
    return {
      min: raw.salaryMin ?? null,
      max: raw.salaryMax ?? null,
      currency: raw.salaryCurrency ?? "CAD",
      period: raw.salaryPeriod ?? "year",
    };
  }
  return extractSalary(raw.rawText) ?? { min: null, max: null, currency: null, period: null };
}
