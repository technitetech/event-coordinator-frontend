"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { makeReservation, fetchTimeSlots } from "../actions";
import { Calendar, Clock, Users, CheckCircle2, Shield, ArrowRight, Utensils } from "lucide-react";

export default function ReservationForm({ session, initialDate, initialCovers }) {
  const router = useRouter();

  const todayStr = new Date().toISOString().split("T")[0];
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

  // Load available slots when date or covers change
  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    fetchTimeSlots(date, covers)
      .then((slots) => {
        if (active) {
          setAvailableSlots(slots);
          if (slots.length > 0 && !slots.some((s) => s.slot === timeSlot)) {
            setTimeSlot(slots[0].slot);
          } else if (slots.length === 0) {
            setTimeSlot("");
          }
          setLoadingSlots(false);
        }
      })
      .catch((e) => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [date, covers]);

  const MAX_ADVANCE_DAYS = 730;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      router.push(`/login?next=/dining/reserve?date=${date}&covers=${covers}`);
      return;
    }

    setError(null);

    // Client-side date checks (supplements HTML min attribute)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resDate = new Date(date);
    resDate.setHours(0, 0, 0, 0);
    if (resDate < today) {
      setError("Reservation date cannot be in the past.");
      return;
    }
    if (Math.round((resDate - today) / 86400000) > MAX_ADVANCE_DAYS) {
      setError("Reservations cannot be made more than 2 years in advance.");
      return;
    }

    if (!timeSlot) {
      setError("Please select an available dining time slot.");
      return;
    }
    if (dietary.length > 200) {
      setError("Dietary requirements must not exceed 200 characters.");
      return;
    }
    if (specialRequests.length > 500) {
      setError("Special requests must not exceed 500 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await makeReservation({
        date,
        timeSlot,
        covers,
        specialRequests,
        dietary,
        occasion,
      });

      if (res.ok) {
        setConfirmedRes(res.reservation);
      } else {
        setError(res.error || "Failed to make reservation.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedRes) {
    return (
      <div className="p-8 md:p-12 bg-white border border-line rounded-2xl max-w-xl mx-auto text-center shadow-lg">
        <div className="w-16 h-16 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} />
        </div>

        <span className="eyebrow">Table Reserved</span>
        <h2 className="display text-3xl text-emerald mb-2">Your Table is Prepared</h2>
        <p className="text-stone-600 text-sm mb-6">
          Your dining reservation has been confirmed under confirmation code:
        </p>

        <div className="p-4 bg-stone-50 border border-line rounded-lg inline-block mb-8 font-mono text-xl font-bold text-emerald tracking-wider">
          {confirmedRes.confirmation_code}
        </div>

        <div className="text-left bg-stone-50 p-6 rounded-xl border border-line space-y-3 text-sm mb-8">
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account" className="btn btn-solid">
            View in Customer Portal
          </Link>
          <Link href="/dining/menu" className="btn btn-ghost">
            Browse Menu &amp; Pre-Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start max-w-5xl mx-auto">
      {/* Left Form (2 cols) */}
      <div className="lg:col-span-2 bg-white border border-line rounded-xl p-8 shadow-sm">
        <div className="mb-8">
          <span className="eyebrow">Table Reservation</span>
          <h2 className="display text-2xl md:text-3xl text-emerald">Book Your Dining Experience</h2>
          <p className="text-sm text-mist mt-1">Select your preferred date, party size, and table seating time.</p>
        </div>

        {error && <div className="err mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Covers Grid */}
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
                    {n} {n === 1 ? "Guest (Solo Dining)" : `${n} Guests`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Slots Grid */}
          <div className="field">
            <label className="flex items-center justify-between">
              <span>
                <Clock size={14} className="inline mr-1" />
                Select Seating Time Slot
              </span>
              {loadingSlots && <span className="text-2xs text-mist">Checking table availability...</span>}
            </label>

            {availableSlots.length === 0 && !loadingSlots ? (
              <div className="p-4 bg-stone-50 border border-line rounded-lg text-xs text-stone-500 text-center">
                No tables available for {covers} guests on {date}. Please choose another date or party size.
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
              placeholder="E.g., Window table with plantation view, high chair for infant, birthday dessert candle..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-solid w-full justify-center py-3 text-base"
            disabled={submitting || !timeSlot}
          >
            {submitting ? "Securing Table Reservation..." : session ? "Confirm Table Reservation" : "Sign In to Confirm Table"}
          </button>
        </form>
      </div>

      {/* Right Sidebar Info */}
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
            <strong>Pre-Orders:</strong> You can select items in advance from our online menu to expedite kitchen service upon arrival.
          </p>
        </div>

        <div className="p-4 bg-white border border-line rounded-lg">
          <div className="flex items-center gap-2 font-semibold text-emerald text-xs mb-1">
            <Utensils size={14} />
            <span>Private Dining Rooms</span>
          </div>
          <p className="text-2xs text-stone-500">
            Parties exceeding 8 guests can request our colonial wine room for exclusive celebrations.
          </p>
        </div>
      </div>
    </div>
  );
}
