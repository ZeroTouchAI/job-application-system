import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { normalizeLocation } from "../../../../../lib/areas";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Scope the delete to the current user so nobody can delete another
  // account's saved search by guessing an id.
  const existing = await db.searchCriteria.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.searchCriteria.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}

/** Edits a saved search the user owns (job title, areas, remote, extras). */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const existing = await db.searchCriteria.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    if (!body.niche || typeof body.niche !== "string" || !body.niche.trim()) {
      return NextResponse.json({ error: "A job title or niche is required." }, { status: 400 });
    }
    const list = (v: unknown) => (Array.isArray(v) ? v : []);

    const updated = await db.searchCriteria.update({
      where: { id: params.id },
      data: {
        niche: body.niche.trim(),
        location: normalizeLocation(body.location),
        remoteOnly: !!body.remoteOnly,
        keywords: list(body.keywords),
        greenhouseBoards: list(body.greenhouseBoards),
        leverBoards: list(body.leverBoards),
        rssFeeds: list(body.rssFeeds),
      },
    });
    return NextResponse.json({ criteria: updated });
  } catch (err) {
    console.error("Updating search criteria failed:", err);
    return NextResponse.json({ error: "Something went wrong saving that. Please try again." }, { status: 500 });
  }
}
