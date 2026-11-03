import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { DAILY_DECK_SIZE, dropRepeats, remainingToday, toDeckCard } from "../../../lib/deck";

const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * The swipe deck: the user's best unswiped matches, capped per rolling 24
 * hours so the app stays a short daily ritual instead of an endless feed.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const since = new Date(Date.now() - WINDOW_MS);
  const swipedInWindow = await db.application.count({
    where: { userId, swipedAt: { gte: since } },
  });
  const remaining = remainingToday(swipedInWindow);

  if (remaining === 0) {
    return NextResponse.json({
      cards: [],
      remaining: 0,
      dailyLimit: DAILY_DECK_SIZE,
      swipedToday: swipedInWindow,
    });
  }

  // Over-fetch, then drop repeats of jobs the user already acted on under a
  // different posting ID (sources re-issue listings).
  const candidates = await db.application.findMany({
    where: { userId, status: "suggested", swipe: null },
    include: { jobPosting: true },
    orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
    take: remaining * 4,
  });

  const acted = await db.application.findMany({
    where: { userId, status: { not: "suggested" } },
    select: { jobPosting: { select: { title: true, company: true } } },
  });

  type Keyed = { app: (typeof candidates)[number]; title: string; company: string };
  const keyed: Keyed[] = candidates.map((app: (typeof candidates)[number]) => ({
    app,
    title: app.jobPosting.title,
    company: app.jobPosting.company,
  }));
  const fresh = dropRepeats<Keyed>(
    keyed,
    acted.map((a: (typeof acted)[number]) => ({ title: a.jobPosting.title, company: a.jobPosting.company }))
  ).slice(0, remaining);

  return NextResponse.json({
    cards: fresh.map((k) => toDeckCard(k.app)),
    remaining,
    dailyLimit: DAILY_DECK_SIZE,
    swipedToday: swipedInWindow,
  });
}
