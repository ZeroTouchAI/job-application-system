import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { parseProfileText } from "../../../../lib/engine/parseProfile";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const result = await parseProfileText(text);
    if (result.error || !result.profile) {
      return NextResponse.json(
        { error: result.error || "Could not parse profile" },
        { status: 422 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const data = result.profile;

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
  } catch (err) {
    console.error("Profile parsing failed:", err);
    return NextResponse.json(
      {
        error:
          "Something went wrong parsing that. Check that GROQ_API_KEY is set correctly, or try again.",
      },
      { status: 500 }
    );
  }
}
