import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { dropRepeats } from "../../../lib/deck";
import { richCard } from "../../../lib/cardInfo";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BATCH = 100;
const MAX_BATCH = 200;

/** Optional daily cap. 0 (the default) means the whole deck is available. */
const DAILY_CAP = Number(process.env.DAILY_DECK_SIZE) > 0 ? Number(process.env.DAILY_DECK_SIZE) : 0;

/**
 * The swipe deck: the user's unswiped matches, best first. By default the
 * whole deck is available; the page asks for it in batches and loads the next
 * batch as the stack runs low. `?limit=` sets the batch size (max 200).
 * Set DAILY_DECK_SIZE to bring back a per-24-hours cap.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const wanted = Math.floor(Number(req.nextUrl.searchParams.get("limit")) || DEFAULT_BATCH);
  const batch = Math.max(1, Math.min(MAX_BATCH, wanted));

  const since = new Date(Date.now() - WINDOW_MS);
  const swipedToday = await db.application.count({
    where: { userId, swipedAt: { gte: since } },
  });

  const unswiped = { userId, status: "suggested", swipe: null };
  const left = await db.application.count({ where: unswiped });

  const capLeft = DAILY_CAP > 0 ? Math.max(0, DAILY_CAP - swipedToday) : Infinity;
  const take = Math.min(batch, capLeft);

  if (take <= 0) {
    return NextResponse.json({ cards: [], remaining: left, dailyLimit: DAILY_CAP, swipedToday });
  }

  // Over-fetch, then drop repeats of jobs the user already acted on under a
  // different posting ID (sources re-issue listings).
  const candidates = await db.application.findMany({
    where: unswiped,
    include: { jobPosting: true },
    orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
    take: take * 3,
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
  ).slice(0, take);

  return NextResponse.json({
    cards: fresh.map((k) => richCard(k.app)),
    remaining: left,
    dailyLimit: DAILY_CAP,
    swipedToday,
  });
}
