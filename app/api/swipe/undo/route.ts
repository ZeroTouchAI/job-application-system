import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

/**
 * Undoes the user's most recent swipe, but only while the job is still
 * sitting where the swipe put it (queued or rejected). Anything the user has
 * since drafted or applied to is left alone.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const last = await db.application.findFirst({
    where: { userId, swipe: { not: null }, status: { in: ["queued", "rejected"] } },
    orderBy: { swipedAt: "desc" },
  });
  if (!last) {
    return NextResponse.json({ error: "Nothing to undo" }, { status: 404 });
  }

  await db.application.update({
    where: { id: last.id },
    data: { status: "suggested", swipe: null, swipedAt: null, topPick: false },
  });

  return NextResponse.json({ applicationId: last.id });
}
