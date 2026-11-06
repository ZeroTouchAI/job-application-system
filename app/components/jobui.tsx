"use client";

import { useState } from "react";
import { PinI } from "./jbicons";

const PALETTE = [
  ["#6D5BFF", "#9B7BFF"],
  ["#0EA5A4", "#22C3A6"],
  ["#2563EB", "#60A5FA"],
  ["#E11D74", "#F472B6"],
  ["#F59E0B", "#FBBF24"],
  ["#16A34A", "#4ADE80"],
];

function paletteFor(name: string): string[] {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Company logo when the source gave one, otherwise a coloured monogram. */
export function JobLogo({
  company,
  logoUrl,
  size = 46,
}: {
  company: string;
  logoUrl?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const [a, b] = paletteFor(company || "?");
  const style = { width: size, height: size, fontSize: size * 0.42 };

  if (logoUrl && !failed) {
    return (
      <span className="jb-logo" style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }
  return (
    <span className="jb-logo jb-logo-mono" style={{ ...style, background: `linear-gradient(135deg, ${a}, ${b})` }}>
      {(company || "?").charAt(0).toUpperCase()}
    </span>
  );
}

/** Circular match gauge, coloured by how strong the match is. */
export function MatchRing({ score, size = 54 }: { score: number; size?: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const colour = pct >= 85 ? "#16a34a" : pct >= 65 ? "#6a4df0" : "#f59e0b";
  return (
    <span className="jb-ring" style={{ width: size, height: size }} aria-label={`${pct}% match`}>
      <svg viewBox="0 0 48 48" width={size} height={size}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e8e5fb" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span className="jb-ring-num">
        {pct}%<small>Match</small>
      </span>
    </span>
  );
}

const MODE_LABEL: Record<string, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "Onsite" };

export function WorkBadge({ mode }: { mode?: string | null }) {
  if (!mode || !MODE_LABEL[mode]) return null;
  return <span className={`jb-badge jb-badge-${mode}`}>{MODE_LABEL[mode]}</span>;
}

export function LocationLine({ location, mode }: { location: string | null; mode?: string | null }) {
  return (
    <span className="jb-loc">
      <PinI width={14} height={14} />
      {location || "Location not listed"}
      <WorkBadge mode={mode} />
    </span>
  );
}

export function postedLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 60) return `Posted ${days} days ago`;
  return `Posted ${Math.round(days / 30)} months ago`;
}
