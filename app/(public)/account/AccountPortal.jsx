"use client";

import { useState } from "react";
import Link from "next/link";
import BookingStatusBadge from "../../components/BookingStatusBadge";
import InvoiceView from "../../components/InvoiceView";
import { requestCancellation } from "../rooms/actions";
import { buildStayInvoice, buildEventInvoice, buildDiningInvoice } from "../../../lib/invoice";
import {
  Bed,
  Calendar,
  Utensils,
  User,
  FileText,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  CheckCircle,
  LogOut,
  ChevronRight,
  Award
} from "lucide-react";

/**
 * Safely turns a stored image_url column into a list of renderable URLs.
 * Returns [] for anything that isn't a real http(s) URL, so a malformed or
 * truncated value can never be emitted as an <img src>.
 */
function parseConceptImages(raw) {
  if (!raw || typeof raw !== "string") return [];
  const isUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return isUrl(raw) ? [raw] : [];
  }
  if (Array.isArray(parsed)) return parsed.filter(isUrl);
  return isUrl(parsed) ? [parsed] : [];
}

export default function AccountPortal({ session, stayBookings, eventBookings, diningReservations, userPrefs, doLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [cancellingStayId, setCancellingStayId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const handleOpenStayInvoice = (booking) => {
    const inv = buildStayInvoice(
      booking,
      { name: booking.room_type_name },
      session
    );
    setActiveInvoice(inv);
  };

  const handleOpenEventInvoice = (booking) => {
    const inv = buildEventInvoice(booking, session);
    setActiveInvoice(inv);
  };

  const handleOpenDiningInvoice = (reservation) => {
    const inv = buildDiningInvoice(reservation, null, session);
    setActiveInvoice(inv);
  };

  const handleCancelStaySubmit = async (bookingId) => {
    setCancelError(null);
    try {
      const res = await requestCancellation(bookingId, cancelReason);
      if (res.ok) {
        setActionSuccess("Your cancellation request has been processed successfully.");
        setCancellingStayId(null);
        setCancelReason("");
        // Reload page to reflect updated status
        window.location.reload();
      } else {
        setCancelError(res.error || "Failed to cancel booking.");
      }
    } catch (err) {
      setCancelError(err.message || "An unexpected error occurred.");
    }
  };

  const totalBookingsCount = stayBookings.length + eventBookings.length + diningReservations.length;

  return (
    <div className="account-portal-container">
      {/* Printable Invoice Modal */}
      {activeInvoice && (
        <InvoiceView invoice={activeInvoice} onClose={() => setActiveInvoice(null)} />
      )}

      {/* Header Profile Summary */}
      <div className="bg-white border border-line rounded-2xl p-6 md:p-8 mb-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="eyebrow">Guest Portfolio</span>
            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 bg-gold/15 text-stone-900 rounded">
              <Award size={12} className="text-gold" />
              Estate Member
            </span>
          </div>
          <h1 className="display text-3xl text-emerald">Hello, {session.name.split(" ")[0]}.</h1>
          <p className="text-xs text-mist mt-1">{session.email} · Account #{session.userId}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/rooms" className="btn btn-solid btn-sm">
            <Bed size={14} />
            <span>Book Sanctuary</span>
          </Link>
          <Link href="/events" className="btn btn-ghost btn-sm">
            <Sparkles size={14} />
            <span>Plan Event</span>
          </Link>
          <form action={doLogout}>
            <button type="submit" className="btn btn-ghost btn-sm text-stone-500">
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald/10 border border-emerald rounded-xl text-emerald text-xs font-semibold mb-6 flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-line pb-px mb-8">
        {[
          { id: "overview", label: "Dashboard Overview", count: null, icon: User },
          { id: "stays", label: "Stays & Sanctuaries", count: stayBookings.length, icon: Bed },
          { id: "events", label: "Event Celebrations", count: eventBookings.length, icon: Calendar },
          { id: "dining", label: "Dining & Table Bookings", count: diningReservations.length, icon: Utensils },
          { id: "profile", label: "AI Preferences & Profile", count: null, icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-emerald text-emerald bg-emerald/5 rounded-t-lg"
                  : "border-transparent text-stone-600 hover:text-emerald"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-2xs px-2 py-0.5 rounded-full ${isActive ? "bg-emerald text-white" : "bg-stone-100 text-stone-600"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Quick Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-line rounded-xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-mist font-semibold uppercase">Room Stays</span>
                <Bed size={20} className="text-emerald" />
              </div>
              <div className="font-serif text-3xl font-bold text-emerald">{stayBookings.length}</div>
              <span className="text-2xs text-stone-500 mt-1 block">Sanctuary reservations</span>
            </div>

            <div className="bg-white border border-line rounded-xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-mist font-semibold uppercase">Events Planned</span>
                <Calendar size={20} className="text-emerald" />
              </div>
              <div className="font-serif text-3xl font-bold text-emerald">{eventBookings.length}</div>
              <span className="text-2xs text-stone-500 mt-1 block">AI-optimized celebrations</span>
            </div>

            <div className="bg-white border border-line rounded-xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-mist font-semibold uppercase">Table Reservations</span>
                <Utensils size={20} className="text-emerald" />
              </div>
              <div className="font-serif text-3xl font-bold text-emerald">{diningReservations.length}</div>
              <span className="text-2xs text-stone-500 mt-1 block">The Dining Room visits</span>
            </div>
          </div>

          {/* Quick Upcoming Stays Preview */}
          <div className="bg-white border border-line rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif font-bold text-xl text-emerald">Recent Sanctuary Reservations</h3>
              <button onClick={() => setActiveTab("stays")} className="text-xs font-semibold text-emerald hover:underline">
                View all stays →
              </button>
            </div>

            {stayBookings.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                No room reservations found.{" "}
                <Link href="/rooms" className="text-emerald underline font-semibold">
                  Browse our Sanctuaries
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {stayBookings.slice(0, 2).map((sb) => (
                  <div key={sb.id} className="p-4 bg-stone-50 border border-line rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-emerald">{sb.room_type_name}</span>
                        <BookingStatusBadge status={sb.status} />
                      </div>
                      <span className="text-stone-600">
                        {sb.check_in_date} → {sb.check_out_date} ({sb.nights} nights) · Room {sb.room_number || "TBC"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenStayInvoice(sb)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                    >
                      <FileText size={12} />
                      <span>Invoice</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STAYS (ACCOMMODATION) */}
      {activeTab === "stays" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif font-bold text-2xl text-emerald">Your Sanctuary Stays</h2>
            <Link href="/rooms" className="btn btn-solid btn-sm">
              <Bed size={14} />
              <span>Book New Room</span>
            </Link>
          </div>

          {stayBookings.length === 0 ? (
            <div className="p-12 bg-white border border-dashed border-line rounded-2xl text-center">
              <Bed size={32} className="text-mist mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-emerald mb-1">No Sanctuary Bookings Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
                Experience beachfront luxury in Negombo. Reserve your boutique ocean room or private beach villa.
              </p>
              <Link href="/rooms" className="btn btn-solid">
                Explore Sanctuaries
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {stayBookings.map((b) => (
                <article key={b.id} className="p-6 bg-white border border-line rounded-xl shadow-xs">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-line">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-serif font-bold text-xl text-emerald">{b.room_type_name}</h3>
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <span className="font-mono text-xs text-stone-400">Ref Code: {b.confirmation_code}</span>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="font-serif font-bold text-xl text-emerald">
                        LKR {Number(b.total_amount).toLocaleString()}
                      </div>
                      <span className="text-2xs text-stone-500">{b.nights} night{b.nights > 1 ? "s" : ""} · Room {b.room_number || "TBC"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600 mb-6">
                    <div>
                      <span className="text-mist block">Check-In</span>
                      <strong className="text-stone-800">{b.check_in_date}</strong> (from 14:00)
                    </div>
                    <div>
                      <span className="text-mist block">Check-Out</span>
                      <strong className="text-stone-800">{b.check_out_date}</strong> (until 11:00)
                    </div>
                    <div>
                      <span className="text-mist block">Guests</span>
                      <strong className="text-stone-800">{b.guests_adult} Adults{b.guests_child > 0 ? `, ${b.guests_child} Children` : ""}</strong>
                    </div>
                  </div>

                  {b.special_requests && (
                    <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-600 mb-6">
                      <span className="font-semibold text-emerald">Your Special Requests:</span> {b.special_requests}
                    </div>
                  )}

                  {/* Actions & Cancellation */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenStayInvoice(b)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                      >
                        <FileText size={14} />
                        <span>Download Tax Invoice</span>
                      </button>
                    </div>

                    {["pending", "confirmed"].includes(b.status) && (
                      <div>
                        {cancellingStayId === b.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Reason for cancellation..."
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="text-xs p-1.5 border border-line rounded"
                            />
                            <button
                              type="button"
                              onClick={() => handleCancelStaySubmit(b.id)}
                              className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                              style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                            >
                              Confirm Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancellingStayId(null)}
                              className="text-xs text-stone-500"
                            >
                              Abort
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCancellingStayId(b.id)}
                            className="text-xs text-red-700 hover:underline"
                          >
                            Request Cancellation
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {cancelError && cancellingStayId === b.id && (
                    <div className="err text-xs mt-3">{cancelError}</div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EVENTS (AI COORDINATOR) */}
      {activeTab === "events" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif font-bold text-2xl text-emerald">Your Event Celebrations</h2>
            <Link href="/events" className="btn btn-solid btn-sm">
              <Sparkles size={14} />
              <span>Plan New Celebration</span>
            </Link>
          </div>

          {eventBookings.length === 0 ? (
            <div className="p-12 bg-white border border-dashed border-line rounded-2xl text-center">
              <Calendar size={32} className="text-mist mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-emerald mb-1">No Event Reservations Found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
                Use our Hybrid Neuro-Symbolic AI coordinator to plan optimal weddings, conferences, or private gala dinners.
              </p>
              <Link href="/events" className="btn btn-solid">
                Launch AI Event Coordinator
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {eventBookings.map((eb) => {
                // Only ever render values that are genuinely URLs. Older rows
                // may hold a truncated/invalid JSON blob; falling back to
                // rendering that raw string as an <img src> produced a huge
                // 404 request on every dashboard load.
                const images = parseConceptImages(eb.image_url);

                return (
                  <article key={eb.id} className="p-6 bg-white border border-line rounded-xl shadow-xs">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-line">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-serif font-bold text-xl text-emerald">
                            {eb.event_type.charAt(0).toUpperCase() + eb.event_type.slice(1)} Celebration
                          </h3>
                          <BookingStatusBadge status={eb.status} />
                        </div>
                        <span className="font-mono text-xs text-stone-400">Ref Code: EVT-{String(eb.id).padStart(6, "0")}</span>
                      </div>

                      <div className="text-left md:text-right">
                        <div className="font-serif font-bold text-xl text-emerald">
                          LKR {Number(eb.total_cost).toLocaleString()}
                        </div>
                        <span className="text-2xs text-stone-500">{eb.guests} Guests · {eb.venue_name || "Venue TBC"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600 mb-6">
                      <div>
                        <span className="text-mist block">Event Date</span>
                        <strong className="text-stone-800">{eb.event_date}</strong>
                      </div>
                      <div>
                        <span className="text-mist block">Catering Package</span>
                        <strong className="text-stone-800">{eb.menu_name || "Standard Buffet"}</strong>
                      </div>
                      <div>
                        <span className="text-mist block">Décor Aesthetic</span>
                        <strong className="text-stone-800">{eb.decoration_name || "Custom Theme"}</strong>
                      </div>
                    </div>

                    {images.length > 0 && (
                      <div className="mb-6">
                        <span className="text-2xs font-semibold uppercase text-mist block mb-2">Synthesized AI Concept Visuals:</span>
                        <div className="flex overflow-x-auto gap-3 pb-2">
                          {images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Concept ${i + 1}`}
                              // These are generated on demand by an external
                              // service and can take many seconds each; lazy +
                              // async keeps them off the critical path so the
                              // dashboard stays responsive while they arrive.
                              loading="lazy"
                              decoding="async"
                              width={192}
                              height={128}
                              className="w-48 h-32 object-cover rounded-lg border border-line shrink-0 bg-stone-100"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEventInvoice(eb)}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                        >
                          <FileText size={14} />
                          <span>Event Invoice</span>
                        </button>
                      </div>

                      <Link
                        href={`/events/feedback?booking=${eb.id}`}
                        className="btn btn-solid btn-sm"
                        style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                      >
                        ⭐ Rate &amp; Review Experience
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DINING (RESTAURANT) */}
      {activeTab === "dining" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif font-bold text-2xl text-emerald">Your Dining Reservations</h2>
            <Link href="/dining/reserve" className="btn btn-solid btn-sm">
              <Utensils size={14} />
              <span>Reserve Table</span>
            </Link>
          </div>

          {diningReservations.length === 0 ? (
            <div className="p-12 bg-white border border-dashed border-line rounded-2xl text-center">
              <Utensils size={32} className="text-mist mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-emerald mb-1">No Dining Reservations Found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
                Reserve your table at The Dining Room or Garden Terrace to experience Ceylon high tea and fine dining.
              </p>
              <Link href="/dining/reserve" className="btn btn-solid">
                Reserve a Table
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {diningReservations.map((dr) => (
                <article key={dr.id} className="p-6 bg-white border border-line rounded-xl shadow-xs">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-line">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-serif font-bold text-xl text-emerald">
                          Table {dr.table_number} ({dr.location ? dr.location.toUpperCase() : "INDOOR"})
                        </h3>
                        <BookingStatusBadge status={dr.status} />
                      </div>
                      <span className="font-mono text-xs text-stone-400">Ref Code: {dr.confirmation_code}</span>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="font-serif font-bold text-lg text-emerald">
                        {dr.reservation_date} at {dr.time_slot}
                      </div>
                      <span className="text-2xs text-stone-500">Party of {dr.covers} Guests</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600 mb-4">
                    {dr.occasion && (
                      <div>
                        <span className="text-mist block">Occasion:</span>
                        <strong className="text-stone-800">{dr.occasion}</strong>
                      </div>
                    )}
                    {dr.dietary_notes && (
                      <div>
                        <span className="text-mist block">Dietary Requirements:</span>
                        <strong className="text-stone-800">{dr.dietary_notes}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDiningInvoice(dr)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                    >
                      <FileText size={14} />
                      <span>Reservation Slip</span>
                    </button>
                    <Link href="/dining/menu" className="text-xs text-emerald font-semibold hover:underline">
                      View Menu &amp; Pre-Order →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROFILE & PREFERENCES */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-white border border-line rounded-xl space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-emerald border-b border-line pb-3">Guest Profile</h3>
            <div>
              <span className="text-mist block">Full Name:</span>
              <strong className="text-stone-800 text-sm">{session.name}</strong>
            </div>
            <div>
              <span className="text-mist block">Email Address:</span>
              <strong className="text-stone-800 text-sm">{session.email}</strong>
            </div>
            <div>
              <span className="text-mist block">Account Role:</span>
              <span className="capitalize text-emerald font-bold">{session.role}</span>
            </div>
          </div>

          <div className="p-6 bg-white border border-line rounded-xl space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Sparkles size={16} className="text-gold" />
              <h3 className="font-serif font-bold text-lg text-emerald">Adaptive AI Preference Vector</h3>
            </div>
            <p className="text-stone-500 text-2xs leading-relaxed">
              {userPrefs?.personalised
                ? "These weights were learned from your submitted reviews and consultation choices, and steer how the engine ranks future recommendations."
                : "These are the estate's baseline weights. Submit a post-event review and the engine begins tuning them to your own priorities."}
            </p>

            <div className="flex items-center gap-2 text-2xs">
              <span
                className={`px-2 py-0.5 rounded font-semibold ${
                  userPrefs?.personalised
                    ? "bg-emerald/10 text-emerald"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {userPrefs?.personalised ? "PERSONALISED" : "ESTATE DEFAULT"}
              </span>
              <span className="text-stone-500">
                {userPrefs?.feedback_count === 1
                  ? "1 review on file"
                  : `${userPrefs?.feedback_count ?? 0} reviews on file`}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {(userPrefs?.weights ?? []).map((p) => {
                // Weights are a normalised distribution summing to 1, so show
                // each as its share of the whole rather than a raw fraction.
                const total = (userPrefs?.weights ?? []).reduce((s, x) => s + x.value, 0) || 1;
                const pct = Math.round((p.value / total) * 100);
                return (
                  <div key={p.key}>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>{p.label}</span>
                      <span className="font-mono text-emerald">{pct}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {(!userPrefs || userPrefs.weights?.length === 0) && (
                <p className="text-2xs text-stone-400 italic">
                  Preference data is not available right now.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
