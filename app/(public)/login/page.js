"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "../auth-actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e?.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedPass  = password.trim();
    if (!trimmedEmail || !trimmedPass) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const res = await login({ email: trimmedEmail, password: trimmedPass });
      if (!res.ok) { setError(res.error); return; }
      router.push(res.role === "admin" ? "/admin" : "/account");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">St. Lachland Hotel</span>
        <h1 className="display">Welcome back</h1>
        <p>Sign in to manage your bookings.</p>

        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              required
              autoFocus
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={72}
              required
              autoComplete="current-password"
            />
          </div>
        </form>

        {error && <div className="err">{error}</div>}

        <button className="btn btn-solid" onClick={submit} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="auth-switch">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
