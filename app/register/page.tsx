"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "../components/AuthShell";
import { ArrowIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "../components/authicons";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong creating your account.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (result?.error) {
        router.push("/login");
        return;
      }
      router.push("/profile");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create Your Account" subtitle="Start finding jobs across Canada">
      <form onSubmit={handleSubmit} className="au-form">
        {error && <div className="au-error">{error}</div>}

        <label className="au-field">
          <MailIcon />
          <input
            type="email"
            placeholder="Email Address"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label className="au-field">
          <LockIcon />
          <input
            type={show ? "text" : "password"}
            placeholder="Password (at least 8 characters)"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="au-eye"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </label>

        <button type="submit" className="au-submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"} {!loading && <ArrowIcon />}
        </button>

        <p className="au-switch">
          Already have an account? <Link href="/login">Sign In</Link>
        </p>
      </form>
    </AuthShell>
  );
}
