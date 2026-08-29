"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bookRoom } from "../actions";
import { Calendar, Users, CheckCircle2, Shield, ArrowRight, ArrowLeft } from "lucide-react";

export default function BookingCheckout({ roomTypes, initialRoomTypeId, initialCheckIn, initialCheckOut, session }) {
  const router = useRouter();

  const [selectedRoomId, setSelectedRoomId] = useState(
    initialRoomTypeId ? Number(initialRoomTypeId) : (roomTypes[0]?.id || 1)
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const [checkIn, setCheckIn] = useState(initialCheckIn || tomorrow.toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState(initialCheckOut || dayAfterTomorrow.toISOString().split("T")[0]);
  const [guestsAdult, setGuestsAdult] = useState(2);
  const [guestsChild, setGuestsChild] = useState(0);
  const [specialRequests, setSpecialRequests] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const selectedRoom = roomTypes.find((r) => r.id === Number(selectedRoomId)) || roomTypes[0];

  // Calculate nights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

  const ratePerNight = selectedRoom?.base_rate_per_night || 0;
  const subtotal = ratePerNight * nights;
  const taxGov = Math.round(subtotal * 0.05);
  const serviceCharge = Math.round(subtotal * 0.10);
  const totalAmount = subtotal + taxGov + serviceCharge;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const MAX_ADVANCE_DAYS = 730;
  const MAX_NIGHTS = 30;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      router.push(`/login?next=/rooms/book?roomTypeId=${selectedRoomId}&checkIn=${checkIn}&checkOut=${checkOut}`);
      return;
    }

    setError(null);

    // Client-side date validation (supplements HTML min attribute which can be bypassed)
    const ciDate = new Date(checkIn);
    const coDate = new Date(checkOut);
    ciDate.setHours(0, 0, 0, 0);
    coDate.setHours(0, 0, 0, 0);

    if (ciDate < today) {
      setError("Check-in date cannot be in the past.");
      return;
    }
    const daysAhead = Math.round((ciDate - today) / 86400000);
    if (daysAhead > MAX_ADVANCE_DAYS) {
      setError("Check-in date cannot be more than 2 years in advance.");
      return;
    }
    if (coDate <= ciDate) {
      setError("Check-out must be at least one night after check-in.");
      return;
    }
    const stayNights = Math.round((coDate - ciDate) / 86400000);
    if (stayNights > MAX_NIGHTS) {
      setError(`Stays are limited to ${MAX_NIGHTS} nights. Please contact us for extended arrangements.`);
      return;
    }
    if (specialRequests.length > 1000) {
      setError("Special requests must not exceed 1000 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await bookRoom({
        roomTypeId: selectedRoomId,
        checkIn,
        checkOut,
        guestsAdult,
        guestsChild,
        specialRequests,
      });

      if (res.ok) {
        setConfirmedBooking(res.booking);
      } else {
        setError(res.error || "Failed to complete reservation.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred during booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="booking-confirmation-card p-8 md:p-12 bg-white border border-line rounded-2xl max-w-2xl mx-auto text-center shadow-lg">
        <div className="w-16 h-16 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} />
        </div>

        <span className="eyebrow">Reservation Confirmed</span>
        <h2 className="display text-3xl text-emerald mb-2">We Look Forward to Welcoming You</h2>
        <p className="text-stone-600 text-sm mb-6">
          Your reservation has been recorded under Confirmation Code:
        </p>

        <div className="p-4 bg-stone-50 border border-line rounded-lg inline-block mb-8 font-mono text-xl font-bold text-emerald tracking-wider">
          {confirmedBooking.confirmation_code}
        </div>

        <div className="text-left bg-stone-50 p-6 rounded-xl border border-line space-y-3 text-sm mb-8">
          <div className="flex justify-between">
            <span className="text-mist">Sanctuary:</span>
            <span className="font-semibold text-emerald">{selectedRoom?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Dates:</span>
            <span className="font-semibold">{confirmedBooking.check_in_date} → {confirmedBooking.check_out_date} ({confirmedBooking.nights} night{confirmedBooking.nights > 1 ? "s" : ""})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Party Size:</span>
            <span className="font-semibold">{guestsAdult} Adults{guestsChild > 0 ? `, ${guestsChild} Children` : ""}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-3">
            <span className="font-bold text-emerald">Total Investment:</span>
            <span className="font-bold text-emerald font-serif text-lg">LKR {Number(confirmedBooking.total_amount).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account" className="btn btn-solid">
            View in Customer Portal
          </Link>
          <Link href="/rooms" className="btn btn-ghost">
            Explore More Sanctuaries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start max-w-6xl mx-auto">
      {/* Left Form (2 cols) */}
      <div className="lg:col-span-2 bg-white border border-line rounded-xl p-8 shadow-sm">
        <div className="mb-8">
          <span className="eyebrow">Stay Reservation</span>
          <h2 className="display text-2xl md:text-3xl text-emerald">Complete Your Sanctuary Booking</h2>
          <p className="text-sm text-mist mt-1">Direct booking at St. Lachland guarantees best rates and estate privileges.</p>
        </div>

        {error && <div className="err mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Selection */}
          <div className="field">
            <label htmlFor="room_type">Selected Sanctuary / Room Type</label>
            <select
              id="room_type"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(Number(e.target.value))}
              required
            >
              {roomTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — LKR {Number(r.base_rate_per_night).toLocaleString()} / night (Max {r.max_occupancy} guests)
                </option>
              ))}
            </select>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="check_in">
                <Calendar size={14} className="inline mr-1" />
                Check-In Date
              </label>
              <input
                id="check_in"
                type="date"
                value={checkIn}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="check_out">
                <Calendar size={14} className="inline mr-1" />
                Check-Out Date
              </label>
              <input
                id="check_out"
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Guest Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="adults">
                <Users size={14} className="inline mr-1" />
                Adults
              </label>
              <select
                id="adults"
                value={guestsAdult}
                onChange={(e) => setGuestsAdult(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} Adult{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="children">Children (Under 12)</label>
              <select
                id="children"
                value={guestsChild}
                onChange={(e) => setGuestsChild(Number(e.target.value))}
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n} Children
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Special Requests */}
          <div className="field">
            <label htmlFor="requests">
              Special Preferences &amp; Arrival Notes (Optional)
              <span className="hint" style={{ float: "right", fontSize: "0.75em" }}>
                {specialRequests.length}/1000
              </span>
            </label>
            <textarea
              id="requests"
              rows={3}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value.slice(0, 1000))}
              maxLength={1000}
              placeholder="E.g., Dietary requirements, early check-in request, honeymoon anniversary setup..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-solid w-full justify-center py-3 text-base"
            disabled={submitting}
          >
            {submitting ? "Confirming Sanctuary Reservation..." : session ? "Confirm & Reserve Stay" : "Sign In to Complete Reservation"}
          </button>
        </form>
      </div>

      {/* Right Pricing Summary Sidebar (1 col) */}
      <div className="bg-stone-50 border border-line rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="font-serif font-bold text-xl text-emerald border-b border-line pb-4">
          Reservation Summary
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-mist">{selectedRoom?.name}</span>
            <span className="font-semibold">{nights} night{nights > 1 ? "s" : ""}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-mist">Nightly Rate</span>
            <span>LKR {Number(ratePerNight).toLocaleString()}</span>
          </div>

          <div className="flex justify-between border-t border-dashed border-line pt-3">
            <span className="text-stone-700 font-medium">Room Subtotal</span>
            <span className="font-semibold">LKR {subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-xs text-stone-500">
            <span>Govt. Tourism Levy (5%)</span>
            <span>LKR {taxGov.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-xs text-stone-500">
            <span>Service Charge (10%)</span>
            <span>LKR {serviceCharge.toLocaleString()}</span>
          </div>

          <div className="flex justify-between border-t border-line pt-4 text-base font-bold text-emerald">
            <span>Estimated Total</span>
            <span className="font-serif text-xl">LKR {totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-line rounded-lg space-y-2 text-xs text-stone-600">
          <div className="flex items-center gap-2 font-semibold text-emerald">
            <Shield size={14} />
            <span>St. Lachland Guarantee</span>
          </div>
          <p>Mock settlement mode: Reservation is placed in confirmed status immediately with zero upfront payment friction.</p>
        </div>
      </div>
    </div>
  );
}
