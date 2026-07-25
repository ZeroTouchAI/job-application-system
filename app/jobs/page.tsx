"use client";

import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";

interface SearchCriteria {
  id: string;
  niche: string;
  location: string | null;
  remoteOnly: boolean;
  keywords: string[];
  greenhouseBoards: string[];
  leverBoards: string[];
}

export default function JobSearchSettingsPage() {
  const [criteriaList, setCriteriaList] = useState<SearchCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-new-search form state
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [greenhouseBoards, setGreenhouseBoards] = useState("");
  const [leverBoards, setLeverBoards] = useState("");
  const [saving, setSaving] = useState(false);

  function loadCriteria() {
    fetch("/api/user/search-settings")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load (${r.status})`);
        return r.json();
      })
      .then((data) => setCriteriaList(data.criteria || []))
      .catch((err) => {
        console.error("Failed to load search criteria:", err);
        setError("Couldn't load your saved searches.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCriteria();
  }, []);

  function splitList(v: string): string[] {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleAdd() {
    setError(null);
    if (!niche.trim()) {
      setError("Enter a job title or niche first.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/search-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          location,
          remoteOnly,
          keywords: splitList(keywords),
          greenhouseBoards: splitList(greenhouseBoards),
          leverBoards: splitList(leverBoards),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong saving that.");
        return;
      }

      // Clear the form and refresh the list rather than replacing anything.
      setNiche("");
      setLocation("");
      setRemoteOnly(false);
      setKeywords("");
      setGreenhouseBoards("");
      setLeverBoards("");
      loadCriteria();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setCriteriaList((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/user/search-settings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        loadCriteria(); // revert the optimistic removal if it actually failed
      }
    } catch {
      loadCriteria();
    }
  }

  return (
    <div className="profile-shell">
      <AppHeader active="jobs" />

      <section className="profile-hero">
        <div className="container">
          <div className="eyebrow">Step 2</div>
          <h1>Add/Edit jobs</h1>
          <p>
            Add every role or niche you want tracked. Each one gets pulled
            from legitimate public job APIs on a schedule and scored against
            your resume, independently.
          </p>
        </div>
      </section>

      <div className="profile-body">
        {error && <div className="form-error">{error}</div>}

        {!loading && criteriaList.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {criteriaList.map((c) => (
              <div className="profile-card" key={c.id} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.niche}</div>
                    <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                      {c.location || "Any location"}
                      {c.remoteOnly ? " · Remote only" : ""}
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleDelete(c.id)}
                    style={{ color: "#b42318", borderColor: "#f3b3ab" }}
                  >
                    Remove
                  </button>
                </div>
                {c.keywords.length > 0 && (
                  <div className="skill-chip-row">
                    {c.keywords.map((kw) => (
                      <span className="skill-chip" key={kw}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="profile-card">
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
            Add a new search
          </h2>

          <div className="field">
            <label htmlFor="niche">Job title or niche</label>
            <input
              id="niche"
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Operations Coordinator, Data Analyst"
            />
          </div>

          <div className="field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Toronto, ON"
            />
          </div>

          <div className="field">
            <label className="filter-checkbox" style={{ marginBottom: 0 }}>
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
              />
              Remote roles only
            </label>
          </div>

          <div className="field">
            <label htmlFor="keywords">Additional keywords</label>
            <input
              id="keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. logistics, scheduling, Excel"
            />
            <div className="field-hint">Comma-separated. Optional.</div>
          </div>

          <div className="field">
            <label htmlFor="greenhouse">Specific companies (Greenhouse)</label>
            <input
              id="greenhouse"
              type="text"
              value={greenhouseBoards}
              onChange={(e) => setGreenhouseBoards(e.target.value)}
              placeholder="e.g. stripe, airbnb"
            />
            <div className="field-hint">Comma-separated. Optional.</div>
          </div>

          <div className="field">
            <label htmlFor="lever">Specific companies (Lever)</label>
            <input
              id="lever"
              type="text"
              value={leverBoards}
              onChange={(e) => setLeverBoards(e.target.value)}
              placeholder="e.g. netflix"
            />
            <div className="field-hint">Comma-separated. Optional.</div>
          </div>

          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? "Adding..." : "Add search"}
          </button>
        </div>
      </div>
    </div>
  );
}
