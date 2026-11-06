import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";

/** Counts for the Overview block, plus the jobs the user has applied for. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const grouped = await db.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const count = (...statuses: string[]) =>
    grouped
      .filter((g: { status: string }) => statuses.includes(g.status))
      .reduce((n: number, g: { _count: { _all: number } }) => n + g._count._all, 0);

  const appliedApps = await db.application.findMany({
    where: { userId, status: { in: ["applied", "interview", "offer"] } },
    include: { jobPosting: { select: { title: true, company: true } } },
    orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  return NextResponse.json({
    found: grouped.reduce((n: number, g: { _count: { _all: number } }) => n + g._count._all, 0),
    interested: count("queued", "drafted"),
    passed: count("rejected"),
    applied: count("applied", "interview", "offer"),
    appliedJobs: appliedApps.map((a: (typeof appliedApps)[number]) => ({
      id: a.id,
      title: a.jobPosting.title,
      company: a.jobPosting.company,
      status: a.status,
    })),
  });
}
