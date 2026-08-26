"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export default function TestimonialCarousel({ testimonials }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".testimonial-card")?.offsetWidth || 320;
    const newIndex = Math.max(0, Math.min(testimonials.length - 1, activeIndex + dir));
    setActiveIndex(newIndex);
    el.scrollTo({ left: newIndex * (cardWidth + 24), behavior: "smooth" });
  };

  return (
    <div className="testimonial-carousel-wrap">
      <button className="carousel-arrow carousel-arrow-left" onClick={() => scroll(-1)} aria-label="Previous testimonial">
        <ChevronLeft size={24} strokeWidth={1.5} />
      </button>
      <div className="testimonial-carousel" ref={scrollRef}>
        {testimonials.map((t, i) => (
          <div key={i} className="testimonial-card" id={`testimonial-${i}`}>
            <div className="testimonial-stars">
              {[...Array(5)].map((_, s) => (
                <Star key={s} size={16} fill="currentColor" strokeWidth={0} className="star-filled" />
              ))}
            </div>
            <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">{t.avatar}</div>
              <div>
                <strong>{t.name}</strong>
                <span>{t.event}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="carousel-arrow carousel-arrow-right" onClick={() => scroll(1)} aria-label="Next testimonial">
        <ChevronRight size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
}
