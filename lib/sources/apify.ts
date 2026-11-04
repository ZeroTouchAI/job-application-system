import type { RawPosting } from "./arbeitnow";
import { getRunBudget } from "./budget";

/**
 * Apify source: runs ONE configured actor per sync and maps its dataset to
 * RawPosting. Meant for actors that read companies' own public ATS career
 * pages (see docs/notes-apify-and-followups.md). Do not point this at actors
 * that scrape LinkedIn, Indeed or Glassdoor; docs/spec.md rules that out.
 *
 * Everything is env-driven because no actor has been tested yet and their
 * input schemas differ:
 *   APIFY_TOKEN          required, otherwise this source is a no-op
 *   APIFY_ACTOR_ID       required, e.g. "owner~actor-name" (use ~ not /)
 *   APIFY_ACTOR_INPUT    optional JSON string passed as the actor input
 *   APIFY_COUNTRY        optional, "CA" keeps only Canadian-looking locations
 *
 * Budget: see ./budget.ts. Every run is capped with maxTotalChargeUsd and
 * maxItems. Both are Apify run options; confirm against the current Apify API
 * docs when first wiring a token.
 */

const CANADA_RE =
  /canada|\b(ON|BC|AB|QC|MB|SK|NS|NB|NL|PE|NT|YT|NU)\b|ontario|british columbia|alberta|quebec|québec|manitoba|saskatchewan|nova scotia|new brunswick|toronto|vancouver|montreal|montréal|calgary|edmonton|ottawa|winnipeg|halifax|waterloo|mississauga|victoria/i;

type Item = Record<string, unknown>;

function pick(item: Item, keys: string[]): string | null {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

function locationOf(item: Item): string | null {
  const direct = pick(item, ["location", "locationName", "jobLocation", "city"]);
  if (direct) return direct;
  const loc = item["location"];
  if (loc && typeof loc === "object") {
    const o = loc as Item;
    const parts = [o["city"], o["region"], o["state"], o["country"]].filter(
      (p): p is string => typeof p === "string" && !!p
    );
    if (parts.length) return parts.join(", ");
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchApifyJobs(): Promise<RawPosting[]> {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;
  if (!token || !actorId) return []; // same no-op pattern as USAJobs

  const budget = getRunBudget();
  if (budget.maxItems <= 0) {
    console.warn("Apify: per-run budget allows 0 items; skipping.");
    return [];
  }

  let input: unknown = {};
  if (process.env.APIFY_ACTOR_INPUT) {
    try {
      input = JSON.parse(process.env.APIFY_ACTOR_INPUT);
    } catch {
      throw new Error("APIFY_ACTOR_INPUT is not valid JSON");
    }
  }

  const url = new URL(
    `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items`
  );
  url.searchParams.set("maxItems", String(budget.maxItems));
  url.searchParams.set("maxTotalChargeUsd", budget.perRunUsd.toFixed(2));

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(240_000),
  });
  if (!res.ok) {
    throw new Error(`Apify run failed: ${res.status} ${res.statusText}`);
  }

  const items = (await res.json()) as Item[];
  if (!Array.isArray(items)) return [];

  const canadaOnly = (process.env.APIFY_COUNTRY || "").toUpperCase() === "CA";
  const out: RawPosting[] = [];

  for (const item of items) {
    const title = pick(item, ["title", "jobTitle", "position", "name"]);
    const company = pick(item, [
      "company",
      "companyName",
      "company_name",
      "organization",
      "employer",
    ]);
    const applyUrl = pick(item, [
      "applyUrl",
      "apply_url",
      "applyLink",
      "absolute_url",
      "jobUrl",
      "url",
      "link",
    ]);
    if (!title || !company || !applyUrl) continue;

    const location = locationOf(item);
    const remote =
      item["remote"] === true ||
      item["isRemote"] === true ||
      /remote/i.test(location || "");

    if (canadaOnly && !(location && CANADA_RE.test(location))) continue;

    const description = pick(item, [
      "description",
      "descriptionText",
      "descriptionPlain",
      "content",
      "jobDescription",
    ]);

    const id = pick(item, ["id", "jobId", "job_id", "externalId"]) || applyUrl;

    out.push({
      source: "apify",
      sourceId: id,
      title,
      company,
      location,
      remote,
      rawText: description ? stripHtml(description) : title,
      applyUrl,
      applyEmail: null,
    });
  }

  return out;
}
