import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";

/**
 * Returns the current user's job suggestions/applications, most recently
 * scored first. This backs the dashboard's main list.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await db.application.findMany({
    // Rejected applications are kept in the database but hidden from the
    // default list — rejecting is a "remove from view" action, not a delete.
    where: { userId: (session.user as { id: string }).id, status: { not: "rejected" } },
    include: { jobPosting: true },
    orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json({ applications });
}
