"use client";

/**
 * RadarChart — 5-objective score visualization using Canvas API.
 * Draws a pentagon radar chart showing Cost, Quality, Availability, Weather, Preference.
 */
import { useEffect, useRef } from "react";

const LABELS = ["Cost", "Quality", "Availability", "Weather", "Preference"];

export default function RadarChart({ scores = [], size = 200, color = "#1a3c34" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38; // radius of the outer ring
    const n = LABELS.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2; // top

    ctx.clearRect(0, 0, size, size);

    // Draw grid rings (20%, 40%, 60%, 80%, 100%)
    for (let ring = 1; ring <= 5; ring++) {
      const rr = (ring / 5) * r;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + rr * Math.cos(angle);
        const y = cy + rr * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = ring === 5 ? "rgba(26,60,52,0.25)" : "rgba(26,60,52,0.08)";
      ctx.lineWidth = ring === 5 ? 1.5 : 0.5;
      ctx.stroke();
    }

    // Draw axis lines
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      ctx.strokeStyle = "rgba(26,60,52,0.12)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Draw score polygon (filled)
    if (scores.length === n) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const idx = i % n;
        const angle = startAngle + idx * angleStep;
        const val = Math.max(0, Math.min(1, scores[idx]));
        const x = cx + val * r * Math.cos(angle);
        const y = cy + val * r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = `${color}22`; // 13% opacity fill
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw dots at each vertex
      for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const val = Math.max(0, Math.min(1, scores[i]));
        const x = cx + val * r * Math.cos(angle);
        const y = cy + val * r * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Draw labels
    ctx.font = "600 11px var(--font-body, Manrope, sans-serif)";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      const labelR = r + 20;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);
      ctx.fillText(LABELS[i], x, y);

      // Score percentage under label
      if (scores[i] !== undefined) {
        ctx.font = "500 10px var(--font-body, Manrope, sans-serif)";
        ctx.fillStyle = color;
        ctx.fillText(`${Math.round(scores[i] * 100)}%`, x, y + 13);
        ctx.font = "600 11px var(--font-body, Manrope, sans-serif)";
        ctx.fillStyle = "#333";
      }
    }
  }, [scores, size, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      aria-label={`Radar chart showing scores: ${LABELS.map((l, i) => `${l}: ${Math.round((scores[i] || 0) * 100)}%`).join(", ")}`}
    />
  );
}
