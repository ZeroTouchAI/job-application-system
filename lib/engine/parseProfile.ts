import fs from "node:fs/promises";
import path from "node:path";
import { Profile } from "../profileSchema";

const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

let systemPromptCache: string | null = null;
async function loadSystemPrompt(): Promise<string> {
  if (!systemPromptCache) {
    systemPromptCache = await fs.readFile(
      path.join(process.cwd(), "prompts", "system-parse-profile.md"),
      "utf-8"
    );
  }
  return systemPromptCache;
}

export interface ParseProfileResult {
  profile?: Profile;
  error?: string;
}

/**
 * Parses raw pasted resume/LinkedIn text into the structured Profile shape.
 * This is intentionally a *parsing* step, not a rewriting step — bullets
 * should come out close to the original wording. Tailoring/rewriting
 * happens later, in the resume-generation step, against the user's
 * explicit direction and a specific job posting.
 */
export async function parseProfileText(rawText: string): Promise<ParseProfileResult> {
  if (!rawText || rawText.trim().length < 40) {
    return {
      error:
        "That doesn't look like enough text to parse. Paste your full resume or LinkedIn profile content.",
    };
  }

  const systemPrompt = await loadSystemPrompt();

  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText },
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
  const parsed = JSON.parse(cleaned);

  if (parsed.error) {
    return { error: parsed.error };
  }

  // Normalize technicalSkills key naming from the prompt's "name" field
  // (matches SkillCategory schema) and validate everything strictly
  // before it's allowed anywhere near generation.
  const validated = Profile.safeParse(parsed);
  if (!validated.success) {
    return {
      error:
        "Could not parse that into a valid profile. Try pasting plainer text (no tables/columns), or fill in fields manually.",
    };
  }

  return { profile: validated.data };
}
