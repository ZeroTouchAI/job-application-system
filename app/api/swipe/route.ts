import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { isSwipeDir, swipeUpdate } from "../../../lib/deck";

/**
 * Records a swipe. Right = interested, up = top pick (both queue the job),
 * left = pass (marks it rejected, which the sync keeps hidden even if the
 * source re-issues the same listing). Nothing here applies to anything: the
 * user finishes every application themselves.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  let body: { applicationId?: unknown; dir?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.applicationId !== "string" || !isSwipeDir(body.dir)) {
    return NextResponse.json(
      { error: "applicationId (string) and dir (right | left | up) are required" },
      { status: 400 }
    );
  }

  const existing = await db.application.findUnique({ where: { id: body.applicationId } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.swipe !== null || existing.status !== "suggested") {
    return NextResponse.json({ error: "Already swiped" }, { status: 409 });
  }

  const update = swipeUpdate(body.dir);
  const application = await db.application.update({
    where: { id: existing.id },
    data: { ...update, swipedAt: new Date() },
  });

  return NextResponse.json({ application: { id: application.id, status: application.status } });
}
