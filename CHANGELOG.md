# Changelog

Every change to Joby bumps the version in `package.json` and adds an entry here.
The version shows in the app footer. A CI check (`.github/workflows/version-check.yml`)
fails a pull request that doesn't bump it.

Versioning: `MAJOR.MINOR.PATCH`. Patch for fixes and small tweaks, minor for new
features or visible changes, major for breaking changes to data or behaviour.

## [0.4.0] - 2026-11-09
### Added
- Posted date and "Added to Joby" date on the swipe deck, list view and details sheet.
- List view now has an info button under the match percentage that opens the same details as the deck (summary, posted and added dates, pay, matched and missing skills, source, link to the posting). The list and deck use one shared card shape, so they show the same information.
- Data retention in the prune tool: `since` date removes everything that entered the system before it. Applied, interview and offer records are kept.

### Changed
- The whole deck is available instead of 10 a day. Cards load in batches of 100 and the next batch loads as the stack runs low. A daily cap can come back with `DAILY_DECK_SIZE`. The "Today's deck" ring is now "Left in your deck".
- Add/Edit Resume removed from the top bar (it stays in the right sidebar).
- Logo in the sidebar is transparent (no white tile).
- Swipe deck: the job details are shown open on the card (no info button), with a More button for the full description. The card is taller to fit them.
- List view: Interested is blue and Pass is red.

## [0.3.0] - 2026-11-07
### Added
- New Joby icon (from J) as the site logo, favicon and phone home-screen icon.
- Search areas: each saved search is a job title plus a list of areas (cities or a province). Jobs outside those areas are no longer shown or pulled in. Remote jobs appear only when remote is switched on for a search.
- Edit Jobs redesigned: a wide "Add a new search" block with area chips and a remote switch, and your existing searches listed below with Edit and Remove.
- Edit a saved search (new `PUT /api/user/search-settings/[id]`).
- Cleanup tool: `Prune jobs outside my areas` (manual GitHub Action, dry run by default) removes unswiped and passed jobs outside your areas. Interested, drafted and applied jobs are never touched. The daily sync also drops unswiped suggestions outside your areas.
- Resume card in the right sidebar now shows years of service, roles, skills, certifications, and your recent roles.

### Changed
- Profile, Add/Edit Resume and Add/Edit Jobs rebuilt in the new design (they were still on the old style and overlapped the header).
- Profile form is now first name, last name, address, city, phone, email and LinkedIn ID. Field/classification and years of experience removed.
- New **Applied** tab. Navigation order is now Dashboard, List view, Interested, Applied, Passed, Add/Edit Jobs, Add/Edit Resume. Applied jobs moved off the Interested page.
- Left sidebar: Job Search shows one card per search (title with its areas); Application Status removed (applied jobs live on Applied).
- Top bar: notification bell, name menu and density option removed; one Dark/Light toggle.
- List view rows reworked so the Pass button no longer gets cut off; province filter chips removed.
- Dark mode: all text, cards, pills, badges and forms now follow theme colours.

### Database
- `Profile.address` (optional text). Additive, applied by `prisma db push` on build.

## [0.2.0] - 2026-11-06
### Added
- Redesigned dashboard: dark left sidebar, pill navigation, swipe stage with a skyline backdrop, match-score rings, "Today's deck" ring, company logos (monogram fallback).
- Swipe effects: left swipes shatter and dissolve; right and up swipes burst into stars with a glow.
- Pay on every card and row (Ashby, Lever and Apify sources give structured pay; a conservative text fallback fills gaps), plus work mode (remote / hybrid / onsite), posted date and company logo.
- Generate Now card in the right sidebar for the job on top of the deck.
- Favicon and app icon use the Joby logo.
- App version in the footer, `CHANGELOG.md`, and a CI check that requires a version bump.
- Bottom tab bar on phones.
- Daily sync (every morning) with recency-limited Apify runs, so new jobs arrive each day within the $4.50/month cap. `NEW` badge on cards posted in the last two days.
- Pipeline strip (Found, Interested, Applied, Interview, Offer), count-up numbers, dark mode and a compact density option (avatar menu), province filter chips on the list view, phone haptics on swipe, pop animation when a job is marked applied.

### Changed
- Swipe deck is the home page; list view is the second tab (10 per page).
- Interested and Passed pages replace the queue.
- Overview and Application status moved into the left sidebar (Application status lists applied jobs only).

### Database
- `JobPosting` gains optional columns: `salaryMin`, `salaryMax`, `salaryCurrency`, `salaryPeriod`, `logoUrl`, `postedAt`, `workMode`. Additive, applied by `prisma db push` on build.

## [0.1.1]
- Canada-only mode, Ashby adapter, Apify Indeed/LinkedIn boards with a $4.50/month cap, swipe-first pages. See PR #10 and #11.
