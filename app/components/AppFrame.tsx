"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { InFrameContext } from "./frameContext";
import { useMaterials } from "./materials";
import { formatAreas } from "../../lib/areas";
import { careerSummary, roleSpan } from "../../lib/resumeStats";
import {
  BanI,
  BriefcaseI,
  CheckI,
  ChevronI,
  FileI,
  HeartFillI,
  HeartI,
  HomeI,
  ListI,
  LogoutI,
  MoonI,
  PencilI,
  PinI,
  SparkleI,
  SunI,
  TagI,
} from "./jbicons";

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

interface ProfileData {
  fullName?: string;
  email?: string;
  workExperience?: { employer: string; title: string; startDate?: string; endDate?: string }[];
  certifications?: { name: string }[];
  technicalSkills?: { name: string; items: string[] }[];
}

interface SearchCriteria {
  id: string;
  niche: string;
  location: string | null;
  remoteOnly: boolean;
}

interface Stats {
  found: number;
  interested: number;
  passed: number;
  applied: number;
  interview: number;
  offer: number;
}

interface Current {
  id: string;
  title: string;
  company: string;
  applyUrl: string | null;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", match: ["/dashboard", "/deck"], Icon: HomeI },
  { href: "/list", label: "List view", match: ["/list"], Icon: ListI },
  { href: "/interested", label: "Interested", match: ["/interested", "/queue"], Icon: HeartI },
  { href: "/applied", label: "Applied", match: ["/applied"], Icon: CheckI },
  { href: "/passed", label: "Passed", match: ["/passed"], Icon: BanI },
  { href: "/jobs", label: "Add/Edit Jobs", match: ["/jobs"], Icon: BriefcaseI },
];

const TABS = [
  { href: "/dashboard", label: "Swipe", Icon: HomeI },
  { href: "/list", label: "List", Icon: ListI },
  { href: "/interested", label: "Interested", Icon: HeartI },
  { href: "/applied", label: "Applied", Icon: CheckI },
  { href: "/passed", label: "Passed", Icon: BanI },
];

/** Pages call this after a swipe or status change so the sidebars update now. */
export function refreshFrame() {
  window.dispatchEvent(new Event("joby-refresh"));
}

/** Numbers glide to their new value instead of jumping. */
function CountUp({ value }: { value: number | undefined }) {
  const [shown, setShown] = useState(value ?? 0);
  const from = useRef(value ?? 0);
  useEffect(() => {
    if (value === undefined) return;
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 600);
      setShown(Math.round(start + (value - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{value === undefined ? "\u2013" : shown}</>;
}

function PipelineStrip({ stats }: { stats: Stats | null }) {
  const found = stats?.found ?? 0;
  const steps = [
    { label: "Found", n: stats?.found },
    { label: "Interested", n: stats?.interested },
    { label: "Applied", n: stats?.applied },
    { label: "Interview", n: stats?.interview },
    { label: "Offer", n: stats?.offer },
  ];
  return (
    <div className="jb-pipe" aria-label="Your pipeline">
      {steps.map((st) => (
        <div className="jb-pipe-step" key={st.label}>
          <b>
            <CountUp value={st.n} />
          </b>
          <span>{st.label}</span>
          <i style={{ "--w": `${found > 0 && st.n ? Math.max(6, Math.round((st.n / found) * 100)) : 0}%` } as React.CSSProperties} />
        </div>
      ))}
    </div>
  );
}

function initialsOf(name?: string) {
  return name
    ? name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("")
    : "?";
}

/**
 * The shared dashboard frame: dark left sidebar, pill navigation, centre
 * page, right resume rail, footer with the app version, and a tab bar on
 * phones.
 */
export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [criteria, setCriteria] = useState<SearchCriteria[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [current, setCurrent] = useState<Current | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Remember the look the user picked on this device.
  useEffect(() => {
    try {
      const t = localStorage.getItem("joby-theme");
      if (t === "dark" || t === "light") setTheme(t);
    } catch {
      /* storage blocked: keep defaults */
    }
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("joby-theme", next);
    } catch {
      /* ignore */
    }
  }

  const materials = useMaterials((id) => {
    window.dispatchEvent(new CustomEvent("joby-generated", { detail: { id } }));
    refreshFrame();
  });

  const loadStats = useCallback(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile))
      .catch(() => {});
    fetch("/api/user/search-settings")
      .then((r) => r.json())
      .then((d) => setCriteria(d.criteria || []))
      .catch(() => {});
    loadStats();

    const onRefresh = () => loadStats();
    const onSearches = () => {
      fetch("/api/user/search-settings")
        .then((r) => r.json())
        .then((d) => setCriteria(d.criteria || []))
        .catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") loadStats();
    };
    const onCurrent = (e: Event) => setCurrent((e as CustomEvent<Current | null>).detail ?? null);
    window.addEventListener("joby-refresh", onRefresh);
    window.addEventListener("joby-searches", onSearches);
    window.addEventListener("joby-current", onCurrent);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(loadStats, 15000);
    return () => {
      window.removeEventListener("joby-refresh", onRefresh);
      window.removeEventListener("joby-searches", onSearches);
      window.removeEventListener("joby-current", onCurrent);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [loadStats]);

  const onDashboard = pathname === "/dashboard" || pathname === "/deck";
  const showPipeline = onDashboard || pathname === "/interested" || pathname === "/applied";
  const skills = (profile?.technicalSkills || []).flatMap((c) => c.items);
  const isActive = (m: string[]) => m.some((x) => pathname === x || pathname.startsWith(x + "/"));
  const initials = initialsOf(profile?.fullName);
  const career = careerSummary(profile?.workExperience || []);
  const roles = profile?.workExperience || [];
  const certCount = (profile?.certifications || []).length;

  const overview = [
    { label: "Jobs found", value: stats?.found, href: "/list", Icon: BriefcaseI, tone: "blue" },
    { label: "Interested", value: stats?.interested, href: "/interested", Icon: HeartFillI, tone: "green" },
    { label: "Passed", value: stats?.passed, href: "/passed", Icon: BanI, tone: "red" },
    { label: "Applied", value: stats?.applied, href: "/applied", Icon: CheckI, tone: "ok" },
  ];

  return (
    <div className="jb" data-theme={theme}>
      {/* ---------- Left sidebar ---------- */}
      <aside className="jb-side">
        <Link href="/dashboard" className="jb-brand">
          <span className="jb-brand-tile">
            <img src="/joby-logo.png" alt="" width={32} height={32} />
          </span>
          <span>Joby</span>
        </Link>

        <div className="jb-user">
          <span className="jb-avatar jb-avatar-lg">{initials}</span>
          <div className="jb-user-text">
            <div className="jb-user-name">{profile?.fullName || "Your account"}</div>
            <div className="jb-user-mail">{profile?.email || ""}</div>
          </div>
        </div>
        <Link href="/account" className="jb-ghost-btn">
          <PencilI width={14} height={14} /> Edit Profile
        </Link>

        <div className="jb-side-title">Overview</div>
        <div className="jb-ov">
          {overview.map((o) => (
            <Link href={o.href} className="jb-ov-row" key={o.label}>
              <span className={`jb-ov-ico jb-tone-${o.tone}`}>
                <o.Icon width={15} height={15} />
              </span>
              <span className="jb-ov-label">{o.label}</span>
              <span className="jb-ov-count">
                <CountUp value={o.value} />
              </span>
            </Link>
          ))}
        </div>

        <div className="jb-side-title">Job Search</div>
        <div className="jb-ov">
          {criteria.length === 0 && (
            <Link href="/jobs" className="jb-search-card">
              <span className="jb-search-title">Set your search</span>
              <span className="jb-search-areas">Add a job title and the areas you want</span>
            </Link>
          )}
          {criteria.map((c) => (
            <Link href="/jobs" className="jb-search-card" key={c.id}>
              <span className="jb-search-title">
                <TagI width={14} height={14} /> {c.niche}
              </span>
              <span className="jb-search-areas">
                <PinI width={13} height={13} /> {formatAreas(c.location) || "Anywhere in Canada"}
              </span>
              {c.remoteOnly && <span className="jb-search-remote">+ Remote</span>}
            </Link>
          ))}
        </div>

        <button className="jb-logout" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogoutI width={16} height={16} /> Log Out
        </button>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="jb-main">
        <header className="jb-top">
          <nav className="jb-pills" aria-label="Main">
            {NAV.map(({ href, label, match, Icon }) => (
              <Link key={href} href={href} className={isActive(match) ? "on" : ""}>
                <Icon width={16} height={16} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="jb-top-right">
            <button
              className="jb-theme"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <SunI width={18} height={18} /> : <MoonI width={18} height={18} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
        </header>

        <div className="jb-content">
          <main className="jb-center">
            <div className="jb-mstats">
              {overview.map((o) => (
                <Link href={o.href} key={o.label}>
                  <b>{o.value ?? "–"}</b> {o.label}
                </Link>
              ))}
              <Link href="/jobs">Edit Jobs</Link>
              <Link href="/profile">Edit Resume</Link>
            </div>
            {showPipeline && <PipelineStrip stats={stats} />}
            <InFrameContext.Provider value={true}>{children}</InFrameContext.Provider>
          </main>

          {/* ---------- Right rail ---------- */}
          <aside className="jb-right">
            <div className="jb-card">
              <div className="jb-card-title">
                <span className="jb-ico-box">
                  <FileI width={18} height={18} />
                </span>
                Your Current Resume
              </div>
              {profile?.fullName || roles.length > 0 ? (
                <>
                  <div className="jb-resume">
                    <span className="jb-status-check">
                      <CheckI width={14} height={14} />
                    </span>
                    <div className="jb-resume-text">
                      <b>{profile?.fullName || "Resume on file"}</b>
                      <small>Last saved resume</small>
                    </div>
                    <Link href="/profile" className="jb-mini-btn">
                      <PencilI width={12} height={12} /> Edit
                    </Link>
                  </div>

                  <div className="jb-facts">
                    <div>
                      <b>{career.label || "\u2013"}</b>
                      <span>Years of service</span>
                    </div>
                    <div>
                      <b>{roles.length}</b>
                      <span>Roles</span>
                    </div>
                    <div>
                      <b>{skills.length}</b>
                      <span>Skills</span>
                    </div>
                    <div>
                      <b>{certCount}</b>
                      <span>Certifications</span>
                    </div>
                  </div>

                  {roles.length > 0 && (
                    <>
                      <div className="jb-skills-title">Roles</div>
                      <ul className="jb-roles">
                        {roles.slice(0, 6).map((r, i) => (
                          <li key={`${r.employer}-${i}`}>
                            <b>{r.title}</b>
                            <span>
                              {r.employer}
                              {roleSpan(r) ? ` \u00b7 ${roleSpan(r)}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {roles.length > 6 && <div className="jb-muted">+ {roles.length - 6} more</div>}
                    </>
                  )}
                </>
              ) : (
                <div className="jb-side-empty dark">
                  No resume yet.{" "}
                  <Link href="/profile" className="jb-link">
                    Add one
                  </Link>
                </div>
              )}

              {skills.length > 0 && (
                <>
                  <div className="jb-skills-title">Key Skills</div>
                  <div className="jb-chips">
                    {skills.slice(0, 14).map((s) => (
                      <span className="jb-chip" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {onDashboard && current && (
              <div className="jb-card jb-cta">
                <div className="jb-cta-text">
                  <SparkleI width={26} height={26} />
                  <p>
                    Generate a tailored resume &amp; cover letter for <b>{current.title}</b> at{" "}
                    <b>{current.company}</b>.
                  </p>
                </div>
                <button
                  className="jb-btn jb-btn-primary jb-btn-block"
                  disabled={materials.generatingId === current.id}
                  onClick={() => materials.generate(current)}
                >
                  {materials.generatingId === current.id ? "Generating..." : "Generate Now \u2192"}
                </button>
                {materials.error && <div className="jb-cta-error">{materials.error}</div>}
              </div>
            )}
          </aside>
        </div>

        <footer className="jb-footer">
          Powered by{" "}
          <a href="https://zerotouchai.com" target="_blank" rel="noreferrer">
            ZeroTouchAI.com
          </a>
          <span className="jb-version">v{VERSION}</span>
        </footer>
      </div>

      {/* Phones: bottom tab bar */}
      <nav className="jb-tabbar" aria-label="Main">
        {TABS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={isActive([href]) ? "on" : ""}>
            <Icon width={20} height={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {materials.modal}
    </div>
  );
}
