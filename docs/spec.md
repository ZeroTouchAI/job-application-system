# Groundwork — Product Spec

## 1. Core idea

Groundwork does three things:

1. **Sources** job postings from legitimate, ToS-compliant public sources on
   a schedule.
2. **Tailors** a resume and cover letter to each posting the user selects,
   grounded entirely in a verified, user-maintained skills database — never
   inventing experience.
3. **Tracks** every application: what was sent, match score, status over
   time.

It intentionally stops short of automated outreach-to-strangers or
auto-apply. See §2 for why, and §5 for what replaces those ideas.

## 2. What was scoped out, and why

Three features were considered and rejected during design:

### 2.1 Scraping LinkedIn profiles automatically
LinkedIn's Terms of Service explicitly prohibit scraping. LinkedIn has
pursued legal action against companies that scrape at scale (e.g. the hiQ
Labs litigation), and won on the underlying breach-of-contract claims after
years of litigation, even though an early ruling on a narrower legal question
went the other way. A public, forkable tool that scrapes LinkedIn on behalf
of any user who runs it is a legal liability for every person who deploys it.

**Replacement**: users paste their own LinkedIn profile text (copied by
hand, or from LinkedIn's own "download your data" export) or upload a
resume file. The tool parses either into the structured profile — same
result, no scraping.

### 2.2 Discovering hiring-manager emails and auto-emailing them
Major job boards (Indeed, LinkedIn, Glassdoor, ZipRecruiter) do not expose
personal contact emails — applications route through their own systems or an
ATS. The only sources for "find anyone's email" are third-party contact
enrichment services (Apollo.io, RocketReach, People Data Labs, etc.), which
build their databases largely from scraping public profiles and pages —
the same practice LinkedIn and others actively litigate against. Using one
of these:

- Breaks the "this should be free" requirement (they charge per lookup,
  typically $30–100+/month minimum).
- Means shipping a tool whose core function is generating cold email to
  strangers found via scraped data — a spam/scraping risk profile, not a
  resume tool, regardless of intent.

**Replacement**: applications go through the posting's own official channel
(ATS link, or an email address the *employer itself* published in the
posting text). If the user already has a real contact (a referral, a
business card, a publicly listed careers@ address), Groundwork will draft
the outreach email for review — but it never discovers the contact itself.

### 2.3 Fully automated applying
Submitting on the user's behalf without review risks a bad match or an
off-tone generation going out under their name, unreviewed. Most ATS
platforms and job boards also prohibit automated application bots in their
terms of service — a bot risks the user's account being flagged or banned.

**Replacement**: one-click *preparation*, human click to *submit*. The user
always sees the generated documents and the target link/email before
anything goes out.

## 3. User-facing workflow

1. User creates a profile: paste resume text, upload a resume file, or paste
   LinkedIn profile text. Parsed into the structured skills database (§4).
2. User sets search criteria: niche/keywords, location, seniority, remote
   preference. Saved for reuse.
3. Background job (every 3 days, configurable) pulls new postings from
   configured sources (§6), scores each against the profile, and stores
   results.
4. Dashboard shows new matches: title, company, match %, source link.
5. User clicks a posting → system generates tailored resume (.docx) + cover
   letter (.docx), grounded in the profile, with a truth audit (§7).
6. System shows the application path:
   - Direct link to the posting's official application form, or
   - A drafted email, if-and-only-if the posting itself lists an application
     email address — user reviews and sends.
7. User marks status (applied / interview / offer / rejected) — or, if they
   connect their own inbox, the system can suggest status updates based on
   reply keywords (opt-in, user's own inbox only).
8. History page shows all past applications with match scores and outcomes.

## 4. Data model

See `prisma/schema.prisma` for the authoritative schema. Conceptually:

- **User** — auth identity, search preferences
- **Profile** — the verified skills database: contact info, work history
  (with per-entry `verified: true`), certifications, technical skills by
  category, and an explicit `knownGaps` list ("things I do NOT have") so the
  AI never implies otherwise
- **JobPosting** — sourced postings: title, company, requirements, keywords,
  source, raw text, official apply URL or listed email
- **Application** — one per user+posting: match score, keyword match
  breakdown, generated file references, truth-audit results, status,
  timestamps

## 5. Content generation rules (unchanged from original design)

- Never invent employers, titles, dates, certifications, or skills.
- Reword, reorganize, and conservatively quantify — never fabricate.
- Ask the user before assuming anything not in the database.
- Every generated bullet must cite the profile entry it came from (this
  citation is what powers the truth audit — it's built into the generation
  call, not a separate pass).
- X-Y-Z bullet formula, banned corporate-AI phrases, ATS-safe formatting —
  all as originally specified. See `prompts/system-resume.md`.

## 6. Job sources (all ToS-compliant, all free)

| Source | What it provides | Access method |
|---|---|---|
| Arbeitnow | Aggregated postings, mostly EU | Free public API |
| Greenhouse | Per-company postings | Public `boards-api.greenhouse.io` endpoint, meant for this use |
| Lever | Per-company postings | Public `api.lever.co/v0/postings` endpoint, meant for this use |
| RSS | Any board that publishes a feed | Standard feed parsing |
| USAJobs (roadmap) | US federal roles | Official public API, free registration |

Company-specific Greenhouse/Lever board names are user-configurable — e.g. a
user targeting a specific industry can add the board slugs of companies they
care about.

## 7. Truth audit

Every generated document is checked line-by-line against the profile before
being shown to the user:

- ✅ **Verified** — bullet text traces directly to a specific profile entry
  (work experience, certification, or skill), cited by ID.
- ⚠️ **Needs review** — bullet uses a conservative inference (e.g. derived
  quantification) that the user should confirm before submitting.

No bullet without a traceable source is ever included.

## 8. Roadmap

- [x] Spec + architecture
- [ ] Profile intake (paste/upload/LinkedIn-text) + parsing into schema
- [ ] Match engine + dashboard
- [ ] Resume/cover-letter generation + truth audit
- [ ] Greenhouse/Lever/Arbeitnow source connectors
- [ ] Scheduled sync (cron)
- [ ] Application tracker
- [ ] Reply-detection via user's own connected inbox (opt-in)
- [ ] Portfolio site generator (separate module)
- [ ] Career-change translation, STAR interview prep, negotiation scripts
      (optional modules, on-request only)
