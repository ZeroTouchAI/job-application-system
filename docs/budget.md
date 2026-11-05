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

## How the guard works
`lib/sources/budget.ts` splits the monthly budget over the maximum sync runs in a month (11 for the `*/3` schedule) and caps each run, then splits that across saved searches:

- per-run cap = floor(4.50 / 11) = **$0.40**
- results per search = floor((per-search cap - $0.01 start) / $0.0035)
- Apify also gets `maxItems` and `maxTotalChargeUsd`, so a run stops itself at the cap.

| Saved searches | Cap per search | Results per search per run | Worst-case month |
|---|---|---|---|
| 1 | $0.40 | 111 | $4.38 |
| 2 | $0.20 | 54 | $4.38 |
| 5 | $0.08 | 20 | $4.40 |

About 1,200 results a month in total. Each extra saved search splits the same pool; it doesn't add to it. Verified by running `planBoardsRun` locally.

## Other schedules (single search)
| Schedule | Runs/month | Cap per run | Results per run | Results per month |
|---|---|---|---|---|
| Every 3rd day (current) | 11 | $0.40 | 111 | 1,221 |
| Weekly | 5 | $0.90 | 254 | 1,270 |
| Daily | 31 | $0.14 | 37 | 1,147 |

Fewer, bigger runs waste less on the $0.01 start fee. Differences are small.

## Caveats
- Prices are the Free-plan prices read from the live listing on 2026-11-05. They change; update `APIFY_START_PRICE_USD` / `APIFY_RESULT_PRICE_USD`.
- agentx timed out in 121 of its recent runs per its listing; failed runs still cost whatever results they delivered.
- Set the Apify account's own monthly usage limit to $4.50 (console, Settings, Limits) as the second line of defence.
- Adzuna is free and not part of this budget.
