"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import AppHeader from "../components/AppHeader";
import EditProfileModal from "../components/EditProfileModal";
import { FileTextIcon, MapPinIcon, BriefcaseIcon, LogOutIcon } from "../icons";

interface Application {
  id: string;
  matchScore: number;
  status: string;
  jobPosting: {
    title: string;
    company: string;
    location: string | null;
    remote: boolean;
    source: string;
    applyUrl: string | null;
    applyEmail: string | null;
  };
}

interface ProfileData {
  fullName?: string;
  headline?: string;
  yearsExperience?: string;
  technicalSkills?: { name: string; items: string[] }[];
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  function loadProfile() {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setProfile(data.profile))
      .catch(() => {});
  }

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .finally(() => setLoading(false));

    loadProfile();
  }, []);

  async function handleGenerate(applicationId: string) {
    setGeneratingId(applicationId);
    try {
      await fetch("/api/generate/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      await fetch("/api/generate/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: "drafted" } : a))
      );
    } finally {
      setGeneratingId(null);
    }
  }

  const filtered = useMemo(() => {
    if (!searchText.trim()) return applications;
    const q = searchText.toLowerCase();
    return applications.filter((app) =>
      `${app.jobPosting.title} ${app.jobPosting.company}`.toLowerCase().includes(q)
    );
  }, [applications, searchText]);

  const totalJobs = applications.length;
  const draftCount = applications.filter((a) => a.status === "drafted").length;
  const appliedCount = applications.filter((a) =>
    ["applied", "interview", "offer"].includes(a.status)
  ).length;
  const avgMatch = applications.length
    ? Math.round(applications.reduce((sum, a) => sum + a.matchScore, 0) / applications.length)
    : 0;

  const skillChips = (profile?.technicalSkills || []).flatMap((c) => c.items).slice(0, 8);

  const initials = profile?.fullName
    ? profile.fullName.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("")
    : "?";

  return (
    <div className="app-shell">
      <AppHeader active="dashboard" />

      {editOpen && (
        <EditProfileModal
          onClose={() => setEditOpen(false)}
          onSaved={loadProfile}
        />
      )}

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
            <button
              className="btn btn-primary btn-sm"
              style={{ width: "100%" }}
              onClick={() => setEditOpen(true)}
            >
              Edit profile
            </button>
          </div>

          <div className="side-card">
            <div className="side-card-title">Application status</div>
            {applications.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                Nothing yet. Matches will show up here.
              </div>
            ) : (
              <div className="status-list">
                {applications.slice(0, 4).map((app) => (
                  <div className="status-row" key={app.id}>
                    <div className="info">
                      <span className="dot" />
                      <div>
                        <div className="title">{app.jobPosting.title}</div>
                        <div className="company">{app.jobPosting.company}</div>
                      </div>
                    </div>
                    <span className={`status-pill ${app.status}`}>{app.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {skillChips.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">Top skills</div>
              <div className="skill-chip-row">
                {skillChips.map((skill) => (
                  <span className="skill-chip" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            className="sidebar-logout-btn"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOutIcon width={16} height={16} />
            Log out
          </button>
        </div>

        {/* Center column */}
        <div>
          <div className="search-hero">
            <h2>Find your dream job here!</h2>
            <p>Search the postings we&apos;ve already pulled in for you.</p>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by title or company..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" type="button">
                Search
              </button>
            </div>
          </div>

          {loading && <div className="empty-state">Loading your matches...</div>}

          {!loading && applications.length === 0 && (
            <div className="empty-state">
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No matches yet</div>
              Fill out your resume and set your job search criteria in{" "}
              <a href="/jobs" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                Add/Edit Jobs
              </a>
              , then wait for the next sync, or run one manually with{" "}
              <code>npm run sync-jobs</code>.
            </div>
          )}

          {!loading && applications.length > 0 && filtered.length === 0 && (
            <div className="empty-state">No matches fit that search.</div>
          )}

          {filtered.map((app) => (
            <div className="job-card" key={app.id}>
              <div className="job-card-top">
                <div className="job-card-logo">{app.jobPosting.company[0]?.toUpperCase() || "?"}</div>
                <div className="job-card-title-block">
                  <h3>{app.jobPosting.title}</h3>
                  <div className="company">{app.jobPosting.company}</div>
                </div>
                <span
                  style={{
                    background: "var(--color-primary-soft)",
                    color: "var(--color-primary)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                  }}
                >
                  {app.matchScore}% match
                </span>
              </div>

              <div className="job-card-tags">
                <span className="job-tag">{app.jobPosting.remote ? "Remote" : "Onsite"}</span>
                <span className="job-tag">{app.jobPosting.source}</span>
                <span className="job-tag">{app.status}</span>
              </div>

              <div className="job-card-meta-row">
                <span className="meta-item">
                  <MapPinIcon width={14} height={14} />
                  {app.jobPosting.location || "Location unspecified"}
                </span>
                <span className="meta-item">
                  <BriefcaseIcon width={14} height={14} />
                  {app.jobPosting.source}
                </span>
              </div>

              <div className="job-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={generatingId === app.id}
                  onClick={() => handleGenerate(app.id)}
                >
                  <FileTextIcon width={15} height={15} />
                  {generatingId === app.id ? "Generating..." : "Generate resume + cover letter"}
                </button>

                {app.status === "drafted" && app.jobPosting.applyUrl && (
                  <a
                    href={app.jobPosting.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13.5, color: "var(--color-primary)", fontWeight: 600 }}
                  >
                    Go to application page &rarr;
                  </a>
                )}
              </div>

              {app.status === "drafted" && app.jobPosting.applyEmail && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--color-text-muted)" }}>
                  Employer-listed apply email: <strong>{app.jobPosting.applyEmail}</strong>.
                  Review the drafted email before sending.
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right stat blocks */}
        <div>
          <div className="side-card">
            <div className="side-card-title">Overview</div>
            <div className="stat-grid">
              <div className="stat-block">
                <div className="value">{totalJobs}</div>
                <div className="label">Total jobs</div>
              </div>
              <div className="stat-block">
                <div className="value">{draftCount}</div>
                <div className="label">Draft</div>
              </div>
              <div className="stat-block">
                <div className="value">{appliedCount}</div>
                <div className="label">Applied</div>
              </div>
              <div className="stat-block">
                <div className="value">{avgMatch}%</div>
                <div className="label">Average</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
