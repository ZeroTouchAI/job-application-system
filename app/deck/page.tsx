"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppHeader from "../components/AppHeader";
import "../swipe.css";

type Dir = "right" | "left" | "up";

interface Card {
  id: string;
  matchScore: number;
  keywordsMatched: string[];
  keywordsMissing: string[];
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  sourceLabel: string;
  attribution: string | null;
  applyModeLabel: string;
  summary: string;
  postedAt: string;
}

// Dark enough that white text passes contrast on every one of them.
const GRADIENTS = [
  "linear-gradient(160deg,#4338CA,#6D28D9)",
  "linear-gradient(160deg,#0F766E,#115E59)",
  "linear-gradient(160deg,#1D4ED8,#1E3A8A)",
  "linear-gradient(160deg,#B45309,#7C2D12)",
  "linear-gradient(160deg,#4D7C0F,#365314)",
  "linear-gradient(160deg,#9D174D,#581C87)",
];

function gradientFor(company: string): string {
  let h = 0;
  for (const ch of company) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

const THRESHOLD = 100;

export default function DeckPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [fly, setFly] = useState<Dir | null>(null);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(0);

  const start = useRef({ x: 0, y: 0 });
  const history = useRef<{ card: Card; dir: Dir }[]>([]);
  const busy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deck");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(`Deck request failed (${res.status})`);
      const data = await res.json();
      setCards(data.cards || []);
      setDailyLimit(data.dailyLimit || 10);
      setLimitReached((data.remaining || 0) === 0);
    } catch {
      setError("Couldn't load your deck. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const commit = useCallback(
    (dir: Dir) => {
      if (busy.current || cards.length === 0) return;
      busy.current = true;
      const card = cards[0];
      setFly(dir);
      setToast("");

      fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: card.id, dir }),
      })
        .then((res) => {
          if (!res.ok && res.status !== 409) throw new Error(String(res.status));
        })
        .catch(() => {
          setToast("Couldn't save that swipe. Refreshing your deck.");
          history.current = history.current.filter((h) => h.card.id !== card.id);
          load();
        });

      history.current.push({ card, dir });
      window.setTimeout(() => {
        setCards((c) => c.slice(1));
        setFly(null);
        setDx(0);
        setDy(0);
        setExpanded(false);
        if (dir !== "left") {
          setSaved((n) => n + 1);
          setToast(dir === "up" ? "Top pick saved." : "Saved to your queue.");
        }
        busy.current = false;
      }, 260);
    },
    [cards, load]
  );

  const undo = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await fetch("/api/swipe/undo", { method: "POST" });
      if (!res.ok) {
        setToast("Nothing to undo.");
        return;
      }
      const { applicationId } = await res.json();
      const idx = history.current.map((h) => h.card.id).lastIndexOf(applicationId);
      if (idx >= 0) {
        const [entry] = history.current.splice(idx, 1);
        setCards((c) => [entry.card, ...c]);
        if (entry.dir !== "left") setSaved((n) => Math.max(0, n - 1));
        setLimitReached(false);
        setToast("");
      } else {
        await load();
      }
    } catch {
      setToast("Couldn't undo. Try again.");
    } finally {
      busy.current = false;
    }
  }, [load]);

  // Keyboard: arrows to swipe, ArrowUp for top pick, Z to undo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") commit("right");
      else if (e.key === "ArrowLeft") commit("left");
      else if (e.key === "ArrowUp") commit("up");
      else if (e.key.toLowerCase() === "z") undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit, undo]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (fly || expanded) return;
    start.current = { x: e.clientX, y: e.clientY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture is a nicety, not required */
    }
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDx(e.clientX - start.current.x);
    setDy(e.clientY - start.current.y);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (dy < -THRESHOLD && Math.abs(dy) > Math.abs(dx)) commit("up");
    else if (dx > THRESHOLD) commit("right");
    else if (dx < -THRESHOLD) commit("left");
    else {
      setDx(0);
      setDy(0);
    }
  }

  const card = cards[0];
  const next = cards[1];

  let transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.06}deg)`;
  if (fly === "right") transform = `translate(150%, ${dy}px) rotate(20deg)`;
  if (fly === "left") transform = `translate(-150%, ${dy}px) rotate(-20deg)`;
  if (fly === "up") transform = "translate(0, -130%)";

  const vertical = Math.abs(dy) > Math.abs(dx);
  const likeOp = fly === "right" ? 1 : vertical ? 0 : clamp01(dx / 90);
  const nopeOp = fly === "left" ? 1 : vertical ? 0 : clamp01(-dx / 90);
  const topOp = fly === "up" ? 1 : vertical ? clamp01(-dy / 90) : 0;

  return (
    <div className="profile-shell">
      <AppHeader active="deck" />

      <main className="deck-wrap">
        <div className="deck-top">
          <h1 className="deck-title">Swipe</h1>
          <div className="deck-pill" aria-live="polite">
            {card ? `${cards.length} left today` : "Done for today"}
          </div>
        </div>

        <div className="deck-stage">
          {loading && <div className="deck-empty">Loading your deck…</div>}

          {!loading && error && (
            <div className="deck-empty">
              <p>{error}</p>
              <button className="btn btn-primary" onClick={load}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && !card && (
            <div className="deck-empty">
              <h2>{limitReached ? "You're all caught up" : "No new matches yet"}</h2>
              <p>
                {limitReached
                  ? `You've seen today's ${dailyLimit} jobs${saved ? ` and saved ${saved}` : ""}. More arrive as new postings are found.`
                  : "Add a resume and a job search, then run a sync. New matches show up here."}
              </p>
              <Link href="/queue" className="btn btn-primary">
                Open your queue
              </Link>
              {!limitReached && (
                <Link href="/jobs" className="btn btn-outline" style={{ marginTop: 8 }}>
                  Add a job search
                </Link>
              )}
            </div>
          )}

          {!loading && !error && card && (
            <>
              {next && (
                <div
                  className="deck-card deck-card-next"
                  style={{ background: gradientFor(next.company) }}
                  aria-hidden="true"
                />
              )}

              <div
                className="deck-card"
                role="group"
                aria-label={`${card.title} at ${card.company}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{
                  background: gradientFor(card.company),
                  transform,
                  transition: dragging ? "none" : "transform 0.26s ease-out, opacity 0.26s",
                  opacity: fly ? 0.2 : 1,
                  cursor: dragging ? "grabbing" : "grab",
                }}
              >
                <div className="deck-initial" aria-hidden="true">
                  {card.company.charAt(0).toUpperCase()}
                </div>
                <div className="deck-fade" />

                <div className="deck-badges">
                  <span className="deck-badge deck-badge-match">{card.matchScore}% match</span>
                  <span className="deck-badge">{card.applyModeLabel}</span>
                </div>

                <div className="deck-info">
                  <div className="deck-info-row">
                    <div className="deck-info-text">
                      <div className="deck-job-title">{card.title}</div>
                      <div className="deck-job-company">{card.company}</div>
                      <div className="deck-job-meta">
                        {[card.location, card.remote ? "Remote" : null].filter(Boolean).join(" · ") ||
                          "Location not listed"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="deck-info-btn"
                      aria-label="Show details"
                      aria-expanded={expanded}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setExpanded((v) => !v)}
                    >
                      i
                    </button>
                  </div>
                  <div className="deck-chip-row">
                    {card.keywordsMatched.slice(0, 3).map((k) => (
                      <span className="deck-chip" key={k}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="deck-stamp deck-stamp-like" style={{ opacity: likeOp }}>
                  LIKE
                </div>
                <div className="deck-stamp deck-stamp-nope" style={{ opacity: nopeOp }}>
                  NOPE
                </div>
                <div className="deck-stamp deck-stamp-top" style={{ opacity: topOp }}>
                  TOP PICK
                </div>

                {expanded && (
                  <div className="deck-sheet" onPointerDown={(e) => e.stopPropagation()}>
                    <div className="deck-sheet-head">
                      <strong>About this job</strong>
                      <button
                        type="button"
                        className="deck-sheet-close"
                        aria-label="Close details"
                        onClick={() => setExpanded(false)}
                      >
                        ×
                      </button>
                    </div>
                    <p className="deck-sheet-text">{card.summary}</p>
                    {card.keywordsMatched.length > 0 && (
                      <>
                        <div className="deck-sheet-label">On your profile</div>
                        <div className="deck-chip-row">
                          {card.keywordsMatched.map((k) => (
                            <span className="deck-chip deck-chip-have" key={k}>
                              {k}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                    {card.keywordsMissing.length > 0 && (
                      <>
                        <div className="deck-sheet-label">Not on your profile</div>
                        <div className="deck-chip-row">
                          {card.keywordsMissing.map((k) => (
                            <span className="deck-chip deck-chip-miss" key={k}>
                              {k}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="deck-sheet-source">
                      Source: {card.sourceLabel} · posted {ageLabel(card.postedAt)}
                      {card.attribution ? ` · ${card.attribution}` : ""}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="deck-toast" aria-live="polite">
          {toast}
        </div>

        <div className="deck-actions">
          <button type="button" className="deck-btn deck-btn-small" aria-label="Undo last swipe" onClick={undo}>
            ↶
          </button>
          <button
            type="button"
            className="deck-btn deck-btn-nope"
            aria-label="Pass on this job"
            disabled={!card}
            onClick={() => commit("left")}
          >
            ✕
          </button>
          <button
            type="button"
            className="deck-btn deck-btn-top"
            aria-label="Mark as top pick"
            disabled={!card}
            onClick={() => commit("up")}
          >
            ★
          </button>
          <button
            type="button"
            className="deck-btn deck-btn-like"
            aria-label="Interested in this job"
            disabled={!card}
            onClick={() => commit("right")}
          >
            ♥
          </button>
        </div>
        <p className="deck-hint">Drag the card, or use ← pass · → interested · ↑ top pick · Z undo</p>
      </main>
    </div>
  );
}
