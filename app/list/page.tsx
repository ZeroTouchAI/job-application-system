"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { refreshFrame } from "../components/AppFrame";
import { JobLogo, LocationLine, MatchRing } from "../components/jobui";
import { SearchI, PinI } from "../components/jbicons";
import { formatSalary } from "../../lib/salary";

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
    logoUrl: string | null;
    workMode: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    salaryPeriod: string | null;
  };
}

interface Page {
  applications: Application[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PROVINCES: { label: string; loc: string }[] = [
  { label: "Ontario", loc: "Ontario|, ON" },
  { label: "British Columbia", loc: "British Columbia|, BC" },
  { label: "Alberta", loc: "Alberta|, AB" },
  { label: "Quebec", loc: "Quebec|Qu\u00e9bec|, QC" },
  { label: "Remote", loc: "Remote" },
];

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
  const from = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? from + apps.length - (apps.length ? 1 : 0) : 0;

  return (
    <div>
      <div className="jb-page-head">
        <h1>Browse Jobs</h1>
        <p>Search and explore jobs you haven&apos;t swiped on yet.</p>
      </div>

      <div className="jb-searchbar">
        <label className="jb-input">
          <SearchI width={16} height={16} />
          <input
            type="text"
            placeholder="Job title or company..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="jb-input">
          <PinI width={16} height={16} />
          <input
            type="text"
            placeholder="City or region..."
            value={locationText}
            onChange={(e) => {
              setLocationText(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <button className="jb-btn jb-btn-primary" onClick={() => load(1, searchText, locationText)}>
          Search
        </button>
      </div>

      <div className="jb-prov" aria-label="Filter by province">
        {PROVINCES.map((p) => (
          <button
            key={p.label}
            className={locationText === p.loc ? "on" : ""}
            onClick={() => {
              setLocationText(locationText === p.loc ? "" : p.loc);
              setPage(1);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="jb-empty-row">Loading your matches...</div>}

      {!loading && data && data.total === 0 && !searchText && !locationText && (
        <div className="jb-empty-row">
          <b>Nothing left to swipe.</b> New jobs arrive after the next sync, or add more searches in{" "}
          <a href="/jobs" className="jb-link">
            Add/Edit Jobs
          </a>
          .
        </div>
      )}
      {!loading && data && data.total === 0 && (searchText || locationText) && (
        <div className="jb-empty-row">No matches fit that search.</div>
      )}

      <div className="jb-rows">
        {apps.map((app) => {
          const p = app.jobPosting;
          const pay = formatSalary(p);
          return (
            <div className="jb-row" key={app.id}>
              <JobLogo company={p.company} logoUrl={p.logoUrl} />
              <div className="jb-row-main">
                <div className="jb-row-title">{p.title}</div>
                <div className="jb-row-sub">{p.company}</div>
              </div>
              <div className="jb-row-loc">
                <LocationLine location={p.location} mode={p.workMode ?? (p.remote ? "remote" : null)} />
              </div>
              <div className="jb-row-pay">{pay || <span className="jb-muted">Pay not listed</span>}</div>
              <MatchRing score={app.matchScore} size={50} />
              <div className="jb-row-actions">
                <button
                  className="jb-btn jb-btn-primary jb-btn-sm"
                  disabled={busyId === app.id}
                  onClick={() => swipe(app, "right")}
                >
                  Interested
                </button>
                <button
                  className="jb-btn jb-btn-outline jb-btn-sm"
                  disabled={busyId === app.id}
                  onClick={() => swipe(app, "left")}
                >
                  Pass
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {data && data.total > 0 && (
        <div className="jb-pager-row">
          <nav className="jb-pager" aria-label="Pages">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
              &lsaquo;
            </button>
            {pageWindow(page, data.totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`}>…</span>
              ) : (
                <button
                  key={p}
                  className={p === page ? "on" : ""}
                  onClick={() => setPage(p)}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              )
            )}
            <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
              &rsaquo;
            </button>
          </nav>
          <span className="jb-muted">
            Showing {from}&ndash;{to} of {data.total} jobs
          </span>
        </div>
      )}
    </div>
  );
}
