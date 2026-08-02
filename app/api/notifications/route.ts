import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";

/**
 * Backs the header bell badge: how many NEW matches the most recent
 * sync run created for this user. Overwritten every run — not a
 * cumulative unread count.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { lastSyncNewCount: true, lastSyncAt: true },
  });

  return NextResponse.json({
    newCount: user?.lastSyncNewCount ?? 0,
    syncedAt: user?.lastSyncAt ?? null,
  });
}
