# Scraper budget (Apify)

Hard rule from J: **ZeroTouch scraping spend stays under $5/month; target cap $4.50/month.**

## How the guard works
`lib/sources/budget.ts` splits the monthly budget evenly across the maximum number of sync runs in a month and gives each run a hard cap:

- `perRunUsd = floor(monthlyBudget / runsPerMonth, to the cent)`
- `maxItems  = floor(perRunUsd / pricePer1000 * 1000)`

Both are sent to Apify (`maxTotalChargeUsd`, `maxItems`), so a run is stopped by Apify itself if it hits the cap. Because every run is capped, the month cannot exceed the budget even if every run maxes out. No database table is needed.

Also set a **monthly usage limit of $4.50 on the Apify account** (Apify console, Settings, Limits). That is the real backstop.

## The math (assumed $3.00 per 1,000 results, budget $4.50)
$4.50 / $3.00 per 1,000 = **1,500 results per month** in total.

| Sync schedule | Runs/month (max) | Per-run cap | Max results/run | Max results/month | Max spend/month |
|---|---|---|---|---|---|
| Daily | 31 | $0.14 | 46 | 1,426 | $4.28 |
| **Every 3rd day (current workflow, `*/3`)** | 11 | $0.40 | 133 | 1,463 | $4.39 |
| Weekly | 5 | $0.90 | 300 | 1,500 | $4.50 |

`*/3` on day-of-month fires on days 1, 4, 7 ... 31, so 10 or 11 runs depending on the month. The guard uses 11.

### Price sensitivity (results per month at $4.50)
| Price per 1,000 | Results/month |
|---|---|
| $2.00 | 2,250 |
| $3.00 | 1,500 |
| $3.50 | 1,285 |

## Making the budget go further
- Sync less often but with bigger runs (weekly) when results per run matter more than freshness.
- Ask the actor for only recent postings so you are not paying for ones already stored.
- Use free sources first (Greenhouse, Lever, Ashby, Adzuna). They cost nothing and do not count against this budget. Apify should fill gaps, not be the base.
- One user (J) means one saved-search set, so 1,500 results/month is plenty for testing. Revisit before adding users.

## Caveats (verify before trusting the numbers)
- $3.00/1,000 is an **assumption** from Store listings of other job actors. The ATS actor we pick may price differently, may add a per-run start fee, or may bill compute or proxy separately. Run one small capped test and read the Apify usage page, then set `APIFY_PRICE_PER_1000_USD`.
- Confirm that `maxItems` and `maxTotalChargeUsd` are honored for the chosen actor's pricing model.
- Adzuna is not billed through Apify.
