"use client";

import { useEffect, useState } from "react";

interface EditProfileModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProfileModal({ onClose, onSaved }: EditProfileModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setEmail(a.email || "");
        setLinkedinUrl(a.linkedinUrl || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
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
          email,
          linkedinUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong saving that.");
        setSaving(false);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit profile</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {error && <div className="form-error">{error}</div>}

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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

            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
