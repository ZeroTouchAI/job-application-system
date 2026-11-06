# Design brief

Asked for by J (2026-11-05): ideas for making the dashboard feel more unique, a layout concept, and a prompt to give an AI designer.

## Current layout (shipped)
Header (Dashboard, List view, Add/Edit Resume, Interested, Passed, Add/Edit Jobs). Three columns on every main page:
- Left: profile card, Overview (Jobs found / Interested / Passed / Applied), Job search, Application status (applied jobs only), log out.
- Centre: the page (swipe deck on Dashboard; paginated list; Interested; Passed; resume; jobs).
- Right: Current resume.
Footer: Powered by ZeroTouchAI.com.

## Ideas
1. **Make the deck the star.** One big swipe stage with a calm, quiet frame around it. Everything else is a rail.
2. **Swipe feel.** Card tilts as you drag, a stamp fades in (INTERESTED green, PASS red), spring-back if you let go early. Keyboard: left/right/up arrows. Optional haptics on mobile.
3. **Match score as a ring** around the company logo, coloured by strength, instead of a small pill.
4. **Pipeline strip** (Found > Interested > Applied > Interview > Offer) as one thin progress bar with counts, in place of four equal boxes.
5. **Today's deck progress** (for example 7 of 10) as a small ring in the left rail.
6. **Distinct type.** A characterful heading face with a clean body face. Warm off-white paper background, deep ink text, one confident accent colour, plus a second accent for "success" (Applied).
7. **Real information on the card:** pay (when the posting lists it), province chip, remote/hybrid/onsite badge, posted date, source, and a one-line "why it matches" from the skills overlap.
8. **Empty states with a next action** ("You're caught up. Next sync is in 2 days. Add another search?").
9. **Moments of delight, kept small:** a subtle check animation on Mark as applied, a count-up on the Overview numbers.
10. **Mobile first:** bottom tab bar (Swipe, List, Interested, Passed, You), full-screen swipe stage, left and right rails become sheets.
11. **Dark mode and a density toggle** (comfortable / compact) for the list.
12. **Canadian touches** that are tasteful rather than kitsch: province filter chips, CAD salary display, bilingual labels as a later option.

## Layout concept: "Stage and rails"
```
+----------------------------------------------------------------------+
| logo   Dashboard  List  Resume  Interested  Passed  Jobs      avatar |
+--------------+--------------------------------------+----------------+
| LEFT RAIL    |              STAGE                   | RIGHT RAIL     |
| profile      |   (swipe card, large, centred)       | current resume |
| pipeline     |   [Pass]  [Top pick]  [Interested]   | skills chips   |
| job search   |   keyboard hints, today's progress   | tips / sync    |
| applied jobs |                                      | status         |
+--------------+--------------------------------------+----------------+
|                     Powered by ZeroTouchAI.com                       |
+----------------------------------------------------------------------+
```
On small screens the rails collapse into bottom sheets and the stage is full screen.

## Prompt for an AI designer (copy and paste)

```
You are a senior product designer. Design a distinctive, polished dashboard for "Joby", a Tinder-style job-search app for Canadian job seekers. Do not use a generic SaaS-template look.

PRODUCT
Users upload a resume and pick the jobs they want. Joby finds matching jobs, and the user swipes: right = Interested, left = Pass, up = Top pick. For Interested jobs the user can generate a tailored resume and cover letter, open the employer's application page, and mark the job Applied. Joby never submits applications for the user.

PAGES TO DESIGN (all share the same frame)
1. Dashboard (home): a large swipe card stage.
2. List view: the same jobs as paginated rows, 10 per page, with search by title/company and by city/region, and Interested/Pass buttons.
3. Interested: jobs with buttons Generate resume + cover letter, Open application, Mark as applied (green), Remove. Applied jobs listed below.
4. Passed: jobs with a Move to Interested button.
5. Add/Edit Resume and Add/Edit Jobs (forms).

LAYOUT (keep this structure)
- Top header: logo and nav (Dashboard, List view, Add/Edit Resume, Interested, Passed, Add/Edit Jobs) and a user menu.
- Left rail: profile card, Overview (Jobs found, Interested, Passed, Applied), Job search summary, Application status (only jobs the user applied to), log out.
- Centre: the page content (the stage).
- Right rail: Current resume summary with skill chips.
- Footer on every page: "Powered by ZeroTouchAI.com".
- Desktop three columns; on mobile the rails become bottom sheets and a bottom tab bar replaces the top nav.

JOB CARD CONTENT
Title, company with logo or monogram, location with province chip, remote/hybrid/onsite badge, match score (as a ring or gauge), source, posted date, pay range when available (CAD) otherwise "Pay not listed", and a one-line reason it matches.

SWIPE INTERACTION
Card tilts while dragging, a stamp fades in (INTERESTED green / PASS red / TOP PICK gold), spring-back when released early, keyboard arrows supported, undo for the last swipe, a small "today's deck 7/10" progress ring.

STYLE DIRECTION
Warm and confident, not corporate. Warm off-white paper background, deep ink text, one bold accent colour plus a green for success. A characterful heading typeface paired with a clean body typeface. Soft layered shadows, generous spacing, subtle texture. Micro-animations that are quick and purposeful. Include light and dark themes. Meet WCAG AA contrast and visible focus states.

DELIVERABLES
A short design rationale; a colour palette with hex values and tokens (CSS variables); the type scale; spacing and radius tokens; component designs (header, rails, stat tiles, job card, swipe stage, list row, pager, buttons, empty states, modal); then working responsive HTML and CSS for the Dashboard and List view that I can adapt into a Next.js app. Use plain CSS variables so it ports easily.
```
