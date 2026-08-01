import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

const VALID_STATUSES = ["suggested", "drafted", "applied", "interview", "offer", "rejected"];

/**
 * Updates an application's status (e.g. after the user actually submits
 * the application, hears back for an interview, etc). This is the only
 * way status advances past "drafted" — nothing else in the app does it.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const existing = await db.application.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const status = body.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const application = await db.application.update({
    where: { id: params.id },
    data: {
      status,
      // Stamp appliedAt the first time a job crosses into "applied";
      // don't clobber it if the user later moves on to interview/offer.
      appliedAt: status === "applied" && !existing.appliedAt ? new Date() : existing.appliedAt,
    },
    include: { jobPosting: true },
  });

  return NextResponse.json({ application });
}
