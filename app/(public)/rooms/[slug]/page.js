import { notFound } from "next/navigation";
import Link from "next/link";
import { getRoomTypeBySlug, getRoomTypes } from "../../../../lib/rooms";
import { Users, Maximize2, Check, ArrowLeft, ArrowRight, Shield, Clock, Award, Star } from "lucide-react";
import RoomGallery from "./RoomGallery";

const LOCAL_GALLERY = {
  "deluxe-garden":   ["/images/venue-garden.jpg",    "/images/venue-dining.jpg",    "/images/venue-spa.jpg"],
  "deluxe-mountain": ["/images/venue-spa.jpg",       "/images/hero-bg.jpg",         "/images/venue-garden.jpg"],
  "junior-suite":    ["/images/venue-dining.jpg",    "/images/venue-ballroom.jpg",  "/images/venue-garden.jpg"],
  "grand-suite":     ["/images/venue-ballroom.jpg",  "/images/venue-grand-hall.jpg","/images/venue-dining.jpg"],
  "heritage-villa":  ["/images/venue-grand-hall.jpg","/images/venue-ballroom.jpg",  "/images/hero-bg.jpg"],
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
  const otherRooms = allRooms.filter(r => r.slug !== room.slug).slice(0, 3);

  const dbImages    = Array.isArray(room.images_json) ? room.images_json.filter(Boolean) : [];
  const localImages = LOCAL_GALLERY[room.slug] || LOCAL_GALLERY["deluxe-garden"];
  // Merge: DB images first, then pad with local gallery images not already included
  const images = dbImages.length > 0
    ? [...dbImages, ...localImages.filter(l => !dbImages.includes(l))]
    : localImages;
  const amenities = room.amenities_json || [];

  return (
    <main style={{ background: "#fafaf9", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 8 }}>
        <Link href="/rooms" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#78716c", textDecoration: "none", fontWeight: 500 }}
        >
          <ArrowLeft size={15} /> Back to Accommodation Collection
        </Link>
      </div>

      {/* Gallery */}
      <section className="wrap" style={{ paddingBottom: 0 }}>
        <RoomGallery images={images} name={room.name} />
      </section>

      {/* Main content + sidebar */}
      <section className="wrap" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 48, alignItems: "start" }}>

          {/* ── Left: Room info ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {/* Title block */}
            <div>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--emerald)", marginBottom: 8 }}>Beachfront Sanctuary</span>
              <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#1c1917", lineHeight: 1.15, margin: "0 0 10px" }}>{room.name}</h1>
              {room.tagline && <p style={{ fontSize: 17, color: "#78716c", fontStyle: "italic", margin: 0 }}>{room.tagline}</p>}
            </div>

            {/* Quick specs strip */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[
                { icon: <Users size={16} />, text: `Up to ${room.max_occupancy} Guests` },
                room.size_sqm && { icon: <Maximize2 size={16} />, text: `${room.size_sqm} m² Floor Space` },
                { icon: <Award size={16} />, text: "Tea & Sunset Inclusions" },
                { icon: <Star size={16} />, text: "Direct Booking Benefits" },
              ].filter(Boolean).map((spec, i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "#fff", border: "1px solid #e7e5e4", borderRadius: 99, fontSize: 13, color: "#44403c", fontWeight: 500 }}>
                  <span style={{ color: "var(--emerald)" }}>{spec.icon}</span>
                  {spec.text}
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 16, padding: "28px 32px" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1c1917", marginBottom: 14 }}>About this Sanctuary</h2>
              <p style={{ fontSize: 15, color: "#57534e", lineHeight: 1.75, margin: 0 }}>{room.description}</p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 16, padding: "28px 32px" }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1c1917", marginBottom: 20 }}>Curated Room Amenities</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {amenities.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f9f8f6", border: "1px solid #f0ede9", borderRadius: 10, fontSize: 13, color: "#44403c" }}>
                      <Check size={15} style={{ color: "var(--emerald)", flexShrink: 0 }} />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            <div style={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 16, padding: "28px 32px" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1c1917", marginBottom: 20 }}>Stay Policies</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {[
                  { icon: <Clock size={18} />, title: "Check-in / Check-out", body: "Check-in from 14:00 · Check-out by 11:00" },
                  { icon: <Shield size={18} />, title: "Cancellation", body: "Full refund if cancelled 24 hours before arrival." },
                  { icon: <Users size={18} />, title: "Occupancy", body: `Maximum ${room.max_occupancy} guests per room.` },
                  { icon: <Award size={18} />, title: "Direct Benefits", body: "Best rate, priority dining & late checkout on request." },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--emerald)", flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1c1917", marginBottom: 3 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#78716c", lineHeight: 1.5 }}>{p.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Sticky booking card ── */}
          <div style={{ position: "sticky", top: 96 }}>
            <div style={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 20, padding: 28, boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #f0ede9" }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#a8a29e" }}>Nightly Rate</span>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "var(--emerald)", lineHeight: 1.1, marginTop: 4 }}>
                    LKR {Number(room.base_rate_per_night).toLocaleString()}
                  </div>
                  <span style={{ fontSize: 12, color: "#a8a29e" }}>per night, excl. taxes</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={13} fill="var(--gold, #C9A96E)" color="var(--gold, #C9A96E)" />)}
                  </div>
                  <span style={{ fontSize: 11, color: "#a8a29e", marginTop: 3, display: "block" }}>Luxury Rated</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {[
                  "Complimentary Ceylon High Tea",
                  "Priority Dining Reservations",
                  "Dedicated Butler Service",
                  "Late Check-out on Request",
                ].map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, color: "#44403c" }}>
                    <Check size={14} style={{ color: "var(--emerald)", flexShrink: 0 }} />
                    {b}
                  </div>
                ))}
              </div>

              <Link href={`/rooms/book?roomTypeId=${room.id}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px 20px", background: "var(--emerald, #1A3C34)", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: "none", marginBottom: 12, boxSizing: "border-box" }}
              >
                Reserve this Sanctuary <ArrowRight size={16} />
              </Link>

              <div style={{ textAlign: "center", fontSize: 11, color: "#a8a29e", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <Shield size={12} /> Instant confirmation · Secure reservation
              </div>
            </div>

            {/* Other rooms */}
            {otherRooms.length > 0 && (
              <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e7e5e4", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0ede9", fontSize: 12, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: ".07em" }}>
                  Other Sanctuaries
                </div>
                {otherRooms.map((r, i) => {
                  const thumb = Array.isArray(r.images_json) && r.images_json[0] ? r.images_json[0] : (LOCAL_GALLERY[r.slug]?.[0] || "/images/venue-garden.jpg");
                  return (
                    <Link key={r.id} href={`/rooms/${r.slug}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", textDecoration: "none", borderBottom: i < otherRooms.length - 1 ? "1px solid #f0ede9" : "none" }}
                    >
                      <img src={thumb} alt={r.name} style={{ width: 52, height: 40, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1c1917", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "var(--emerald)" }}>LKR {Number(r.base_rate_per_night).toLocaleString()} / night</div>
                      </div>
                      <ArrowRight size={14} color="#a8a29e" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
