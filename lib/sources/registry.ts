/**
 * Machine-readable job source registry. Mirrors docs/sources.md; keep the two
 * in sync. The sync job and the card UI both read this so attribution, limits
 * and apply behavior are enforced in code, not remembered by hand.
 */

export type ApplyMode = "prefill" | "email" | "link" | "official-only";
export type Country = "US" | "CA";
export type SourceStatus = "implemented" | "planned" | "unverified" | "skip";

export interface SourceMeta {
  id: string;
  name: string;
  kind: "ats" | "aggregator" | "government" | "reference";
  /** Countries the source is known to cover. Empty = unconfirmed. */
  countries: Country[];
  remoteOnly?: boolean;
  /** Default apply behavior for postings from this source. */
  applyMode: ApplyMode;
  status: SourceStatus;
  /** Text that must be shown on any card from this source. */
  attribution?: { text: string; linkRequired: boolean };
  /** Hard cap on fetches per day, if the vendor states one. */
  maxRequestsPerDay?: number;
  /** Minutes the vendor delays listings, if stated. */
  listingDelayMinutes?: number;
  /** Vendor forbids forwarding listings to other job sites. */
  noRedistributionToJobSites?: boolean;
  /** Needs a commercial licence before a public launch. */
  needsCommercialLicence?: boolean;
  notes?: string;
}

export const SOURCES: SourceMeta[] = [
  {
    id: "greenhouse",
    name: "Greenhouse",
    kind: "ats",
    countries: ["US", "CA"],
    applyMode: "prefill",
    status: "implemented",
    notes: "Public read. Job endpoint returns application questions; submit needs the company's key.",
  },
  {
    id: "lever",
    name: "Lever",
    kind: "ats",
    countries: ["US", "CA"],
    applyMode: "prefill",
    status: "implemented",
    notes: "Public read. Apply POST needs a company-issued key.",
  },
  {
    id: "ashby",
    name: "Ashby",
    kind: "ats",
    countries: ["US", "CA"],
    applyMode: "prefill",
    status: "planned",
    notes: "api.ashbyhq.com/posting-api/job-board/{name}, no key.",
  },
  {
    id: "recruitee",
    name: "Recruitee",
    kind: "ats",
    countries: [],
    applyMode: "prefill",
    status: "unverified",
    notes: "Keyless offers endpoint reported by a secondary source only.",
  },
  {
    id: "workable",
    name: "Workable",
    kind: "ats",
    countries: [],
    applyMode: "prefill",
    status: "unverified",
    notes: "Unofficial public routes; vendor terms not read. Decide before use.",
  },
  {
    id: "smartrecruiters",
    name: "SmartRecruiters",
    kind: "ats",
    countries: [],
    applyMode: "prefill",
    status: "skip",
    notes: "Official docs require an API key or OAuth.",
  },
  {
    id: "usajobs",
    name: "USAJobs",
    kind: "government",
    countries: ["US"],
    applyMode: "official-only",
    status: "implemented",
    attribution: {
      text: "Source: USAJOBS. Not operated, sponsored or endorsed by OPM.",
      linkRequired: true,
    },
    notes: "Never claim an application was sent unless it followed the announcement's instructions.",
  },
  {
    id: "adzuna",
    name: "Adzuna",
    kind: "aggregator",
    countries: [],
    applyMode: "link",
    status: "unverified",
    attribution: { text: "Jobs by Adzuna", linkRequired: true },
    needsCommercialLicence: true,
    notes: "US/CA coverage not confirmed from docs. Free tier is evaluation only.",
  },
  {
    id: "jooble",
    name: "Jooble",
    kind: "aggregator",
    countries: [],
    applyMode: "link",
    status: "unverified",
    notes: "Free key limited to 500 lifetime requests. Terms not found.",
  },
  {
    id: "careerjet",
    name: "Careerjet",
    kind: "aggregator",
    countries: [],
    applyMode: "link",
    status: "unverified",
    notes: "Requires end-user IP and user agent on every call.",
  },
  {
    id: "jsearch",
    name: "JSearch",
    kind: "aggregator",
    countries: [],
    applyMode: "link",
    status: "unverified",
    notes: "Paid RapidAPI dependency; upstream terms not reviewed.",
  },
  {
    id: "remotive",
    name: "Remotive",
    kind: "aggregator",
    countries: [],
    remoteOnly: true,
    applyMode: "link",
    status: "planned",
    attribution: { text: "Source: Remotive", linkRequired: true },
    maxRequestsPerDay: 4,
    listingDelayMinutes: 24 * 60,
    noRedistributionToJobSites: true,
  },
  {
    id: "remoteok",
    name: "RemoteOK",
    kind: "aggregator",
    countries: [],
    remoteOnly: true,
    applyMode: "link",
    status: "planned",
    attribution: { text: "Source: Remote OK", linkRequired: true },
    notes: "Read their terms before shipping.",
  },
  {
    id: "himalayas",
    name: "Himalayas",
    kind: "aggregator",
    countries: [],
    remoteOnly: true,
    applyMode: "link",
    status: "unverified",
    notes: "Docs not reachable during verification.",
  },
  {
    id: "arbeitnow",
    name: "Arbeitnow",
    kind: "aggregator",
    countries: [],
    applyMode: "link",
    status: "implemented",
    notes: "Mostly EU; low value for US/CA.",
  },
  {
    id: "jobbank-ca",
    name: "Job Bank Canada (open data)",
    kind: "reference",
    countries: ["CA"],
    applyMode: "link",
    status: "planned",
    notes: "Monthly CSV, no apply links. Enrichment only (wages, NOC codes), not a deck source.",
  },
];

/** Sources the sync job may call for a user in the given country. */
export function sourcesForCountry(country: Country): SourceMeta[] {
  return SOURCES.filter(
    (s) =>
      s.status === "implemented" &&
      s.kind !== "reference" &&
      s.countries.includes(country)
  );
}
