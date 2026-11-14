"use client";

import { JobLogo, LocationLine, MatchRing } from "./jobui";
import { BriefcaseI } from "./jbicons";

/** What both the swipe deck and the list view know about a job. */
export interface InfoCard {
  id: string;
  matchScore: number;
  keywordsMatched: string[];
  keywordsMissing: string[];
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  workMode: string | null;
  sourceLabel: string;
  attribution: string | null;
  applyModeLabel: string;
  applyUrl?: string | null;
  summary: string;
  details?: string;
  postedAt: string;
  postedExact?: boolean;
  addedAt?: string;
  salaryText: string | null;
  logoUrl: string | null;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 60) return `${days} days ago`;
  return `${Math.round(days / 30)} months ago`;
}

/** Posted date from the employer (when known) and the date Joby added it. */
export function PostedLines({ card }: { card: InfoCard }) {
  const exact = card.postedExact !== false;
  return (
    <div className="jb-posted">
      <span>
        {exact ? `Posted ${fmtDate(card.postedAt)} (${ago(card.postedAt)})` : "Posted date not listed"}
      </span>
      {card.addedAt && <span>Added to Joby {fmtDate(card.addedAt)}</span>}
    </div>
  );
}

export function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="jb-info-btn" aria-label="Show details about this post" title="Details" onClick={onClick}>
      i
    </button>
  );
}

/** The details sheet for one job, opened from the info button. */
export function JobDetailsModal({ card, onClose }: { card: InfoCard; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card jb-details" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>About this job</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="jb-details-head">
          <JobLogo company={card.company} logoUrl={card.logoUrl} size={52} />
          <div className="jb-details-title">
            <b>{card.title}</b>
            <span>{card.company}</span>
          </div>
          <MatchRing score={card.matchScore} size={58} />
        </div>

        <div className="jb-details-lines">
          <LocationLine location={card.location} mode={card.workMode ?? (card.remote ? "remote" : null)} />
          <span className="jb-job-pay">
            <BriefcaseI width={14} height={14} />
            {card.salaryText || "Pay not listed"}
          </span>
          <PostedLines card={card} />
        </div>

        <p className="jb-details-summary">{card.details || card.summary}</p>

        {card.keywordsMatched.length > 0 && (
          <div className="jb-details-skills">
            <b>Matches your skills:</b> {card.keywordsMatched.join(", ")}
          </div>
        )}
        {card.keywordsMissing.length > 0 && (
          <div className="jb-details-miss">Not on your resume: {card.keywordsMissing.join(", ")}</div>
        )}
        <div className="jb-muted" style={{ marginTop: 10 }}>
          {card.sourceLabel}
          {card.applyModeLabel ? ` \u00b7 ${card.applyModeLabel}` : ""}
          {card.attribution ? ` \u00b7 ${card.attribution}` : ""}
        </div>

        {card.applyUrl && (
          <a className="jb-btn jb-btn-primary jb-btn-block" style={{ marginTop: 16 }} href={card.applyUrl} target="_blank" rel="noreferrer">
            Open the posting &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
