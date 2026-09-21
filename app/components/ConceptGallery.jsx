"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Download, Maximize2, AlertCircle } from "lucide-react";

// Renders are issued one at a time server-side, so a slot is either waiting its
// turn, actively rendering, finished, or failed. Each tile reflects its own
// state rather than a single global spinner.
const STAGES = ["Composing geometry", "Resolving textures", "Simulating lighting", "Upscaling output"];
const STAGE_EVERY = 7; // seconds per stage label while a tile renders
const RING = 2 * Math.PI * 22;

function Ring({ pct }) {
  return (
    <svg width="54" height="54" viewBox="0 0 52 52" style={{ display: "block" }}>
      <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="3" />
      <circle cx="26" cy="26" r="22" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={RING} strokeDashoffset={RING * (1 - pct / 100)}
        transform="rotate(-90 26 26)" style={{ transition: "stroke-dashoffset .4s linear" }} />
      <text x="26" y="26" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="12" fontWeight="700">
        {Math.round(pct)}
      </text>
    </svg>
  );
}

function QueuedMark() {
  return (
    <svg width="54" height="54" viewBox="0 0 52 52" style={{ display: "block", opacity: .5 }}>
      <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="3" strokeDasharray="4 6" />
    </svg>
  );
}

export default function ConceptGallery({ slots = [], generating = false }) {
  const [loaded, setLoaded]     = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [tick, setTick]         = useState(0);

  // Single clock drives the ring on whichever tile is currently rendering.
  const activeKey = slots.find(s => s.status === "rendering")?.key ?? null;
  useEffect(() => {
    if (!activeKey) return;
    setTick(0);
    const started = Date.now();
    const id = setInterval(() => setTick((Date.now() - started) / 1000), 250);
    return () => clearInterval(id);
  }, [activeKey]);

  const ready = slots.filter(s => s.url && loaded[s.url]);
  const done  = slots.filter(s => s.status === "done").length;

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = e => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setLightbox(i => Math.min(ready.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, ready.length]);

  if (slots.length === 0) return null;

  // Asymptotic toward 95% — never claims done before the file actually arrives.
  const pct   = Math.min(95, 95 * (1 - Math.exp(-tick / 11)));
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(tick / STAGE_EVERY))];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {slots.map((slot, i) => {
          const isReady  = slot.url && loaded[slot.url];
          const isError  = slot.status === "error";
          const readyIdx = ready.findIndex(r => r.key === slot.key);

          return (
            <div key={slot.key}>
              <div
                onClick={() => isReady && setLightbox(readyIdx)}
                style={{
                  position: "relative", width: "100%", aspectRatio: "16 / 9",
                  borderRadius: 10, overflow: "hidden", background: "#f5f5f4",
                  cursor: isReady ? "zoom-in" : "default",
                }}
              >
                {slot.url && (
                  <img
                    key={slot.url}
                    src={slot.url}
                    alt={`${slot.label} perspective of the venue`}
                    onLoad={() => setLoaded(m => ({ ...m, [slot.url]: true }))}
                    onError={() => setLoaded(m => ({ ...m, [slot.url]: true }))}
                    style={{
                      width: "100%", height: "100%", objectFit: "cover", display: "block",
                      transition: "opacity .5s ease, filter .5s ease, transform .3s",
                      opacity: isReady ? 1 : 0, filter: isReady ? "none" : "blur(12px)",
                    }}
                    onMouseEnter={e => { if (isReady) e.currentTarget.style.transform = "scale(1.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                  />
                )}

                {!isReady && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                    background: isError
                      ? "linear-gradient(160deg, #7f1d1d, #991b1b)"
                      : "linear-gradient(100deg, rgba(26,60,52,.94) 30%, rgba(38,82,70,.94) 50%, rgba(26,60,52,.94) 70%)",
                    backgroundSize: isError ? "auto" : "200% 100%",
                    animation: isError ? "none" : `cp-shimmer 2s ease-in-out ${i * 0.15}s infinite`,
                  }}>
                    {isError ? <AlertCircle size={26} color="#fff" />
                      : slot.status === "rendering" ? <Ring pct={pct} />
                      : slot.url ? <Ring pct={95} />
                      : <QueuedMark />}

                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.92)", letterSpacing: ".03em", textAlign: "center", padding: "0 10px", lineHeight: 1.4 }}>
                      {isError ? (slot.error || "Render failed")
                        : slot.status === "rendering" ? `${stage}…`
                        : slot.url ? "Loading render…"
                        : `Queued · position ${i + 1}`}
                    </span>
                  </div>
                )}

                {isReady && (
                  <span style={{ position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: 6, background: "rgba(0,0,0,.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <Maximize2 size={12} />
                  </span>
                )}
              </div>

              <span style={{ display: "block", textAlign: "center", fontSize: 11, color: isReady ? "#78716c" : "#a8a29e", marginTop: 5 }}>
                {slot.label}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: "#a8a29e", textAlign: "center", marginTop: 10, fontStyle: "italic" }}>
        {generating
          ? `Rendering one at a time to stay within the free quota — ${done} of ${slots.length} complete`
          : `${ready.length} of ${slots.length} perspectives rendered · tap any render for full resolution`}
      </p>

      {lightbox !== null && ready[lightbox] && (
        <div onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.93)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <button onClick={() => setLightbox(null)} aria-label="Close"
            style={{ position: "absolute", top: 14, right: 14, width: 40, height: 40, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <X size={20} />
          </button>

          <a href={ready[lightbox].url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="Open original"
            style={{ position: "absolute", top: 14, right: 62, width: 40, height: 40, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Download size={18} />
          </a>

          {lightbox > 0 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(i => i - 1); }} aria-label="Previous"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <ChevronLeft size={22} />
            </button>
          )}
          {lightbox < ready.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(i => i + 1); }} aria-label="Next"
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <ChevronRight size={22} />
            </button>
          )}

          <figure onClick={e => e.stopPropagation()} style={{ margin: 0, maxWidth: "92vw", maxHeight: "88vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <img src={ready[lightbox].url} alt={`${ready[lightbox].label} — full view`}
              style={{ maxWidth: "100%", maxHeight: "78vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 24px 64px rgba(0,0,0,.6)" }} />
            <figcaption style={{ color: "rgba(255,255,255,.75)", fontSize: 13, textAlign: "center" }}>
              {ready[lightbox].label}
              <span style={{ color: "rgba(255,255,255,.4)", marginLeft: 8 }}>{lightbox + 1} / {ready.length}</span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
