"use client";

import { useState } from "react";
import Link from "next/link";
import Frond from "../../components/Frond";
import { createReservation } from "./actions";

// The rule engine lives in the Flask backend. Set NEXT_PUBLIC_API_URL if it
// runs somewhere other than the default.
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "conference", label: "Conference" },
  { value: "birthday", label: "Birthday" },
  { value: "dinner", label: "Gala Dinner" },
];
const THEMES = [
  { value: "floral", label: "Floral" },
  { value: "modern", label: "Modern" },
  { value: "tropical", label: "Tropical" },
  { value: "classic", label: "Classic Gold" },
];

const fmt = (n) => "LKR " + Number(n).toLocaleString();

export default function EventPlanner({ loggedIn, customerName }) {
  const [form, setForm] = useState({
    event_type: "wedding", guests: 100, budget: 350000, theme: "floral", event_date: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [reserveError, setReserveError] = useState(null);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // --- Plan: call the Flask rule engine (must be running on port 5000) ---
  const plan = async () => {
    setLoading(true); setError(null); setResult(null);
    setReserved(false); setReserveError(null);
    try {
      const res = await fetch(`${API}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: form.event_type,
          theme: form.theme,
          guests: Number(form.guests),
          budget: Number(form.budget),
          event_date: form.event_date || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (e) {
      setError("Couldn't reach the coordinator service. Make sure the Flask backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  // --- Reserve: saved in Next.js (MySQL) for the logged-in customer ---
  const reserve = async () => {
    setReserving(true); setReserveError(null);
    try {
      const payload = {
        event_type: form.event_type,
        event_date: form.event_date,
        guests: Number(form.guests),
        budget: Number(form.budget),
        theme: form.theme,
        total_cost: result.total_cost,
        venue_name: result.venue.name,
        menu_name: result.menu.name,
        decoration_name: result.decoration.name,
      };
      const res = await createReservation(payload);
      if (res.ok) setReserved(true);
      else setReserveError(res.error);
    } catch (e) {
      setReserveError("Couldn't complete the reservation. Please try again.");
    } finally {
      setReserving(false);
    }
  };

  return (
    <main>
      <section className="tool-hero">
        <div className="wrap">
          <span className="eyebrow">AI Event Coordinator</span>
          <h1 className="display">Let&rsquo;s plan your celebration.</h1>
          <p>Tell us about your event and the coordinator will recommend a venue, menu, and décor to suit your guest count and budget — then reserve it in a click.</p>
        </div>
      </section>

      <section className="tool-body">
        <div className="wrap tool-grid">
          {/* Form */}
          <div className="form-card">
            <h2>Event details</h2>
            <div className="f-grid">
              <div className="field">
                <label htmlFor="event_type">Event type</label>
                <select id="event_type" value={form.event_type} onChange={update("event_type")}>
                  {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="theme">Theme</label>
                <select id="theme" value={form.theme} onChange={update("theme")}>
                  {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="guests">Guests</label>
                <input id="guests" type="number" min="1" max="500" value={form.guests} onChange={update("guests")} />
              </div>
              <div className="field">
                <label htmlFor="budget">Budget <span className="opt">(LKR)</span></label>
                <input id="budget" type="number" min="0" step="10000" value={form.budget} onChange={update("budget")} />
              </div>
              <div className="field wide">
                <label htmlFor="event_date">Event date <span className="opt">· required to reserve</span></label>
                <input id="event_date" type="date" value={form.event_date} onChange={update("event_date")} />
              </div>
            </div>
            <button className="btn btn-solid" onClick={plan} disabled={loading}>
              {loading ? "Planning…" : "Plan my event"}
            </button>
            {error && <div className="err">{error}</div>}
          </div>

          {/* Result + reserve */}
          <div className="result-wrap">
            {!result && !loading && (
              <div className="empty-state">
                <div className="frond-deco"><Frond stroke="currentColor" /></div>
                <p>Your estimate will appear here once you plan an event.</p>
              </div>
            )}

            {result && (
              <div className="slip">
                <div className="slip-head">
                  <h3>Your estimate</h3>
                  <span className={`verdict ${result.within_budget ? "ok" : "over"}`}>
                    <span className="dot" />{result.within_budget ? "Within budget" : "Over budget"}
                  </span>
                </div>

                <div className="li">
                  <div><div className="li-name">{result.venue.name}</div><div className="li-sub">Venue hire</div></div>
                  <div className="li-cost">{fmt(result.venue.cost)}</div>
                </div>
                <div className="li">
                  <div><div className="li-name">{result.menu.name}</div><div className="li-sub">{fmt(result.menu.price_per_head)} × {result.guests} guests</div></div>
                  <div className="li-cost">{fmt(result.menu.cost)}</div>
                </div>
                <div className="li">
                  <div><div className="li-name">{result.decoration.name}</div><div className="li-sub">Decoration</div></div>
                  <div className="li-cost">{fmt(result.decoration.cost)}</div>
                </div>
                <div className="slip-total">
                  <span className="lbl">Total estimate</span>
                  <span className="val">{fmt(result.total_cost)}</span>
                </div>

                {(result.warnings?.length > 0 || result.suggestions?.length > 0) && (
                  <div className="notices">
                    {result.warnings?.map((w, i) => <div key={`w${i}`} className="notice warn">{w}</div>)}
                    {result.suggestions?.map((s, i) => <div key={`s${i}`} className="notice tip">{s}</div>)}
                  </div>
                )}

                {/* Reserve area */}
                <div className="reserve-area">
                  {reserved ? (
                    <div className="reserve-done">
                      <strong>Reservation requested 🎉</strong>
                      <p>Thanks{customerName ? `, ${customerName.split(" ")[0]}` : ""} — your event is pending confirmation. You can view it in your account.</p>
                      <Link href="/account" className="btn btn-ghost">View my bookings</Link>
                    </div>
                  ) : !loggedIn ? (
                    <div className="reserve-login">
                      <p>Please sign in to reserve this event.</p>
                      <div className="reserve-actions">
                        <Link href="/login" className="btn btn-solid">Sign in</Link>
                        <Link href="/register" className="btn btn-ghost">Create account</Link>
                      </div>
                    </div>
                  ) : !form.event_date ? (
                    <div className="reserve-note">Add an <strong>event date</strong> above and plan again to reserve.</div>
                  ) : (
                    <>
                      <button className="btn btn-gold reserve-btn" onClick={reserve} disabled={reserving}>
                        {reserving ? "Reserving…" : "Reserve this event"}
                      </button>
                      {reserveError && <div className="err">{reserveError}</div>}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
