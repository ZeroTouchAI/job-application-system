# Scraper budget (Apify)

Rule from J: **scraping spend stays under $5/month; target cap $4.50/month.** J's Apify account is on the Free plan, which also hard-stops at $5 of monthly credit, so there is a built-in backstop.

## Test results (2026-11-05, 10-result capped runs, about $0.12 total)

| Actor | Result | Real cost | Verdict |
|---|---|---|---|
| `agentx/all-jobs-scraper` (Indeed, LinkedIn, plus 36 boards) | 10 jobs, Toronto/Winnipeg/Montreal/Waterloo/Vancouver. LinkedIn rows have posted date + link; Indeed rows add the employer's own apply URL on Workday/careers pages. | $0.045 for 10 ($0.01 start + $0.0035 per result). Platform usage paid by the actor's author. | **Chosen** |
| `khadinakbar/jobs-scraper` | 5 clean LinkedIn rows before it hit the cap | **$0.057 for 5 jobs**. Billed platform usage to us (4 GB container plus residential proxy), so the real price is roughly $11 per 1,000, not the listed $3. | Rejected: hidden cost |
| `hapol/job-boards` (Greenhouse/Lever/Ashby) | 10 clean jobs with descriptions and apply links | $0.015 for 10 | Works, but see below |
| `devilscrapes/multi-ats-jobs-scraper` | Crashed (exit 91, bug on fractional Ashby salaries) | $0 | Rejected: unreliable |
| `openclawai/job-board-scraper` | Not run | Listed at $6.00 per 1,000 on the Free plan | Too expensive |
| `fairquery/company-jobs-feed`, `groupoject/indeed-jobs-scraper` | Do not exist any more | n/a | n/a |

**ATS boards do not need Apify.** Greenhouse, Lever and Ashby publish free keyless APIs. The repo reads them natively (`greenhouse.ts`, `lever.ts`, new `ashby.ts`), so the whole $4.50 goes to the Indeed/LinkedIn actor.

## Daily fresh jobs
J wants something new every day, so the sync now runs **every morning** (08:00 UTC, `.github/workflows/sync-jobs.yml`).

- **Free sources do most of the work.** Greenhouse, Lever and Ashby cost nothing, so they run daily and pick up each day's new postings.
- **Apify only pays for new postings.** Each daily run sends `posted_since` = yesterday (set `APIFY_POSTED_SINCE_DAYS` to widen it), so results are jobs posted in the last day, not repeats. This `posted_since` field is in the actor's input schema but the date format is untested, so check the first run's posted dates.
- **Salary comes back in CAD** (`currency: "CAD"`).
- The budget guard now assumes **31 runs a month** (`APIFY_RUNS_PER_MONTH`), so every day is covered.

## How the guard works
`lib/sources/budget.ts` splits the monthly budget over the maximum number of runs in a month and caps each run, then splits that across saved searches:

- per-run cap = floor(4.50 / 31) = **$0.14**
- results per search = floor((per-search cap - $0.01 start) / $0.0035)
- Apify also gets `maxItems` and `maxTotalChargeUsd`, so a run stops itself at the cap.

| Saved searches | Cap per search | Results per search per day | Worst-case month |
|---|---|---|---|
| 1 | $0.14 | 37 | $4.32 |
| 3 | $0.046 | 10 | $4.19 |
| 5 | $0.028 | 5 | $4.26 |

About 1,100 paid results a month at most. Real spend is lower on days with fewer new postings. Each extra saved search splits the same daily pool. Verified by running `planBoardsRun` locally.

### What "new every day" can and can't promise
- The deck shows up to 10 jobs a day, best match first, so one new posting a day is enough to keep it fresh.
- How many new postings exist depends on the market and your saved searches. A very narrow search can have quiet days.
- A day's paid results are capped (37 for one search), so busy days are cut off at the budget, not at the supply.

## Caveats
- Prices are the Free-plan prices read from the live listing on 2026-11-05. They change; update `APIFY_START_PRICE_USD` / `APIFY_RESULT_PRICE_USD`.
- agentx timed out in 121 of its recent runs per its listing; failed runs still cost whatever results they delivered.
- Set the Apify account's own monthly usage limit to $4.50 (console, Settings, Limits) as the second line of defence.
- Adzuna is free and not part of this budget.
