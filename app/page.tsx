import Link from "next/link";
import {
  CheckIcon,
  ShieldIcon,
  DatabaseIcon,
  UserCheckIcon,
  SendIcon,
  TargetIcon,
  FileTextIcon,
  MailDraftIcon,
  TrackIcon,
  UploadIcon,
  SearchIcon,
} from "./icons";

const CHECKLIST = [
  "Grounded resume tailoring",
  "Drafted cover letters",
  "Application tracking",
  "Review before anything sends",
  "ToS-compliant job sourcing",
  "100% free & open source",
];

const TRUST_ITEMS = [
  { icon: ShieldIcon, title: "Verified skills", sub: "Never invented" },
  { icon: DatabaseIcon, title: "Legitimate job APIs", sub: "Never scraped" },
  { icon: UserCheckIcon, title: "You review & approve", sub: "Always in control" },
  { icon: SendIcon, title: "Apply through the employer", sub: "Never auto-submitted" },
];

const STEPS = [
  {
    icon: UploadIcon,
    title: "Add your profile",
    desc: "Paste your resume or LinkedIn text and we build a verified skills database from it. Nothing more.",
  },
  {
    icon: SearchIcon,
    title: "Discover matching jobs",
    desc: "We pull postings from legitimate public job APIs on a schedule and score them against your profile.",
  },
  {
    icon: FileTextIcon,
    title: "Generate applications",
    desc: "A tailored resume and cover letter, grounded entirely in what's actually in your profile.",
  },
  {
    icon: CheckIcon,
    title: "Review the truth audit",
    desc: "Every bullet is checked against your profile and flagged verified or needs-review before you see it.",
  },
  {
    icon: TrackIcon,
    title: "Apply & track",
    desc: "Submit through the employer's own application page or listed inbox, and track status over time.",
  },
];

const FEATURES = [
  {
    icon: TargetIcon,
    title: "Grounded job matching",
    desc: "Match scoring based on your actual verified skills against each posting's real requirements.",
  },
  {
    icon: FileTextIcon,
    title: "Resume tailoring",
    desc: "ATS-safe, single-column formatting with every bullet traceable back to your profile.",
  },
  {
    icon: MailDraftIcon,
    title: "Email drafts you review",
    desc: "When a posting lists an application email, we draft it, and you always read it and hit send yourself.",
  },
  {
    icon: FileTextIcon,
    title: "Cover letter generation",
    desc: "Specific to the company and role, and honest about at least one real gap instead of hiding it.",
  },
  {
    icon: TrackIcon,
    title: "Application tracker",
    desc: "Every application logged with match score, documents used, and status over time.",
  },
  {
    icon: ShieldIcon,
    title: "Self-hosted, your data",
    desc: "Runs on your own free Postgres database. Nothing about you is sold or shared.",
  },
];

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <div className="logo">
            <span className="logo-mark">J</span>
            <div className="logo-block">
              Joby
              <span className="powered-by">
                Powered by{" "}
                <a href="https://zerotouchai.com" target="_blank" rel="noreferrer">
                  ZeroTouchAI.com
                </a>
              </span>
            </div>
          </div>
          <nav className="site-nav">
            <div className="site-nav-links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a
                href="https://github.com/ZeroTouchAI/job-application-system"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
            <div className="site-nav-actions">
              <Link href="/login" className="btn btn-outline btn-sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Get started free
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">Free &amp; open source</div>
            <h1>
              Land your next job, <span className="accent">honestly</span>
            </h1>
            <p className="lede">
              This system finds real postings from legitimate job APIs, tailors a
              resume and cover letter from your verified skills, and never
              invents experience you don&apos;t have.
            </p>
            <ul className="hero-checklist">
              {CHECKLIST.map((item) => (
                <li key={item}>
                  <CheckIcon className="check-icon" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-primary">
                Get started free
              </Link>
              <a href="#how-it-works" className="btn btn-outline">
                See how it works
              </a>
            </div>
            <div className="hero-footnote">
              <CheckIcon className="check-icon" style={{ width: 15, height: 15 }} />
              Free. Open source. No scraping, ever.
            </div>
          </div>

          <div className="hero-visual">
            <div className="preview-window">
              <div className="preview-titlebar">
                <span className="preview-dot" style={{ background: "#ff5f57" }} />
                <span className="preview-dot" style={{ background: "#febc2e" }} />
                <span className="preview-dot" style={{ background: "#28c840" }} />
              </div>
              <div className="preview-body">
                <div className="preview-title">Your matches</div>
                <div className="preview-stat-grid">
                  <div className="preview-stat">
                    <div className="num">12</div>
                    <div className="label">New matches</div>
                  </div>
                  <div className="preview-stat">
                    <div className="num">4</div>
                    <div className="label">Applied</div>
                  </div>
                </div>
                <div className="preview-match">
                  <div>
                    <div className="role">Operations Coordinator</div>
                    <div className="meta">Acme Logistics · Remote</div>
                  </div>
                  <span className="score">82% match</span>
                </div>
                <div className="preview-match">
                  <div>
                    <div className="role">Data Analyst</div>
                    <div className="meta">Riverside Group · Toronto</div>
                  </div>
                  <span className="score">76% match</span>
                </div>
                <div className="preview-match">
                  <div>
                    <div className="role">Program Associate</div>
                    <div className="meta">Northwind Co · Hybrid</div>
                  </div>
                  <span className="score">64% match</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="container trust-bar-inner">
          {TRUST_ITEMS.map(({ icon: Icon, title, sub }) => (
            <div className="trust-item" key={title}>
              <Icon className="icon" />
              <div>
                <div className="title">{title}</div>
                <div className="sub">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-heading">
            <h2>How it works</h2>
            <p>Five steps, and you&apos;re in control at every one of them.</p>
          </div>
          <div className="steps">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div className="step" key={title}>
                {i < STEPS.length - 1 && <div className="step-connector" />}
                <div className="step-circle">
                  <Icon width={26} height={26} />
                </div>
                <div className="step-num">STEP {i + 1}</div>
                <div className="step-title">{title}</div>
                <div className="step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section features-section" id="features">
        <div className="container">
          <div className="section-heading">
            <h2>Everything you need, nothing that overreaches</h2>
            <p>Built to help your search, not to spam anyone on your behalf.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div className="feature-card" key={title}>
                <Icon className="icon" />
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2>Ready to search smarter?</h2>
            <p>
              Set up your profile in a few minutes and let the system do the
              legwork.
            </p>
            <div className="cta-actions">
              <Link href="/register" className="btn btn-primary">
                Get started free
              </Link>
              <a
                href="https://github.com/ZeroTouchAI/job-application-system"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}
              >
                View on GitHub
              </a>
            </div>
          </div>
          <div className="cta-badges">
            <div className="cta-badge">
              <ShieldIcon className="icon" />
              <div>
                <div className="title">100% free &amp; open source</div>
                <div className="sub">Built transparently for job seekers</div>
              </div>
            </div>
            <div className="cta-badge">
              <DatabaseIcon className="icon" />
              <div>
                <div className="title">Your data, your control</div>
                <div className="sub">Self-hosted on your own database</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <span>
            &copy; {new Date().getFullYear()} Joby. Free &amp; open
            source. Powered by{" "}
            <a href="https://zerotouchai.com" target="_blank" rel="noreferrer">
              ZeroTouchAI.com
            </a>
            .
          </span>
          <a
            href="https://github.com/ZeroTouchAI/job-application-system"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
