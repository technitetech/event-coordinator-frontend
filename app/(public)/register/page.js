"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerCustomer } from "../auth-actions";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^\+?[\d\s\-]{7,20}$/;

  const submit = async (e) => {
    e?.preventDefault();
    setError(null);

    const name  = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const pw    = form.password;
    const conf  = form.confirm;

    if (!name)  return setError("Please enter your full name.");
    if (name.length > 100) return setError("Name must not exceed 100 characters.");
    if (!email) return setError("Please enter your email address.");
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email address.");
    if (phone && !PHONE_RE.test(phone)) return setError("Phone number format is invalid (digits, spaces, hyphens, optional leading +).");
    if (!pw)    return setError("Please choose a password.");
    if (pw.length < 8)  return setError("Password must be at least 8 characters.");
    if (pw.length > 72) return setError("Password must not exceed 72 characters.");
    if (pw !== conf)    return setError("Passwords don't match.");

    setBusy(true);
    try {
      const res = await registerCustomer({ name, email, phone: phone || "", password: pw });
      if (res.ok) router.push("/account");
      else setError(res.error);
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
        <h1 className="display">Create an account</h1>
        <p>Register to book stays and events, and track your reservations.</p>

        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              value={form.name}
              onChange={update("name")}
              maxLength={100}
              required
              autoFocus
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={update("email")}
              maxLength={254}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-phone">Phone <span className="hint">(optional)</span></label>
            <input
              id="reg-phone"
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              maxLength={20}
              placeholder="+94 77 123 4567"
              autoComplete="tel"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              value={form.password}
              onChange={update("password")}
              minLength={8}
              maxLength={72}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-confirm">Confirm password</label>
            <input
              id="reg-confirm"
              type="password"
              value={form.confirm}
              onChange={update("confirm")}
              maxLength={72}
              required
              autoComplete="new-password"
            />
          </div>
        </form>

        {error && <div className="err">{error}</div>}

        <button className="btn btn-solid" onClick={submit} disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
