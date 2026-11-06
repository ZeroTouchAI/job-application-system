"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { refreshFrame } from "../components/AppFrame";
import { MapPinIcon, BriefcaseIcon } from "../icons";

interface Application {
  id: string;
  matchScore: number;
  jobPosting: {
    title: string;
    company: string;
    location: string | null;
    remote: boolean;
    source: string;
    applyUrl: string | null;
  };
}

interface Page {
  applications: Application[];
  total: number;
  page: number;
  totalPages: number;
}

/** Page numbers to show: first, last, and a window around the current page. */
function pageWindow(current: number, total: number): (number | "…")[] {
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export default function ListPage() {
  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [locationText, setLocationText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p: number, q: string, loc: string) => {
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q.trim()) params.set("q", q.trim());
      if (loc.trim()) params.set("loc", loc.trim());
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as Page;
      // If the last card on a later page was just swiped away, step back.
      if (json.applications.length === 0 && json.total > 0 && p > 1) {
        setPage(p - 1);
        return;
      }
      setData(json);
    } catch {
      setError("Couldn't load your jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(page, searchText, locationText), 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [page, searchText, locationText, load]);

  async function swipe(app: Application, dir: "right" | "left") {
    setBusyId(app.id);
    setError(null);
    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app.id, dir }),
      });
      if (!res.ok && res.status !== 409) throw new Error(String(res.status));
      refreshFrame();
      await load(page, searchText, locationText);
    } catch {
      setError("Couldn't save that. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  const apps = data?.applications || [];

  return (
    <div>
      <div className="search-hero">
        <h2>Find your dream job here!</h2>
        <p>Jobs you haven&apos;t swiped on yet. Anything you pick or pass moves to its own page.</p>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by title or company..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="text"
            placeholder="City or region..."
            value={locationText}
            onChange={(e) => {
              setLocationText(e.target.value);
              setPage(1);
            }}
            style={{ borderLeft: "1px solid var(--color-border)", borderRadius: 0 }}
          />
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="empty-state">Loading your matches...</div>}

      {!loading && data && data.total === 0 && !searchText && !locationText && (
        <div className="empty-state">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Nothing left to swipe</div>
          You&apos;ve been through everything we have. New jobs arrive after the next sync, or add
          more searches in{" "}
          <a href="/jobs" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Add/Edit Jobs
          </a>
          .
        </div>
      )}

      {!loading && data && data.total === 0 && (searchText || locationText) && (
        <div className="empty-state">No matches fit that search.</div>
      )}

      {apps.map((app) => (
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
              disabled={busyId === app.id}
              onClick={() => swipe(app, "right")}
            >
              Interested
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ color: "#b42318", borderColor: "#f3b3ab" }}
              disabled={busyId === app.id}
              onClick={() => swipe(app, "left")}
            >
              Pass
            </button>
            {app.jobPosting.applyUrl && (
              <a
                href={app.jobPosting.applyUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 13.5, color: "var(--color-primary)", fontWeight: 600 }}
              >
                View posting &rarr;
              </a>
            )}
          </div>
        </div>
      ))}

      {data && data.totalPages > 1 && (
        <nav className="pager" aria-label="Pages">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            &larr; Prev
          </button>
          {pageWindow(page, data.totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} style={{ padding: "0 4px" }}>
                …
              </span>
            ) : (
              <button
                key={p}
                className={p === page ? "current" : ""}
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}
          <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next &rarr;
          </button>
        </nav>
      )}
      {data && data.total > 0 && (
        <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--color-text-muted)" }}>
          {data.total} job{data.total === 1 ? "" : "s"} to go through
        </div>
      )}
    </div>
  );
}
