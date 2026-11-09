"use client";

import { useEffect, useRef, useState } from "react";
import { refreshFrame } from "../components/AppFrame";
import { PlusI, SearchI, TrashI, PencilI } from "../components/jbicons";
import { parseAreas } from "../../lib/areas";

interface SearchCriteria {
  id: string;
  niche: string;
  location: string | null;
  remoteOnly: boolean; // stored name; meaning: include remote roles
  keywords: string[];
  greenhouseBoards: string[];
  leverBoards: string[];
  rssFeeds: string[];
}

const splitList = (v: string): string[] =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export default function JobSearchSettingsPage() {
  const [list, setList] = useState<SearchCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [niche, setNiche] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState("");
  const [includeRemote, setIncludeRemote] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [greenhouse, setGreenhouse] = useState("");
  const [lever, setLever] = useState("");
  const [rss, setRss] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function load() {
    fetch("/api/user/search-settings")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => setList(d.criteria || []))
      .catch(() => setError("Couldn't load your saved searches."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function resetForm() {
    setEditingId(null);
    setNiche("");
    setAreas([]);
    setAreaInput("");
    setIncludeRemote(false);
    setKeywords("");
    setGreenhouse("");
    setLever("");
    setRss("");
  }

  function addAreaFromInput() {
    const parts = areaInput
      .split(/[,;\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setAreas((prev) => {
      const next = [...prev];
      for (const p of parts) if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
      return next;
    });
    setAreaInput("");
  }

  function startEdit(c: SearchCriteria) {
    setEditingId(c.id);
    setNiche(c.niche);
    setAreas((c.location || "").split(",").map((x) => x.trim()).filter(Boolean));
    setAreaInput("");
    setIncludeRemote(c.remoteOnly);
    setKeywords(c.keywords.join(", "));
    setGreenhouse(c.greenhouseBoards.join(", "));
    setLever(c.leverBoards.join(", "));
    setRss(c.rssFeeds.join(", "));
    setNotice(null);
    setError(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSave() {
    setError(null);
    setNotice(null);
    // Anything typed but not yet added still counts.
    const typed = areaInput
      .split(/[,;\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const finalAreas = [...areas];
    for (const p of typed) if (!finalAreas.some((x) => x.toLowerCase() === p.toLowerCase())) finalAreas.push(p);

    if (!niche.trim()) {
      setError("Enter a job title first.");
      return;
    }
    if (finalAreas.length === 0 && !includeRemote) {
      setError("Add at least one area, or turn on remote roles. Joby only shows jobs in the areas you pick.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/user/search-settings/${editingId}` : "/api/user/search-settings",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            niche,
            location: finalAreas.join(", "),
            remoteOnly: includeRemote,
            keywords: splitList(keywords),
            greenhouseBoards: splitList(greenhouse),
            leverBoards: splitList(lever),
            rssFeeds: splitList(rss),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong saving that.");
        return;
      }
      setNotice(
        editingId
          ? "Search updated. Jobs outside these areas drop off at the next sync."
          : "Search added. Matching jobs show up after the next sync."
      );
      resetForm();
      load();
      refreshFrame();
      // The sidebar's Job Search list reads from the same data.
      window.dispatchEvent(new Event("joby-searches"));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this search?")) return;
    setList((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/user/search-settings/${id}`, { method: "DELETE" });
      if (!res.ok) load();
      window.dispatchEvent(new Event("joby-searches"));
    } catch {
      load();
    }
  }

  return (
    <div>
      <div className="jb-page-head">
        <h1>Add/Edit Jobs</h1>
        <p>
          Each search is a job title plus the areas you want it in. Joby only shows jobs inside those areas.
          Remote jobs appear only if you switch remote on.
        </p>
      </div>

      {error && <div className="jb-error">{error}</div>}
      {notice && <div className="jb-notice">{notice}</div>}

      <div className="jb-panel" ref={formRef}>
        <h2 className="jb-panel-title">
          <span className="jb-ico-box">{editingId ? <PencilI width={18} height={18} /> : <PlusI width={18} height={18} />}</span>
          {editingId ? "Edit search" : "Add a new search"}
        </h2>
        <p className="jb-panel-sub">
          {editingId ? "Change anything, then save." : "Pick a job title and every area you would work in."}
        </p>

        <div className="jb-form-grid">
          <div className="jb-field full">
            <label htmlFor="niche">Job title or niche</label>
            <input
              id="niche"
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Data Center Operator"
            />
          </div>

          <div className="jb-field full">
            <label htmlFor="areas">Areas</label>
            <div className="jb-chipinput">
              {areas.map((a) => (
                <span className="jb-areachip" key={a}>
                  {a}
                  <button type="button" aria-label={`Remove ${a}`} onClick={() => setAreas((p) => p.filter((x) => x !== a))}>
                    &times;
                  </button>
                </span>
              ))}
              <input
                id="areas"
                type="text"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addAreaFromInput();
                  } else if (e.key === "Backspace" && !areaInput && areas.length) {
                    setAreas((p) => p.slice(0, -1));
                  }
                }}
                onBlur={addAreaFromInput}
                placeholder={areas.length ? "Add another area..." : "e.g. Scarborough, then Toronto"}
              />
            </div>
            <div className="jb-hint">
              Type a city and press Enter. Add as many as you like. A province on its own (e.g. Ontario) covers the
              whole province.
            </div>
          </div>

          <div className="jb-field full">
            <label className="jb-switch">
              <input type="checkbox" checked={includeRemote} onChange={(e) => setIncludeRemote(e.target.checked)} />
              <i />
              Include remote jobs (open to Canada)
            </label>
          </div>
        </div>

        <details className="jb-more">
          <summary>More options</summary>
          <div className="jb-form-grid" style={{ marginTop: 12 }}>
            <div className="jb-field full">
              <label htmlFor="keywords">Additional keywords</label>
              <input id="keywords" type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. critical facilities, HVAC, Excel" />
              <div className="jb-hint">Comma-separated. Optional.</div>
            </div>
            <div className="jb-field">
              <label htmlFor="greenhouse">Specific companies (Greenhouse)</label>
              <input id="greenhouse" type="text" value={greenhouse} onChange={(e) => setGreenhouse(e.target.value)} placeholder="e.g. hootsuite, faire" />
            </div>
            <div className="jb-field">
              <label htmlFor="lever">Specific companies (Lever)</label>
              <input id="lever" type="text" value={lever} onChange={(e) => setLever(e.target.value)} placeholder="e.g. wattpad" />
            </div>
            <div className="jb-field full">
              <label htmlFor="rss">RSS feed URLs</label>
              <input id="rss" type="text" value={rss} onChange={(e) => setRss(e.target.value)} placeholder="A saved-search feed from a regional job board" />
              <div className="jb-hint">Comma-separated. Any feed you have legitimate access to.</div>
            </div>
          </div>
        </details>

        <div className="jb-actions">
          <button className="jb-btn jb-btn-primary" onClick={handleSave} disabled={saving}>
            <SearchI width={16} height={16} />
            {saving ? "Saving..." : editingId ? "Save changes" : "Add search"}
          </button>
          {editingId && (
            <button className="jb-btn jb-btn-outline" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <h2 className="jb-section">Your searches</h2>
      {loading && <div className="jb-muted">Loading...</div>}
      {!loading && list.length === 0 && <div className="jb-empty-row">No searches saved yet. Add one above.</div>}

      <div className="jb-saved-list">
        {list.map((c) => {
          const parsed = parseAreas(c.location);
          const chips = [...parsed.cities, ...parsed.provinces];
          return (
            <div className="jb-saved" key={c.id}>
              <div className="jb-saved-main">
                <div className="jb-saved-title">{c.niche}</div>
                <div className="jb-saved-areas">
                  {chips.length === 0 && <span className="jb-muted">Anywhere in Canada</span>}
                  {(c.location || "")
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                    .map((a) => (
                      <span className="jb-areachip" key={a} style={{ paddingRight: 12 }}>
                        {a}
                      </span>
                    ))}
                  {c.remoteOnly && <span className="jb-badge jb-badge-remote">Remote included</span>}
                </div>
                {(c.keywords.length > 0 || c.greenhouseBoards.length + c.leverBoards.length + c.rssFeeds.length > 0) && (
                  <div className="jb-saved-meta">
                    {c.keywords.length > 0 && <>Keywords: {c.keywords.join(", ")}. </>}
                    {c.greenhouseBoards.length + c.leverBoards.length > 0 && (
                      <>{c.greenhouseBoards.length + c.leverBoards.length} company boards. </>
                    )}
                    {c.rssFeeds.length > 0 && <>{c.rssFeeds.length} RSS feed{c.rssFeeds.length === 1 ? "" : "s"}.</>}
                  </div>
                )}
              </div>
              <div className="jb-saved-actions">
                <button className="jb-btn jb-btn-outline jb-btn-sm" onClick={() => startEdit(c)}>
                  <PencilI width={14} height={14} /> Edit
                </button>
                <button className="jb-btn jb-btn-outline jb-btn-sm jb-btn-danger" onClick={() => handleDelete(c.id)}>
                  <TrashI width={14} height={14} /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
