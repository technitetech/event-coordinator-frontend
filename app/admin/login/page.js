"use client";

import { useState } from "react";
import { login } from "../../(public)/auth-actions";
import Frond from "../../components/Frond";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedPass  = password;
    if (!trimmedEmail || !trimmedPass) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const res = await login({ email: trimmedEmail, password: trimmedPass });
      if (!res.ok) { setError(res.error || "Incorrect email or password."); return; }
      if (res.role !== "admin") {
        setError("This account doesn't have admin access.");
        return;
      }
      // Hard navigation so the server layout sees the freshly-set session cookie.
      window.location.href = "/admin";
    } catch (e) {
      setError("Something went wrong. Is the app running correctly?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ad-login">
      <div className="ad-login-frond"><Frond stroke="#d6bb6e" /></div>
      <div className="ad-login-card">
        <span className="brand-mark">SL</span>
        <h1 className="display">Admin access</h1>
        <p>Sign in to manage St. Lachland&rsquo;s data.</p>
        <form onSubmit={submit} noValidate style={{ display: "contents" }}>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
            autoFocus
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={72}
            required
            autoComplete="current-password"
          />
        </form>
        {error && <div className="ad-error">{error}</div>}
        <button className="btn btn-solid" onClick={submit} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="ad-hint">
          No admin account yet? Run <code>npm run create-admin</code> once (see README).
        </p>
      </div>
    </div>
  );
}
