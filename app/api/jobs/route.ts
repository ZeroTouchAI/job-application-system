import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";

const PAGE_SIZE = 10;

/**
 * The list view: jobs the user has NOT swiped on yet, best match first,
 * 10 per page. Anything swiped (interested or passed), drafted or applied
 * lives on its own page instead. Optional filters: `q` (title/company),
 * `loc` (location), `page` (1-based).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const params = req.nextUrl.searchParams;
  const q = (params.get("q") || "").trim();
  const loc = (params.get("loc") || "").trim();
  const page = Math.max(1, Math.floor(Number(params.get("page")) || 1));

  const where = {
    userId,
    status: "suggested",
    swipe: null,
    jobPosting: {
      ...(loc ? { location: { contains: loc, mode: "insensitive" as const } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { company: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
  };

  const [total, applications] = await Promise.all([
    db.application.count({ where }),
    db.application.findMany({
      where,
      include: { jobPosting: true },
      orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({
    applications,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
