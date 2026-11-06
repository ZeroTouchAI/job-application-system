# Changelog

Every change to Joby bumps the version in `package.json` and adds an entry here.
The version shows in the app footer. A CI check (`.github/workflows/version-check.yml`)
fails a pull request that doesn't bump it.

Versioning: `MAJOR.MINOR.PATCH`. Patch for fixes and small tweaks, minor for new
features or visible changes, major for breaking changes to data or behaviour.

## [0.2.0] - 2026-11-06
### Added
- Redesigned dashboard: dark left sidebar, pill navigation, swipe stage with a skyline backdrop, match-score rings, "Today's deck" ring, company logos (monogram fallback).
- Swipe effects: left swipes shatter and dissolve; right and up swipes burst into stars with a glow.
- Pay on every card and row (Ashby, Lever and Apify sources give structured pay; a conservative text fallback fills gaps), plus work mode (remote / hybrid / onsite), posted date and company logo.
- Generate Now card in the right sidebar for the job on top of the deck.
- Favicon and app icon use the Joby logo.
- App version in the footer, `CHANGELOG.md`, and a CI check that requires a version bump.
- Bottom tab bar on phones.

### Changed
- Swipe deck is the home page; list view is the second tab (10 per page).
- Interested and Passed pages replace the queue.
- Overview and Application status moved into the left sidebar (Application status lists applied jobs only).

### Database
- `JobPosting` gains optional columns: `salaryMin`, `salaryMax`, `salaryCurrency`, `salaryPeriod`, `logoUrl`, `postedAt`, `workMode`. Additive, applied by `prisma db push` on build.

## [0.1.1]
- Canada-only mode, Ashby adapter, Apify Indeed/LinkedIn boards with a $4.50/month cap, swipe-first pages. See PR #10 and #11.
