"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { refreshFrame } from "../components/AppFrame";
import { CheckI, FileI } from "../components/jbicons";

interface ParsedProfile {
  fullName?: string;
  workExperience?: { employer: string; title: string }[];
  technicalSkills?: { name: string; items: string[] }[];
}

export default function ProfilePage() {
  const [pastedText, setPastedText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setHasResume(((data.profile?.workExperience || []).length || 0) > 0))
      .catch(() => {});
  }, []);

  async function handleSave() {
    setError(null);
    setStatus("saving");
    try {
      const res = await fetch("/api/profile/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong processing that.");
        setStatus("idle");
        return;
      }
      setParsed(data.profile);
      setStatus("done");
      refreshFrame();
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  const skillCount = parsed?.technicalSkills?.reduce((n, c) => n + c.items.length, 0) || 0;

  return (
    <div>
      <div className="jb-page-head">
        <h1>{hasResume ? "Update your resume" : "Add your resume"}</h1>
        <p>
          Paste your resume text, or your LinkedIn profile text, copied by hand or from LinkedIn&apos;s own data
          export. Joby only extracts what is written there, and your roles, years of service and skills appear
          in the sidebar.
        </p>
      </div>

      <div className="jb-panel">
        {status === "done" && parsed ? (
          <>
            <div className="jb-summary">
              <span className="jb-status-check">
                <CheckI width={14} height={14} />
              </span>
              <div>
                <b>{parsed.fullName || "Resume saved"}</b>
                <div className="jb-muted">
                  {parsed.workExperience?.length || 0} roles and {skillCount} skills found
                </div>
              </div>
            </div>
            <div className="jb-actions">
              <Link href="/dashboard" className="jb-btn jb-btn-primary">
                Go to dashboard
              </Link>
              <button
                className="jb-btn jb-btn-outline"
                onClick={() => {
                  setStatus("idle");
                  setParsed(null);
                  setPastedText("");
                }}
              >
                Paste something else
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="jb-panel-title">
              <span className="jb-ico-box">
                <FileI width={18} height={18} />
              </span>
              Resume text
            </h2>
            <p className="jb-panel-sub">One resume is all you need. Pasting a new one replaces the current one.</p>

            {error && <div className="jb-error">{error}</div>}

            <div className="jb-field">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste resume or LinkedIn profile text here..."
                aria-label="Resume text"
              />
            </div>
            <div className="jb-actions">
              <button
                className="jb-btn jb-btn-primary"
                disabled={status === "saving" || pastedText.trim().length < 40}
                onClick={handleSave}
              >
                {status === "saving" ? "Processing..." : "Save resume"}
              </button>
              <Link href="/dashboard" className="jb-muted">
                Skip for now
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="jb-trust">
        <span>Never invented. Only what you wrote</span>
        <span>You stay in control</span>
        <span>No LinkedIn scraping</span>
      </div>
    </div>
  );
}
