# Canada job sources

Updated 2026-11-05. Canada only for now; US and EU sources are skipped (`CANADA_ONLY`, `lib/sources/canada.ts`). See also `docs/sources.md`, `docs/budget.md`, `docs/scraping-policy.md`.

## What runs
| Source | Cost | Status |
|---|---|---|
| Greenhouse, Lever, Ashby boards (native adapters) | Free | On. Seeded with the verified Canadian employers below. Add more with `GREENHOUSE_DEFAULT_BOARDS`, `LEVER_DEFAULT_BOARDS`, `ASHBY_DEFAULT_BOARDS`. |
| Apify `agentx/all-jobs-scraper`: Indeed + LinkedIn | About $4.40/month max | Built, off until `APIFY_TOKEN` is set. Tested 2026-11-05. |
| Adzuna Canada | Free tier, evaluation only | Built, off until keys set. |
| Arbeitnow, USAJobs | Free | Paused (Canada only). |

## Verified seed boards (existence and open postings checked 2026-11-05)
Greenhouse: hootsuite, faire, ritual, d2l, later, unbounce, tailscale.
Lever: wattpad, achievers, plooto, pointclickcare.
Ashby: lightspeedhq, cohere, procurify, visier, hopper, jobber, trulioo, clearco, neofinancial, koho, benevity, miovision.

A slug existing does not prove it is the company you expect (for example `later`, `faire`, `tailscale`). Postings are filtered to Canada, so a wrong match only costs a few rows.

Boards that exist but had 0 postings that day: wealthsimple (Lever), thinkific, benchsci, fellow.
Not found on Greenhouse/Lever/Ashby by that name: shopify, clio, coveo, nuvei, applyboard, auvik, axonify, vena, bench, league, borrowell, ecobee, kobo, freshbooks, telus, rbc.
(US employers with Canadian offices were also found, e.g. stripe, dropbox, gitlab, cloudflare, okta, mongodb, elastic, twilio, affirm, robinhood, canonical, samsara, mercury, plaid, zapier; they are not seeded because they would store thousands of mostly non-Canadian postings.)

## Next
1. Set `APIFY_TOKEN` as a GitHub secret and the $4.50 limit on the Apify account.
2. Run the sync once and check the Actions log (Apify cost line, Ashby counts).
3. Add the swipe-yes question capture (`docs/criteria-profile.md`).
4. Remotive / Himalayas for remote roles (read terms first).
