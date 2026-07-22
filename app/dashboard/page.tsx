"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { TrackIcon, FileTextIcon, UserCheckIcon } from "../icons";

interface Application {
  id: string;
  matchScore: number;
  status: string;
  jobPosting: {
    title: string;
    company: string;
    location: string | null;
    applyUrl: string | null;
    applyEmail: string | null;
  };
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .finally(() => setLoading(false));
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

  const appliedCount = applications.filter((a) => a.status !== "suggested").length;
  const draftedCount = applications.filter((a) => a.status === "drafted").length;

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            J
          </span>
          Joby
        </div>
        <nav className="dash-nav">
          <Link href="/dashboard" className="active">
            Dashboard
          </Link>
          <Link href="/profile">Resume</Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              signOut({ callbackUrl: "/" });
            }}
          >
            Log out
          </a>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div style={{ fontWeight: 700 }}>Your matches</div>
          <Link href="/profile" className="btn btn-outline btn-sm">
            Edit resume
          </Link>
        </div>

        <div className="dash-content">
          <div className="dash-stats">
            <div className="stat-card">
              <div className="label">Total matches</div>
              <div className="value">{applications.length}</div>
            </div>
            <div className="stat-card">
              <div className="label">Drafted</div>
              <div className="value">{draftedCount}</div>
            </div>
            <div className="stat-card">
              <div className="label">Applied</div>
              <div className="value">{appliedCount}</div>
            </div>
            <div className="stat-card">
              <div className="label">Avg. match</div>
              <div className="value">
                {applications.length
                  ? Math.round(
                      applications.reduce((sum, a) => sum + a.matchScore, 0) /
                        applications.length
                    )
                  : 0}
                %
              </div>
            </div>
          </div>

          {loading && <div className="empty-state">Loading your matches...</div>}

          {!loading && applications.length === 0 && (
            <div className="empty-state">
              <UserCheckIcon
                width={28}
                height={28}
                style={{ margin: "0 auto 12px", color: "var(--color-text-muted)" }}
              />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                No matches yet
              </div>
              Fill out your resume and wait for the next sync, or run one
              manually with <code>npm run sync-jobs</code>.
            </div>
          )}

          {applications.map((app) => (
            <div className="match-card" key={app.id}>
              <div className="match-card-head">
                <div>
                  <h3>
                    {app.jobPosting.title} at {app.jobPosting.company}
                  </h3>
                  <div className="meta">
                    {app.jobPosting.location || "Location unspecified"} · Status:{" "}
                    {app.status}
                  </div>
                </div>
                <span className="match-score">{app.matchScore}% match</span>
              </div>

              <button
                className="btn btn-primary btn-sm"
                disabled={generatingId === app.id}
                onClick={() => handleGenerate(app.id)}
              >
                <FileTextIcon width={16} height={16} />
                {generatingId === app.id
                  ? "Generating..."
                  : "Generate tailored resume + cover letter"}
              </button>

              {app.status === "drafted" && (
                <div style={{ marginTop: 10, fontSize: 13.5 }}>
                  {app.jobPosting.applyUrl && (
                    <a
                      href={app.jobPosting.applyUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--color-primary)", fontWeight: 600 }}
                    >
                      Go to official application page →
                    </a>
                  )}
                  {app.jobPosting.applyEmail && (
                    <div style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
                      Employer-listed apply email:{" "}
                      <strong>{app.jobPosting.applyEmail}</strong>. Review the
                      drafted email before sending.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
