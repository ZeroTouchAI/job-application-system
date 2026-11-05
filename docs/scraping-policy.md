# Scraping policy (what the project does, honestly)

## Default
The project reads official, public, keyless job-board APIs: Greenhouse, Lever, Ashby, Arbeitnow, USAJobs, and RSS feeds that users supply. No scraping.

## Owner's exception (Nov 2026)
J (the owner) chose to add an **optional** Indeed + LinkedIn job-posting source through Apify (`agentx/all-jobs-scraper`, `lib/sources/apify.ts`).

- It is **off** unless `APIFY_TOKEN` is set. A plain deployment never runs it.
- Indeed, LinkedIn and Glassdoor terms prohibit automated scraping. The risk of enabling it sits with whoever sets the token (account action by those sites, and possible legal exposure). Do not enable it for other people's accounts without telling them.
- It only reads public job listings. It does not touch profiles, contact emails, or the sites' apply flows.
- Nothing is submitted automatically. The user still reviews and clicks apply (README, spec section 2.3).
- Spend is capped (see `docs/budget.md`).

## Still out of scope
Scraping LinkedIn profiles (spec section 2.1), contact-email discovery and cold email (section 2.2), and auto-applying (section 2.3).
