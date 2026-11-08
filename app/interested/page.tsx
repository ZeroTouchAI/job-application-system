"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { refreshFrame } from "../components/AppFrame";
import { JobLogo, LocationLine } from "../components/jobui";
import { useMaterials } from "../components/materials";
import { BriefcaseI } from "../components/jbicons";

interface Item {
  id: string;
  status: string;
  topPick: boolean;
  matchScore: number;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  sourceLabel: string;
  applyModeLabel: string;
  applyUrl: string | null;
  applyEmail: string | null;
  appliedAt: string | null;
  salaryText: string | null;
  logoUrl: string | null;
  workMode: string | null;
}

export default function InterestedPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const a = await fetch("/api/queue?view=interested");
      if (a.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!a.ok) throw new Error("load failed");
      setItems((await a.json()).items || []);
    } catch {
      setError("Couldn't load your jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const materials = useMaterials((id) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "drafted" } : i)));
  });

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(String(res.status));
      await load();
      refreshFrame();
    } catch {
      setError("Couldn't update that job. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="jb-page-head">
        <h1>Interested Jobs</h1>
        <p>
          These are the jobs you&apos;re interested in. Generate your documents, finish the
          application on the employer&apos;s page, then mark it applied and it moves to Applied. Joby never
          submits for you.
        </p>
      </div>

      {(error || materials.error) && <div className="jb-error">{error || materials.error}</div>}
      {loading && <div className="jb-empty-row">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="jb-empty-row">
          No jobs waiting. Swipe right on a job to add it here.{" "}
          <Link href="/dashboard" className="jb-link">
            Start swiping
          </Link>
        </div>
      )}

      {items.map((item) => (
        <article className="jb-job" key={item.id}>
          <div className="jb-job-top">
            <JobLogo company={item.company} logoUrl={item.logoUrl} size={52} />
            <div className="jb-job-main">
              <div className="jb-row-title">
                {item.topPick && <span className="jb-star" title="Top pick">★</span>}
                {item.title}
              </div>
              <div className="jb-row-sub">{item.company}</div>
              <div className="jb-job-meta">
                <LocationLine location={item.location} mode={item.workMode ?? (item.remote ? "remote" : null)} />
                <span className="jb-job-pay">
                  <BriefcaseI width={14} height={14} />
                  {item.salaryText || "Pay not listed"}
                </span>
                <span className="jb-muted">
                  {item.matchScore}% match · {item.applyModeLabel} · {item.sourceLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="jb-job-actions">
            <button
              className="jb-btn jb-btn-primary"
              disabled={materials.generatingId === item.id}
              onClick={() => materials.generate(item)}
            >
              {materials.generatingId === item.id
                ? "Generating..."
                : item.status === "drafted"
                ? "Regenerate Resume + Cover Letter"
                : "Generate Resume + Cover Letter"}
            </button>
            {item.applyEmail ? (
              <a className="jb-btn jb-btn-outline" href={`mailto:${item.applyEmail}`}>
                Email Them
              </a>
            ) : item.applyUrl ? (
              <a className="jb-btn jb-btn-outline" href={item.applyUrl} target="_blank" rel="noreferrer">
                Open Application
              </a>
            ) : (
              <span className="jb-muted">No apply link listed</span>
            )}
            <button
              className="jb-btn jb-btn-green"
              disabled={busyId === item.id}
              onClick={() => setStatus(item.id, "applied")}
            >
              Mark as Applied
            </button>
            <button
              className="jb-btn jb-btn-outline jb-btn-danger"
              disabled={busyId === item.id}
              onClick={() => setStatus(item.id, "rejected")}
            >
              Remove
            </button>
          </div>
        </article>
      ))}

      {materials.modal}
    </div>
  );
}
