/**
 * Search areas. A saved search's `location` is a comma-separated list of
 * areas, e.g. "Scarborough, Toronto, Ontario". Cities are the areas that
 * count; provinces and "Canada" are qualifiers. A search that names only a
 * province covers that whole province.
 *
 * A job is allowed for a user only if it sits in one of their areas, or it is
 * remote AND the user asked for remote. Nothing else gets through.
 */

const PROVINCES: { code: string; names: string[] }[] = [
  { code: "ON", names: ["ontario"] },
  { code: "BC", names: ["british columbia"] },
  { code: "AB", names: ["alberta"] },
  { code: "QC", names: ["quebec"] },
  { code: "MB", names: ["manitoba"] },
  { code: "SK", names: ["saskatchewan"] },
  { code: "NS", names: ["nova scotia"] },
  { code: "NB", names: ["new brunswick"] },
  { code: "NL", names: ["newfoundland and labrador", "newfoundland", "labrador"] },
  { code: "PE", names: ["prince edward island", "pei"] },
  { code: "NT", names: ["northwest territories"] },
  { code: "YT", names: ["yukon"] },
  { code: "NU", names: ["nunavut"] },
];

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function provinceOf(segment: string): { code: string } | null {
  const n = norm(segment);
  for (const p of PROVINCES) {
    if (p.code.toLowerCase() === n || p.names.includes(n)) return { code: p.code };
  }
  return null;
}

export interface ParsedAreas {
  cities: string[];
  provinces: string[]; // province codes
}

export function parseAreas(location: string | null | undefined): ParsedAreas {
  const cities: string[] = [];
  const provinces: string[] = [];
  for (const raw of (location || "").split(/[,;|\n]+/)) {
    const seg = raw.trim();
    if (!seg) continue;
    const n = norm(seg);
    if (n === "canada" || n === "ca") continue;
    const prov = provinceOf(seg);
    if (prov) {
      if (!provinces.includes(prov.code)) provinces.push(prov.code);
    } else if (!cities.some((c) => norm(c) === n)) {
      cities.push(seg);
    }
  }
  return { cities, provinces };
}

/** Tidy a user-typed list of areas: trimmed, de-duplicated, joined with ", ". */
export function normalizeLocation(input: string | string[] | null | undefined): string | null {
  const parts = Array.isArray(input) ? input : (input || "").split(/[,;|\n]+/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t || seen.has(norm(t))) continue;
    seen.add(norm(t));
    out.push(t);
  }
  return out.length ? out.join(", ") : null;
}

/** Does a posting's location sit inside the wanted areas? */
export function matchesArea(postingLocation: string | null, wanted: string | null | undefined): boolean {
  if (!wanted || !wanted.trim()) return true;
  if (!postingLocation) return false;

  const { cities, provinces } = parseAreas(wanted);
  const p = norm(postingLocation);

  if (cities.length > 0) {
    return cities.some((c) => new RegExp(`(^|[^a-z])${escapeRe(norm(c))}([^a-z]|$)`).test(p));
  }
  if (provinces.length > 0) {
    return provinces.some((code) => {
      const prov = PROVINCES.find((x) => x.code === code)!;
      const byName = prov.names.some((n) => new RegExp(`(^|[^a-z])${escapeRe(n)}([^a-z]|$)`).test(p));
      // "Toronto, ON": the two-letter code, upper case, after a comma or space.
      const byCode = new RegExp(`(^|[,\\s(])${code}([,\\s)|]|$)`).test(postingLocation);
      return byName || byCode;
    });
  }
  return true;
}

export interface SearchLike {
  location: string | null;
  remoteOnly: boolean; // stored name; meaning: "include remote roles"
}

/** The one rule every source and every page follows. */
export function postingAllowed(
  posting: { location: string | null; remote: boolean },
  searches: SearchLike[]
): boolean {
  if (searches.length === 0) return true; // no saved searches yet: nothing to filter by
  if (searches.some((s) => !s.location || !s.location.trim())) return true; // an "anywhere" search
  if (posting.remote && searches.some((s) => s.remoteOnly)) return true;
  return searches.some((s) => matchesArea(posting.location, s.location));
}

/** "Scarborough, Toronto, Ontario" for display, or "" when no areas are set. */
export function formatAreas(location: string | null | undefined): string {
  return normalizeLocation(location) || "";
}
