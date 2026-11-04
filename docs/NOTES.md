# Joby: Running Notes

Everything we decide or build gets logged here (newest at the bottom).

## Product vision (from J)
Tinder-style job swiping. User uploads resume and says what jobs they want. System finds matches, user swipes.
Swipe yes -> tailored resume + application info is prepared. If the job supports direct apply, a button submits/opens it.
If not, the system prepares everything needed to apply by hand.
The system reads each application's questions and stores answers in a reusable **criteria profile** (e.g. required income), so repeat questions are pre-filled next time.

## Current state (from repo review)
- Next.js 14 + Prisma/Postgres + NextAuth, Groq for generation, deployed on Vercel.
- Already built: resume/cover-letter generation with truth audit, .docx output, email drafting, job sync (`lib/jobSync.ts`, run by `scripts/sync-jobs.ts` every 3rd day via GitHub Actions).
- Sources before this work: Arbeitnow, Greenhouse, Lever, USAJobs, RSS. Too thin, especially for Canada.
- Repo principles (README): no scraping sites that forbid it, no contact-enrichment email guessing, no auto-apply without user review.

## Decisions
- 2026-11-04: Focus Canada first (J tests with own profile). US later.
- 2026-11-04: Expand sources via official APIs / public ATS endpoints rather than "random scraping", to stay consistent with the repo's ToS-compliant stance. See `canada-sources.md`.
- 2026-11-04: Scraper spend capped at $4.50/month (J's limit is $5). Math and guard in `budget.md`; `lib/sources/budget.ts` caps every Apify run.
- 2026-11-04: Built (branch `feat/canada-sources`): Apify adapter, Adzuna connector, budget guard. All off until env vars are set. Indeed/LinkedIn/Glassdoor actors NOT built (conflicts with `spec.md`); J's decision if that should change.
- 2026-11-04: Add a criteria profile store for application questions. See `criteria-profile.md`.

## Next steps
1. DONE (branch): Adzuna connector, Apify adapter, budget guard.
2. Trial one ATS Apify actor with a tiny cap; record real price in `budget.md`.
3. Seed a list of Canadian companies for Greenhouse/Lever/Ashby connectors; add Ashby.
3b. Add Remotive/Himalayas connectors filtered to Canada-eligible roles (read terms first).
4. Add `Job.applyMethod` field (`ATS_LINK`, `EMAIL`, `EXTERNAL`) and `Job.questions` JSON.
5. Build swipe-yes flow: tailor resume -> extract questions -> fill from criteria profile -> ask only for unknowns.
6. Dedupe across sources (company + title + location hash).
