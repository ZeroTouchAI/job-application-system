import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.profile.findUnique({
    where: { userId: (session.user as { id: string }).id },
    select: {
      fullName: true,
      email: true,
      phone: true,
      location: true,
      linkedinUrl: true,
      headline: true,
      yearsExperience: true,
    },
  });

  return NextResponse.json({ account: profile });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const userId = (session.user as { id: string }).id;
    const loginEmail = session.user.email;

    const fullName = [body.firstName, body.lastName].filter(Boolean).join(" ").trim() || null;

    const profile = await db.profile.upsert({
      where: { userId },
      update: {
        fullName,
        email: loginEmail || null,
        phone: body.phone || null,
        location: body.city || null,
        linkedinUrl: body.linkedinUrl || null,
        headline: body.headline || null,
        yearsExperience: body.yearsExperience || null,
      },
      create: {
        userId,
        fullName,
        email: loginEmail || null,
        phone: body.phone || null,
        location: body.city || null,
        linkedinUrl: body.linkedinUrl || null,
        headline: body.headline || null,
        yearsExperience: body.yearsExperience || null,
      },
      select: {
        fullName: true,
        email: true,
        phone: true,
        location: true,
        linkedinUrl: true,
        headline: true,
        yearsExperience: true,
      },
    });

    return NextResponse.json({ account: profile });
  } catch (err) {
    console.error("Saving account info failed:", err);
    return NextResponse.json(
      { error: "Something went wrong saving that. Please try again." },
      { status: 500 }
    );
  }
}
