"use client";

import { useEffect, useState } from "react";

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

  if (loading) return <main style={{ padding: "2rem" }}>Loading...</main>;

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Your matches</h1>
      {applications.length === 0 && (
        <p>
          No matches yet. Fill out your profile and wait for the next sync, or
          run one manually with <code>npm run sync-jobs</code>.
        </p>
      )}
      {applications.map((app) => (
        <div
          key={app.id}
          style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}
        >
          <h3>
            {app.jobPosting.title} — {app.jobPosting.company}
          </h3>
          <p>
            {app.jobPosting.location || "Location unspecified"} · Match:{" "}
            {app.matchScore}% · Status: {app.status}
          </p>
          <button disabled={generatingId === app.id} onClick={() => handleGenerate(app.id)}>
            {generatingId === app.id ? "Generating..." : "Generate tailored resume + cover letter"}
          </button>
          {app.status === "drafted" && (
            <p>
              {app.jobPosting.applyUrl && (
                <a href={app.jobPosting.applyUrl} target="_blank" rel="noreferrer">
                  Go to official application page
                </a>
              )}
              {app.jobPosting.applyEmail && (
                <>
                  {" "}
                  · Employer-listed apply email: <strong>{app.jobPosting.applyEmail}</strong> (review
                  the drafted email before sending)
                </>
              )}
            </p>
          )}
        </div>
      ))}
    </main>
  );
}
