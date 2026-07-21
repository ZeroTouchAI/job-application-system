# Joby

A free, open-source job-search co-pilot: it finds relevant job postings from
legitimate public sources, tailors a resume and cover letter to each one from
a verified personal skills database, and tracks your applications — without
ever inventing experience you don't have, and without scraping or emailing
anyone's personal inbox without their consent.

## Why "Joby"

Two ideas, both load-bearing:

1. **Grounded generation.** Every resume bullet is generated *from* your
   verified skills database, never invented. The AI selects, rewords, and
   organizes — it never fabricates an employer, title, date, or skill.
2. **A job-search co-pilot** — sourcing postings, tailoring documents,
   tracking applications — so you don't have to do it manually for every
   single posting.

## What this is NOT

To keep this project free, legal, and safe to self-host, it deliberately does
**not**:

- Scrape LinkedIn or any site that forbids scraping in its terms of service.
- Discover or guess personal/hiring-manager email addresses via third-party
  "contact enrichment" APIs (Apollo, RocketReach, etc.).
- Auto-apply to jobs without the user reviewing and clicking submit.
- Send unsolicited cold email on the user's behalf to people the system found
  on its own.

See [`docs/spec.md`](./docs/spec.md) for the full reasoning and the detailed
product spec.

## How applications actually happen

- **Official ATS link**: most postings link to a Greenhouse/Lever/Workday
  application form. Joby prepares your tailored resume + cover letter
  and hands you a direct link — you review and submit.
- **Posting-listed inbox**: if a posting itself states an email address to
  apply to (common for smaller companies), Joby drafts that email with
  your tailored resume attached, and you review and send it. This is
  fundamentally different from the system discovering a stranger's email on
  its own — the employer published that address specifically to be emailed.

## Stack

- **Next.js 14** (App Router, TypeScript) — single full-stack app
- **PostgreSQL + Prisma** — works with any Postgres host (Neon, Railway,
  Supabase-as-plain-Postgres, or local Docker) — free tiers available
  everywhere, no vendor lock-in
- **NextAuth.js** — self-contained auth, no third-party auth vendor required
- **Groq API** — resume/cover-letter generation, grounded in the user's
  profile, with citation-based truth auditing. Free tier, no credit card
  required ([console.groq.com](https://console.groq.com)). Called via
  Groq's OpenAI-compatible endpoint, so swapping to any other
  OpenAI-compatible provider later is a one-line env change
  (`GROQ_BASE_URL` / `GROQ_MODEL`)
- **`docx` npm package** — renders `.docx` output
- **Node cron script** (`scripts/sync-jobs.ts`) — periodic job sourcing,
  runnable via any free scheduler (GitHub Actions cron, Railway cron, etc.)
  instead of a paid automation platform

## Job sources (legitimate, ToS-compliant)

- [Arbeitnow](https://www.arbeitnow.com) — free public job board API
- Greenhouse public job-board API (per-company, e.g.
  `https://boards-api.greenhouse.io/v1/boards/{company}/jobs`)
- Lever public postings API (per-company, e.g.
  `https://api.lever.co/v0/postings/{company}`)
- RSS feeds from any board that publishes one
- (Roadmap) USAJobs public API for US government roles

## Getting started

```bash
cp .env.example .env        # fill in DATABASE_URL, GROQ_API_KEY, NEXTAUTH_SECRET
npm install
npx prisma migrate dev
npm run dev
```

To run a job sync manually:

```bash
npm run sync-jobs
```

## Project structure

```
/app                    Next.js App Router pages + API routes
/lib
  /sources              Job source connectors (Arbeitnow, Greenhouse, Lever)
  /engine               Match scoring, resume/cover-letter generation, truth audit
  /docx                 .docx rendering
  profileSchema.ts       Zod schema for the verified skills database
/prisma/schema.prisma    Database schema
/prompts                 System prompts (grounding + guardrails)
/scripts/sync-jobs.ts    Cron entry point for scheduled job sourcing
profile.example.yaml     Example profile — copy structure, never commit real data
```

## Privacy

Your profile data (work history, contact info) lives only in your own
database. `profile.example.yaml` ships with fake data as a structural
reference. Never commit a real filled-in profile — treat it like credentials.

## License

MIT. Free to self-host, fork, and modify.
