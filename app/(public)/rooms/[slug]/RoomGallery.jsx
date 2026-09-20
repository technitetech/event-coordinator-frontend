"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

export default function RoomGallery({ images, name }) {
  const [activeIdx, setActiveIdx]   = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const prev = (e) => { e.stopPropagation(); setActiveIdx(i => Math.max(0, i - 1)); };
  const next = (e) => { e.stopPropagation(); setActiveIdx(i => Math.min(images.length - 1, i + 1)); };

  const lbPrev = () => setLightboxIdx(i => Math.max(0, i - 1));
  const lbNext = () => setLightboxIdx(i => Math.min(images.length - 1, i + 1));

  return (
    <>
      {/* ── Main gallery ── */}
      <div style={{ display: "grid", gridTemplateColumns: images.length > 1 ? "1fr 1fr" : "1fr", gridTemplateRows: "420px", gap: 4, borderRadius: 16, overflow: "hidden" }}>
        {/* Hero image */}
        <div
          style={{ position: "relative", gridRow: "1", gridColumn: images.length > 1 ? "1" : "1 / span 2", overflow: "hidden", cursor: "zoom-in", background: "#1c1917" }}
          onClick={() => setLightboxIdx(0)}
        >
          <img src={images[activeIdx] || images[0]} alt={`${name} — main view`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .4s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          />
          {/* Main nav arrows */}
          {images.length > 1 && (
            <>
              {activeIdx > 0 && (
                <button onClick={prev} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "rgba(255,255,255,.9)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,.2)" }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              {activeIdx < images.length - 1 && (
                <button onClick={next} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "rgba(255,255,255,.9)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,.2)" }}>
                  <ChevronRight size={18} />
                </button>
              )}
            </>
          )}
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, display: "flex", alignItems: "center", gap: 5 }}>
            <ZoomIn size={12} /> {activeIdx + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail strip — right column, up to 3 thumbnails */}
        {images.length > 1 && (
          <div style={{ display: "grid", gridTemplateRows: `repeat(${Math.min(images.length - 1, 3)}, 1fr)`, gap: 4 }}>
            {images.slice(1, 4).map((src, i) => {
              const realIdx = i + 1;
              const isMore  = realIdx === 3 && images.length > 4;
              return (
                <div key={src + i}
                  onClick={() => { setActiveIdx(realIdx); setLightboxIdx(realIdx); }}
                  style={{ position: "relative", overflow: "hidden", cursor: "pointer", background: "#1c1917" }}
                >
                  <img src={src} alt={`${name} photo ${realIdx + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: activeIdx === realIdx ? 1 : 0.82, transition: "transform .3s, opacity .2s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = activeIdx === realIdx ? "1" : "0.82"; }}
                  />
                  {isMore && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                      +{images.length - 4} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <button onClick={() => setLightboxIdx(null)}
            style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <X size={20} />
          </button>
          <button onClick={e => { e.stopPropagation(); lbPrev(); }}
            disabled={lightboxIdx === 0}
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", opacity: lightboxIdx === 0 ? .3 : 1 }}>
            <ChevronLeft size={22} />
          </button>
          <img
            src={images[lightboxIdx]}
            alt={`${name} — full view`}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}
          />
          <button onClick={e => { e.stopPropagation(); lbNext(); }}
            disabled={lightboxIdx === images.length - 1}
            style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", opacity: lightboxIdx === images.length - 1 ? .3 : 1 }}>
            <ChevronRight size={22} />
          </button>
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setLightboxIdx(i); }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: i === lightboxIdx ? "#fff" : "rgba(255,255,255,.35)", border: "none", cursor: "pointer", padding: 0 }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
