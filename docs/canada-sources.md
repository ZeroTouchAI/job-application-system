# Canada job sources

Researched 2026-11-04. Read together with `docs/sources.md` (the registry doc) and `docs/notes-apify-and-followups.md`. This file is the Canada-specific plan.

## Build order
| # | Source | Role | Status |
|---|--------|------|--------|
| 1 | Greenhouse / Lever / Ashby boards of Canadian employers | Direct apply links, readable question schemas (feeds the criteria profile) | Greenhouse and Lever in repo. Ashby planned. Needs a seeded Canadian company list. |
| 2 | Adzuna API, country `ca` | Broad coverage, redirect links | Connector written (`lib/sources/adzuna.ts`), off until keys are set. Free tier is evaluation only; public launch needs a licence. Quota figures vary by source, so check your dashboard. |
| 3 | Apify ATS-board actor | Fills gaps across many companies' public career pages | Adapter written (`lib/sources/apify.ts`), off until token and actor set. Actor not yet chosen or tested. Budget-capped, see `docs/budget.md`. |
| 4 | Remotive / RemoteOK / Himalayas | Remote roles open to Canada | Planned. Read each one's terms first (Remotive: about 4 requests/day, 24h delay, attribution). |
| 5 | Job Bank Canada open data | Wage and NOC enrichment only | Monthly CSV, no employer or apply link. Not a deck source. |

## Apify: what is and is not allowed in this repo
- **Allowed path:** actors that read companies' own public ATS pages (candidate list in `docs/notes-apify-and-followups.md`).
- **Not built:** multi-board actors that scrape Indeed, LinkedIn, Glassdoor or ZipRecruiter (about $3 per 1,000 results, Canada supported). `docs/spec.md` section 2.2 and the README rule these out, Indeed also forbids automating its apply flow, and the repo is public so deployers inherit the risk. Using them would be a deliberate policy change by J, not a config tweak. If J decides to, update `spec.md`, the README "What this is NOT" list and `registry.ts` first.

## Next
1. Pick and trial one ATS actor with `maxItems` of about 20; record real price and output shape here.
2. Seed Canadian Greenhouse/Lever/Ashby companies.
3. Add Ashby connector.
4. Set Apify account monthly limit to $4.50.
