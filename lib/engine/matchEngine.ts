import type { Profile, JobPostingAnalysis } from "../profileSchema";

export interface MatchResult {
  matchScore: number; // 0-100
  keywordsMatched: string[];
  keywordsMissing: string[];
  band: "overqualified" | "excellent" | "good" | "stretch" | "underqualified";
  recommendation: string;
}

/** Flattens all of a profile's skill/experience text into a searchable set. */
function collectProfileTerms(profile: Profile): Set<string> {
  const terms = new Set<string>();

  for (const cat of profile.technicalSkills) {
    for (const item of cat.items) terms.add(normalize(item));
  }
  for (const cert of profile.certifications) {
    terms.add(normalize(cert.name));
  }
  for (const job of profile.workExperience) {
    terms.add(normalize(job.title));
    for (const bullet of job.bullets) {
      for (const word of tokenize(bullet)) terms.add(word);
    }
  }

  return terms;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9+.#]+/)
    .filter((w) => w.length > 2);
}

/**
 * Score = (keywords matched / total required keywords) × 100
 * Same formula as the original spec, applied programmatically here
 * (a lightweight first pass) and refined per-application by the LLM
 * generation step, which has full context on both sides.
 */
export function scoreMatch(
  posting: JobPostingAnalysis,
  profile: Profile
): MatchResult {
  const profileTerms = collectProfileTerms(profile);
  const knownGapTerms = new Set(profile.knownGaps.map(normalize));

  const requiredTerms = [
    ...posting.requiredSkills,
    ...posting.certificationsRequired,
    ...posting.softwareRequired,
  ].map(normalize);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const term of requiredTerms) {
    const isKnownGap = [...knownGapTerms].some(
      (gap) => gap.includes(term) || term.includes(gap)
    );
    const isMatch = [...profileTerms].some(
      (pt) => pt.includes(term) || term.includes(pt)
    );

    if (isMatch && !isKnownGap) {
      matched.push(term);
    } else {
      missing.push(term);
    }
  }

  const total = requiredTerms.length || 1;
  const score = Math.round((matched.length / total) * 100);

  return {
    matchScore: score,
    keywordsMatched: matched,
    keywordsMissing: missing,
    ...bandFor(score),
  };
}

function bandFor(score: number): {
  band: MatchResult["band"];
  recommendation: string;
} {
  if (score >= 90)
    return { band: "overqualified", recommendation: "Overqualified" };
  if (score >= 75)
    return {
      band: "excellent",
      recommendation: "Excellent fit — apply immediately",
    };
  if (score >= 60)
    return {
      band: "good",
      recommendation: "Good fit — apply with a strong cover letter",
    };
  if (score >= 50)
    return {
      band: "stretch",
      recommendation: "Stretch role — apply if you're passionate about it",
    };
  return {
    band: "underqualified",
    recommendation: "Under-qualified — skip unless it's a dream role",
  };
}
