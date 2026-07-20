import { z } from "zod";

/**
 * The verified skills database schema. This is the single source of truth
 * for all generated resume/cover-letter content. The generation engine is
 * instructed to never output a claim that doesn't trace back to one of
 * these entries.
 */

export const WorkExperienceEntry = z.object({
  employer: z.string(),
  title: z.string(),
  location: z.string().optional(),
  startDate: z.string(), // free text, e.g. "2021-03" or "March 2021"
  endDate: z.string(),   // free text, or "Present"
  bullets: z.array(z.string()),
  verified: z.literal(true).default(true),
});
export type WorkExperienceEntry = z.infer<typeof WorkExperienceEntry>;

export const CertificationEntry = z.object({
  name: z.string(),
  issuer: z.string(),
  year: z.string().optional(),
  verified: z.literal(true).default(true),
});
export type CertificationEntry = z.infer<typeof CertificationEntry>;

export const SkillCategory = z.object({
  name: z.string(), // user-defined, e.g. "AI & Automation", "Infrastructure"
  items: z.array(z.string()),
});
export type SkillCategory = z.infer<typeof SkillCategory>;

export const Profile = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url().optional(),

  workExperience: z.array(WorkExperienceEntry).default([]),
  certifications: z.array(CertificationEntry).default([]),
  technicalSkills: z.array(SkillCategory).default([]),

  /**
   * Explicitly tracked "I do NOT have this" list. Prevents the AI from
   * ever implying the user has something they don't (e.g. a specific
   * license, degree, or certification a posting requires).
   */
  knownGaps: z.array(z.string()).default([]),
});
export type Profile = z.infer<typeof Profile>;

/** A single sourced job posting, parsed into structured requirements. */
export const JobPostingAnalysis = z.object({
  title: z.string(),
  company: z.string(),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  certificationsRequired: z.array(z.string()).default([]),
  softwareRequired: z.array(z.string()).default([]),
  atsKeywords: z.array(z.string()).default([]),
  rawText: z.string(),
});
export type JobPostingAnalysis = z.infer<typeof JobPostingAnalysis>;

/** One line item in a truth audit — every generated claim traced to source. */
export const TruthAuditEntry = z.object({
  claim: z.string(),
  sourceRef: z.string(), // e.g. "workExperience[2].bullets[0]" or "knownGaps"
  status: z.enum(["verified", "flagged"]),
});
export type TruthAuditEntry = z.infer<typeof TruthAuditEntry>;
