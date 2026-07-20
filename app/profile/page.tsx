"use client";

import { useState } from "react";

/**
 * MVP profile intake: paste resume text or LinkedIn profile text into a
 * textarea. A real implementation should call an LLM-backed parser
 * (reusing the Anthropic client pattern from lib/engine/generateResume.ts)
 * to convert the pasted text into the structured Profile shape before
 * saving — that parsing step is intentionally left as a TODO here so the
 * scaffold stays reviewable; wire it to POST /api/profile once built.
 */
export default function ProfilePage() {
  const [pastedText, setPastedText] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSave() {
    setStatus("Parsing not yet wired up in this scaffold — see comment in app/profile/page.tsx.");
    // TODO: POST pastedText to a parsing endpoint that returns a
    // validated Profile object, then PUT it to /api/profile.
  }

  return (
    <main style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Your profile</h1>
      <p>
        Paste your resume text, or your LinkedIn profile text (copied by hand,
        or from LinkedIn&apos;s own data export — Groundwork never scrapes
        LinkedIn on your behalf).
      </p>
      <textarea
        style={{ width: "100%", height: 300 }}
        value={pastedText}
        onChange={(e) => setPastedText(e.target.value)}
        placeholder="Paste resume or LinkedIn profile text here..."
      />
      <div>
        <button onClick={handleSave}>Save</button>
      </div>
      {status && <p>{status}</p>}
    </main>
  );
}
