"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { refreshFrame } from "../components/AppFrame";
import { JobLogo, LocationLine, MatchRing } from "../components/jobui";
import { InfoButton, JobDetailsModal, PostedLines } from "../components/JobInfo";
import type { InfoCard } from "../components/JobInfo";
import { SearchI, PinI } from "../components/jbicons";

interface Page {
  applications: InfoCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Posted within the last two days. */
function isNew(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 2 * 86_400_000;
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
  const [details, setDetails] = useState<InfoCard | null>(null);
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

  async function swipe(card: InfoCard, dir: "right" | "left") {
    setBusyId(card.id);
    setError(null);
    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: card.id, dir }),
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
        <p>Search and explore jobs you haven&apos;t swiped on yet. The details match the swipe deck.</p>
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

      {error && <div className="jb-error">{error}</div>}
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
        {apps.map((c) => (
          <div className="jb-row" key={c.id}>
            <JobLogo company={c.company} logoUrl={c.logoUrl} />
            <div className="jb-row-main">
              <div className="jb-row-title">
                {c.title}
                {isNew(c.postedAt) && <span className="jb-new">NEW</span>}
              </div>
              <div className="jb-row-sub">{c.company}</div>
            </div>
            <div className="jb-row-info">
              <LocationLine location={c.location} mode={c.workMode ?? (c.remote ? "remote" : null)} />
              <span className="jb-row-pay">{c.salaryText || <span className="jb-muted">Pay not listed</span>}</span>
              <PostedLines card={c} />
              <div className="jb-row-skills">
                {c.keywordsMatched.length > 0
                  ? `Matches your skills: ${c.keywordsMatched.slice(0, 3).join(", ")}`
                  : "Few skills overlap with your resume."}
              </div>
            </div>
            <div className="jb-ringcol">
              <MatchRing score={c.matchScore} size={50} />
              <InfoButton onClick={() => setDetails(c)} />
            </div>
            <div className="jb-row-actions">
              <button
                className="jb-btn jb-btn-blue jb-btn-sm"
                disabled={busyId === c.id}
                onClick={() => swipe(c, "right")}
              >
                Interested
              </button>
              <button
                className="jb-btn jb-btn-red jb-btn-sm"
                disabled={busyId === c.id}
                onClick={() => swipe(c, "left")}
              >
                Pass
              </button>
            </div>
          </div>
        ))}
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

      {details && <JobDetailsModal card={details} onClose={() => setDetails(null)} />}
    </div>
  );
}
