/**
 * Facts about the resume for the sidebar: roles, years of service.
 * Dates in the profile are free text ("2021-03", "March 2021", "2019",
 * "Present"), so this parses what it can and ignores what it can't.
 */

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
];

/** Months since year 0 for a date string, or null if it can't be read. */
export function parseMonthIndex(text: string, now = new Date()): number | null {
  const t = (text || "").trim().toLowerCase();
  if (!t) return null;
  if (/(present|current|now|today|ongoing)/.test(t)) return now.getFullYear() * 12 + now.getMonth();

  const year = /(19|20)\d{2}/.exec(t);
  if (!year) return null;
  const y = parseInt(year[0], 10);

  const named = MONTHS.findIndex((m) => new RegExp(`\\b${m}`).test(t));
  if (named >= 0) return y * 12 + named;

  const numeric = /(?:^|\D)(0?[1-9]|1[0-2])(?:[\/\-.]|\s)/.exec(t.replace(year[0], " " + year[0]));
  const ym = /(19|20)\d{2}[\/\-.](0?[1-9]|1[0-2])\b/.exec(t);
  if (ym) return y * 12 + (parseInt(ym[2], 10) - 1);
  const my = /\b(0?[1-9]|1[0-2])[\/\-.](19|20)\d{2}/.exec(t);
  if (my) return y * 12 + (parseInt(my[1], 10) - 1);
  void numeric;
  return y * 12; // year only: January
}

export interface RoleLike {
  title: string;
  employer: string;
  startDate?: string;
  endDate?: string;
}

export interface CareerSummary {
  roles: number;
  months: number;
  /** "4 yrs 3 mos", "8 mos", or "" when no dates could be read. */
  label: string;
}

export function careerSummary(entries: RoleLike[], now = new Date()): CareerSummary {
  const spans: [number, number][] = [];
  for (const e of entries) {
    const s = parseMonthIndex(e.startDate || "", now);
    if (s === null) continue;
    let end = parseMonthIndex(e.endDate || "", now);
    if (end === null) end = s;
    if (end < s) continue;
    spans.push([s, end + 1]); // inclusive of the last month
  }
  spans.sort((a, b) => a[0] - b[0]);

  // Merge overlapping roles so two jobs held at once aren't counted twice.
  let months = 0;
  let cur: [number, number] | null = null;
  for (const sp of spans) {
    if (!cur) cur = [sp[0], sp[1]];
    else if (sp[0] <= cur[1]) cur[1] = Math.max(cur[1], sp[1]);
    else {
      months += cur[1] - cur[0];
      cur = [sp[0], sp[1]];
    }
  }
  if (cur) months += cur[1] - cur[0];

  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  const parts: string[] = [];
  if (yrs) parts.push(`${yrs} yr${yrs === 1 ? "" : "s"}`);
  if (mos) parts.push(`${mos} mo${mos === 1 ? "" : "s"}`);
  return { roles: entries.length, months, label: parts.join(" ") };
}

/** "2021 – Present" style span for one role. */
export function roleSpan(e: RoleLike): string {
  const y = (s?: string) => (s ? /(19|20)\d{2}/.exec(s)?.[0] : undefined);
  const start = y(e.startDate);
  const end = /(present|current|now)/i.test(e.endDate || "") ? "Present" : y(e.endDate);
  if (start && end) return `${start} \u2013 ${end}`;
  return start || end || "";
}
