# Notes: Apify job sourcing and open follow-ups

Written Nov 4, 2026 so we can pick this up later. Nothing here is built yet.
Everything about Apify actors below is **untested**; it comes from their Store
listings only.

## Idea

Use Apify as a job-sourcing layer for the sync (`lib/jobSync.ts`). Today the
sync only finds jobs for companies a user types in (Greenhouse/Lever board
names) plus Arbeitnow (mostly EU) and USAJobs (needs a key). Apify could
return many more US and Canadian postings, which the swipe deck needs.

## Status

- Apify is **not connected yet**. A connection link was generated through
  Composio but never completed, and those links expire after 10 minutes.
  Re-run the connection flow when ready; it needs an Apify API token
  (Apify account > Settings > Integrations).
- The app itself also needs the token as a secret (`APIFY_TOKEN`) in GitHub
  Actions and in the hosting env. The Composio connection only lets an
  assistant test actors; it does not give the app access.

## Candidate actors (ATS company job boards)

These read companies' own public career pages and return direct apply links:

- https://apify.com/glitchbound/job-board-scraper
- https://apify.com/hapol/job-boards
- https://apify.com/devilscrapes/multi-ats-jobs-scraper
- https://apify.com/appetizing_horsefly/ats-jobs-scraper
- https://apify.com/fairquery/company-jobs-feed
- https://apify.com/benthepythondev/ats-jobs-aggregator

To evaluate: run a small capped test of each, then keep the one whose output
is clean for US and Canadian roles (title, company, location, remote flag,
full description, apply URL, stable ID). Check pricing model and set a hard
spend cap per run.

## Do not use

Actors that scrape LinkedIn, Indeed or Glassdoor. Their terms prohibit
scraping, Indeed also prohibits automating its apply process, and
`docs/spec.md` already rules this out. The repo is public, so anyone who
deploys it inherits the risk. See `docs/sources.md` for the full source rules.

## How it would plug in

1. New `lib/sources/apify.ts` that starts an actor run, waits, and maps the
   dataset items to `RawPosting` (same shape as `greenhouse.ts`).
2. Register it in `lib/sources/registry.ts` with the right `applyMode`
   (probably `prefill` for ATS postings) and country coverage.
3. Call it from `collectAllPostings()` in `lib/jobSync.ts`, driven by each
   user's saved searches and company lists.
4. Add `APIFY_TOKEN` to `.env.example` and the sync workflow's env.
5. Cost guard: `maxTotalChargeUsd` and `maxItems` on every run, and skip the
   Apify step when the token is missing (same pattern as USAJobs).

## Other follow-ups noted today

- **Scheduled workflows were disabled by GitHub for inactivity** (60 days
  without commits). Both workflows were re-enabled on Nov 4, 2026. If the repo
  goes quiet again they will switch off again; any commit re-arms the clock
  but does not re-enable them.
- **"Sync now" button**: `POST /api/jobs/sync` exists but no page calls it.
  Add a button on the Swipe page.
- **Starter company list**: a seed list of US and Canadian companies on
  Greenhouse/Lever/Ashby so a new account has cards immediately.
- **Database changes ship via the build**: `npm run build` runs
  `prisma db push`. The scheduled sync workflow does not, so the hosted app
  must deploy before the sync runs against a changed schema.
- **Unverified sources** in `docs/sources.md` (Adzuna, Jooble, Careerjet,
  JSearch, Workable, Himalayas, RemoteOK terms) still need their terms read
  before any connector ships.
