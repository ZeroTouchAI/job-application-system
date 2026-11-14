import { toDeckCard } from "./deck";
import { cardExtras } from "./salary";

type CardSource = Parameters<typeof toDeckCard>[0];

/**
 * The one card shape every page uses (swipe deck, list view): the deck card
 * plus pay, logo, work mode, posted date, the date Joby added it, and the
 * posting link. Keeping both views on this shape keeps them in step.
 */
export function richCard(app: CardSource) {
  const p = app.jobPosting as CardSource["jobPosting"] & {
    postedAt?: Date | null;
    fetchedAt?: Date;
    applyUrl?: string | null;
    rawText?: string;
  };
  return {
    ...toDeckCard(app),
    ...cardExtras(p as Parameters<typeof cardExtras>[0]),
    postedExact: !!p.postedAt,
    addedAt: (p.fetchedAt ?? new Date()).toISOString(),
    applyUrl: p.applyUrl ?? null,
    // The description, tidied and capped, for the open "About this job" text.
    details: (p.rawText || "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 2000),
  };
}
