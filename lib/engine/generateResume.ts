import fs from "node:fs/promises";
import path from "node:path";
import type { Profile, JobPostingAnalysis } from "../profileSchema";

/**
 * Uses Groq's free, OpenAI-compatible API (https://api.groq.com/openai/v1)
 * instead of a paid provider: no credit card required to get a key at
 * console.groq.com. Swappable later for any other OpenAI-compatible
 * provider by changing GROQ_BASE_URL/GROQ_MODEL.
 */
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
// gpt-oss-120b is Groq's current recommended flagship text model (as of
// mid-2026): strong instruction-following for structured JSON output,
// which matters for the citation format the truth audit depends on.
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

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

  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 4096,
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
