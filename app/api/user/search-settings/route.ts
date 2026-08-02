import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const criteria = await db.searchCriteria.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ criteria });
}

/**
 * Adds a new saved search. Does NOT overwrite existing ones — a user
 * can have several searches (e.g. different roles/niches) tracked at
 * the same time, each surfaced separately on the dashboard.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const userId = (session.user as { id: string }).id;

    if (!body.niche || typeof body.niche !== "string" || !body.niche.trim()) {
      return NextResponse.json(
        { error: "A job title or niche is required." },
        { status: 400 }
      );
    }

    const created = await db.searchCriteria.create({
      data: {
        userId,
        niche: body.niche.trim(),
        location: body.location || null,
        remoteOnly: !!body.remoteOnly,
        keywords: Array.isArray(body.keywords) ? body.keywords : [],
        greenhouseBoards: Array.isArray(body.greenhouseBoards) ? body.greenhouseBoards : [],
        leverBoards: Array.isArray(body.leverBoards) ? body.leverBoards : [],
        rssFeeds: Array.isArray(body.rssFeeds) ? body.rssFeeds : [],
      },
    });

    return NextResponse.json({ criteria: created });
  } catch (err) {
    console.error("Saving search criteria failed:", err);
    return NextResponse.json(
      { error: "Something went wrong saving that. Please try again." },
      { status: 500 }
    );
  }
}
