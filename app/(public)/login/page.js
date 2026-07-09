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

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const res = await login({ email, password });
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

        <div className="auth-form">
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
        </div>

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
