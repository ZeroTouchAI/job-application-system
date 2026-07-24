"use client";

import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";

export default function JobSearchSettingsPage() {
  const [searchNiche, setSearchNiche] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchRemoteOnly, setSearchRemoteOnly] = useState(false);
  const [searchKeywords, setSearchKeywords] = useState("");
  const [greenhouseBoards, setGreenhouseBoards] = useState("");
  const [leverBoards, setLeverBoards] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/search-settings")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load settings (${r.status})`);
        return r.json();
      })
      .then((data) => {
        const s = data.settings;
        if (!s) return;
        setSearchNiche(s.searchNiche || "");
        setSearchLocation(s.searchLocation || "");
        setSearchRemoteOnly(!!s.searchRemoteOnly);
        setSearchKeywords((s.searchKeywords || []).join(", "));
        setGreenhouseBoards((s.greenhouseBoards || []).join(", "));
        setLeverBoards((s.leverBoards || []).join(", "));
      })
      .catch((err) => {
        console.error("Failed to load search settings:", err);
        setError("Couldn't load your saved settings. You can still fill in the form below.");
      })
      .finally(() => setLoading(false));
  }, []);

  function splitList(v: string): string[] {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/user/search-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchNiche,
          searchLocation,
          searchRemoteOnly,
          searchKeywords: splitList(searchKeywords),
          greenhouseBoards: splitList(greenhouseBoards),
          leverBoards: splitList(leverBoards),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong saving that.");
        return;
      }

      setSaved(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
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
            Tell us what you&apos;re looking for. We use this to pull relevant
            postings from legitimate public job APIs on a schedule, and to
            score how well each one matches your resume.
          </p>
        </div>
      </section>

      <div className="profile-body">
        <div className="profile-card">
          {loading ? (
            <div>Loading your settings...</div>
          ) : (
            <>
              {error && <div className="form-error">{error}</div>}
              {saved && (
                <div
                  style={{
                    background: "var(--color-primary-soft)",
                    color: "var(--color-primary)",
                    fontSize: 13,
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  Saved. New matches will show up after the next sync.
                </div>
              )}

              <div className="field">
                <label htmlFor="niche">Job title or niche</label>
                <input
                  id="niche"
                  type="text"
                  value={searchNiche}
                  onChange={(e) => setSearchNiche(e.target.value)}
                  placeholder="e.g. Operations Coordinator, Data Analyst"
                />
                <div className="field-hint">The main role or field you&apos;re targeting.</div>
              </div>

              <div className="field">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="e.g. Toronto, ON"
                />
              </div>

              <div className="field">
                <label className="filter-checkbox" style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={searchRemoteOnly}
                    onChange={(e) => setSearchRemoteOnly(e.target.checked)}
                  />
                  Remote roles only
                </label>
              </div>

              <div className="field">
                <label htmlFor="keywords">Additional keywords</label>
                <input
                  id="keywords"
                  type="text"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
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
                <div className="field-hint">
                  Comma-separated company board names. Optional, for companies you specifically want to track.
                </div>
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

              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save search settings"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
