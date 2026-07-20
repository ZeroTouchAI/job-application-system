/**
 * Looks for an application email address that the EMPLOYER ITSELF listed
 * inside the posting text (e.g. "Send your resume to jobs@acme.com").
 *
 * This is the one case where Groundwork will draft an outreach email: the
 * employer published the address specifically to be emailed about this
 * role. It is fundamentally different from looking up or guessing a
 * person's email via a third-party contact-enrichment service — nothing
 * here is discovered, scraped, or inferred.
 *
 * Deliberately conservative: only matches emails that appear near
 * apply-oriented language, to avoid picking up unrelated addresses
 * (e.g. a company's generic support or privacy contact) as if they were
 * meant for applications.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const APPLY_CONTEXT_WORDS =
  /\b(apply|application|send (your )?resume|send (your )?cv|forward your resume|email us|contact us to apply)\b/i;

export function extractListedApplyEmail(rawText: string): string | null {
  const lines = rawText.split(/\n|\.(?=\s)/);

  for (const line of lines) {
    if (APPLY_CONTEXT_WORDS.test(line)) {
      const matches = line.match(EMAIL_REGEX);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
  }

  // Fallback: if there's exactly one email in the whole posting, it's a
  // reasonable bet it's the application contact even without nearby
  // apply-language.
  const allMatches = rawText.match(EMAIL_REGEX);
  if (allMatches && allMatches.length === 1) {
    return allMatches[0];
  }

  return null;
}
