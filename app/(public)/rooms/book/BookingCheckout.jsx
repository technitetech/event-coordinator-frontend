"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bookRoom, checkRoomAvailability } from "../actions";
import {
  Calendar, Users, CheckCircle2, Shield, ArrowRight, ArrowLeft,
  BedDouble, Star, Check, Minus, Plus, AlertCircle, Lock,
} from "lucide-react";

const LOCAL_IMGS = {
  "deluxe-garden":   "/images/venue-garden.jpg",
  "deluxe-mountain": "/images/venue-spa.jpg",
  "junior-suite":    "/images/venue-dining.jpg",
  "grand-suite":     "/images/venue-ballroom.jpg",
  "heritage-villa":  "/images/venue-grand-hall.jpg",
};

const fmt = n => `LKR ${Number(n).toLocaleString()}`;

const fmtDate = s => {
  if (!s) return "—";
  return new Date(s + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

function GuestStepper({ label, hint, value, min, max, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f0ede9" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1c1917" }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{ width: 32, height: 32, border: "1.5px solid #e7e5e4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: value <= min ? "#f5f5f4" : "#fff", cursor: value <= min ? "not-allowed" : "pointer", color: value <= min ? "#d6d3d1" : "#1c1917", transition: "all .12s" }}>
          <Minus size={14} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#1c1917", minWidth: 24, textAlign: "center" }}>{value}</span>
        <button type="button" disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{ width: 32, height: 32, border: "1.5px solid #e7e5e4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: value >= max ? "#f5f5f4" : "#fff", cursor: value >= max ? "not-allowed" : "pointer", color: value >= max ? "#d6d3d1" : "#1c1917", transition: "all .12s" }}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function DateInput({ id, label, value, min, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <label htmlFor={id} style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#78716c", marginBottom: 8 }}>
        <Calendar size={12} style={{ display: "inline", marginRight: 5 }} />{label}
      </label>
      <input id={id} type="date" value={value} min={min}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e7e5e4", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#1c1917", background: "#fff", outline: "none", boxSizing: "border-box", cursor: "pointer" }}
        onFocus={e => e.target.style.borderColor = "var(--emerald, #1A3C34)"}
        onBlur={e => e.target.style.borderColor = "#e7e5e4"}
      />
    </div>
  );
}

export default function BookingCheckout({ roomTypes, initialRoomTypeId, initialCheckIn, initialCheckOut, session }) {
  const router = useRouter();

  const [selectedRoomId, setSelectedRoomId] = useState(
    initialRoomTypeId ? Number(initialRoomTypeId) : (roomTypes[0]?.id || 1)
  );

  const tomorrow      = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter      = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
  const todayStr      = new Date().toISOString().split("T")[0];

  const [checkIn,  setCheckIn]  = useState(initialCheckIn  || tomorrow.toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState(initialCheckOut || dayAfter.toISOString().split("T")[0]);
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);
  const [requests, setRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [confirmed,  setConfirmed]  = useState(null);

  const [availCount,    setAvailCount]    = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  useEffect(() => {
    if (!checkIn || !checkOut) { setAvailCount(null); return; }
    const ci = new Date(checkIn); const co = new Date(checkOut);
    ci.setHours(0,0,0,0); co.setHours(0,0,0,0);
    if (co <= ci) { setAvailCount(null); return; }
    let active = true;
    setCheckingAvail(true); setAvailCount(null);
    checkRoomAvailability(checkIn, checkOut).then(avail => {
      if (!active) return;
      const slug = roomTypes.find(r => r.id === Number(selectedRoomId))?.slug;
      setAvailCount(slug ? (avail[slug]?.available ?? null) : null);
      setCheckingAvail(false);
    }).catch(() => { if (active) setCheckingAvail(false); });
    return () => { active = false; };
  }, [checkIn, checkOut, selectedRoomId, roomTypes]);

  const selectedRoom = roomTypes.find(r => r.id === Number(selectedRoomId)) || roomTypes[0];
  const roomThumb    = (() => {
    const db = Array.isArray(selectedRoom?.images_json) ? selectedRoom.images_json.filter(Boolean)[0] : null;
    return db || LOCAL_IMGS[selectedRoom?.slug] || Object.values(LOCAL_IMGS)[0];
  })();

  const ci    = new Date(checkIn);  ci.setHours(0,0,0,0);
  const co    = new Date(checkOut); co.setHours(0,0,0,0);
  const nights   = Math.round((co - ci) / 86400000);
  const validDates = nights >= 1;

  const maxOcc    = selectedRoom?.max_occupancy || 6;
  const effAdults = Math.min(adults, maxOcc);
  const effChild  = Math.min(children, Math.max(0, maxOcc - effAdults));

  const rate        = Number(selectedRoom?.base_rate_per_night || 0);
  const subtotal    = validDates ? rate * nights : 0;
  const taxGov      = validDates ? Math.round(subtotal * 0.05) : 0;
  const svcCharge   = validDates ? Math.round(subtotal * 0.10) : 0;
  const total       = subtotal + taxGov + svcCharge;

  const minCO = (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })();

  const handleCheckInChange = v => {
    setCheckIn(v);
    const ciD = new Date(v); ciD.setDate(ciD.getDate() + 1);
    const minCOStr = ciD.toISOString().split("T")[0];
    if (checkOut <= v) setCheckOut(minCOStr);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!session) {
      router.push(`/login?next=/rooms/book?roomTypeId=${selectedRoomId}&checkIn=${checkIn}&checkOut=${checkOut}`);
      return;
    }
    setError(null);
    const today = new Date(); today.setHours(0,0,0,0);
    if (ci < today)     { setError("Check-in date cannot be in the past."); return; }
    if (co <= ci)       { setError("Check-out must be at least one night after check-in."); return; }
    if (nights > 30)    { setError("Stays are limited to 30 nights. Contact us for extended arrangements."); return; }
    if (requests.length > 1000) { setError("Special requests must not exceed 1000 characters."); return; }
    setSubmitting(true);
    try {
      const res = await bookRoom({ roomTypeId: selectedRoomId, checkIn, checkOut, guestsAdult: effAdults, guestsChild: effChild, specialRequests: requests });
      if (res.ok) setConfirmed(res.booking);
      else setError(res.error || "Failed to complete reservation.");
    } catch (err) { setError(err.message || "An unexpected error occurred."); }
    finally { setSubmitting(false); }
  };

  /* ── Confirmation screen ── */
  if (confirmed) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 24, padding: "48px 40px", textAlign: "center", boxShadow: "0 16px 60px rgba(0,0,0,.08)" }}>
          <div style={{ width: 72, height: 72, background: "rgba(26,60,52,.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--emerald, #1A3C34)" }}>
            <CheckCircle2 size={40} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--emerald)" }}>Reservation Confirmed</span>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1c1917", margin: "10px 0 8px" }}>We Look Forward to Welcoming You</h2>
          <p style={{ fontSize: 14, color: "#78716c", margin: "0 0 24px" }}>Your reservation has been confirmed with code:</p>
          <div style={{ display: "inline-block", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "14px 28px", fontFamily: "monospace", fontSize: 22, fontWeight: 900, color: "var(--emerald, #1A3C34)", letterSpacing: ".12em", marginBottom: 32 }}>
            {confirmed.confirmation_code}
          </div>
          <div style={{ background: "#f9f8f6", border: "1px solid #f0ede9", borderRadius: 14, padding: "20px 24px", marginBottom: 32, textAlign: "left" }}>
            {[
              ["Sanctuary",   selectedRoom?.name],
              ["Check-in",    fmtDate(confirmed.check_in_date)],
              ["Check-out",   fmtDate(confirmed.check_out_date)],
              ["Duration",    `${confirmed.nights} night${confirmed.nights > 1 ? "s" : ""}`],
              ["Party",       `${effAdults} Adult${effAdults > 1 ? "s" : ""}${effChild > 0 ? `, ${effChild} Child${effChild > 1 ? "ren" : ""}` : ""}`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px dashed #e7e5e4", fontSize: 13 }}>
                <span style={{ color: "#78716c" }}>{label}</span>
                <span style={{ fontWeight: 600, color: "#1c1917" }}>{val}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, fontSize: 16 }}>
              <span style={{ fontWeight: 700, color: "var(--emerald)" }}>Total Investment</span>
              <span style={{ fontWeight: 900, color: "var(--emerald)", fontFamily: "serif" }}>{fmt(confirmed.total_amount)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/account" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", background: "var(--emerald, #1A3C34)", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              View in My Portal
            </Link>
            <Link href="/rooms" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", border: "1.5px solid #e7e5e4", color: "#44403c", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              Explore More Rooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Booking form ── */
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Back link */}
      <Link href="/rooms" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#78716c", textDecoration: "none", marginBottom: 28, fontWeight: 500 }}>
        <ArrowLeft size={15} /> Back to Rooms
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>

        {/* ── Left: Form ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Header */}
          <div style={{ background: "var(--emerald, #1A3C34)", borderRadius: "20px 20px 0 0", padding: "32px 36px", color: "#fff" }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", opacity: .7 }}>Stay Reservation</span>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, margin: "8px 0 6px", lineHeight: 1.2 }}>Complete Your Sanctuary Booking</h1>
            <p style={{ fontSize: 13, opacity: .75, margin: 0 }}>Direct booking guarantees the best rates and exclusive estate privileges.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #e7e5e4", borderTop: "none", borderRadius: "0 0 20px 20px", padding: "32px 36px", display: "flex", flexDirection: "column", gap: 32 }}>
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, fontSize: 13, color: "#991b1b" }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {/* Room selector */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#78716c", marginBottom: 12 }}>
                Select Room Type
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {roomTypes.map(rt => {
                  const thumb = (() => { const db = Array.isArray(rt.images_json) ? rt.images_json.filter(Boolean)[0] : null; return db || LOCAL_IMGS[rt.slug] || Object.values(LOCAL_IMGS)[0]; })();
                  const sel = rt.id === Number(selectedRoomId);
                  return (
                    <button key={rt.id} type="button" onClick={() => setSelectedRoomId(rt.id)}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `2px solid ${sel ? "var(--emerald, #1A3C34)" : "#e7e5e4"}`, borderRadius: 12, background: sel ? "rgba(26,60,52,.04)" : "#fff", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                      <img src={thumb} alt={rt.name} style={{ width: 60, height: 46, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>{rt.name}</div>
                        <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>Max {rt.max_occupancy} guests{rt.size_sqm ? ` · ${rt.size_sqm} m²` : ""}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: sel ? "var(--emerald, #1A3C34)" : "#1c1917" }}>{fmt(rt.base_rate_per_night)}</div>
                        <div style={{ fontSize: 11, color: "#a8a29e" }}>/ night</div>
                      </div>
                      {sel && <Check size={16} style={{ color: "var(--emerald, #1A3C34)", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#78716c", marginBottom: 12 }}>
                Your Stay Dates
              </label>
              <div style={{ display: "flex", gap: 12 }}>
                <DateInput id="checkin_date"  label="Check-In"  value={checkIn}  min={todayStr} onChange={handleCheckInChange} />
                <DateInput id="checkout_date" label="Check-Out" value={checkOut} min={minCO}    onChange={setCheckOut} />
              </div>

              {/* Availability status */}
              {validDates && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: checkingAvail ? "#f5f5f4" : availCount === 0 ? "#fef2f2" : availCount > 0 ? "rgba(26,60,52,.06)" : "#f5f5f4",
                  color: checkingAvail ? "#a8a29e" : availCount === 0 ? "#991b1b" : availCount > 0 ? "var(--emerald, #1A3C34)" : "#a8a29e",
                }}>
                  {checkingAvail ? "Checking availability…" :
                   availCount === 0 ? "⚠ No availability for these dates — please try different dates." :
                   availCount > 0  ? `✓ ${availCount} room${availCount > 1 ? "s" : ""} available for your selected dates.` :
                   "Select valid dates to check availability."}
                </div>
              )}
            </div>

            {/* Guests */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#78716c", marginBottom: 4 }}>
                Guests
              </label>
              <div style={{ background: "#f9f8f6", border: "1px solid #f0ede9", borderRadius: 12, padding: "0 16px" }}>
                <GuestStepper label="Adults" hint="Ages 13+" value={effAdults} min={1} max={maxOcc} onChange={v => { setAdults(v); setChildren(c => Math.min(c, Math.max(0, maxOcc - v))); }} />
                <GuestStepper label="Children" hint="Ages 2–12" value={effChild} min={0} max={Math.max(0, maxOcc - effAdults)} onChange={setChildren} />
              </div>
              <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 6 }}>
                Maximum occupancy: {maxOcc} guests total for {selectedRoom?.name}
              </div>
            </div>

            {/* Special requests */}
            <div>
              <label htmlFor="requests" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#78716c", marginBottom: 8 }}>
                <span>Special Preferences</span>
                <span style={{ fontWeight: 400, fontSize: 11, color: "#a8a29e" }}>{requests.length}/1000</span>
              </label>
              <textarea id="requests" rows={3} value={requests} maxLength={1000}
                onChange={e => setRequests(e.target.value.slice(0, 1000))}
                placeholder="E.g. dietary requirements, early check-in request, special occasion setup, bed preference…"
                style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e7e5e4", borderRadius: 10, fontSize: 13, color: "#1c1917", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = "var(--emerald, #1A3C34)"}
                onBlur={e => e.target.style.borderColor = "#e7e5e4"}
              />
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting || availCount === 0}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px 24px", background: (submitting || availCount === 0) ? "#a8a29e" : "var(--emerald, #1A3C34)", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: submitting || availCount === 0 ? "not-allowed" : "pointer", transition: "opacity .15s" }}
              onMouseEnter={e => { if (!submitting && availCount !== 0) e.currentTarget.style.opacity = ".88"; }}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {submitting ? "Confirming Reservation…" : session ? <>Confirm & Reserve Stay <ArrowRight size={18} /></> : <>Sign In to Complete <ArrowRight size={18} /></>}
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "#a8a29e" }}>
              <Lock size={12} /> Secure reservation · No payment required now
            </div>
          </form>
        </div>

        {/* ── Right: Sticky summary ── */}
        <div style={{ position: "sticky", top: 96, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Room preview card */}
          <div style={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.07)" }}>
            <div style={{ position: "relative", height: 180 }}>
              <img src={roomThumb} alt={selectedRoom?.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.5) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,.4)" }}>{selectedRoom?.name}</div>
                {selectedRoom?.tagline && <div style={{ fontSize: 11, color: "rgba(255,255,255,.8)", marginTop: 2 }}>{selectedRoom.tagline}</div>}
              </div>
            </div>

            <div style={{ padding: "20px 20px 4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: "#78716c" }}>Nightly Rate</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--emerald, #1A3C34)" }}>{fmt(rate)}</span>
              </div>

              {/* Date summary */}
              {validDates && (
                <div style={{ background: "#f9f8f6", border: "1px solid #f0ede9", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#78716c", marginBottom: 6 }}>
                    <span>{fmtDate(checkIn)}</span>
                    <span>→</span>
                    <span>{fmtDate(checkOut)}</span>
                  </div>
                  <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#1c1917" }}>
                    {nights} night{nights > 1 ? "s" : ""} · {effAdults + effChild} guest{effAdults + effChild > 1 ? "s" : ""}
                  </div>
                </div>
              )}

              {/* Price breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[
                  [`${fmt(rate)} × ${validDates ? nights : "—"} nights`, validDates ? fmt(subtotal) : "—"],
                  ["Govt. Tourism Levy (5%)", validDates ? fmt(taxGov) : "—"],
                  ["Service Charge (10%)", validDates ? fmt(svcCharge) : "—"],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#78716c" }}>
                    <span>{label}</span><span>{val}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "var(--emerald, #1A3C34)", paddingTop: 10, borderTop: "2px solid #f0ede9", marginTop: 4 }}>
                  <span>Estimated Total</span>
                  <span>{validDates ? fmt(total) : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div style={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#78716c", marginBottom: 12 }}>St. Lachland Guarantee</div>
            {[
              [<Shield size={14} />, "Instant confirmation"],
              [<Check size={14} />,  "No upfront payment required"],
              [<Star size={14} />,   "Best rate direct guarantee"],
              [<Lock size={14} />,   "Secure encrypted reservation"],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#57534e", padding: "5px 0" }}>
                <span style={{ color: "var(--emerald, #1A3C34)" }}>{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
