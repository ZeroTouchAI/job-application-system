import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: {
      searchNiche: true,
      searchLocation: true,
      searchRemoteOnly: true,
      searchKeywords: true,
      greenhouseBoards: true,
      leverBoards: true,
    },
  });

  return NextResponse.json({ settings: user });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const user = await db.user.update({
      where: { id: (session.user as { id: string }).id },
      data: {
        searchNiche: body.searchNiche || null,
        searchLocation: body.searchLocation || null,
        searchRemoteOnly: !!body.searchRemoteOnly,
        searchKeywords: Array.isArray(body.searchKeywords) ? body.searchKeywords : [],
        greenhouseBoards: Array.isArray(body.greenhouseBoards) ? body.greenhouseBoards : [],
        leverBoards: Array.isArray(body.leverBoards) ? body.leverBoards : [],
      },
      select: {
        searchNiche: true,
        searchLocation: true,
        searchRemoteOnly: true,
        searchKeywords: true,
        greenhouseBoards: true,
        leverBoards: true,
      },
    });

    return NextResponse.json({ settings: user });
  } catch (err) {
    console.error("Saving search settings failed:", err);
    return NextResponse.json(
      { error: "Something went wrong saving that. Please try again." },
      { status: 500 }
    );
  }
}
