"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { JobLogo, LocationLine, MatchRing, postedLabel } from "../components/jobui";
import { ArrowUpI, BriefcaseI, BulbI, HeartFillI, UndoI, XI } from "../components/jbicons";

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
  applyUrl?: string | null;
  summary: string;
  postedAt: string;
  salaryText: string | null;
  logoUrl: string | null;
  workMode: string | null;
}

interface Fx {
  key: number;
  dir: Dir;
  card: Card;
  dx: number;
  dy: number;
}

const THRESHOLD = 100;

/** Posted within the last two days. */
function isNew(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 2 * 86_400_000;
}
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** The visible face of a job card. Also used for the shatter pieces. */
function CardBody({ card }: { card: Card }) {
  return (
    <>
      <div className="jb-card-head">
        <JobLogo company={card.company} logoUrl={card.logoUrl} size={64} />
        <div className="jb-card-title-block">
          <h2>{card.title}</h2>
          <div className="jb-card-co">
            {card.company}
            {isNew(card.postedAt) && <span className="jb-new" style={{ marginLeft: 8 }}>NEW</span>}
          </div>
        </div>
        <MatchRing score={card.matchScore} size={72} />
      </div>
      <div className="jb-card-line">
        <LocationLine location={card.location} mode={card.workMode ?? (card.remote ? "remote" : null)} />
      </div>
      <div className="jb-card-line jb-card-pay">
        <BriefcaseI width={16} height={16} />
        <b>{card.salaryText || "Pay not listed"}</b>
        <span>&bull; {postedLabel(card.postedAt)}</span>
      </div>
      <div className="jb-card-match">
        <BulbI width={16} height={16} />
        <span>
          {card.keywordsMatched.length > 0
            ? `Matches your skills: ${card.keywordsMatched.slice(0, 3).join(", ")}`
            : "Few skills overlap with your resume. Worth a look?"}
        </span>
      </div>
      <div className="jb-card-src">
        {card.sourceLabel}
        {card.applyModeLabel ? ` · ${card.applyModeLabel}` : ""}
      </div>
    </>
  );
}

const BUILDINGS: [number, number, number][] = [
  [0, 70, 110], [78, 46, 150], [130, 60, 95], [196, 40, 170], [242, 70, 120], [320, 50, 90],
  [380, 44, 140], [430, 80, 105], [520, 46, 160], [572, 60, 100], [700, 54, 150], [760, 70, 110],
  [838, 44, 175], [888, 70, 120], [966, 54, 95], [1026, 66, 150], [1100, 100, 115],
];

function Skyline() {
  return (
    <svg className="jb-skyline" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b6cff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#5b43e6" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {BUILDINGS.map(([x, w, h], i) => (
        <rect key={i} x={x} y={240 - h} width={w} height={h} fill="url(#sky)" opacity={0.75} />
      ))}
      {/* tower */}
      <rect x="630" y="40" width="9" height="200" fill="url(#sky)" />
      <ellipse cx="634.5" cy="112" rx="22" ry="9" fill="url(#sky)" />
      <rect x="633" y="8" width="3" height="40" fill="url(#sky)" />
      <path d="M0 240V218c180-26 380-30 600-14s420 24 600 8v28z" fill="#5b43e6" opacity="0.35" />
    </svg>
  );
}

/** Left swipe: the card breaks into pieces that fall away and fade. */
function Shatter({ fx }: { fx: Fx }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        col: i % 4,
        row: Math.floor(i / 4),
        dx: rand(-170, 170),
        dy: rand(140, 420),
        rot: rand(-55, 55),
        delay: rand(0, 140),
      })),
    [fx.key]
  );
  const dust = useMemo(
    () =>
      Array.from({ length: 22 }, () => ({
        x: rand(8, 92),
        y: rand(8, 92),
        dx: rand(-90, 90),
        dy: rand(40, 260),
        s: rand(4, 9),
        delay: rand(0, 220),
      })),
    [fx.key]
  );
  return (
    <div
      className="jb-fx"
      style={{ transform: `translate(${fx.dx}px, ${fx.dy}px) rotate(${fx.dx * 0.06}deg)` }}
      aria-hidden="true"
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          className="jb-card jb-shard"
          style={
            {
              clipPath: `inset(${p.row * 33.333}% ${(3 - p.col) * 25}% ${(2 - p.row) * 33.333}% ${p.col * 25}%)`,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        >
          <CardBody card={fx.card} />
        </div>
      ))}
      {dust.map((d, i) => (
        <i
          key={i}
          className="jb-dust"
          style={
            {
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.s,
              height: d.s,
              "--dx": `${d.dx}px`,
              "--dy": `${d.dy}px`,
              animationDelay: `${d.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

const SPARK_COLOURS = ["#fbbf24", "#f472b6", "#ffffff", "#34d399", "#a78bfa", "#fde68a"];

/** Right and up swipes: the card flies off in a burst of stars. */
function Sparkles({ fx }: { fx: Fx }) {
  const count = fx.dir === "up" ? 38 : 26;
  const sparks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = rand(0, Math.PI * 2);
        const dist = rand(90, fx.dir === "up" ? 330 : 260);
        return {
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist - 30,
          rot: rand(-180, 180),
          size: rand(10, fx.dir === "up" ? 30 : 24),
          delay: rand(0, 160),
          colour: SPARK_COLOURS[i % SPARK_COLOURS.length],
        };
      }),
    [fx.key, count, fx.dir]
  );
  return (
    <>
      <div
        className={`jb-fx jb-fly-${fx.dir}`}
        style={{ transform: `translate(${fx.dx}px, ${fx.dy}px) rotate(${fx.dx * 0.06}deg)` }}
        aria-hidden="true"
      >
        <div className="jb-card jb-fx-card">
          <CardBody card={fx.card} />
        </div>
      </div>
      <div className={`jb-burst jb-burst-${fx.dir}`} aria-hidden="true">
        <span className="jb-glow" />
        {sparks.map((s, i) => (
          <i
            key={i}
            className="jb-spark"
            style={
              {
                "--tx": `${s.tx}px`,
                "--ty": `${s.ty}px`,
                "--rot": `${s.rot}deg`,
                width: s.size,
                height: s.size,
                background: s.colour,
                animationDelay: `${s.delay}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}

export default function DeckPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [swipedToday, setSwipedToday] = useState(0);
  const [fx, setFx] = useState<Fx | null>(null);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState("");

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
      setSwipedToday(data.swipedToday || 0);
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

  const card = cards[0];
  const next = cards[1];

  // Tell the frame which job is on top so its Generate Now button knows.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("joby-current", {
        detail: card
          ? { id: card.id, title: card.title, company: card.company, applyUrl: card.applyUrl ?? null }
          : null,
      })
    );
    return () => {
      window.dispatchEvent(new CustomEvent("joby-current", { detail: null }));
    };
  }, [card?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback(
    (dir: Dir) => {
      if (busy.current || cards.length === 0) return;
      busy.current = true;
      const top = cards[0];

      // A short buzz on phones that support it: longer for a top pick.
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(dir === "up" ? [18, 40, 18] : dir === "right" ? 14 : 8);
      }

      setFx({ key: Date.now(), dir, card: top, dx, dy });
      setCards((c) => c.slice(1));
      setDx(0);
      setDy(0);
      setExpanded(false);
      setSwipedToday((n) => n + 1);
      setToast(dir === "left" ? "" : dir === "up" ? "Top pick saved." : "Saved to Interested.");

      fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: top.id, dir }),
      })
        .then((res) => {
          if (!res.ok && res.status !== 409) throw new Error(String(res.status));
          window.dispatchEvent(new Event("joby-refresh"));
        })
        .catch(() => {
          setToast("Couldn't save that swipe. Refreshing your deck.");
          history.current = history.current.filter((h) => h.card.id !== top.id);
          load();
        });

      history.current.push({ card: top, dir });
      window.setTimeout(() => {
        busy.current = false;
      }, 320);
      window.setTimeout(() => setFx((f) => (f && f.card.id === top.id ? null : f)), 1150);
    },
    [cards, dx, dy, load]
  );

  // A resume + cover letter was generated for the top card from the sidebar.
  useEffect(() => {
    function onGenerated(e: Event) {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      const hit = cards.find((c) => c.id === id);
      if (!hit) return;
      setFx({ key: Date.now(), dir: "right", card: hit, dx: 0, dy: 0 });
      setCards((c) => c.filter((x) => x.id !== id));
      setToast("Saved to Interested.");
      window.setTimeout(() => setFx(null), 1150);
    }
    window.addEventListener("joby-generated", onGenerated);
    return () => window.removeEventListener("joby-generated", onGenerated);
  }, [cards]);

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
        setSwipedToday((n) => Math.max(0, n - 1));
        setLimitReached(false);
        setToast("");
        setFx(null);
        window.dispatchEvent(new Event("joby-refresh"));
      } else {
        await load();
      }
    } catch {
      setToast("Couldn't undo. Try again.");
    } finally {
      busy.current = false;
    }
  }, [load]);

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
    if (expanded) return;
    start.current = { x: e.clientX, y: e.clientY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture is a nicety */
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

  const vertical = Math.abs(dy) > Math.abs(dx);
  const likeOp = vertical ? 0 : clamp01(dx / 90);
  const nopeOp = vertical ? 0 : clamp01(-dx / 90);
  const topOp = vertical ? clamp01(-dy / 90) : 0;
  const done = Math.min(dailyLimit, swipedToday);
  const ringPct = dailyLimit > 0 ? done / dailyLimit : 0;

  return (
    <div className="jb-deck">
      <div className="jb-hero">
        <div>
          <h1>
            Find Your Next <span className="jb-accent">Opportunity</span>
          </h1>
          <p>Swipe jobs, find your perfect match in Canada.</p>
        </div>
        <div className="jb-today" aria-label={`Today's deck ${done} of ${dailyLimit}`}>
          <span className="jb-today-ring">
            <svg viewBox="0 0 48 48" width="62" height="62">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#dcd6fb" strokeWidth="5" />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#5b43e6"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${ringPct * 125.66} 125.66`}
                transform="rotate(-90 24 24)"
              />
            </svg>
            <b>
              {done}/{dailyLimit}
            </b>
          </span>
          <span className="jb-today-label">Today&apos;s deck</span>
        </div>
      </div>

      <div className="jb-stage">
        <Skyline />

        <div className="jb-stage-grid">
          <div className="jb-act-col jb-act-left">
            <button type="button" className="jb-act jb-act-pass" aria-label="Pass on this job" disabled={!card} onClick={() => commit("left")}>
              <XI width={30} height={30} strokeWidth={3} />
            </button>
            <span className="jb-act-label jb-red">Pass</span>
          </div>

          <div className="jb-card-zone">
            {loading && <div className="jb-empty">Loading your deck…</div>}

            {!loading && error && (
              <div className="jb-empty">
                <p>{error}</p>
                <button className="jb-btn jb-btn-primary" onClick={load}>
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && !card && !fx && (
              <div className="jb-empty">
                <h2>{limitReached ? "You're all caught up" : "No new matches yet"}</h2>
                <p>
                  {limitReached
                    ? `You've seen today's ${dailyLimit} jobs. Fresh postings are pulled in every morning, so come back tomorrow for a new deck.`
                    : "Add a resume and a job search. New matches are pulled in every morning."}
                </p>
                <Link href="/interested" className="jb-btn jb-btn-primary">
                  Open Interested
                </Link>
                {!limitReached && (
                  <Link href="/jobs" className="jb-btn jb-btn-outline">
                    Add a job search
                  </Link>
                )}
              </div>
            )}

            {!loading && !error && card && (
              <>
                {next && (
                  <div className="jb-card jb-card-next" aria-hidden="true">
                    <CardBody card={next} />
                  </div>
                )}
                <div
                  key={card.id}
                  className="jb-card jb-card-top"
                  role="group"
                  aria-label={`${card.title} at ${card.company}`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  style={{
                    transform: dragging || dx || dy
                      ? `translate(${dx}px, ${dy}px) rotate(${dx * 0.06}deg)`
                      : undefined,
                    transition: dragging ? "none" : undefined,
                    cursor: dragging ? "grabbing" : "grab",
                  }}
                >
                  <CardBody card={card} />
                  <button
                    type="button"
                    className="jb-info"
                    aria-label="Show details"
                    aria-expanded={expanded}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setExpanded((v) => !v)}
                  >
                    i
                  </button>

                  <div className="jb-stamp jb-stamp-like" style={{ opacity: likeOp }}>INTERESTED</div>
                  <div className="jb-stamp jb-stamp-nope" style={{ opacity: nopeOp }}>PASS</div>
                  <div className="jb-stamp jb-stamp-top" style={{ opacity: topOp }}>TOP PICK</div>

                  {expanded && (
                    <div className="jb-sheet" onPointerDown={(e) => e.stopPropagation()}>
                      <div className="jb-sheet-head">
                        <strong>About this job</strong>
                        <button type="button" aria-label="Close details" onClick={() => setExpanded(false)}>
                          ×
                        </button>
                      </div>
                      <p>{card.summary}</p>
                      {card.keywordsMissing.length > 0 && (
                        <div className="jb-sheet-miss">
                          Not on your resume: {card.keywordsMissing.join(", ")}
                        </div>
                      )}
                      <div className="jb-sheet-src">
                        {card.sourceLabel}
                        {card.attribution ? ` · ${card.attribution}` : ""}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {fx && (fx.dir === "left" ? <Shatter fx={fx} /> : <Sparkles fx={fx} />)}
          </div>

          <div className="jb-act-col jb-act-right">
            <button type="button" className="jb-act jb-act-top" aria-label="Mark as top pick" disabled={!card} onClick={() => commit("up")}>
              <ArrowUpI width={30} height={30} strokeWidth={3} />
            </button>
            <span className="jb-act-label jb-gold">Top Pick</span>
            <button type="button" className="jb-act jb-act-like" aria-label="Interested in this job" disabled={!card} onClick={() => commit("right")}>
              <HeartFillI width={30} height={30} />
            </button>
            <span className="jb-act-label jb-green">Interested</span>
          </div>
        </div>

        <div className="jb-deck-foot">
          <button type="button" className="jb-pill" onClick={undo}>
            <UndoI width={16} height={16} /> Undo
          </button>
          <span className="jb-pill jb-pill-count">
            {done} / {dailyLimit}
          </span>
          <span className="jb-pill jb-pill-keys">Keyboard: ← → ↑</span>
        </div>
        <div className="jb-toast" aria-live="polite">
          {toast}
        </div>
      </div>
    </div>
  );
}
