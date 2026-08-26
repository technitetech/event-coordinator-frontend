"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart, Star, MapPin, Users, ArrowRight } from "lucide-react";

export default function VenueCarousel({ venues }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".venue-card")?.offsetWidth || 320;
    el.scrollBy({ left: dir * (cardWidth + 24), behavior: "smooth" });
  };

  return (
    <div className="venue-carousel-wrap">
      <button className="carousel-arrow carousel-arrow-left" onClick={() => scroll(-1)} aria-label="Scroll left">
        <ChevronLeft size={24} strokeWidth={1.5} />
      </button>
      <div className="venue-carousel" ref={scrollRef}>
        {venues.map((v) => (
          <Link href="/events" key={v.name} className="venue-card" id={`venue-${v.name.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="venue-card-img">
              <Image
                src={v.img}
                alt={v.name}
                fill
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 340px"
                quality={70}
                style={{ objectFit: "cover" }}
              />
              <div className="venue-card-badge">{v.badge}</div>
              <button className="venue-card-fav" aria-label="Save venue" onClick={(e) => e.preventDefault()}>
                <Heart size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="venue-card-body">
              <div className="venue-card-rating">
                <Star size={14} fill="currentColor" strokeWidth={0} className="star-icon" />
                <span>{v.rating}</span>
              </div>
              <h3>{v.name}</h3>
              <p className="venue-card-caption">
                <MapPin size={14} strokeWidth={2} className="loc-icon" />
                {v.caption}
              </p>
              <div className="venue-card-meta">
                <span className="venue-card-capacity">
                  <Users size={14} strokeWidth={2} />
                  {v.capacity}
                </span>
              </div>
              <div className="venue-card-foot">
                <span className="venue-card-price">
                  LKR {v.price}
                  <span> / event</span>
                </span>
                <span className="venue-card-link">
                  View details <ArrowRight size={16} strokeWidth={2} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <button className="carousel-arrow carousel-arrow-right" onClick={() => scroll(1)} aria-label="Scroll right">
        <ChevronRight size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
}
