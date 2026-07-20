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
    where: { userId: (session.user as { id: string }).id },
    include: { jobPosting: true },
    orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json({ applications });
}
