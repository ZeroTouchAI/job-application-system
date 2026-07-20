import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs/promises";
import path from "node:path";
import type { Profile, JobPostingAnalysis } from "../profileSchema";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GeneratedCoverLetter {
  body: string;
  gap_addressed: string;
  sourceRefs: string[];
}

let systemPromptCache: string | null = null;
async function loadSystemPrompt(): Promise<string> {
  if (!systemPromptCache) {
    systemPromptCache = await fs.readFile(
      path.join(process.cwd(), "prompts", "system-coverletter.md"),
      "utf-8"
    );
  }
  return systemPromptCache;
}

export async function generateCoverLetter(
  profile: Profile,
  posting: JobPostingAnalysis
): Promise<GeneratedCoverLetter> {
  const systemPrompt = await loadSystemPrompt();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: JSON.stringify({ profile, jobPosting: posting }),
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from generation model");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as GeneratedCoverLetter;
}
