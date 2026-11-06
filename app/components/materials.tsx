"use client";

import { useState } from "react";
import { DownloadIcon } from "../icons";

export interface MaterialsTarget {
  id: string;
  title: string;
  company: string;
  applyUrl: string | null;
}

interface Ready extends MaterialsTarget {
  resumeBase64: string;
  resumeFileName: string;
  coverLetterBase64: string;
  coverLetterFileName: string;
}

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

/**
 * Generates the tailored resume and cover letter for one application and
 * returns a ready-made download modal. Shared by the Interested page and
 * the Generate Now card on the dashboard.
 */
export function useMaterials(onDone?: (id: string) => void) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<Ready | null>(null);

  async function generate(target: MaterialsTarget) {
    setGeneratingId(target.id);
    setError(null);
    try {
      const resumeRes = await fetch("/api/generate/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: target.id }),
      });
      const resumeData = await resumeRes.json();
      if (!resumeRes.ok) {
        setError(resumeData.error || "Couldn't generate the resume. Try again.");
        return;
      }
      const coverRes = await fetch("/api/generate/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: target.id }),
      });
      const coverData = await coverRes.json();
      if (!coverRes.ok) {
        setError(coverData.error || "Couldn't generate the cover letter. Try again.");
        return;
      }
      setReady({
        ...target,
        resumeBase64: resumeData.docxBase64,
        resumeFileName: resumeData.fileName,
        coverLetterBase64: coverData.docxBase64,
        coverLetterFileName: coverData.fileName,
      });
      onDone?.(target.id);
    } catch {
      setError("Something went wrong generating your materials. Try again.");
    } finally {
      setGeneratingId(null);
    }
  }

  const modal = ready ? (
    <div className="modal-overlay" onClick={() => setReady(null)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Your materials are ready</h2>
          <button className="modal-close-btn" onClick={() => setReady(null)} aria-label="Close">
            &times;
          </button>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", marginBottom: 18 }}>
          Download both files, then apply for <strong>{ready.title}</strong> at{" "}
          <strong>{ready.company}</strong> and upload them there.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          <button
            className="jb-btn jb-btn-outline"
            style={{ justifyContent: "flex-start" }}
            onClick={() => downloadBase64Docx(ready.resumeBase64, ready.resumeFileName)}
          >
            <DownloadIcon width={15} height={15} />
            Download resume ({ready.resumeFileName})
          </button>
          <button
            className="jb-btn jb-btn-outline"
            style={{ justifyContent: "flex-start" }}
            onClick={() => downloadBase64Docx(ready.coverLetterBase64, ready.coverLetterFileName)}
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
            className="jb-btn jb-btn-primary"
            style={{ width: "100%" }}
            onClick={() => setReady(null)}
          >
            Go to application page &rarr;
          </a>
        ) : (
          <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
            No application link on file. Apply directly with the employer.
          </div>
        )}
      </div>
    </div>
  ) : null;

  return { generate, generatingId, error, clearError: () => setError(null), modal };
}
