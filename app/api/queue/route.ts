import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { APPLY_MODE_LABEL, applyModeFor, attributionFor, sourceLabel } from "../../../lib/deck";

/** Jobs the user swiped right or up on and hasn't finished yet. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const apps = await db.application.findMany({
    where: { userId, status: { in: ["queued", "drafted"] } },
    include: { jobPosting: true },
    orderBy: [{ topPick: "desc" }, { swipedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const items = apps.map((a: (typeof apps)[number]) => {
    const applyMode = applyModeFor(a.jobPosting);
    return {
      id: a.id,
      status: a.status,
      topPick: a.topPick,
      matchScore: a.matchScore,
      title: a.jobPosting.title,
      company: a.jobPosting.company,
      location: a.jobPosting.location,
      remote: a.jobPosting.remote,
      source: a.jobPosting.source,
      sourceLabel: sourceLabel(a.jobPosting.source),
      attribution: attributionFor(a.jobPosting.source),
      applyMode,
      applyModeLabel: APPLY_MODE_LABEL[applyMode],
      applyUrl: a.jobPosting.applyUrl,
      applyEmail: a.jobPosting.applyEmail,
    };
  });

  return NextResponse.json({ items });
}
