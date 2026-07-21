"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ParsedProfile {
  fullName?: string;
  workExperience?: { employer: string; title: string }[];
  technicalSkills?: { name: string; items: string[] }[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [pastedText, setPastedText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);

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
        setError(data.error || "Something went wrong parsing that.");
        setStatus("idle");
        return;
      }

      setParsed(data.profile);
      setStatus("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done" && parsed) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ maxWidth: 460 }}>
          <h1>Profile saved</h1>
          <p className="sub">Here&apos;s what we pulled out — you can refine it anytime.</p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              {parsed.fullName || "Name not detected"}
            </div>
            <div style={{ fontSize: 13.5, color: "var(--color-text-muted)" }}>
              {parsed.workExperience?.length || 0} work experience entr
              {parsed.workExperience?.length === 1 ? "y" : "ies"} ·{" "}
              {parsed.technicalSkills?.reduce((n, c) => n + c.items.length, 0) || 0} skills
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", marginBottom: 10 }}
            onClick={() => router.push("/dashboard")}
          >
            Go to dashboard
          </button>
          <button
            className="btn btn-outline"
            style={{ width: "100%" }}
            onClick={() => {
              setStatus("idle");
              setParsed(null);
              setPastedText("");
            }}
          >
            Paste something else instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 640, margin: "3rem auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Your profile</h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: 14.5, marginBottom: 20 }}>
        Paste your resume text, or your LinkedIn profile text (copied by hand,
        or from LinkedIn&apos;s own data export — Joby never scrapes LinkedIn
        on your behalf). We only extract what&apos;s actually written here —
        nothing is invented.
      </p>

      {error && <div className="form-error">{error}</div>}

      <textarea
        style={{
          width: "100%",
          height: 320,
          padding: 12,
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          fontFamily: "inherit",
          fontSize: 14,
          marginBottom: 12,
        }}
        value={pastedText}
        onChange={(e) => setPastedText(e.target.value)}
        placeholder="Paste resume or LinkedIn profile text here..."
      />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          className="btn btn-primary"
          disabled={status === "saving" || pastedText.trim().length < 40}
          onClick={handleSave}
        >
          {status === "saving" ? "Parsing..." : "Save profile"}
        </button>
        <Link href="/dashboard" style={{ fontSize: 13.5, color: "var(--color-text-muted)" }}>
          Skip for now
        </Link>
      </div>
    </main>
  );
}
