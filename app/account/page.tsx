"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { refreshFrame } from "../components/AppFrame";

export default function AccountPage() {
  const { data: session } = useSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
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
        setAddress(a.address || "");
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
        body: JSON.stringify({ firstName, lastName, address, city, phone, linkedinUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong saving that.");
        return;
      }
      setSaved(true);
      refreshFrame();
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="jb-page-head">
        <h1>Your Profile</h1>
        <p>These details fill in the header of your resume and cover letter when Joby generates them.</p>
      </div>

      <div className="jb-panel">
        {loading ? (
          <div className="jb-muted">Loading...</div>
        ) : (
          <>
            {error && <div className="jb-error">{error}</div>}
            {saved && <div className="jb-notice">Saved.</div>}

            <div className="jb-form-grid">
              <div className="jb-field">
                <label htmlFor="firstName">First name</label>
                <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="jb-field">
                <label htmlFor="lastName">Last name</label>
                <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>

              <div className="jb-field full">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address (optional)"
                />
              </div>

              <div className="jb-field">
                <label htmlFor="city">City</label>
                <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Scarborough" />
              </div>
              <div className="jb-field">
                <label htmlFor="phone">Phone number</label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="jb-field">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" value={session?.user?.email || ""} disabled />
                <div className="jb-hint">This is the email you log in with.</div>
              </div>
              <div className="jb-field">
                <label htmlFor="linkedinUrl">LinkedIn ID</label>
                <input
                  id="linkedinUrl"
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/yourname"
                />
              </div>
            </div>

            <div className="jb-actions">
              <button className="jb-btn jb-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
