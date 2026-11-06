"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { refreshFrame } from "../components/AppFrame";
import { JobLogo, LocationLine } from "../components/jobui";

interface Item {
  id: string;
  matchScore: number;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  sourceLabel: string;
  applyUrl: string | null;
  salaryText: string | null;
  logoUrl: string | null;
  workMode: string | null;
}

export default function PassedPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/queue?view=passed");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setItems((await res.json()).items || []);
    } catch {
      setError("Couldn't load your passed jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moveToInterested(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "queued" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      await load();
      refreshFrame();
    } catch {
      setError("Couldn't move that job. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="jb-page-head">
        <h1>Passed Jobs</h1>
        <p>Jobs you passed on. Changed your mind? Move one back to Interested.</p>
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="jb-empty-row">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="jb-empty-row">
          You haven&apos;t passed on anything yet.{" "}
          <Link href="/dashboard" className="jb-link">
            Start swiping
          </Link>
        </div>
      )}

      <div className="jb-rows">
        {items.map((item) => (
          <div className="jb-row jb-row-passed" key={item.id}>
            <JobLogo company={item.company} logoUrl={item.logoUrl} />
            <div className="jb-row-main">
              <div className="jb-row-title">{item.title}</div>
              <div className="jb-row-sub">{item.company}</div>
            </div>
            <div className="jb-row-loc">
              <LocationLine location={item.location} mode={item.workMode ?? (item.remote ? "remote" : null)} />
            </div>
            <div className="jb-row-pay">
              {item.salaryText || <span className="jb-muted">Pay not listed</span>}
            </div>
            <div className="jb-row-actions">
              {item.applyUrl && (
                <a className="jb-btn jb-btn-outline jb-btn-sm" href={item.applyUrl} target="_blank" rel="noreferrer">
                  View
                </a>
              )}
              <button
                className="jb-btn jb-btn-primary jb-btn-sm"
                disabled={busyId === item.id}
                onClick={() => moveToInterested(item.id)}
              >
                Move to Interested
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
