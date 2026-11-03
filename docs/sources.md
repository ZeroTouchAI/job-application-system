# Job source registry (US + Canada)

Verified November 2, 2026 against vendor docs where reachable. Anything marked
**unverified** was not confirmed from an official page and must be re-checked
before it ships. Terms change; re-verify each source quarterly.

## How applying works per source

Every posting gets an `applyMode` that decides what the swipe-right flow does:

| applyMode | Meaning |
|---|---|
| `prefill` | Known ATS form. User opens the official form, a user-triggered browser extension fills it, the user reviews and submits. |
| `email` | Posting itself lists an apply address. App drafts the email, user sends it from their own inbox. |
| `link` | Aggregator redirect. App prepares the Apply Pack (resume, cover letter, answers) and links out. |
| `official-only` | Government or similar; must follow the announcement's own instructions. Link out only. |

No source gives us a way to submit on a candidate's behalf without that
company's own credentials, so there is no server-side auto-submit anywhere.

## Tier 1: ATS feeds (direct apply URLs, per company)

Coverage depends on which company slugs we know. Location is in the feed, so
US/Canada filtering works. The bottleneck is company discovery: ship a seed
directory plus "add a company" per user.

| Source | Read access | Submit | Status |
|---|---|---|---|
| Greenhouse | `GET boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`, public. The job endpoint also returns each posting's application `questions` array. | POST uses Basic auth with the company's own API key. Not available to us. | In repo. Add question harvesting. |
| Lever | `GET api.lever.co/v0/postings/{site}?mode=json` (EU: `api.eu.lever.co`), public | Apply POST needs a key from the company's Super Admin (secondary source). Custom questions are not in the public API (secondary source). | In repo |
| Ashby | `GET api.ashbyhq.com/posting-api/job-board/{name}?includeCompensation=true`, no key | `applicationForm.submit` exists; auth requirement not confirmed. Assume gated. | Add |
| Recruitee | `GET {company}.recruitee.com/api/offers/`, keyless (secondary source) | None described | Add, verify first |
| Workable | Two unofficial public routes reported (`jobs.workable.com/api/v1/jobs` search; per-account endpoint). One secondary source says account access is key-gated. Vendor terms not found. | None described | **Unverified.** Decide after reading Workable's terms. |
| SmartRecruiters | Official Posting API docs say API key or OAuth is required. Other articles claim it is public. | n/a | **Skip** until confirmed; official docs win. |
| Personio, Pinpoint, Gem, Polymer, Teamtailor (RSS) | Reported public feeds (secondary source) | None described | Later, low priority |
| Workday, iCIMS | Career-site only, employer-gated | n/a | Skip |
| Breezy, BambooHR, Rippling, Manatal | Undocumented endpoints that can change without notice | n/a | Skip |

## Tier 2: aggregators and government

| Source | Countries | Access | Terms that shape the product | Status |
|---|---|---|---|---|
| USAJobs | US (federal) | Free key, official API. Search: up to 500 rows per page, 10,000 per query. | Commercial and public-facing use allowed. Attribution encouraged, not required. Must not imply government endorsement, must not claim an application was sent unless it followed the announcement's instructions, no credential sharing or rate-limit bypass. | In repo. Needs `USAJOBS_API_KEY`, `USAJOBS_USER_AGENT`. |
| Adzuna | US and CA **unconfirmed** from docs (only a UK example seen) | Free key. One comparison reports 2,500 requests/month, 250/day, 25/min. | Free tier is for evaluation. Commercial use needs a licence after a 14-day trial. Ads need the "Adzuna" label linking back. Results are redirect links with snippets. | Add behind a flag. Needs a licence conversation for a public product. |
| Jooble | US via jooble.org key; Canada **unconfirmed** (keys are per regional domain) | Free key, 500 lifetime requests per key | Terms not found. | **Unverified.** Too small a quota for production. |
| Careerjet | Locales **unconfirmed** | Free publisher key tied to a registered site, Basic auth | Each call must carry the end user's IP and user agent. Built for displaying listings. | **Unverified.** Awkward for a batch sync. |
| JSearch (RapidAPI) | US and CA likely (Google for Jobs), **unconfirmed** | 200 requests/month free, $25 for 10,000. Returns apply links. | Third-party paid dependency; upstream data provenance and terms not reviewed. | Optional, evaluate later. |
| Remotive | Remote only | `GET remotive.com/api/remote-jobs`, free | Max about 4 requests/day, blocked above 2/minute. Listings delayed 24h. Link to the Remotive URL and credit them. Must not pass their jobs to other job sites. No email or signup harvesting. | Add, remote lane only. |
| RemoteOK | Remote only | `GET remoteok.com/api`, first array element is a legal notice | Link-back attribution required (secondary source). | Add, read their terms first. |
| We Work Remotely | Remote only | RSS | Terms not stated in sources read. | Optional |
| Himalayas | Remote only | Paginated public API | Docs page could not be fetched. Terms unread. | **Unverified.** |
| Arbeitnow | Mostly EU | Free public API | In repo. Low value for US/CA. | Keep as filler or drop. |
| Job Bank Canada | CA | Monthly CSV only, Open Government Licence - Canada. No apply links or full descriptions. No official live API found. | Fine to use. | Use for wage and NOC enrichment, **not** as a deck source. |

## The Canada gap

No free live Canadian job feed was found. Realistic coverage: Canadian
companies on Greenhouse, Lever and Ashby (location-filtered), plus Adzuna CA
or Jooble CA if the keys confirm it, plus remote roles that allow Canada.
Expect thinner Canadian decks than US ones at launch; say so in the UI instead
of hiding it.

## Public-product obligations (not legal advice)

- Render required attribution on every card from a source that demands it.
- Never copy Remotive listings into anything that republishes to other job sites.
- USAJobs cards carry a "not affiliated with OPM" note.
- Adzuna needs a commercial licence before a public launch.
- Store the minimum personal data; offer export and delete. Get a privacy review
  for Canadian and US state rules before launch.
- Employer-side AI-hiring rules (for example Ontario's posting disclosure since
  Jan 1, 2026) bind employers, not this tool, but the apply flow should never
  misrepresent who wrote an answer.
