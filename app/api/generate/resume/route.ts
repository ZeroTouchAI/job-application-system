import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { generateResume } from "../../../../lib/engine/generateResume";
import { auditResume } from "../../../../lib/engine/truthAudit";
import { buildResumeDocx } from "../../../../lib/docx/docxBuilder";
import type { Profile, JobPostingAnalysis } from "../../../../lib/profileSchema";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { applicationId } = await req.json();
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
  }

  const application = await db.application.findFirst({
    where: { id: applicationId, userId },
    include: { jobPosting: true },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const dbProfile = await db.profile.findUnique({ where: { userId } });
  if (!dbProfile) {
    return NextResponse.json(
      { error: "Complete your profile before generating a resume" },
      { status: 400 }
    );
  }

  const profile: Profile = {
    fullName: dbProfile.fullName ?? undefined,
    email: dbProfile.email ?? undefined,
    phone: dbProfile.phone ?? undefined,
    location: dbProfile.location ?? undefined,
    linkedinUrl: dbProfile.linkedinUrl ?? undefined,
    workExperience: dbProfile.workExperience as Profile["workExperience"],
    certifications: dbProfile.certifications as Profile["certifications"],
    technicalSkills: dbProfile.technicalSkills as Profile["technicalSkills"],
    knownGaps: dbProfile.knownGaps,
  };

  const posting: JobPostingAnalysis = {
    title: application.jobPosting.title,
    company: application.jobPosting.company,
    requiredSkills: application.jobPosting.requiredSkills,
    preferredSkills: application.jobPosting.preferredSkills,
    certificationsRequired: [],
    softwareRequired: [],
    atsKeywords: application.jobPosting.atsKeywords,
    rawText: application.jobPosting.rawText,
  };

  const resume = await generateResume(profile, posting);
  const auditResults = auditResume(profile, resume);

  const flaggedCount = auditResults.filter((r) => r.status === "flagged").length;
  if (flaggedCount > 0) {
    console.warn(
      `Truth audit flagged ${flaggedCount} bullet(s) for application ${applicationId} — shown to user for review, not blocked.`
    );
  }

  const docxBuffer = await buildResumeDocx(profile, resume);

  // NOTE: local filesystem storage is a placeholder for the MVP. Swap
  // for object storage (S3-compatible bucket, etc.) before deploying
  // multi-user in production — local disk won't persist or scale across
  // serverless instances.
  const outputDir = path.join(process.cwd(), "generated");
  await fs.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `resume-${applicationId}.docx`);
  await fs.writeFile(filePath, docxBuffer);

  await db.application.update({
    where: { id: applicationId },
    data: {
      resumeDocPath: filePath,
      truthAudit: auditResults,
      status: "drafted",
    },
  });

  return NextResponse.json({ resume, truthAudit: auditResults });
}
