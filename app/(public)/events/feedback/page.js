import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../auth-actions";
import { getMyBookings } from "../actions";
import FeedbackForm from "../../../components/FeedbackForm";

export const metadata = {
  title: "Event Review & Feedback — St. Lachland Hotel",
  description: "Provide feedback on your recent event to help train and calibrate our AI coordinator.",
};

export default async function FeedbackPage({ searchParams }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/events/feedback");

  const bookings = await getMyBookings();
  const selectedBookingId = searchParams?.booking ? Number(searchParams.booking) : null;
  const targetBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0] || null;

  return (
    <main className="feedback-page">
      <div className="wrap max-w-4xl py-16">
        <div className="section-head text-center mb-10">
          <span className="eyebrow">Adaptive AI Calibration</span>
          <h1 className="display">Post-Event Experience Feedback</h1>
          <p className="max-w-xl mx-auto">
            Your evaluation directly trains our hybrid neuro-symbolic engine. By rating your event across 5 dimensions, you help our AI optimize future recommendations.
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>You don&rsquo;t have any past or active reservations to review yet.</p>
            <Link href="/events" className="btn btn-solid mt-4">
              Plan an Event First
            </Link>
          </div>
        ) : (
          <div className="feedback-container-card">
            {bookings.length > 1 && (
              <div className="booking-selector-bar mb-6">
                <label className="text-sm font-semibold block mb-2 text-stone-700">
                  Select Reservation to Review:
                </label>
                <div className="flex flex-wrap gap-2">
                  {bookings.map((b) => (
                    <Link
                      key={b.id}
                      href={`/events/feedback?booking=${b.id}`}
                      className={`btn btn-sm ${
                        b.id === (targetBooking?.id) ? "btn-solid" : "btn-ghost"
                      }`}
                    >
                      Ref #{b.id} — {b.event_type} ({b.event_date})
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {targetBooking ? (
              <FeedbackForm
                bookingId={targetBooking.id}
                eventSummary={`Ref #${targetBooking.id} · ${targetBooking.event_type.toUpperCase()} on ${targetBooking.event_date} (${targetBooking.venue_name || "Venue"}, ${targetBooking.guests} guests)`}
              />
            ) : (
              <p>Please select a booking above.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
