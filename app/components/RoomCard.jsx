"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Maximize2, Check, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const LOCAL_ROOM_IMAGES = {
  "deluxe-garden":   "/images/venue-garden.jpg",
  "deluxe-mountain": "/images/venue-spa.jpg",
  "junior-suite":    "/images/venue-dining.jpg",
  "grand-suite":     "/images/venue-ballroom.jpg",
  "heritage-villa":  "/images/venue-grand-hall.jpg",
};

const FALLBACK = Object.values(LOCAL_ROOM_IMAGES)[0];

export default function RoomCard({ roomType, availability, checkIn, checkOut }) {
  const isAvailable = availability ? availability.available > 0 : true;
  const availCount  = availability ? availability.available : null;
  const amenities   = roomType.amenities_json || [];

  const dbImages = Array.isArray(roomType.images_json) ? roomType.images_json.filter(Boolean) : [];
  const images   = dbImages.length > 0 ? dbImages : [LOCAL_ROOM_IMAGES[roomType.slug] || FALLBACK];

  const [idx, setIdx] = useState(0);

  const queryParams = new URLSearchParams();
  if (checkIn)  queryParams.set("checkIn",  checkIn);
  if (checkOut) queryParams.set("checkOut", checkOut);
  const bookHref = `/rooms/book?roomTypeId=${roomType.id}${queryParams.toString() ? `&${queryParams}` : ""}`;

  return (
    <article style={{
      background: "#fff",
      border: "1px solid #e7e5e4",
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "box-shadow .2s, transform .2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {/* ── Image carousel ── */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", overflow: "hidden", background: "#e7e5e4", flexShrink: 0 }}>
        {/* Sliding strip */}
        <div style={{ display: "flex", width: "100%", height: "100%", transition: "transform .35s cubic-bezier(.4,0,.2,1)", transform: `translateX(-${idx * 100}%)` }}>
          {images.map((src, i) => (
            <img key={src + i} src={src} alt={`${roomType.name} — photo ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              style={{ width: "100%", height: "100%", objectFit: "cover", flexShrink: 0 }} />
          ))}
        </div>

        {/* Prev arrow */}
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)} aria-label="Previous photo"
            style={{ position: "absolute", top: "50%", left: 10, transform: "translateY(-50%)", width: 32, height: 32, background: "rgba(255,255,255,.92)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.15)", zIndex: 2 }}>
            <ChevronLeft size={16} />
          </button>
        )}
        {/* Next arrow */}
        {idx < images.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)} aria-label="Next photo"
            style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", width: 32, height: 32, background: "rgba(255,255,255,.92)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.15)", zIndex: 2 }}>
            <ChevronRight size={16} />
          </button>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 2 }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Photo ${i + 1}`}
                style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,.45)", border: "none", cursor: "pointer", padding: 0, transform: i === idx ? "scale(1.35)" : "none", transition: "all .15s" }} />
            ))}
          </div>
        )}

        {/* Availability badge */}
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, backdropFilter: "blur(6px)", background: isAvailable ? "rgba(16,185,129,.88)" : "rgba(239,68,68,.88)", color: "#fff" }}>
            {isAvailable ? (availCount !== null ? `${availCount} Available` : "Available") : "Fully Booked"}
          </span>
        </div>

        {/* Photo count */}
        {images.length > 1 && (
          <span style={{ position: "absolute", bottom: 8, right: 10, zIndex: 2, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.9)", background: "rgba(0,0,0,.45)", padding: "2px 7px", borderRadius: 999 }}>
            {idx + 1} / {images.length}
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "18px 18px 18px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1c1917", lineHeight: 1.2, margin: 0 }}>{roomType.name}</h3>
            {roomType.tagline && <p style={{ fontSize: 12, color: "#78716c", marginTop: 3, marginBottom: 0 }}>{roomType.tagline}</p>}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: "var(--emerald, #1A3C34)" }}>
              LKR {Number(roomType.base_rate_per_night).toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: "#a8a29e" }}>/ night</span>
          </div>
        </div>

        {/* Specs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#78716c" }}>
            <Users size={14} /> Up to {roomType.max_occupancy} guests
          </span>
          {roomType.size_sqm && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#78716c" }}>
              <Maximize2 size={14} /> {roomType.size_sqm} m²
            </span>
          )}
        </div>

        {/* Description */}
        {roomType.description && (
          <p style={{ fontSize: 13, color: "#57534e", lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {roomType.description}
          </p>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {amenities.slice(0, 4).map((a, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#57534e", background: "#f5f5f4", padding: "3px 8px", borderRadius: 6, border: "1px solid #e7e5e4" }}>
                <Check size={11} style={{ color: "var(--emerald, #1A3C34)" }} /> {a}
              </span>
            ))}
            {amenities.length > 4 && <span style={{ fontSize: 11, color: "#a8a29e", alignSelf: "center" }}>+{amenities.length - 4} more</span>}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4 }}>
          <Link href={`/rooms/${roomType.slug}`}
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1.5px solid #d6d3d1", color: "#44403c", background: "#fff", transition: "all .15s", whiteSpace: "nowrap" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--emerald, #1A3C34)"; e.currentTarget.style.color = "var(--emerald, #1A3C34)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d6d3d1"; e.currentTarget.style.color = "#44403c"; }}
          >
            View Details
          </Link>
          <Link href={bookHref}
            aria-disabled={!isAvailable}
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none", background: isAvailable ? "var(--emerald, #1A3C34)" : "#a8a29e", color: "#fff", border: "1.5px solid transparent", transition: "all .15s", whiteSpace: "nowrap", pointerEvents: isAvailable ? "auto" : "none" }}
            onMouseEnter={e => isAvailable && (e.currentTarget.style.opacity = ".88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Reserve Now <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
