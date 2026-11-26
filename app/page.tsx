import Link from "next/link";
import Skyline from "./components/Skyline";
import { JobLogo, LocationLine, MatchRing } from "./components/jobui";
import {
  ArrowIcon,
  BoltIcon,
  CheckCircleIcon,
  DocIcon,
  LeafIcon,
  RocketIcon,
  SwipeIcon,
  TargetIcon,
} from "./components/authicons";
import { BriefcaseI, BulbI } from "./components/jbicons";

const WHY = [
  {
    title: "Swipe to Discover",
    text: "Quickly browse jobs that match your skills.",
    Icon: SwipeIcon,
    tone: "violet",
  },
  {
    title: "Get Ready",
    text: "Create tailored resumes and cover letters.",
    Icon: CheckCircleIcon,
    tone: "green",
  },
  {
    title: "Apply with Confidence",
    text: "Open the application and take the next step.",
    Icon: RocketIcon,
    tone: "amber",
  },
  {
    title: "Built for Canada",
    text: "Find opportunities in the areas you choose.",
    Icon: LeafIcon,
    tone: "red",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Add your resume and your areas",
    text: "Paste your resume once, then pick the job titles and the cities you would work in.",
  },
  {
    n: "2",
    title: "Swipe your matches",
    text: "Right for interested, left to pass, up for a top pick. Every card shows pay, location and the date it was posted.",
  },
  {
    n: "3",
    title: "Apply on your own terms",
    text: "Generate a tailored resume and cover letter, open the employer's application, and mark it applied.",
  },
];

const FAQ = [
  {
    q: "Does Joby apply for me?",
    a: "No. Joby prepares your resume and cover letter and opens the employer's own application page. You review everything and submit it yourself.",
  },
  {
    q: "Where do the jobs come from?",
    a: "Company career pages (Greenhouse, Lever and Ashby) and job boards such as Indeed and LinkedIn. Only jobs in the areas you choose are shown.",
  },
  {
    q: "Will Joby make things up on my resume?",
    a: "No. Tailored documents are built only from what is in the resume you provide.",
  },
  {
    q: "Is it only for Canada?",
    a: "For now, yes. Joby starts with Canadian jobs and will expand later.",
  },
];

export default function LandingPage() {
  return (
    <div className="lp">
      {/* ---------- Header ---------- */}
      <header className="lp-nav">
        <Link href="/" className="lp-logo" aria-label="Joby home">
          <img src="/joby-leaf.svg" alt="" width={44} height={44} />
          <span>Joby</span>
        </Link>
        <nav className="lp-links" aria-label="Sections">
          <a href="#how">How It Works</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="lp-nav-right">
          <Link href="/login" className="lp-login">
            Log in
          </Link>
          <Link href="/register" className="lp-btn lp-btn-sm">
            Get Started
          </Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <h1>
            Find Your
            <br />
            Next Opportunity
          </h1>
          <p className="lp-tag">
            Swipe. Discover. <em>Apply.</em>
          </p>
          <p className="lp-lede">Joby helps Canadian job seekers find the right job with a simple swipe.</p>
          <Link href="/register" className="lp-btn lp-btn-lg">
            Get Started Free <ArrowIcon />
          </Link>

          <ul className="lp-mini">
            <li>
              <span className="lp-mini-ico lp-tone-violet">
                <BoltIcon />
              </span>
              Swipe Jobs
              <br />
              Like a Pro
            </li>
            <li>
              <span className="lp-mini-ico lp-tone-indigo">
                <TargetIcon />
              </span>
              Get Matches
              <br />
              That Fit
            </li>
            <li>
              <span className="lp-mini-ico lp-tone-green">
                <CheckCircleIcon />
              </span>
              Apply on Your
              <br />
              Own Terms
            </li>
          </ul>
        </div>

        <div className="lp-hero-visual" aria-hidden="true">
          <Skyline className="lp-hero-sky" />
          <div className="lp-stamp lp-stamp-pass">PASS</div>
          <div className="lp-stamp lp-stamp-like">INTERESTED</div>
          <div className="lp-stamp lp-stamp-top">TOP PICK</div>
          <div className="lp-card">
            <div className="lp-card-head">
              <JobLogo company="Maple Financial" size={58} />
              <div className="lp-card-title">
                <b>Software Engineer</b>
                <span>Maple Financial</span>
              </div>
              <MatchRing score={92} size={70} />
            </div>
            <div className="lp-card-line">
              <LocationLine location="Toronto, ON" mode="hybrid" />
            </div>
            <div className="lp-card-line lp-card-pay">
              <BriefcaseI width={16} height={16} />
              <b>$80K &ndash; $120K CAD</b>
              <span>&bull; Posted 2 days ago</span>
            </div>
            <div className="lp-card-match">
              <BulbI width={16} height={16} />
              <span>Matches your skills: React, TypeScript, cloud computing</span>
            </div>
            <div className="lp-card-note">Example job card</div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="lp-section lp-how">
        <h2>How It Works</h2>
        <ol className="lp-steps">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="lp-step-n">{s.n}</span>
              <b>{s.title}</b>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Why Joby ---------- */}
      <section id="features" className="lp-section lp-why">
        <h2>Why Joby?</h2>
        <div className="lp-why-grid">
          {WHY.map(({ title, text, Icon, tone }) => (
            <div className="lp-why-item" key={title}>
              <span className={`lp-why-ico lp-tone-${tone}`}>
                <Icon width={26} height={26} />
              </span>
              <b>{title}</b>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <div className="lp-docs">
          <DocIcon width={22} height={22} />
          Every card shows pay, location, work mode and when the job was posted, so you can decide in a swipe.
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section id="about" className="lp-section lp-about">
        <h2>About</h2>
        <p>
          Joby is built by ZeroTouchAI for Canadian job seekers. It finds postings in the cities you pick, scores
          them against your resume, and helps you prepare each application. You always review and submit it
          yourself.
        </p>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="lp-section lp-faq">
        <h2>FAQ</h2>
        <div className="lp-faq-list">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <div className="lp-final">
          <Link href="/register" className="lp-btn lp-btn-lg">
            Get Started Free <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="lp-foot">
        <span className="lp-foot-brand">
          <img src="/joby-leaf.svg" alt="" width={30} height={30} />
          Joby
        </span>
        <small>
          Powered by{" "}
          <a href="https://zerotouchai.com" target="_blank" rel="noreferrer">
            ZeroTouchAI.com
          </a>
        </small>
        <nav aria-label="Footer">
          <Link href="/login">Log in</Link>
          <Link href="/register">Sign up</Link>
          <a href="https://github.com/ZeroTouchAI/job-application-system" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </footer>
    </div>
  );
}
