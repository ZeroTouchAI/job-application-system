"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { refreshFrame } from "../components/AppFrame";
import "../swipe.css";

interface Item {
  id: string;
  matchScore: number;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  sourceLabel: string;
  applyUrl: string | null;
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
      <div className="page-intro">
        <h1>Passed</h1>
        <p>Jobs you passed on. Changed your mind? Move one back to Interested.</p>
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="queue-muted">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="queue-empty">
          <p>You haven&apos;t passed on anything yet.</p>
          <Link href="/dashboard" className="btn btn-primary">
            Start swiping
          </Link>
        </div>
      )}

      {items.map((item) => (
        <article className="queue-item" key={item.id}>
          <div className="queue-item-main">
            <div className="queue-item-title">{item.title}</div>
            <div className="queue-item-sub">
              {item.company}
              {item.location ? ` · ${item.location}` : ""}
              {item.remote ? " · Remote" : ""}
            </div>
            <div className="queue-item-meta">
              {item.matchScore}% match · {item.sourceLabel}
            </div>
          </div>
          <div className="queue-item-actions">
            {item.applyUrl && (
              <a
                className="btn btn-outline btn-sm"
                href={item.applyUrl}
                target="_blank"
                rel="noreferrer"
              >
                View posting
              </a>
            )}
            <button
              className="btn btn-primary btn-sm"
              disabled={busyId === item.id}
              onClick={() => moveToInterested(item.id)}
            >
              Move to Interested
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
