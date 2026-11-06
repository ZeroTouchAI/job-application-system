"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { InFrameContext } from "./frameContext";
import { useMaterials } from "./materials";
import {
  BanI,
  BellI,
  BriefcaseI,
  CheckI,
  ChevronI,
  FileI,
  HeartFillI,
  HeartI,
  HomeI,
  ListI,
  LogoutI,
  PencilI,
  PinI,
  SparkleI,
  TagI,
} from "./jbicons";

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

interface ProfileData {
  fullName?: string;
  email?: string;
  headline?: string;
  workExperience?: { employer: string; title: string }[];
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
  appliedJobs: { id: string; title: string; company: string; status: string }[];
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
  { href: "/profile", label: "Add/Edit Resume", match: ["/profile"], Icon: FileI },
  { href: "/interested", label: "Interested", match: ["/interested", "/queue"], Icon: HeartI },
  { href: "/passed", label: "Passed", match: ["/passed"], Icon: BanI },
  { href: "/jobs", label: "Add/Edit Jobs", match: ["/jobs"], Icon: BriefcaseI },
];

const TABS = [
  { href: "/dashboard", label: "Swipe", Icon: HomeI },
  { href: "/list", label: "List", Icon: ListI },
  { href: "/interested", label: "Interested", Icon: HeartI },
  { href: "/passed", label: "Passed", Icon: BanI },
  { href: "/profile", label: "Resume", Icon: FileI },
];

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

/** Pages call this after a swipe or status change so the sidebars update now. */
export function refreshFrame() {
  window.dispatchEvent(new Event("joby-refresh"));
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
  const [newCount, setNewCount] = useState(0);
  const [current, setCurrent] = useState<Current | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNewCount(d.newCount || 0))
      .catch(() => {});
    loadStats();

    const onRefresh = () => loadStats();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadStats();
    };
    const onCurrent = (e: Event) => setCurrent((e as CustomEvent<Current | null>).detail ?? null);
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("joby-refresh", onRefresh);
    window.addEventListener("joby-current", onCurrent);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("mousedown", onClickOutside);
    const timer = setInterval(loadStats, 15000);
    return () => {
      window.removeEventListener("joby-refresh", onRefresh);
      window.removeEventListener("joby-current", onCurrent);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("mousedown", onClickOutside);
      clearInterval(timer);
    };
  }, [loadStats]);

  const onDashboard = pathname === "/dashboard" || pathname === "/deck";
  const skills = (profile?.technicalSkills || []).flatMap((c) => c.items);
  const isActive = (m: string[]) => m.some((x) => pathname === x || pathname.startsWith(x + "/"));
  const initials = initialsOf(profile?.fullName);

  const overview = [
    { label: "Jobs found", value: stats?.found, href: "/list", Icon: BriefcaseI, tone: "blue" },
    { label: "Interested", value: stats?.interested, href: "/interested", Icon: HeartFillI, tone: "green" },
    { label: "Passed", value: stats?.passed, href: "/passed", Icon: BanI, tone: "red" },
    { label: "Applied", value: stats?.applied, href: "/interested", Icon: CheckI, tone: "ok" },
  ];

  return (
    <div className="jb">
      {/* ---------- Left sidebar ---------- */}
      <aside className="jb-side">
        <Link href="/dashboard" className="jb-brand">
          <img src="/joby-logo.png" alt="" width={34} height={34} />
          <span>Joby</span>
        </Link>

        <div className="jb-user">
          <span className="jb-avatar jb-avatar-lg">{initials}</span>
          <div className="jb-user-text">
            <div className="jb-user-name">{profile?.fullName || "Your account"}</div>
            <div className="jb-user-mail">{profile?.email || profile?.headline || ""}</div>
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
              <span className="jb-ov-count">{o.value ?? "–"}</span>
            </Link>
          ))}
        </div>

        <div className="jb-side-title">Job Search</div>
        <div className="jb-ov">
          {criteria.length === 0 && (
            <Link href="/jobs" className="jb-ov-row">
              <span className="jb-ov-ico jb-tone-blue">
                <TagI width={15} height={15} />
              </span>
              <span className="jb-ov-label">Set your search</span>
              <ChevronI width={14} height={14} />
            </Link>
          )}
          {criteria.map((c) => (
            <div key={c.id}>
              <Link href="/jobs" className="jb-ov-row">
                <span className="jb-ov-ico jb-tone-pin">
                  <PinI width={15} height={15} />
                </span>
                <span className="jb-ov-label">{c.location || "Any location"}</span>
                <ChevronI width={14} height={14} />
              </Link>
              <Link href="/jobs" className="jb-ov-row">
                <span className="jb-ov-ico jb-tone-tag">
                  <TagI width={15} height={15} />
                </span>
                <span className="jb-ov-label">{c.niche}</span>
                <ChevronI width={14} height={14} />
              </Link>
            </div>
          ))}
        </div>

        <div className="jb-side-title">Application Status</div>
        {!stats || stats.appliedJobs.length === 0 ? (
          <div className="jb-side-empty">Jobs you mark as applied show up here.</div>
        ) : (
          stats.appliedJobs.map((j) => (
            <div className="jb-status" key={j.id}>
              <span className="jb-status-check">
                <CheckI width={14} height={14} />
              </span>
              <div>
                <div className="jb-status-title">{j.title}</div>
                <div className="jb-status-sub">
                  {j.company} &middot; {STATUS_LABELS[j.status] || j.status}
                </div>
              </div>
            </div>
          ))
        )}

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
            <Link href="/list" className="jb-bell" aria-label="New jobs">
              <BellI width={20} height={20} />
              {newCount > 0 && <span className="jb-bell-dot">{newCount > 99 ? "99+" : newCount}</span>}
            </Link>
            <div className="jb-menu" ref={menuRef}>
              <button className="jb-avatar" onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu">
                {initials}
              </button>
              {menuOpen && (
                <div className="jb-menu-pop">
                  <Link href="/account" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/login" })}>Log out</button>
                </div>
              )}
            </div>
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
            </div>
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
              {profile?.fullName ? (
                <div className="jb-resume">
                  <span className="jb-status-check">
                    <CheckI width={14} height={14} />
                  </span>
                  <div className="jb-resume-text">
                    <b>{profile.headline || profile.fullName}</b>
                    <small>
                      {(profile.workExperience || []).length} role
                      {(profile.workExperience || []).length === 1 ? "" : "s"} on file
                    </small>
                  </div>
                  <Link href="/profile" className="jb-mini-btn">
                    <PencilI width={12} height={12} /> Edit
                  </Link>
                </div>
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
                    {skills.slice(0, 18).map((s) => (
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
