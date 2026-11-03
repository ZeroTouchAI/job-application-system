"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "../components/AppHeader";
import "../swipe.css";

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
  attribution: string | null;
  applyModeLabel: string;
  applyUrl: string | null;
  applyEmail: string | null;
}

export default function QueuePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/queue");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError("Couldn't load your queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: "applied" | "rejected") {
    const before = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setItems(before);
      setError("Couldn't update that job. Try again.");
    }
  }

  return (
    <div className="profile-shell">
      <AppHeader active="queue" />

      <section className="profile-hero">
        <div className="container">
          <div className="eyebrow">Your queue</div>
          <h1>Jobs you swiped on</h1>
          <p>
            Finish each application on the employer&apos;s own page, then mark it applied. Joby never
            submits for you.
          </p>
        </div>
      </section>

      <div className="container queue-body">
        {error && <div className="form-error">{error}</div>}
        {loading && <div className="queue-muted">Loading…</div>}

        {!loading && items.length === 0 && (
          <div className="queue-empty">
            <p>Nothing in your queue yet.</p>
            <Link href="/deck" className="btn btn-primary">
              Start swiping
            </Link>
          </div>
        )}

        {items.map((item) => (
          <article className="queue-item" key={item.id}>
            <div className="queue-item-main">
              <div className="queue-item-title">
                {item.topPick && (
                  <span className="queue-star" title="Top pick" aria-label="Top pick">
                    ★
                  </span>
                )}
                {item.title}
              </div>
              <div className="queue-item-sub">
                {item.company}
                {item.location ? ` · ${item.location}` : ""}
                {item.remote ? " · Remote" : ""}
              </div>
              <div className="queue-item-meta">
                {item.matchScore}% match · {item.applyModeLabel} · {item.sourceLabel}
                {item.attribution ? ` · ${item.attribution}` : ""}
              </div>
            </div>

            <div className="queue-item-actions">
              {item.applyEmail ? (
                <a className="btn btn-primary btn-sm" href={`mailto:${item.applyEmail}`}>
                  Email them
                </a>
              ) : item.applyUrl ? (
                <a
                  className="btn btn-primary btn-sm"
                  href={item.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open application
                </a>
              ) : (
                <span className="queue-muted">No apply link listed</span>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setStatus(item.id, "applied")}>
                Mark applied
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setStatus(item.id, "rejected")}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}