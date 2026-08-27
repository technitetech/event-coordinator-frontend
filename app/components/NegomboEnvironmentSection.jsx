"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Compass, MapPin, Wind, Sun, Droplets, ShieldCheck, 
  Plane, Waves, Trees, Sparkles, ArrowUpRight, CheckCircle2 
} from "lucide-react";
import Reveal from "./Reveal.jsx";

// 3D Tilt Card Component for smooth 60fps interactive depth
function TiltCard({ children, className = "", style = {} }) {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0, hover: false });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x, y, hover: true });
  };

  const handleMouseLeave = () => {
    setCoords({ x: 0, y: 0, hover: false });
  };

  const rotX = coords.hover ? -coords.y * 12 : 0;
  const rotY = coords.hover ? coords.x * 12 : 0;
  const transZ = coords.hover ? 8 : 0;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`tilt-card-container ${className}`}
      style={{
        perspective: 1000,
        ...style,
      }}
    >
      <div
        className="tilt-card-inner"
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${transZ}px)`,
          transition: coords.hover ? "transform 0.1s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {children}
        {coords.hover && (
          <div
            className="tilt-specular-sheen"
            style={{
              background: `radial-gradient(circle at ${(coords.x + 0.5) * 100}% ${(coords.y + 0.5) * 100}%, rgba(255,255,255,0.18) 0%, transparent 60%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function NegomboEnvironmentSection() {
  const [activeCallout, setActiveCallout] = useState("resort");

  return (
    <section className="negombo-env-section" id="location-sanctuary">
      {/* Ambient Glow Elements */}
      <div className="env-glow-orb env-glow-1" aria-hidden="true" />
      <div className="env-glow-orb env-glow-2" aria-hidden="true" />

      <div className="wrap relative z-10">
        {/* Compact Header */}
        <Reveal>
          <div className="env-header">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="env-badge">
                <span className="env-radar-dot" />
                <span className="env-badge-text">7°12&apos;44.2&quot;N 79°50&apos;32.6&quot;E · ETHUKALA, NEGOMBO</span>
              </div>
              <span className="text-2xs font-mono tracking-widest text-gold uppercase">
                WESTERN PROVINCE · SRI LANKA
              </span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mt-3">
              <div>
                <span className="eyebrow text-gold text-xs">Coastal Ecology &amp; Location</span>
                <h2 className="env-main-title">
                  Situated in the Heart of Negombo
                </h2>
              </div>
              <p className="env-lead-text">
                Where the turquoise Indian Ocean meets the calm expanse of the Negombo Lagoon. 
                Just 15 minutes from the airport, surrounded by pristine coastal ecosystems.
              </p>
            </div>
          </div>
        </Reveal>

        {/* 2-Column Compact Layout: Left = 3D Topo Map with External Leader Lines, Right = Bento Cards */}
        <div className="env-layout-grid mt-8">
          
          {/* LEFT: 3D Topographic Map Card with External Leader Line Callouts */}
          <Reveal delay={100} className="env-topo-column">
            <TiltCard className="env-topo-card">
              <div className="env-topo-header">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-gold animate-spin-slow" />
                  <span className="text-xs font-serif font-bold text-white tracking-wide">
                    Negombo 3D Topographic Relief
                  </span>
                </div>
                <span className="env-telemetry-tag">TELEMETRY SCHEMATIC</span>
              </div>

              {/* 3D Map Area with External Leader Lines */}
              <div className="env-topo-stage">
                <div className="env-topo-glow-base" />

                {/* Central Floating 3D Relief Terrain */}
                <div className="env-topo-center-image">
                  <Image
                    src="/images/NEGOMBO_TOPO-removebg-preview.png"
                    alt="Negombo Topographic 3D Map"
                    width={185}
                    height={250}
                    priority={false}
                    className="env-topo-image"
                  />

                  {/* On-Map Target Hotspots (Pulsing Beacons) */}
                  <div 
                    className={`env-map-target target-resort ${activeCallout === "resort" ? "active" : ""}`}
                    onMouseEnter={() => setActiveCallout("resort")}
                    title="St. Lachland Resort (Ethukala Beach)"
                  >
                    <span className="target-pulse" />
                    <span className="target-dot" />
                  </div>

                  <div 
                    className={`env-map-target target-lagoon ${activeCallout === "lagoon" ? "active" : ""}`}
                    onMouseEnter={() => setActiveCallout("lagoon")}
                    title="Negombo Lagoon Mangroves"
                  >
                    <span className="target-pulse pulse-lagoon" />
                    <span className="target-dot dot-lagoon" />
                  </div>

                  <div 
                    className={`env-map-target target-airport ${activeCallout === "airport" ? "active" : ""}`}
                    onMouseEnter={() => setActiveCallout("airport")}
                    title="Bandaranaike International Airport (CMB)"
                  >
                    <span className="target-pulse pulse-airport" />
                    <span className="target-dot dot-airport" />
                  </div>
                </div>

                {/* =========================================================
                    EXTERNAL CALLOUTS OUTSIDE MAP WITH CRISP LEADER LINES
                    ========================================================= */}

                {/* Callout 1: St. Lachland Resort (Top Left Outside) */}
                <div 
                  className={`env-leader-callout callout-resort ${activeCallout === "resort" ? "active" : ""}`}
                  onMouseEnter={() => setActiveCallout("resort")}
                >
                  <div className="leader-badge">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald shrink-0 animate-pulse" />
                      <strong className="text-white text-3xs tracking-wide">St. Lachland Resort</strong>
                    </div>
                    <span className="text-4xs text-gold font-mono block pl-2.5">Ethukala Beach · 0.0m</span>
                  </div>
                  <div className="leader-pointer-resort">
                    <span className="pointer-line-h" />
                    <span className="pointer-line-d" />
                  </div>
                </div>

                {/* Callout 2: Negombo Lagoon (Top Right Outside) */}
                <div 
                  className={`env-leader-callout callout-lagoon ${activeCallout === "lagoon" ? "active" : ""}`}
                  onMouseEnter={() => setActiveCallout("lagoon")}
                >
                  <div className="leader-pointer-lagoon">
                    <span className="pointer-line-d" />
                    <span className="pointer-line-h" />
                  </div>
                  <div className="leader-badge">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                      <strong className="text-white text-3xs tracking-wide">Negombo Lagoon</strong>
                    </div>
                    <span className="text-4xs text-cyan-300 font-mono block pl-2.5">Mangrove Reserve</span>
                  </div>
                </div>

                {/* Callout 3: CMB International Airport (Bottom Right Outside) */}
                <div 
                  className={`env-leader-callout callout-airport ${activeCallout === "airport" ? "active" : ""}`}
                  onMouseEnter={() => setActiveCallout("airport")}
                >
                  <div className="leader-pointer-airport">
                    <span className="pointer-line-d" />
                    <span className="pointer-line-h" />
                  </div>
                  <div className="leader-badge">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                      <strong className="text-white text-3xs tracking-wide">CMB Airport</strong>
                    </div>
                    <span className="text-4xs text-amber-300 font-mono block pl-2.5">15 Min Expressway</span>
                  </div>
                </div>

              </div>

              {/* Bottom Quick Specs */}
              <div className="env-topo-footer">
                <div className="flex justify-between items-center text-2xs text-stone-300 font-mono">
                  <span>SHORELINE: <strong className="text-white">250m Beachfront</strong></span>
                  <span>WETLAND: <strong className="text-gold">6,000 Ha Protected</strong></span>
                </div>
              </div>
            </TiltCard>
          </Reveal>

          {/* RIGHT: Compact 2x2 Bento Grid */}
          <div className="env-bento-column">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              
              {/* Card 1: Oceanfront Shoreline */}
              <Reveal delay={150}>
                <TiltCard className="env-compact-card card-ocean-compact">
                  <div className="env-card-bg-img">
                    <Image
                      src="/images/hero-bg.jpg"
                      alt="Negombo Beachfront"
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                      className="object-cover object-center"
                    />
                    <div className="env-card-overlay-gradient" />
                  </div>

                  <div className="env-compact-card-content">
                    <div className="flex justify-between items-start">
                      <span className="env-chip-pill">
                        <Waves size={13} className="text-gold" />
                        <span>Beachfront</span>
                      </span>
                      <span className="text-2xs font-mono text-gold font-bold">0.0 KM</span>
                    </div>

                    <div className="mt-auto pt-3">
                      <h4 className="text-base font-serif font-bold text-white mb-1">
                        Ethukala Golden Coast
                      </h4>
                      <p className="text-2xs text-stone-200 leading-relaxed">
                        Direct private boardwalk onto soft golden sands with calm Indian Ocean waters.
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-2xs text-stone-300 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-gold text-xs leading-none">wb_sunny</span>
                          <span>28°C Water</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-gold text-xs leading-none">air</span>
                          <span>12 kts Breeze</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>

              {/* Card 2: Lagoon & Mangroves */}
              <Reveal delay={200}>
                <TiltCard className="env-compact-card card-lagoon-compact">
                  <div className="env-card-bg-img">
                    <Image
                      src="/images/negombo-lagoon.jpg"
                      alt="Negombo Lagoon Mangrove"
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                      className="object-cover object-center"
                    />
                    <div className="env-card-overlay-gradient" />
                  </div>

                  <div className="env-compact-card-content">
                    <div className="flex justify-between items-start">
                      <span className="env-chip-pill">
                        <Trees size={13} className="text-gold" />
                        <span>Mangroves</span>
                      </span>
                      <span className="text-2xs font-mono text-gold font-bold">3.2 KM</span>
                    </div>

                    <div className="mt-auto pt-3">
                      <h4 className="text-base font-serif font-bold text-white mb-1">
                        Lagoon Eco-Sanctuary
                      </h4>
                      <p className="text-2xs text-stone-200 leading-relaxed">
                        Catamaran sailing through biodiversity trails and artisanal crab fisheries.
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-2xs text-stone-300 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-gold text-xs leading-none">sailing</span>
                          <span>Catamaran Tours</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-gold text-xs leading-none">nature</span>
                          <span>Bird Haven</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>

              {/* Card 3: 15-Minute Airport Transit */}
              <Reveal delay={250}>
                <TiltCard className="env-compact-card card-glass-light">
                  <div className="env-compact-glass-body">
                    <div className="flex justify-between items-start">
                      <div className="env-transit-icon-wrap-sm">
                        <Plane size={18} className="text-emerald" />
                      </div>
                      <span className="text-2xl font-black text-emerald font-mono tracking-tight">
                        15 MIN
                      </span>
                    </div>

                    <div className="mt-auto pt-2">
                      <span className="env-micro-label text-mist">EXPRESS ACCESS</span>
                      <h4 className="text-sm font-serif font-bold text-emerald mb-1">
                        Bandaranaike Airport (CMB)
                      </h4>
                      <p className="text-2xs text-stone-600 leading-relaxed">
                        Direct expressway corridor connection with 24/7 private luxury transfers.
                      </p>
                      <div className="mt-2 text-2xs text-emerald font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                        <span>12.4 KM Seamless Highway</span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>

              {/* Card 4: Eco Sustainability Certification */}
              <Reveal delay={300}>
                <TiltCard className="env-compact-card card-glass-light">
                  <div className="env-compact-glass-body">
                    <div className="flex justify-between items-start">
                      <div className="env-transit-icon-wrap-sm">
                        <ShieldCheck size={18} className="text-emerald" />
                      </div>
                      <span className="env-eco-badge-sm">
                        <Sparkles size={11} className="text-gold" />
                        <span>Platinum Eco</span>
                      </span>
                    </div>

                    <div className="mt-auto pt-2">
                      <span className="env-micro-label text-mist">MARINE STEWARDSHIP</span>
                      <h4 className="text-sm font-serif font-bold text-emerald mb-1">
                        Coastal Sustainability
                      </h4>
                      <div className="space-y-1.5 mt-2">
                        <div className="flex items-center gap-1.5 text-2xs text-stone-700">
                          <CheckCircle2 size={13} className="text-emerald shrink-0" />
                          <span>100% Solar Hot Water Systems</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-2xs text-stone-700">
                          <CheckCircle2 size={13} className="text-emerald shrink-0" />
                          <span>Zero Single-Use Plastics Certified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>

            </div>
          </div>

        </div>

        {/* Compact Environmental Telemetry Strip */}
        <Reveal delay={350}>
          <div className="env-live-bar-compact mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-5 bg-emerald text-ivory rounded-xl border border-emerald-800 shadow-md">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-gold animate-spin-slow" />
                <span className="text-2xs font-serif font-bold tracking-wide">
                  Negombo Live Coastal Telemetry
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-2xs text-stone-300 font-mono">
                <div>CLIMATE: <strong className="text-ivory">Maritime 29°C</strong></div>
                <div>SUNSET: <strong className="text-gold">18:22 SLST</strong></div>
                <div>TIDES: <strong className="text-ivory">0.3m Low Tide</strong></div>
                <div>AIRPORT: <strong className="text-ivory">12.4 KM (15m)</strong></div>
              </div>

              <Link href="/rooms" className="inline-flex items-center gap-1 text-2xs text-gold hover:underline font-medium">
                <span>Explore Resort</span>
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
