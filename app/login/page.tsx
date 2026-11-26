"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "../components/AuthShell";
import { ArrowIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "../components/authicons";

export default function LoginPage() {
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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("That email and password don't match. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to continue your job search">
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
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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
          {loading ? "Signing in..." : "Sign In"} {!loading && <ArrowIcon />}
        </button>

        <p className="au-switch">
          Don&apos;t have an account? <Link href="/register">Sign Up</Link>
        </p>
      </form>
    </AuthShell>
  );
}
