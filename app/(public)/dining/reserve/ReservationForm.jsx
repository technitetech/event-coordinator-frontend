"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { makeReservation, fetchTimeSlots, placeOrder } from "../actions";
import { Calendar, Clock, Users, CheckCircle2, Shield, Utensils, ShoppingBag, X } from "lucide-react";

export default function ReservationForm({ session, initialDate, initialCovers }) {
  const router = useRouter();

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const [date, setDate] = useState(initialDate || todayStr);
  const [covers, setCovers] = useState(initialCovers ? Number(initialCovers) : 2);
  const [timeSlot, setTimeSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [occasion, setOccasion] = useState("Casual Dining");
  const [dietary, setDietary] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedRes, setConfirmedRes] = useState(null);

  // Pre-order state (cart carried over from the menu browser via localStorage)
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState(null);
  const [orderPlacementError, setOrderPlacementError] = useState(null);

  // Read cart from localStorage on mount (persisted by MenuBrowser before navigation)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dining_preorder_cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setPreOrderItems(parsed);
      }
    } catch {}
  }, []);

  // Load available time slots when date or covers change
  useEffect(() => {
    if (!date || covers < 1 || covers > 12) {
      setAvailableSlots([]);
      setTimeSlot("");
      return;
    }
    let active = true;
    setLoadingSlots(true);
    fetchTimeSlots(date, covers)
      .then((slots) => {
        if (!active) return;
        setAvailableSlots(slots);
        if (slots.length === 0) {
          setTimeSlot("");
        } else if (!slots.some((s) => s.slot === timeSlot)) {
          // Don't auto-select: clear stale selection so the user must actively choose.
          setTimeSlot("");
        }
        setLoadingSlots(false);
      })
      .catch(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [date, covers]);

  const MAX_ADVANCE_DAYS = 730;

  const preOrderSubtotal = preOrderItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleRemovePreOrder = () => {
    setPreOrderItems([]);
    try { localStorage.removeItem("dining_preorder_cart"); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      const next = `/dining/reserve?date=${date}&covers=${covers}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    setError(null);

    if (!date) { setError("Please select a reservation date."); return; }

    const [yr, mo, dy] = date.split("-").map(Number);
    if (!yr || !mo || !dy) { setError("Please enter a valid reservation date."); return; }
    const resDate = new Date(yr, mo - 1, dy);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (resDate < today) { setError("Reservation date cannot be in the past."); return; }
    if (Math.round((resDate - today) / 86400000) > MAX_ADVANCE_DAYS) {
      setError("Reservations cannot be made more than 2 years in advance.");
      return;
    }
    if (!Number.isInteger(covers) || covers < 1 || covers > 12) {
      setError("Party size must be between 1 and 12 guests.");
      return;
    }
    if (!timeSlot) { setError("Please select an available dining time slot."); return; }
    if (!availableSlots.some((s) => s.slot === timeSlot)) {
      setError("The selected time slot is no longer available. Please choose another.");
      return;
    }
    if (dietary.length > 200) { setError("Dietary requirements must not exceed 200 characters."); return; }
    if (specialRequests.length > 500) { setError("Special requests must not exceed 500 characters."); return; }

    setSubmitting(true);

    try {
      const res = await makeReservation({ date, timeSlot, covers, specialRequests, dietary, occasion });

      if (!res.ok) {
        setError(res.error || "Failed to make reservation.");
        return;
      }

      // Reservation confirmed — now attach the pre-order if one exists
      let orderTotal = null;
      let orderErr = null;

      if (preOrderItems.length > 0) {
        try {
          const orderResult = await placeOrder({
            reservationId: res.reservation.id,
            items: preOrderItems.map(({ menu_item_id, quantity }) => ({ menu_item_id, quantity })),
          });
          if (orderResult.ok) {
            orderTotal = orderResult.total;
          } else {
            orderErr = orderResult.error || "Pre-order could not be confirmed. Please inform staff on arrival.";
          }
        } catch {
          orderErr = "Pre-order could not be confirmed. Please inform staff on arrival.";
        }
        try { localStorage.removeItem("dining_preorder_cart"); } catch {}
        setPreOrderItems([]);
      }

      setConfirmedOrderTotal(orderTotal);
      setOrderPlacementError(orderErr);
      setConfirmedRes(res.reservation);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Confirmation Screen ────────────────────────────────────────────────────
  if (confirmedRes) {
    return (
      <div className="p-8 md:p-12 bg-white border border-line rounded-2xl max-w-xl mx-auto text-center shadow-lg">
        <div className="w-16 h-16 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} />
        </div>

        <span className="eyebrow">Table Reserved</span>
        <h2 className="display text-3xl text-emerald mb-2">Your Table is Prepared</h2>
        <p className="text-stone-600 text-sm mb-6">
          Dining reservation confirmed under confirmation code:
        </p>

        <div className="p-4 bg-stone-50 border border-line rounded-lg inline-block mb-8 font-mono text-xl font-bold text-emerald tracking-wider">
          {confirmedRes.confirmation_code}
        </div>

        {/* Reservation details */}
        <div className="text-left bg-stone-50 p-6 rounded-xl border border-line space-y-3 text-sm mb-5">
          <div className="flex justify-between">
            <span className="text-mist">Reservation Date:</span>
            <span className="font-semibold text-emerald">{confirmedRes.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Seating Time:</span>
            <span className="font-semibold">{confirmedRes.time_slot}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Party Size:</span>
            <span className="font-semibold">{confirmedRes.covers} Guests</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Occasion:</span>
            <span className="font-semibold">{occasion}</span>
          </div>
        </div>

        {/* Pre-order confirmation */}
        {confirmedOrderTotal !== null && (
          <div className="text-left bg-emerald/5 border border-emerald/20 p-5 rounded-xl text-sm mb-5">
            <div className="flex items-center gap-2 font-semibold text-emerald mb-3">
              <ShoppingBag size={16} />
              Pre-Order Confirmed
            </div>
            <div className="flex justify-between text-xs text-stone-600 border-t border-emerald/10 pt-2">
              <span>Order total (incl. tax & service charge)</span>
              <span className="font-bold text-emerald">LKR {Number(confirmedOrderTotal).toLocaleString()}</span>
            </div>
            <p className="text-2xs text-stone-400 mt-2">
              Your dishes have been sent to the kitchen for expedited preparation.
            </p>
          </div>
        )}

        {/* Pre-order failed gracefully */}
        {orderPlacementError && (
          <div className="text-left bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 mb-5">
            <strong>Pre-order note:</strong> {orderPlacementError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account" className="btn btn-solid">
            View in Customer Portal
          </Link>
          <Link href="/dining/menu" className="btn btn-ghost">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  // ─── Reservation Form ───────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start max-w-5xl mx-auto">
      {/* Form */}
      <div className="lg:col-span-2 bg-white border border-line rounded-xl p-8 shadow-sm">
        <div className="mb-8">
          <span className="eyebrow">Table Reservation</span>
          <h2 className="display text-2xl md:text-3xl text-emerald">Book Your Dining Experience</h2>
          <p className="text-sm text-mist mt-1">Select your preferred date, party size, and table seating time.</p>
        </div>

        {error && <div className="err mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date + Covers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="res_date">
                <Calendar size={14} className="inline mr-1" />
                Dining Date
              </label>
              <input
                id="res_date"
                type="date"
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="covers">
                <Users size={14} className="inline mr-1" />
                Number of Guests
              </label>
              <select
                id="covers"
                value={covers}
                onChange={(e) => setCovers(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Guest (Solo Dining)" : `Guests`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Slots */}
          <div className="field">
            <label className="flex items-center justify-between">
              <span>
                <Clock size={14} className="inline mr-1" />
                Select Seating Time Slot
              </span>
              {loadingSlots && <span className="text-2xs text-mist animate-pulse">Checking availability...</span>}
            </label>

            {availableSlots.length === 0 && !loadingSlots ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800 text-center font-medium">
                ⚠ No tables available for {covers} guest{covers > 1 ? "s" : ""} on {date}. Please choose another date or party size.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map(({ slot, tables_available }) => {
                  const isSelected = slot === timeSlot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                        isSelected
                          ? "bg-emerald text-white border-emerald shadow-xs"
                          : "bg-white text-stone-800 border-line hover:border-emerald"
                      }`}
                    >
                      <div>{slot}</div>
                      <span className={`text-3xs block ${isSelected ? "text-ivory/80" : "text-stone-400"}`}>
                        {tables_available} left
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Occasion & Dietary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="occasion">Occasion</label>
              <select id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                <option value="Casual Dining">Casual Dining</option>
                <option value="Romantic Dinner">Romantic Dinner / Date</option>
                <option value="Anniversary">Anniversary Celebration</option>
                <option value="Birthday">Birthday Celebration</option>
                <option value="Business Dinner">Business Dinner</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="dietary">Dietary Requirements</label>
              <input
                id="dietary"
                type="text"
                value={dietary}
                onChange={(e) => setDietary(e.target.value.slice(0, 200))}
                maxLength={200}
                placeholder="E.g., Nut allergy, Gluten-free, Halal, Jain"
              />
            </div>
          </div>

          {/* Special Requests */}
          <div className="field">
            <label htmlFor="special_requests">
              Special Seating Requests (Optional)
              <span className="hint" style={{ float: "right", fontSize: "0.75em" }}>
                {specialRequests.length}/500
              </span>
            </label>
            <textarea
              id="special_requests"
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value.slice(0, 500))}
              maxLength={500}
              placeholder="E.g., Window table, high chair for infant, birthday dessert candle..."
            />
          </div>

          {/* Pre-Order Summary panel */}
          {preOrderItems.length > 0 && (
            <div className="p-4 bg-emerald/5 border border-emerald/25 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-emerald flex items-center gap-2">
                  <ShoppingBag size={14} />
                  Pre-Order Attached ({preOrderItems.reduce((s, i) => s + i.quantity, 0)} items)
                </span>
                <button
                  type="button"
                  onClick={handleRemovePreOrder}
                  className="text-2xs text-mist hover:text-red-500 flex items-center gap-1 transition-colors"
                  title="Remove pre-order"
                >
                  <X size={12} /> Remove
                </button>
              </div>
              <div className="space-y-1 text-xs text-stone-600 max-h-36 overflow-y-auto">
                {preOrderItems.map((item) => (
                  <div key={item.menu_item_id} className="flex justify-between">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="font-medium">LKR {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-emerald/15 pt-2 mt-2 flex justify-between text-xs font-bold text-emerald">
                <span>Pre-Order Subtotal</span>
                <span>LKR {preOrderSubtotal.toLocaleString()}</span>
              </div>
              <p className="text-2xs text-stone-400 mt-1">
                Dishes will be sent to the kitchen once your table reservation is confirmed.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-solid w-full justify-center py-3 text-base"
            disabled={submitting}
          >
            {submitting
              ? preOrderItems.length > 0
                ? "Confirming Reservation & Pre-Order..."
                : "Securing Table Reservation..."
              : session
                ? preOrderItems.length > 0
                  ? "Confirm Reservation & Place Pre-Order"
                  : "Confirm Table Reservation"
                : "Sign In to Confirm Table"}
          </button>
        </form>
      </div>

      {/* Right Sidebar */}
      <div className="bg-stone-50 border border-line rounded-xl p-6 shadow-sm space-y-6 text-sm">
        <h3 className="font-serif font-bold text-xl text-emerald border-b border-line pb-4">
          Reservation Policy
        </h3>

        <div className="space-y-3 text-xs text-stone-600">
          <p>
            <strong>Table Holding:</strong> Tables are reserved for 15 minutes past your booking time before being released to walk-in guests.
          </p>
          <p>
            <strong>Dress Code:</strong> Smart casual attire is appreciated for evening dinner service in the Main Dining Room.
          </p>
          <p>
            <strong>Pre-Orders:</strong> Select items from our menu before you arrive — your dishes go straight to the kitchen when you are seated.
          </p>
          <p>
            <strong>Cancellations:</strong> Cancel up to 2 hours before your seating time from the Customer Portal.
          </p>
        </div>

        <div className="p-4 bg-white border border-line rounded-lg">
          <div className="flex items-center gap-2 font-semibold text-emerald text-xs mb-1">
            <Utensils size={14} />
            Private Dining Rooms
          </div>
          <p className="text-2xs text-stone-500">
            Parties exceeding 8 guests can request our colonial wine room for exclusive celebrations.
          </p>
        </div>

        {preOrderItems.length === 0 && (
          <Link
            href="/dining/menu"
            className="btn btn-ghost btn-sm w-full justify-center text-xs"
          >
            <ShoppingBag size={14} />
            Browse Menu &amp; Pre-Order
          </Link>
        )}
      </div>
    </div>
  );
}
