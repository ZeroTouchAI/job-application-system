"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { refreshFrame } from "../components/AppFrame";
import { DownloadIcon, FileTextIcon } from "../icons";
import "../swipe.css";

interface Item {
  id: string;
  status: string;
  topPick: boolean;
  matchScore: number;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  sourceLabel: string;
  attribution: string | null;
  applyModeLabel: string;
  applyUrl: string | null;
  applyEmail: string | null;
}

interface ReadyMaterials {
  jobTitle: string;
  company: string;
  applyUrl: string | null;
  resumeBase64: string;
  resumeFileName: string;
  coverLetterBase64: string;
  coverLetterFileName: string;
}

const STATUS_LABELS: Record<string, string> = {
  queued: "Interested",
  drafted: "Ready to apply",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

function downloadBase64Docx(base64: string, fileName: string) {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function InterestedPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [applied, setApplied] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [ready, setReady] = useState<ReadyMaterials | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [a, b] = await Promise.all([
        fetch("/api/queue?view=interested"),
        fetch("/api/queue?view=applied"),
      ]);
      if (a.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!a.ok || !b.ok) throw new Error("load failed");
      setItems((await a.json()).items || []);
      setApplied((await b.json()).items || []);
    } catch {
      setError("Couldn't load your jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(String(res.status));
      await load();
      refreshFrame();
    } catch {
      setError("Couldn't update that job. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function generate(item: Item) {
    setGeneratingId(item.id);
    setError(null);
    try {
      const resumeRes = await fetch("/api/generate/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: item.id }),
      });
      const resumeData = await resumeRes.json();
      if (!resumeRes.ok) {
        setError(resumeData.error || "Couldn't generate the resume. Try again.");
        return;
      }
      const coverRes = await fetch("/api/generate/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: item.id }),
      });
      const coverData = await coverRes.json();
      if (!coverRes.ok) {
        setError(coverData.error || "Couldn't generate the cover letter. Try again.");
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "drafted" } : i)));
      setReady({
        jobTitle: item.title,
        company: item.company,
        applyUrl: item.applyUrl,
        resumeBase64: resumeData.docxBase64,
        resumeFileName: resumeData.fileName,
        coverLetterBase64: coverData.docxBase64,
        coverLetterFileName: coverData.fileName,
      });
    } catch {
      setError("Something went wrong generating your materials. Try again.");
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div>
      <div className="page-intro">
        <h1>Interested</h1>
        <p>
          Generate your resume and cover letter, finish the application on the employer&apos;s own
          page, then mark it applied. Joby never submits for you.
        </p>
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="queue-muted">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="queue-empty">
          <p>No jobs waiting. Swipe right on a job to add it here.</p>
          <Link href="/dashboard" className="btn btn-primary">
            Start swiping
          </Link>
        </div>
      )}

      {items.map((item) => (
        <article className="queue-item" key={item.id}>
          <div className="queue-item-main">
            <div className="queue-item-title">
              {item.topPick && (
                <span className="queue-star" title="Top pick" aria-label="Top pick">
                  ★
                </span>
              )}
              {item.title}
            </div>
            <div className="queue-item-sub">
              {item.company}
              {item.location ? ` · ${item.location}` : ""}
              {item.remote ? " · Remote" : ""}
            </div>
            <div className="queue-item-meta">
              {item.matchScore}% match · {item.applyModeLabel} · {item.sourceLabel}
              {item.attribution ? ` · ${item.attribution}` : ""}
              {item.status === "drafted" ? " · Resume and cover letter generated" : ""}
            </div>
          </div>

          <div className="queue-item-actions">
            <button
              className="btn btn-primary btn-sm"
              disabled={generatingId === item.id}
              onClick={() => generate(item)}
            >
              <FileTextIcon width={15} height={15} />
              {generatingId === item.id
                ? "Generating..."
                : item.status === "drafted"
                ? "Regenerate resume + cover letter"
                : "Generate resume + cover letter"}
            </button>
            {item.applyEmail ? (
              <a className="btn btn-outline btn-sm" href={`mailto:${item.applyEmail}`}>
                Email them
              </a>
            ) : item.applyUrl ? (
              <a
                className="btn btn-outline btn-sm"
                href={item.applyUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open application
              </a>
            ) : (
              <span className="queue-muted">No apply link listed</span>
            )}
            <button
              className="btn btn-sm btn-green"
              disabled={busyId === item.id}
              onClick={() => setStatus(item.id, "applied")}
            >
              Mark as applied
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ color: "#b42318", borderColor: "#f3b3ab" }}
              disabled={busyId === item.id}
              onClick={() => setStatus(item.id, "rejected")}
            >
              Remove
            </button>
          </div>
        </article>
      ))}

      {applied.length > 0 && (
        <>
          <div className="list-section-title">Applied ({applied.length})</div>
          {applied.map((item) => (
            <article className="queue-item" key={item.id}>
              <div className="queue-item-main">
                <div className="queue-item-title">{item.title}</div>
                <div className="queue-item-sub">
                  {item.company}
                  {item.location ? ` · ${item.location}` : ""}
                </div>
                <div className="queue-item-meta">
                  <span className={`status-pill ${item.status}`}>
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>
              </div>
              <div className="queue-item-actions">
                {item.status === "applied" && (
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={busyId === item.id}
                    onClick={() => setStatus(item.id, "interview")}
                  >
                    Got an interview
                  </button>
                )}
                {item.status === "interview" && (
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={busyId === item.id}
                    onClick={() => setStatus(item.id, "offer")}
                  >
                    Got an offer
                  </button>
                )}
              </div>
            </article>
          ))}
        </>
      )}

      {ready && (
        <div className="modal-overlay" onClick={() => setReady(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Your materials are ready</h2>
              <button className="modal-close-btn" onClick={() => setReady(null)} aria-label="Close">
                &times;
              </button>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", marginBottom: 18 }}>
              Download both files, then apply for <strong>{ready.jobTitle}</strong> at{" "}
              <strong>{ready.company}</strong> using the button below and upload the resume and
              cover letter there.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ justifyContent: "flex-start" }}
                onClick={() => downloadBase64Docx(ready.resumeBase64, ready.resumeFileName)}
              >
                <DownloadIcon width={15} height={15} />
                Download resume ({ready.resumeFileName})
              </button>
              <button
                className="btn btn-outline btn-sm"
                style={{ justifyContent: "flex-start" }}
                onClick={() =>
                  downloadBase64Docx(ready.coverLetterBase64, ready.coverLetterFileName)
                }
              >
                <DownloadIcon width={15} height={15} />
                Download cover letter ({ready.coverLetterFileName})
              </button>
            </div>
            {ready.applyUrl ? (
              <a
                href={ready.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ width: "100%" }}
                onClick={() => setReady(null)}
              >
                Go to application page &rarr;
              </a>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                No application link on file for this posting. Apply directly with the employer.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
