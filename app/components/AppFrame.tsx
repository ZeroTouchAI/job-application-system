"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AppHeader from "./AppHeader";
import { InFrameContext } from "./frameContext";
import { LogOutIcon } from "../icons";
import "../frame.css";

interface ProfileData {
  fullName?: string;
  headline?: string;
  yearsExperience?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
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

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

/** Pages call this after a swipe or status change so the sidebars update now. */
export function refreshFrame() {
  window.dispatchEvent(new Event("joby-refresh"));
}

/**
 * The shared dashboard frame: header, left sidebar (profile, overview, job
 * search, applied jobs), right sidebar (current resume), footer. The page
 * itself renders in the centre column.
 */
export default function AppFrame({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [criteria, setCriteria] = useState<SearchCriteria[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const loadStats = useCallback(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setProfile(data.profile))
      .catch(() => {});
    fetch("/api/user/search-settings")
      .then((r) => r.json())
      .then((data) => setCriteria(data.criteria || []))
      .catch(() => {});
    loadStats();

    const onRefresh = () => loadStats();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadStats();
    };
    window.addEventListener("joby-refresh", onRefresh);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(loadStats, 15000);
    return () => {
      window.removeEventListener("joby-refresh", onRefresh);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [loadStats]);

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("")
    : "?";

  const skills = (profile?.technicalSkills || []).flatMap((c) => c.items);
  const jobsCount = (profile?.workExperience || []).length;

  return (
    <div className="app-shell">
      <AppHeader />

      <div className="app-body">
        {/* Left sidebar */}
        <div>
          <div className="side-card user-card">
            <span className="avatar-circle">{initials}</span>
            <div className="name">{profile?.fullName || "Your account"}</div>
            {profile?.headline && <div className="headline">{profile.headline}</div>}
            {profile?.yearsExperience && (
              <div className="experience">{profile.yearsExperience} experience</div>
            )}
            {!profile?.headline && !profile?.yearsExperience && (
              <div className="experience">Add your details</div>
            )}

            {(profile?.location || profile?.phone || profile?.email || profile?.linkedinUrl) && (
              <div
                style={{
                  textAlign: "left",
                  fontSize: 12.5,
                  color: "var(--color-text-muted)",
                  marginBottom: 14,
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {profile?.location && <div>{profile.location}</div>}
                {profile?.phone && <div>{profile.phone}</div>}
                {profile?.email && <div>{profile.email}</div>}
                {profile?.linkedinUrl && (
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {profile.linkedinUrl}
                  </div>
                )}
              </div>
            )}

            <Link href="/account" className="btn btn-primary btn-sm" style={{ width: "100%" }}>
              Edit profile
            </Link>
          </div>

          <div className="side-card">
            <div className="side-card-title">Overview</div>
            <div className="stat-grid">
              <div className="stat-block">
                <div className="value">{stats?.found ?? "–"}</div>
                <div className="label">Jobs found</div>
              </div>
              <div className="stat-block">
                <div className="value">{stats?.interested ?? "–"}</div>
                <div className="label">Interested</div>
              </div>
              <div className="stat-block">
                <div className="value">{stats?.passed ?? "–"}</div>
                <div className="label">Passed</div>
              </div>
              <div className="stat-block">
                <div className="value">{stats?.applied ?? "–"}</div>
                <div className="label">Applied</div>
              </div>
            </div>
          </div>

          <div className="side-card">
            <div className="side-card-title">Job search</div>
            {criteria.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                {criteria.map((c) => (
                  <div
                    key={c.id}
                    style={{ paddingBottom: 8, borderBottom: "1px solid var(--color-border)" }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.niche}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {c.location || "Any location"}
                      {c.remoteOnly ? " · Remote only" : ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 10 }}>
                No search criteria set yet.
              </div>
            )}
            <Link href="/jobs" className="btn btn-outline btn-sm" style={{ width: "100%" }}>
              {criteria.length > 0 ? "Add or edit searches" : "Set search criteria"}
            </Link>
          </div>

          <div className="side-card">
            <div className="side-card-title">Application status</div>
            {!stats || stats.appliedJobs.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                Jobs you mark as applied will show up here.
              </div>
            ) : (
              <div className="status-list">
                {stats.appliedJobs.map((job) => (
                  <div className="status-row" key={job.id}>
                    <div className="info">
                      <span className="dot" />
                      <div className="status-row-text">
                        <div className="title">{job.title}</div>
                        <div className="company">{job.company}</div>
                      </div>
                    </div>
                    <span className={`status-pill ${job.status}`}>
                      {STATUS_LABELS[job.status] || job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="sidebar-logout-btn" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOutIcon width={16} height={16} />
            Log out
          </button>
        </div>

        {/* Centre column: the page */}
        <div>
          <InFrameContext.Provider value={true}>{children}</InFrameContext.Provider>
        </div>

        {/* Right sidebar */}
        <div>
          <div className="side-card">
            <div className="side-card-title">Current resume</div>
            {profile?.fullName ? (
              <>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                  {profile.fullName}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 12 }}>
                  {jobsCount} work experience entr{jobsCount === 1 ? "y" : "ies"} &middot;{" "}
                  {skills.length} skills
                </div>
                {skills.length > 0 && (
                  <div className="skill-chip-row" style={{ marginBottom: 12 }}>
                    {skills.map((skill) => (
                      <span className="skill-chip" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 12 }}>
                No resume on file yet.
              </div>
            )}
            <Link href="/profile" className="btn btn-outline btn-sm" style={{ width: "100%" }}>
              {profile?.fullName ? "Update resume" : "Add resume"}
            </Link>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        Powered by{" "}
        <a href="https://zerotouchai.com" target="_blank" rel="noreferrer">
          ZeroTouchAI.com
        </a>
      </footer>
    </div>
  );
}
