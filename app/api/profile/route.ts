import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { Profile as ProfileSchema } from "../../../lib/profileSchema";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.profile.findUnique({
    where: { userId: (session.user as { id: string }).id },
  });

  return NextResponse.json({ profile });
}

/**
 * Accepts a parsed profile (from paste-in resume text, uploaded file
 * text, or pasted LinkedIn profile text — parsing happens client-side
 * or in a separate ingestion step, not shown here) and validates it
 * against the Zod schema before storing. Nothing reaches generation
 * without passing this validation.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = (session.user as { id: string }).id;
  const data = parsed.data;

  const profile = await db.profile.upsert({
    where: { userId },
    update: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      location: data.location,
      linkedinUrl: data.linkedinUrl,
      workExperience: data.workExperience,
      certifications: data.certifications,
      technicalSkills: data.technicalSkills,
      knownGaps: data.knownGaps,
    },
    create: {
      userId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      location: data.location,
      linkedinUrl: data.linkedinUrl,
      workExperience: data.workExperience,
      certifications: data.certifications,
      technicalSkills: data.technicalSkills,
      knownGaps: data.knownGaps,
    },
  });

  return NextResponse.json({ profile });
}
