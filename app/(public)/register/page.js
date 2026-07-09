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

  const submit = async () => {
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await registerCustomer(form);
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

        <div className="auth-form">
          <div className="field">
            <label>Full name</label>
            <input value={form.name} onChange={update("name")} autoFocus />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={update("email")} />
          </div>
          <div className="field">
            <label>Phone <span className="hint">(optional)</span></label>
            <input value={form.phone} onChange={update("phone")} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={update("password")} />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={update("confirm")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
        </div>

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
