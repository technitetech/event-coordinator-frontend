"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../(public)/auth-actions";
import Frond from "../../components/Frond";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const res = await login({ email, password });
      if (!res.ok) { setError(res.error || "Incorrect email or password."); return; }
      if (res.role !== "admin") {
        setError("This account doesn't have admin access.");
        return;
      }
      router.push("/admin");
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
        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
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
