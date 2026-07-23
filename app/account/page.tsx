"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AppHeader from "../components/AppHeader";

export default function AccountPage() {
  const { data: session } = useSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        const a = data.account;
        if (!a) return;
        const parts = (a.fullName || "").split(" ").filter(Boolean);
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setHeadline(a.headline || "");
        setYearsExperience(a.yearsExperience || "");
        setCity(a.location || "");
        setPhone(a.phone || "");
        setLinkedinUrl(a.linkedinUrl || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          headline,
          yearsExperience,
          city,
          phone,
          linkedinUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong saving that.");
        return;
      }

      setSaved(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-shell">
      <AppHeader active="dashboard" />

      <section className="profile-hero">
        <div className="container">
          <div className="eyebrow">Your details</div>
          <h1>Profile</h1>
          <p>
            These details get used to fill in your resume and cover letter
            headers when we generate them for you.
          </p>
        </div>
      </section>

      <div className="profile-body">
        <div className="profile-card">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {error && <div className="form-error">{error}</div>}
              {saved && (
                <div
                  style={{
                    background: "var(--color-primary-soft)",
                    color: "var(--color-primary)",
                    fontSize: 13,
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  Saved.
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="headline">Field / classification</label>
                <input
                  id="headline"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. AI & Automation, Data Center"
                />
              </div>

              <div className="field">
                <label htmlFor="yearsExperience">Years of experience</label>
                <input
                  id="yearsExperience"
                  type="text"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="e.g. 2 years"
                />
              </div>

              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  style={{ background: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}
                />
                <div className="field-hint">This is the email you log in with.</div>
              </div>

              <div className="field">
                <label htmlFor="linkedinUrl">LinkedIn URL</label>
                <input
                  id="linkedinUrl"
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/yourname"
                />
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
