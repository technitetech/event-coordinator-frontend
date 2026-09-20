"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Download, Maximize2 } from "lucide-react";
import { ANGLES } from "../../lib/design-prompt";

export default function ConceptGallery({ images }) {
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = e => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setLightbox(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, images.length]);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {images.map((img, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setLightbox(i)}
              style={{ display: "block", width: "100%", padding: 0, border: "none", background: "none", cursor: "zoom-in", position: "relative", borderRadius: 10, overflow: "hidden", lineHeight: 0 }}
            >
              <img
                src={img}
                alt={`${ANGLES[i]?.label ?? "Concept"} perspective of the venue`}
                loading="lazy"
                style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block", background: "#f5f5f4", transition: "transform .3s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              />
              <span style={{ position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: 6, background: "rgba(0,0,0,.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Maximize2 size={12} />
              </span>
            </button>
            <span style={{ display: "block", textAlign: "center", fontSize: 11, color: "#78716c", marginTop: 5 }}>
              {ANGLES[i]?.label ?? `Perspective ${i + 1}`}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "#a8a29e", textAlign: "center", marginTop: 10, fontStyle: "italic" }}>
        {images.length} synchronized perspectives · tap any render for full resolution
      </p>

      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.93)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <button onClick={() => setLightbox(null)} aria-label="Close"
            style={{ position: "absolute", top: 14, right: 14, width: 40, height: 40, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <X size={20} />
          </button>

          <a href={images[lightbox]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="Open original"
            style={{ position: "absolute", top: 14, right: 62, width: 40, height: 40, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Download size={18} />
          </a>

          {lightbox > 0 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(i => i - 1); }} aria-label="Previous"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <ChevronLeft size={22} />
            </button>
          )}
          {lightbox < images.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(i => i + 1); }} aria-label="Next"
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <ChevronRight size={22} />
            </button>
          )}

          <figure onClick={e => e.stopPropagation()} style={{ margin: 0, maxWidth: "92vw", maxHeight: "88vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <img src={images[lightbox]} alt={`${ANGLES[lightbox]?.label ?? "Concept"} — full view`}
              style={{ maxWidth: "100%", maxHeight: "78vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 24px 64px rgba(0,0,0,.6)" }} />
            <figcaption style={{ color: "rgba(255,255,255,.75)", fontSize: 13, textAlign: "center" }}>
              {ANGLES[lightbox]?.label ?? `Perspective ${lightbox + 1}`}
              <span style={{ color: "rgba(255,255,255,.4)", marginLeft: 8 }}>{lightbox + 1} / {images.length}</span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
