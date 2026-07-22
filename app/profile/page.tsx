"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  UploadIcon,
  ShieldIcon,
  UserCheckIcon,
  DatabaseIcon,
  CheckIcon,
} from "../icons";

interface ParsedProfile {
  fullName?: string;
  workExperience?: { employer: string; title: string }[];
  technicalSkills?: { name: string; items: string[] }[];
}

const TRUST_ITEMS = [
  { icon: ShieldIcon, title: "Never invented", sub: "Only what you wrote" },
  { icon: UserCheckIcon, title: "You stay in control", sub: "Review anytime" },
  { icon: DatabaseIcon, title: "No LinkedIn scraping", sub: "Ever" },
];

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
        setError(data.error || "Something went wrong processing that.");
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

  return (
    <div className="profile-shell">
      <header className="site-header">
        <div className="container site-header-inner">
          <div className="logo">
            <span className="logo-mark">J</span>
            <div className="logo-block">
              Joby
              <span className="powered-by">
                Powered by{" "}
                <a href="https://zerotouchai.com" target="_blank" rel="noreferrer">
                  ZeroTouchAI.com
                </a>
              </span>
            </div>
          </div>
          <nav className="site-nav">
            <div className="site-nav-actions">
              <Link href="/dashboard" className="btn btn-outline btn-sm">
                Dashboard
              </Link>
              <a
                href="#"
                className="btn btn-outline btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  signOut({ callbackUrl: "/" });
                }}
              >
                Log out
              </a>
            </div>
          </nav>
        </div>
      </header>

      <section className="profile-hero">
        <div className="container">
          <div className="eyebrow">Step 1</div>
          <h1>Add your resume</h1>
          <p>
            Paste your resume text, or your LinkedIn profile text, copied by
            hand or from LinkedIn&apos;s own data export. We only extract
            what&apos;s actually written here. Nothing is invented, and Joby
            never scrapes LinkedIn on your behalf.
          </p>
        </div>
      </section>

      <div className="profile-body">
        {status === "done" && parsed ? (
          <div className="profile-card">
            <div className="profile-card-icon">
              <CheckIcon width={22} height={22} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
              Resume saved
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 18 }}>
              Here&apos;s what we pulled out. You can refine it anytime.
            </p>

            <div className="profile-summary-stat">
              <UserCheckIcon width={20} height={20} style={{ color: "var(--color-primary)" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {parsed.fullName || "Name not detected"}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                  {parsed.workExperience?.length || 0} work experience entr
                  {parsed.workExperience?.length === 1 ? "y" : "ies"} found,{" "}
                  {parsed.technicalSkills?.reduce((n, c) => n + c.items.length, 0) || 0} skills found
                </div>
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
        ) : (
          <div className="profile-card">
            <div className="profile-card-icon">
              <UploadIcon width={22} height={22} />
            </div>

            {error && <div className="form-error">{error}</div>}

            <textarea
              className="profile-textarea"
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
                {status === "saving" ? "Processing..." : "Save resume"}
              </button>
              <Link href="/dashboard" style={{ fontSize: 13.5, color: "var(--color-text-muted)" }}>
                Skip for now
              </Link>
            </div>
          </div>
        )}

        <div className="profile-trust-grid">
          {TRUST_ITEMS.map(({ icon: Icon, title, sub }) => (
            <div className="profile-trust-item" key={title}>
              <Icon className="icon" />
              <div className="title">{title}</div>
              <div className="sub">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
