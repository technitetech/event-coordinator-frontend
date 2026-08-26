"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Maximize2, Check, ArrowRight } from "lucide-react";

// Local venue-photo fallbacks — external Unsplash URLs are unreliable
// and blocking on first render, so map each room type to an on-disk
// image we already ship in /public/images.
const LOCAL_ROOM_IMAGES = {
  "deluxe-garden": "/images/venue-garden.jpg",
  "deluxe-mountain": "/images/venue-spa.jpg",
  "junior-suite": "/images/venue-dining.jpg",
  "grand-suite": "/images/venue-ballroom.jpg",
  "heritage-villa": "/images/venue-grand-hall.jpg",
};

export default function RoomCard({ roomType, availability, checkIn, checkOut }) {
  const isAvailable = availability ? availability.available > 0 : true;
  const availCount = availability ? availability.available : null;

  const amenities = roomType.amenities_json || [];

  const bgImage = LOCAL_ROOM_IMAGES[roomType.slug] || LOCAL_ROOM_IMAGES["deluxe-garden"];

  const queryParams = new URLSearchParams();
  if (checkIn) queryParams.set("checkIn", checkIn);
  if (checkOut) queryParams.set("checkOut", checkOut);
  const bookHref = `/rooms/book?roomTypeId=${roomType.id}${queryParams.toString() ? `&${queryParams.toString()}` : ""}`;

  return (
    <article className="room-card group">
      <div className="room-card-media">
        <Image
          src={bgImage}
          alt={roomType.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px"
          quality={70}
          className="room-card-img"
          style={{ objectFit: "cover" }}
        />
        <div className="room-card-badge">
          {isAvailable ? (
            <span className="status-badge available">
              {availCount !== null ? `${availCount} Available` : "Available"}
            </span>
          ) : (
            <span className="status-badge unavailable">Fully Booked</span>
          )}
        </div>
      </div>

      <div className="room-card-body">
        <div className="room-card-header">
          <div>
            <h3 className="room-title">{roomType.name}</h3>
            {roomType.tagline && <p className="room-tagline">{roomType.tagline}</p>}
          </div>
          <div className="room-rate">
            <span className="rate-amount">LKR {Number(roomType.base_rate_per_night).toLocaleString()}</span>
            <span className="rate-period">/ night</span>
          </div>
        </div>

        <div className="room-specs">
          <div className="spec-item">
            <Users size={15} />
            <span>Up to {roomType.max_occupancy} Guests</span>
          </div>
          {roomType.size_sqm && (
            <div className="spec-item">
              <Maximize2 size={15} />
              <span>{roomType.size_sqm} m²</span>
            </div>
          )}
        </div>

        <p className="room-desc">{roomType.description}</p>

        {amenities.length > 0 && (
          <div className="room-amenities">
            {amenities.slice(0, 4).map((a, i) => (
              <span key={i} className="amenity-chip">
                <Check size={12} className="amenity-check" />
                {a}
              </span>
            ))}
            {amenities.length > 4 && (
              <span className="amenity-more">+{amenities.length - 4} more</span>
            )}
          </div>
        )}

        <div className="room-card-actions">
          <Link href={`/rooms/${roomType.slug}`} className="btn btn-ghost btn-sm">
            View Details
          </Link>
          <Link
            href={bookHref}
            className={`btn btn-solid btn-sm ${!isAvailable ? "disabled" : ""}`}
            aria-disabled={!isAvailable}
          >
            <span>Reserve Now</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
