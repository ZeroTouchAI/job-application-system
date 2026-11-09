"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { refreshFrame } from "../components/AppFrame";
import { JobLogo, LocationLine } from "../components/jobui";
import { BriefcaseI } from "../components/jbicons";

interface Item {
  id: string;
  status: string;
  matchScore: number;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  sourceLabel: string;
  applyUrl: string | null;
  appliedAt: string | null;
  salaryText: string | null;
  logoUrl: string | null;
  workMode: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function AppliedPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/queue?view=applied");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setItems((await res.json()).items || []);
    } catch {
      setError("Couldn't load your applied jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        <h1>Applied Jobs</h1>
        <p>Jobs you&apos;ve applied for. Track where each one stands: applied, interview, or offer.</p>
      </div>

      {error && <div className="jb-error">{error}</div>}
      {loading && <div className="jb-empty-row">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="jb-empty-row">
          Nothing applied yet. Mark a job as applied from{" "}
          <Link href="/interested" className="jb-link">
            Interested
          </Link>{" "}
          and it shows up here.
        </div>
      )}

      {items.map((item) => (
        <article className="jb-job jb-job-applied" key={item.id}>
          <div className="jb-job-top">
            <JobLogo company={item.company} logoUrl={item.logoUrl} size={50} />
            <div className="jb-job-main">
              <div className="jb-row-title">{item.title}</div>
              <div className="jb-row-sub">{item.company}</div>
              <div className="jb-job-meta">
                <LocationLine location={item.location} mode={item.workMode ?? (item.remote ? "remote" : null)} />
                <span className="jb-job-pay">
                  <BriefcaseI width={14} height={14} />
                  {item.salaryText || "Pay not listed"}
                </span>
              </div>
            </div>
            <span className={`jb-applied-pill jb-applied-${item.status}`}>
              {STATUS_LABELS[item.status] || item.status}
              {item.appliedAt ? ` \u2022 ${shortDate(item.appliedAt)}` : ""}
            </span>
          </div>
          <div className="jb-job-actions">
            {item.status === "applied" && (
              <button
                className="jb-btn jb-btn-outline jb-btn-sm"
                disabled={busyId === item.id}
                onClick={() => setStatus(item.id, "interview")}
              >
                Got an interview
              </button>
            )}
            {item.status === "interview" && (
              <button
                className="jb-btn jb-btn-outline jb-btn-sm"
                disabled={busyId === item.id}
                onClick={() => setStatus(item.id, "offer")}
              >
                Got an offer
              </button>
            )}
            {item.applyUrl && (
              <a className="jb-btn jb-btn-outline jb-btn-sm" href={item.applyUrl} target="_blank" rel="noreferrer">
                View posting
              </a>
            )}
            <button
              className="jb-btn jb-btn-outline jb-btn-sm"
              disabled={busyId === item.id}
              onClick={() => setStatus(item.id, "queued")}
            >
              Move back to Interested
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
