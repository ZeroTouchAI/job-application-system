# Rewrite plan: swipe-to-apply

Decisions (Nov 2, 2026): Tinder-style swipe (right = interested, left = pass),
US and Canada chosen per user, human always makes the final submit click,
prefilled apply is the primary path, public project.

This replaces spec §2.3 ("no auto-apply"). The new rule: **the app prepares,
the person submits.** No server-side submission to any employer form.

## What we keep

Profile parsing, grounded resume and cover-letter generation, truth audit,
Application tracking, rejected-stays-rejected (title+company key), the
Greenhouse/Lever/USAJobs/RSS connectors, NextAuth, Prisma/Postgres.

## What changes

1. **Match quality.** `rawPostingToAnalysis` takes the first 40 unique words of
   a posting as "required skills." Replace with an LLM or embedding pass that
   extracts real requirements, seniority and salary, and scores against the
   profile. Cards are only as good as this.
2. **Deck instead of dashboard.** `GET /api/deck` returns the next N unseen
   postings ranked for the user (capped around 10 per day). `POST /api/swipe`
   records `right | left | up`.
3. **Statuses.** Add `queued` (swiped right), `ready` (Apply Pack built),
   `applied`. `suggested` stays for unseen cards.
4. **Apply Pack.** On right swipe, build in the background: tailored resume,
   cover letter, answers to that posting's questions, and the apply path from
   `applyMode`.
5. **Question vault.** New models `Question` (canonical text, type, sensitive
   flag) and `Answer` (per user, last confirmed). Harvest questions from
   Greenhouse job endpoints; ask the user once; reuse after. Salary, work
   authorization, sponsorship and EEO fields are `sensitive`: always shown for
   confirmation, never filled silently.
6. **Prefill extension.** Browser extension, user-triggered, fills Greenhouse,
   Lever, Ashby (then others) from the Apply Pack. The user reviews and clicks
   submit. Never bypass CAPTCHAs or logins.
7. **Country-aware sync.** Profile gets `country` (US | CA). Sync reads
   `lib/sources/registry.ts`, applies each source's attribution, rate and
   redistribution rules.
8. **Sync cadence.** Move from every 3 days to a daily run. The repo's own
   notes say the Actions storage quota was hit in Aug 2026, so keep the
   cleanup workflow, and check Vercel's cron limits on your plan before moving
   it.

## Phases

| Phase | Deliverable | Needs from you |
|---|---|---|
| 0 | Registry and docs (done). Confirm Adzuna/Jooble US+CA coverage once keys exist. | API keys |
| 1 | Swipe deck UI on existing data, swipe API, queued list. | none |
| 2 | Better extraction and scoring. | Groq key already in env |
| 3 | Apply Pack builder plus question vault with Greenhouse harvesting. | none |
| 4 | Ashby, Remotive, RemoteOK connectors. | read their terms |
| 5 | Prefill browser extension. | Chrome Web Store account later |
| 6 | Public launch checklist: attribution, privacy policy, delete/export, Adzuna licence. | legal review |

## Open risks

- Free Canadian coverage is thin (see docs/sources.md).
- Extension store policies and each ATS's terms on autofill have not been
  reviewed yet.
- Several source terms are unverified; do not ship those connectors until read.
