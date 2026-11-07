# Joby: Running Notes

Everything we decide or build gets logged here (newest at the bottom).

## Product vision (from J)
Tinder-style job swiping. User uploads resume and says what jobs they want. System finds matches, user swipes.
Swipe yes -> tailored resume + application info is prepared. If the job supports direct apply, a button submits/opens it.
If not, the system prepares everything needed to apply by hand.
The system reads each application's questions and stores answers in a reusable **criteria profile** (e.g. required income), so repeat questions are pre-filled next time.

## Current state (from repo review)
- Next.js 14 + Prisma/Postgres + NextAuth, Groq for generation, deployed on Vercel.
- Already built: resume/cover-letter generation with truth audit, .docx output, email drafting, job sync (`lib/jobSync.ts`, run by `scripts/sync-jobs.ts` via GitHub Actions).
- Sources before this work: Arbeitnow, Greenhouse, Lever, USAJobs, RSS. Too thin, especially for Canada.
- Repo principles (README): no scraping sites that forbid it, no contact-enrichment email guessing, no auto-apply without user review.

## Decisions
- 2026-11-04: Focus Canada first (J tests with own profile). US later.
- 2026-11-04: Expand sources via official APIs / public ATS endpoints rather than "random scraping", to stay consistent with the repo's ToS-compliant stance. See `canada-sources.md`.
- 2026-11-04: Scraper spend capped at $4.50/month (J's limit is $5). Math and guard in `budget.md`; `lib/sources/budget.ts` caps every Apify run.
- 2026-11-04: Built (PR #9, merged): Apify adapter, Adzuna connector, budget guard. All off until env vars are set.
- 2026-11-05: J chose to add Indeed + LinkedIn via Apify. Tested actors; chose `agentx/all-jobs-scraper` (predictable $0.01/run + $0.0035/result). Rejected khadinakbar (hidden proxy/compute cost, about $11 per 1,000), devilscrapes (crashes), openclawai ($6 per 1,000). See `budget.md`, `scraping-policy.md`.
- 2026-11-05: Canada only (`CANADA_ONLY`, default on). Arbeitnow and USAJobs skipped. Native Ashby adapter added (free), so Apify is only used for Indeed/LinkedIn. Seeded 23 verified Canadian Greenhouse/Lever/Ashby boards.
- 2026-11-04: Add a criteria profile store for application questions. See `criteria-profile.md`.
- 2026-11-06: v0.2.0 redesign from J's mockup; pay/logo/posted-date/work-mode added; swipe effects (left shatters, right/up bursts into stars); version shown in footer, bumped on every change (CHANGELOG.md + CI check).
- 2026-11-06: Daily sync for fresh jobs; Apify runs limited to postings from the last day; budget guard now assumes 31 runs/month (worst case about $4.30).
- 2026-11-06: Adzuna deliberately left until the very end (J's call).

## Versioning rule
Every change bumps `package.json` version and adds a `CHANGELOG.md` entry. The `Version bump check` workflow fails PRs that don't.

## Next steps
1. DONE: Adzuna connector, Apify adapter, budget guard (PR #9).
2. DONE: actor trial (budget.md), Ashby adapter, seed boards.
3. DONE: APIFY_TOKEN set, first sync ran. Next: check `posted_since` format on the first daily run.
3b. Last: Adzuna. Also Remotive/Himalayas connectors filtered to Canada-eligible roles (read terms first).
4. Add `Job.applyMethod` field (`ATS_LINK`, `EMAIL`, `EXTERNAL`) and `Job.questions` JSON.
5. Build swipe-yes flow: tailor resume -> extract questions -> fill from criteria profile -> ask only for unknowns.
6. Dedupe across sources (company + title + location hash).
