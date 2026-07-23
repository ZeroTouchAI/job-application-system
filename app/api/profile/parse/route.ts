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

    const message = err instanceof Error ? err.message : String(err);
    let userMessage =
      "Something went wrong processing that. Please try again in a moment.";

    if (message.includes("Groq API error: 401")) {
      userMessage =
        "The AI service rejected the request (invalid API key). Double-check GROQ_API_KEY in your deployment's environment variables.";
    } else if (message.includes("Groq API error: 429")) {
      userMessage =
        "The AI service is rate-limited right now. Wait a minute and try again.";
    } else if (message === "MALFORMED_JSON") {
      userMessage =
        "The AI's response got cut off or wasn't valid. This usually happens with very long resumes. Try trimming it down, or try again.";
    } else if (message.includes("Groq API error")) {
      userMessage = `The AI service returned an error: ${message}`;
    }

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
