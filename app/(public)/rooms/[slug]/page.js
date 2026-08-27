import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getRoomTypeBySlug, getRoomTypes } from "../../../../lib/rooms";
import { Users, Maximize2, Check, ArrowLeft, ArrowRight, Shield, Clock, Award } from "lucide-react";

const ROOM_GALLERY = {
  "deluxe-garden":  ["/images/venue-garden.jpg", "/images/venue-dining.jpg", "/images/venue-spa.jpg"],
  "deluxe-mountain":["/images/venue-spa.jpg",    "/images/hero-bg.jpg",      "/images/venue-garden.jpg"],
  "junior-suite":   ["/images/venue-dining.jpg", "/images/venue-ballroom.jpg","/images/venue-garden.jpg"],
  "grand-suite":    ["/images/venue-ballroom.jpg","/images/venue-grand-hall.jpg","/images/venue-dining.jpg"],
  "heritage-villa": ["/images/venue-grand-hall.jpg","/images/venue-ballroom.jpg","/images/hero-bg.jpg"],
};

export async function generateMetadata({ params }) {
  const room = await getRoomTypeBySlug(params.slug);
  if (!room) return { title: "Room Not Found — St. Lachland Hotel" };
  return {
    title: `${room.name} — St. Lachland Hotel`,
    description: room.tagline || room.description,
  };
}

export default async function RoomDetailPage({ params }) {
  const room = await getRoomTypeBySlug(params.slug);
  if (!room) notFound();

  const allRooms = await getRoomTypes();
  const otherRooms = allRooms.filter((r) => r.slug !== room.slug).slice(0, 2);

  const images = ROOM_GALLERY[room.slug] || ROOM_GALLERY["deluxe-garden"];
  const amenities = room.amenities_json || [];

  return (
    <main className="room-detail-page">
      {/* Top Nav Breadcrumb */}
      <div className="wrap py-6">
        <Link href="/rooms" className="inline-flex items-center gap-2 text-sm text-mist hover:text-emerald">
          <ArrowLeft size={16} />
          <span>Back to Accommodation Collection</span>
        </Link>
      </div>

      {/* Gallery Grid */}
      <section className="room-gallery-section">
        <div className="wrap">
          <div className="gallery-grid">
            <div className="gallery-main">
              <Image
                src={images[0]}
                alt={`${room.name} Master View`}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
                quality={78}
                className="gallery-img-main"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="gallery-sub">
              {images.slice(1, 3).map((img, i) => (
                <div key={i} className="gallery-sub-frame">
                  <Image
                    src={img}
                    alt={`${room.name} Detail ${i + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 30vw"
                    quality={70}
                    className="gallery-img-sub"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content + Sticky Booking Box */}
      <section className="room-detail-body py-16">
        <div className="wrap grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Main Info (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <span className="eyebrow">Beachfront Sanctuary</span>
              <h1 className="display text-3xl md:text-4xl text-emerald mb-3">{room.name}</h1>
              {room.tagline && <p className="text-lg text-mist italic font-serif">{room.tagline}</p>}
            </div>

            {/* Quick Specs */}
            <div className="flex flex-wrap gap-6 p-4 bg-stone-50 border border-line rounded-lg text-sm">
              <div className="flex items-center gap-2 text-stone-700">
                <Users size={18} className="text-emerald" />
                <span>Max {room.max_occupancy} Guests</span>
              </div>
              {room.size_sqm && (
                <div className="flex items-center gap-2 text-stone-700">
                  <Maximize2 size={18} className="text-emerald" />
                  <span>{room.size_sqm} m² Floor Space</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-stone-700">
                <Award size={18} className="text-gold" />
                <span>Coastal Tea &amp; Sunset Inclusions</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-serif text-xl font-bold text-emerald mb-3">About this Sanctuary</h3>
              <p className="text-stone-700 leading-relaxed text-base">{room.description}</p>
            </div>

            {/* Full Amenities */}
            <div>
              <h3 className="font-serif text-xl font-bold text-emerald mb-4">Curated Room Amenities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white border border-line rounded-md text-sm">
                    <Check size={16} className="text-emerald shrink-0" />
                    <span className="text-stone-800">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Policies */}
            <div className="p-6 bg-stone-50 border border-line rounded-lg space-y-4 text-xs text-stone-600">
              <h4 className="font-serif font-bold text-sm text-emerald">Stay Policies &amp; Terms</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-emerald shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-800">Check-in / Check-out</strong>
                    <span>Check-in: 14:00 · Check-out: 11:00</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield size={16} className="text-emerald shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-800">Cancellation Policy</strong>
                    <span>Full refund if cancelled at least 24 hours prior to check-in.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Booking Sidebar (Right 1 col) */}
          <div className="sticky top-28 bg-white border border-line rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-baseline mb-6 pb-4 border-b border-line">
              <div>
                <span className="text-xs uppercase text-mist font-semibold tracking-wider">Nightly Rate</span>
                <div className="font-serif text-2xl font-bold text-emerald">
                  LKR {Number(room.base_rate_per_night).toLocaleString()}
                </div>
              </div>
              <span className="text-xs text-stone-500">Excl. statutory taxes</span>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-xs text-stone-600">
                Direct booking benefits include complimentary Ceylon high tea, priority dining reservations, and late check-out upon availability.
              </p>
            </div>

            <Link
              href={`/rooms/book?roomTypeId=${room.id}`}
              className="btn btn-solid w-full justify-center text-center py-3"
            >
              <span>Reserve this Sanctuary</span>
              <ArrowRight size={16} />
            </Link>

            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-1 text-2xs text-stone-400">
                <span className="material-symbols-outlined text-xs leading-none">lock</span>
                <span>Instant confirmation · Secure reservation</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Other Rooms Suggestions */}
      {otherRooms.length > 0 && (
        <section className="py-16 bg-stone-50 border-t border-line">
          <div className="wrap">
            <h3 className="display text-2xl text-emerald mb-8 text-center">Explore Other Sanctuaries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {otherRooms.map((r) => (
                <div key={r.id} className="p-6 bg-white border border-line rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-serif font-bold text-lg text-emerald">{r.name}</h4>
                    <span className="text-xs text-mist">LKR {Number(r.base_rate_per_night).toLocaleString()} / night</span>
                  </div>
                  <Link href={`/rooms/${r.slug}`} className="btn btn-ghost btn-sm">
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
