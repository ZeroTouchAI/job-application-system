"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AppHeader from "../components/AppHeader";
import { FileTextIcon, MapPinIcon, BriefcaseIcon, LogOutIcon, DownloadIcon } from "../icons";

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

interface SearchCriteria {
  id: string;
  niche: string;
  location: string | null;
  remoteOnly: boolean;
  keywords: string[];
}

// Pipeline: suggested (matched, nothing generated yet) -> drafted (resume +
// cover letter generated, not yet sent) -> applied -> interview -> offer.
// Reject can happen from any stage and hides the card from view.
const STATUS_LABELS: Record<string, string> = {
  suggested: "Suggested",
  drafted: "Ready to apply",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

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

interface ReadyMaterials {
  jobTitle: string;
  company: string;
  applyUrl: string | null;
  resumeBase64: string;
  resumeFileName: string;
  coverLetterBase64: string;
  coverLetterFileName: string;
}

function downloadBase64Docx(base64: string, fileName: string) {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [searchCriteriaList, setSearchCriteriaList] = useState<SearchCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [readyMaterials, setReadyMaterials] = useState<ReadyMaterials | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [locationText, setLocationText] = useState("");

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

    fetch("/api/user/search-settings")
      .then((r) => r.json())
      .then((data) => setSearchCriteriaList(data.criteria || []))
      .catch(() => {});
  }, []);

  async function handleGenerate(app: Application) {
    setGeneratingId(app.id);
    setGenerateError(null);
    try {
      const resumeRes = await fetch("/api/generate/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app.id }),
      });
      const resumeData = await resumeRes.json();
      if (!resumeRes.ok) {
        setGenerateError(resumeData.error || "Couldn't generate the resume. Try again.");
        return;
      }

      const coverRes = await fetch("/api/generate/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app.id }),
      });
      const coverData = await coverRes.json();
      if (!coverRes.ok) {
        setGenerateError(coverData.error || "Couldn't generate the cover letter. Try again.");
        return;
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: "drafted" } : a))
      );
      setReadyMaterials({
        jobTitle: app.jobPosting.title,
        company: app.jobPosting.company,
        applyUrl: app.jobPosting.applyUrl,
        resumeBase64: resumeData.docxBase64,
        resumeFileName: resumeData.fileName,
        coverLetterBase64: coverData.docxBase64,
        coverLetterFileName: coverData.fileName,
      });
    } catch {
      setGenerateError("Something went wrong generating your materials. Try again.");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleStatusChange(applicationId: string, status: string) {
    setUpdatingId(applicationId);
    const previous = applications;
    // Rejecting removes the card from view entirely (the record is kept
    // server-side, just excluded from GET /api/jobs going forward).
    if (status === "rejected") {
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    } else {
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      );
    }
    try {
      const res = await fetch(`/api/jobs/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) setApplications(previous); // revert on failure
    } catch {
      setApplications(previous);
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const loc = locationText.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesText =
        !q || `${app.jobPosting.title} ${app.jobPosting.company}`.toLowerCase().includes(q);
      const matchesLocation =
        !loc || (app.jobPosting.location || "").toLowerCase().includes(loc);
      return matchesText && matchesLocation;
    });
  }, [applications, searchText, locationText]);

  const totalJobs = applications.length;
  const draftCount = applications.filter((a) => a.status === "drafted").length;
  const appliedCount = applications.filter((a) =>
    ["applied", "interview", "offer"].includes(a.status)
  ).length;
  const avgMatch = applications.length
    ? Math.round(applications.reduce((sum, a) => sum + a.matchScore, 0) / applications.length)
    : 0;

  const initials = profile?.fullName
    ? profile.fullName.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("")
    : "?";

  return (
    <div className="app-shell">
      <AppHeader active="dashboard" />

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

            <Link
              href="/account"
              className="btn btn-primary btn-sm"
              style={{ width: "100%" }}
            >
              Edit profile
            </Link>
          </div>

          <div className="side-card">
            <div className="side-card-title">Job search</div>
            {searchCriteriaList.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                {searchCriteriaList.map((c) => (
                  <div key={c.id} style={{ paddingBottom: 8, borderBottom: "1px solid var(--color-border)" }}>
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
              {searchCriteriaList.length > 0 ? "Add or edit searches" : "Set search criteria"}
            </Link>
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
                      <div className="status-row-text">
                        <div className="title">{app.jobPosting.title}</div>
                        <div className="company">{app.jobPosting.company}</div>
                      </div>
                    </div>
                    <span className={`status-pill ${app.status}`}>{STATUS_LABELS[app.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              <input
                type="text"
                placeholder="City or region..."
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                style={{ borderLeft: "1px solid var(--color-border)", borderRadius: 0 }}
              />
              <button className="btn btn-primary btn-sm" type="button">
                Search
              </button>
            </div>
          </div>

          {generateError && <div className="form-error">{generateError}</div>}

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
                <span className={`status-pill ${app.status}`}>{STATUS_LABELS[app.status]}</span>
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
                {(app.status === "suggested" || app.status === "drafted") && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={generatingId === app.id}
                    onClick={() => handleGenerate(app)}
                  >
                    <FileTextIcon width={15} height={15} />
                    {generatingId === app.id
                      ? "Generating..."
                      : app.status === "drafted"
                      ? "Regenerate resume + cover letter"
                      : "Generate resume + cover letter"}
                  </button>
                )}

                {app.status === "drafted" && (
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={updatingId === app.id}
                    onClick={() => handleStatusChange(app.id, "applied")}
                  >
                    Mark as applied
                  </button>
                )}

                {app.status === "applied" && (
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={updatingId === app.id}
                    onClick={() => handleStatusChange(app.id, "interview")}
                  >
                    Got an interview
                  </button>
                )}

                {app.status === "interview" && (
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={updatingId === app.id}
                    onClick={() => handleStatusChange(app.id, "offer")}
                  >
                    Got an offer
                  </button>
                )}

                <button
                  className="btn btn-outline btn-sm"
                  style={{ color: "#b42318", borderColor: "#f3b3ab" }}
                  disabled={updatingId === app.id}
                  onClick={() => handleStatusChange(app.id, "rejected")}
                >
                  Reject
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

          <div className="side-card">
            <div className="side-card-title">Current resume</div>
            {profile?.fullName ? (
              <>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                  {profile.fullName}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 12 }}>
                  {(profile.workExperience || []).length} work experience entr
                  {(profile.workExperience || []).length === 1 ? "y" : "ies"} &middot;{" "}
                  {(profile.technicalSkills || []).reduce((n, c) => n + c.items.length, 0)} skills
                </div>
                {(profile.technicalSkills || []).length > 0 && (
                  <div className="skill-chip-row" style={{ marginBottom: 12 }}>
                    {(profile.technicalSkills || []).flatMap((c) => c.items).map((skill) => (
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

      {readyMaterials && (
        <div className="modal-overlay" onClick={() => setReadyMaterials(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Your materials are ready</h2>
              <button
                className="modal-close-btn"
                onClick={() => setReadyMaterials(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", marginBottom: 18 }}>
              Download both files, then apply for <strong>{readyMaterials.jobTitle}</strong> at{" "}
              <strong>{readyMaterials.company}</strong> using the button below — upload the
              resume and cover letter there.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ justifyContent: "flex-start" }}
                onClick={() =>
                  downloadBase64Docx(readyMaterials.resumeBase64, readyMaterials.resumeFileName)
                }
              >
                <DownloadIcon width={15} height={15} />
                Download resume ({readyMaterials.resumeFileName})
              </button>
              <button
                className="btn btn-outline btn-sm"
                style={{ justifyContent: "flex-start" }}
                onClick={() =>
                  downloadBase64Docx(
                    readyMaterials.coverLetterBase64,
                    readyMaterials.coverLetterFileName
                  )
                }
              >
                <DownloadIcon width={15} height={15} />
                Download cover letter ({readyMaterials.coverLetterFileName})
              </button>
            </div>

            {readyMaterials.applyUrl ? (
              <a
                href={readyMaterials.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ width: "100%" }}
                onClick={() => setReadyMaterials(null)}
              >
                Go to application page &rarr;
              </a>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                No application link on file for this posting — apply directly with the employer.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
