import Link from "next/link";
import { getRoomTypes, getRoomAvailability } from "../../../lib/rooms";
import RoomCard from "../../components/RoomCard";
import { Calendar, Search, Sparkles, Shield, Coffee, Compass } from "lucide-react";

export const metadata = {
  title: "Luxury Accommodation & Suites — St. Lachland Hotel",
  description: "Experience refined coastal sanctuary in Negombo. Book boutique ocean rooms, suites, and private beach villas.",
};

export default async function RoomsPage({ searchParams }) {
  const roomTypes = await getRoomTypes();

  const checkIn = searchParams?.checkIn || "";
  const checkOut = searchParams?.checkOut || "";

  let availability = {};
  if (checkIn && checkOut) {
    try {
      availability = await getRoomAvailability(checkIn, checkOut);
    } catch (e) {
      console.error("Availability query error:", e);
    }
  }

  return (
    <main className="rooms-page">
      {/* Hero Section */}
      <section className="tool-hero bg-emerald text-ivory">
        <div className="wrap text-center">
          <span className="eyebrow">Coastal Oceanfront Sanctuary</span>
          <h1 className="display">Refined Beachfront Accommodation</h1>
          <p className="max-w-2xl mx-auto">
            Each room and private villa at St. Lachland is architecturally positioned to capture the dramatic Indian Ocean sunsets, swaying coconut palms, and tropical luxury charm.
          </p>
        </div>
      </section>

      {/* Date Search Filter Bar */}
      <section className="search-filter-section">
        <div className="wrap">
          <form method="GET" action="/rooms" className="room-search-bar">
            <div className="search-field">
              <label htmlFor="checkIn">
                <Calendar size={14} className="inline mr-1" />
                Check-In Date
              </label>
              <input
                id="checkIn"
                name="checkIn"
                type="date"
                defaultValue={checkIn}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="search-field">
              <label htmlFor="checkOut">
                <Calendar size={14} className="inline mr-1" />
                Check-Out Date
              </label>
              <input
                id="checkOut"
                name="checkOut"
                type="date"
                defaultValue={checkOut}
                min={checkIn ? (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })() : new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="search-field">
              <label htmlFor="guests">Guests</label>
              <select id="guests" name="guests" defaultValue={searchParams?.guests || "2"}>
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="6">6+ Guests (Villa)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-solid search-btn">
              <Search size={16} />
              <span>Check Availability</span>
            </button>
          </form>

          {checkIn && checkOut && (
            <div className="search-status-bar">
              <p>
                Showing real-time room availability for <strong>{checkIn}</strong> to <strong>{checkOut}</strong>:
              </p>
              <Link href="/rooms" className="text-xs text-emerald underline">
                Clear filter
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Room Listing Grid */}
      <section className="rooms-grid-section py-16">
        <div className="wrap">
          <div className="section-head mb-12">
            <span className="eyebrow">Our Sanctuary Collection</span>
            <h2 className="display">Bespoke Rooms &amp; Private Villas</h2>
          </div>

          <div className="rooms-grid">
            {roomTypes.map((rt) => (
              <RoomCard
                key={rt.id}
                roomType={rt}
                availability={availability[rt.slug]}
                checkIn={checkIn}
                checkOut={checkOut}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Estate Inclusions / Experience Features */}
      <section className="estate-perks-section bg-stone-50 py-20 border-t border-b border-line">
        <div className="wrap">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="eyebrow">The St. Lachland Standard</span>
            <h3 className="display">Every Stay Includes</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="perk-card">
              <div className="perk-icon-wrap">
                <Coffee size={24} className="text-emerald" />
              </div>
              <h4 className="font-serif font-bold text-lg mb-2 text-emerald">Artisan Tea Tasting</h4>
              <p className="text-xs text-stone-600">Daily afternoon Ceylon tea and sunset refreshments curated by our sommelier.</p>
            </div>

            <div className="perk-card">
              <div className="perk-icon-wrap">
                <Sparkles size={24} className="text-gold" />
              </div>
              <h4 className="font-serif font-bold text-lg mb-2 text-emerald">Dedicated Butler Care</h4>
              <p className="text-xs text-stone-600">Discreet 24-hour coastal resort concierge and pressing services.</p>
            </div>

            <div className="perk-card">
              <div className="perk-icon-wrap">
                <Compass size={24} className="text-emerald" />
              </div>
              <h4 className="font-serif font-bold text-lg mb-2 text-emerald">Coastal &amp; Lagoon Tours</h4>
              <p className="text-xs text-stone-600">Guided sunset beach walks and Negombo lagoon catamaran boat tours.</p>
            </div>

            <div className="perk-card">
              <div className="perk-icon-wrap">
                <Shield size={24} className="text-emerald" />
              </div>
              <h4 className="font-serif font-bold text-lg mb-2 text-emerald">Flexible Cancellation</h4>
              <p className="text-xs text-stone-600">Peace-of-mind reservation management up to 24 hours prior to check-in.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
