import { SOURCES } from "./sources/registry";
import type { ApplyMode } from "./sources/registry";

/**
 * Pure logic for the swipe deck. Kept free of Next.js and Prisma imports so
 * it can be unit tested (scripts/test-deck.ts) without a database.
 */

export type SwipeDir = "right" | "left" | "up";

/** Cards served per rolling 24 hours. Small on purpose: fresh beats endless. */
export const DAILY_DECK_SIZE = Number(process.env.DAILY_DECK_SIZE) > 0
  ? Number(process.env.DAILY_DECK_SIZE)
  : 10;

export function isSwipeDir(v: unknown): v is SwipeDir {
  return v === "right" || v === "left" || v === "up";
}

/** What a swipe does to an application record. */
export function swipeUpdate(dir: SwipeDir): {
  status: "queued" | "rejected";
  swipe: SwipeDir;
  topPick: boolean;
} {
  if (dir === "left") return { status: "rejected", swipe: "left", topPick: false };
  return { status: "queued", swipe: dir, topPick: dir === "up" };
}

/** How many more cards the user may see in this 24 hour window. */
export function remainingToday(swipedInWindow: number, dailySize = DAILY_DECK_SIZE): number {
  return Math.max(0, dailySize - swipedInWindow);
}

/**
 * Same real-world job under different internal IDs (sources re-issue
 * listings). Mirrors the key used by lib/jobSync.ts.
 */
export function jobIdentityKey(title: string, company: string): string {
  return `${title.trim().toLowerCase()}|${company.trim().toLowerCase()}`;
}

/**
 * How the user finishes applying to a posting. A listed email beats
 * everything because the employer published it for exactly this. Otherwise
 * the source registry decides.
 */
export function applyModeFor(posting: {
  source: string;
  applyUrl: string | null;
  applyEmail: string | null;
}): ApplyMode {
  if (posting.applyEmail) return "email";
  const meta = SOURCES.find((s) => s.id === posting.source);
  return meta ? meta.applyMode : "link";
}

/** Short badge text. Honest about what exists today: no prefill extension yet. */
export const APPLY_MODE_LABEL: Record<ApplyMode, string> = {
  prefill: "ATS form",
  email: "Email apply",
  link: "Link out",
  "official-only": "Official site",
};

export function attributionFor(source: string): string | null {
  return SOURCES.find((s) => s.id === source)?.attribution?.text ?? null;
}

export function sourceLabel(source: string): string {
  return SOURCES.find((s) => s.id === source)?.name ?? source;
}

export interface DeckCard {
  id: string;
  matchScore: number;
  keywordsMatched: string[];
  keywordsMissing: string[];
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  source: string;
  sourceLabel: string;
  attribution: string | null;
  applyMode: ApplyMode;
  applyModeLabel: string;
  summary: string;
  postedAt: string;
}

interface ApplicationWithPosting {
  id: string;
  matchScore: number;
  keywordsMatched: string[];
  keywordsMissing: string[];
  jobPosting: {
    title: string;
    company: string;
    location: string | null;
    remote: boolean;
    source: string;
    rawText: string;
    applyUrl: string | null;
    applyEmail: string | null;
    fetchedAt: Date;
  };
}

/** Trims text to a card-sized summary without cutting a word in half. */
export function summarize(text: string, max = 280): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + "…";
}

export function toDeckCard(app: ApplicationWithPosting): DeckCard {
  const p = app.jobPosting;
  const applyMode = applyModeFor(p);
  return {
    id: app.id,
    matchScore: app.matchScore,
    // Few chips, longest first, so the card isn't a wall of keywords.
    keywordsMatched: [...app.keywordsMatched].sort((a, b) => b.length - a.length).slice(0, 4),
    keywordsMissing: [...app.keywordsMissing].sort((a, b) => b.length - a.length).slice(0, 4),
    title: p.title,
    company: p.company,
    location: p.location,
    remote: p.remote,
    source: p.source,
    sourceLabel: sourceLabel(p.source),
    attribution: attributionFor(p.source),
    applyMode,
    applyModeLabel: APPLY_MODE_LABEL[applyMode],
    summary: summarize(p.rawText),
    postedAt: p.fetchedAt.toISOString(),
  };
}

/**
 * Drops cards for jobs the user already acted on under a different posting
 * ID, and de-duplicates within the batch. Input order is preserved.
 */
export function dropRepeats<T extends { title: string; company: string }>(
  candidates: T[],
  alreadyActedOn: { title: string; company: string }[]
): T[] {
  const seen = new Set(alreadyActedOn.map((a) => jobIdentityKey(a.title, a.company)));
  const out: T[] = [];
  for (const c of candidates) {
    const key = jobIdentityKey(c.title, c.company);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
