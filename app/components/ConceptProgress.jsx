"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { ANGLES } from "../../lib/design-prompt";

// Typical end-to-end render time. Used only to pace the progress bar's
// asymptotic curve — the bar never reaches 100% until the fetch actually
// resolves, so a slow render degrades gracefully instead of stalling at "done".
const EXPECTED_SECONDS = 28;

const STAGES = [
  "Composing scene geometry",
  "Resolving material and fabric textures",
  "Simulating lighting and shadow falloff",
  "Rendering synchronized perspectives",
  "Upscaling and colour grading",
];

export default function ConceptProgress({ count = ANGLES.length }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - started) / 1000), 200);
    return () => clearInterval(id);
  }, []);

  // Asymptotic: fast at first, then creeps — caps at 95% until real completion.
  const pct = Math.min(95, 95 * (1 - Math.exp(-elapsed / (EXPECTED_SECONDS / 2.5))));
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(elapsed / (EXPECTED_SECONDS / STAGES.length)))];

  return (
    <div>
      {/* Status line */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--emerald, #1A3C34)" }}>
          <Sparkles size={14} style={{ animation: "cp-pulse 1.6s ease-in-out infinite" }} />
          {stage}…
        </span>
        <span style={{ fontSize: 11, color: "#a8a29e", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(pct)}% · {elapsed.toFixed(0)}s
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#e7e5e4", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--emerald, #1A3C34)", borderRadius: 999, transition: "width .3s linear" }} />
      </div>

      {/* Skeleton tiles — one per perspective being rendered */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            <div
              style={{
                aspectRatio: "16 / 9",
                borderRadius: 10,
                background: "linear-gradient(100deg, #f5f5f4 30%, #e7e5e4 50%, #f5f5f4 70%)",
                backgroundSize: "200% 100%",
                animation: `cp-shimmer 1.6s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
            <span style={{ display: "block", textAlign: "center", fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
              {ANGLES[i]?.label ?? `Perspective ${i + 1}`}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "#a8a29e", textAlign: "center", marginTop: 12, fontStyle: "italic" }}>
        Rendering {count} synchronized perspectives — this usually takes 20–40 seconds.
      </p>
    </div>
  );
}
