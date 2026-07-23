import fs from "node:fs/promises";
import path from "node:path";
import type { Profile, JobPostingAnalysis } from "../profileSchema";

const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

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

  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({ profile, jobPosting: posting }),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API error: ${res.status} ${errBody}`);
  }

  const json = await res.json();
  const content: string | undefined = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in Groq response");
  }

  const cleaned = content.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as GeneratedCoverLetter;
}
