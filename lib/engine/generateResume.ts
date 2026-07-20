import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs/promises";
import path from "node:path";
import type { Profile, JobPostingAnalysis } from "../profileSchema";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GeneratedBullet {
  text: string;
  sourceRef: string;
}

export interface GeneratedResume {
  summary: string;
  workExperience: {
    employer: string;
    title: string;
    dateRange: string;
    bullets: GeneratedBullet[];
  }[];
  skills: string[];
  certifications: string[];
  gaps_to_ask_about: string[];
}

let systemPromptCache: string | null = null;
async function loadSystemPrompt(): Promise<string> {
  if (!systemPromptCache) {
    systemPromptCache = await fs.readFile(
      path.join(process.cwd(), "prompts", "system-resume.md"),
      "utf-8"
    );
  }
  return systemPromptCache;
}

export async function generateResume(
  profile: Profile,
  posting: JobPostingAnalysis
): Promise<GeneratedResume> {
  const systemPrompt = await loadSystemPrompt();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          profile,
          jobPosting: posting,
        }),
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from generation model");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as GeneratedResume;

  // Defense in depth: even though the prompt forbids it, verify every
  // bullet actually has a non-empty sourceRef before returning. The
  // truth-audit step does the real verification against the profile;
  // this just guards against a malformed/missing citation slipping
  // through to the UI.
  for (const job of parsed.workExperience) {
    for (const bullet of job.bullets) {
      if (!bullet.sourceRef) {
        throw new Error(
          `Generated bullet missing sourceRef: "${bullet.text}"`
        );
      }
    }
  }

  return parsed;
}
