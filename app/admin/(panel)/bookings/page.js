import { getUnifiedBookings } from "../../actions";
import BookingsManager from "./BookingsManager";

export const metadata = {
  title: "Unified Bookings Hub — St. Lachland Hotel",
  description: "Cross-domain reservation management for stays, AI events, and dining tables.",
};

export default async function UnifiedBookingsPage() {
  let bookings = { stays: [], events: [], dining: [] };
  try {
    bookings = await getUnifiedBookings({ type: "all", status: "all" });
  } catch (err) {
    return (
      <div className="ad-content">
        <h1 className="ad-title">Unified Bookings Hub</h1>
        <div className="err mt-4">{err.message}</div>
      </div>
    );
  }

  return (
    <div className="ad-content">
      <div className="mb-6">
        <span className="eyebrow">Operational Operations</span>
        <h1 className="ad-title text-2xl md:text-3xl">Unified Bookings Hub</h1>
        <p className="text-stone-500 text-xs mt-1">
          Comprehensive real-time ledger spanning room stays, AI event celebrations, and restaurant table bookings.
        </p>
      </div>

      <BookingsManager
        initialStays={bookings.stays}
        initialEvents={bookings.events}
        initialDining={bookings.dining}
      />
    </div>
  );
}
