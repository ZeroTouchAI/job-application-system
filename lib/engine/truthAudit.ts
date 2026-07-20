import type { Profile } from "../profileSchema";
import type { GeneratedResume } from "./generateResume";
import type { TruthAuditEntry } from "../profileSchema";

/**
 * Resolves a sourceRef path like "workExperience[1].bullets[2]" against
 * the profile object and returns the referenced value, or null if the
 * path doesn't resolve — which means the generation model cited a source
 * that doesn't actually exist, and the claim must be flagged.
 */
function resolveSourceRef(profile: Profile, ref: string): unknown {
  const segments = ref
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);

  let current: unknown = profile;
  for (const seg of segments) {
    if (current == null) return null;
    const key = /^\d+$/.test(seg) ? Number(seg) : seg;
    // @ts-expect-error - dynamic path traversal
    current = current[key];
  }
  return current ?? null;
}

/**
 * Runs a truth audit over a generated resume: every bullet's cited
 * sourceRef must resolve to a real profile entry, and the bullet text
 * should share meaningful overlap with that entry's content. This is a
 * safety net on top of the generation prompt's citation requirement —
 * it does not trust the model, it verifies it.
 */
export function auditResume(
  profile: Profile,
  resume: GeneratedResume
): TruthAuditEntry[] {
  const entries: TruthAuditEntry[] = [];

  for (const job of resume.workExperience) {
    for (const bullet of job.bullets) {
      const resolved = resolveSourceRef(profile, bullet.sourceRef);

      if (resolved == null) {
        entries.push({
          claim: bullet.text,
          sourceRef: bullet.sourceRef,
          status: "flagged",
        });
        continue;
      }

      const sourceText =
        typeof resolved === "string" ? resolved : JSON.stringify(resolved);

      const overlap = wordOverlapRatio(bullet.text, sourceText);

      entries.push({
        claim: bullet.text,
        sourceRef: bullet.sourceRef,
        status: overlap >= 0.25 ? "verified" : "flagged",
      });
    }
  }

  return entries;
}

function wordOverlapRatio(a: string, b: string): number {
  const wordsA = new Set(tokenize(a));
  const wordsB = new Set(tokenize(b));
  if (wordsA.size === 0) return 0;

  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared++;

  return shared / wordsA.size;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9+.#]+/)
    .filter((w) => w.length > 3); // skip short connector words
}
