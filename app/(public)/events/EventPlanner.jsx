"use client";

import { useState } from "react";
import Link from "next/link";
import Frond from "../../components/Frond";
import { createReservation, getHybridEstimate } from "./actions";
import DesignGeneratorPopup from "../../components/DesignGeneratorPopup";
import ChatAssistantPopup from "../../components/ChatAssistantPopup";
import ExplanationPanel from "../../components/ExplanationPanel";
import { Sparkles, Award, TrendingUp, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "conference", label: "Conference" },
  { value: "birthday", label: "Birthday" },
  { value: "dinner", label: "Gala Dinner" },
];
const THEMES = [
  { value: "floral", label: "Floral" },
  { value: "modern", label: "Modern" },
  { value: "tropical", label: "Tropical" },
  { value: "classic", label: "Classic Gold" },
];

const fmt = (n) => "LKR " + Number(n).toLocaleString();

const PACKAGE_BADGES = {
  "Best Overall": { icon: Award, color: "#1A3C34", bg: "#EBF2EE" },
  "Best Quality": { icon: Sparkles, color: "#9A7B4F", bg: "#FBF7F0" },
  "Best Value": { icon: DollarSign, color: "#2B5E49", bg: "#EDF6F2" },
};

export default function EventPlanner({ loggedIn, customerName }) {
  const [form, setForm] = useState({
    event_type: "wedding",
    guests: 100,
    budget: 350000,
    theme: "floral",
    event_date: "",
  });

  const [recommendations, setRecommendations] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [reserveError, setReserveError] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showChat, setShowChat] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Currently active recommendation
  const currentPlan = recommendations[selectedIdx] || null;

  // --- Hybrid Recommendation Execution ---
  const handlePlanSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendations([]);
    setSelectedIdx(0);
    setReserved(false);
    setReserveError(null);

    try {
      const data = await getHybridEstimate({
        event_type: form.event_type,
        theme: form.theme,
        guests: Number(form.guests),
        budget: Number(form.budget),
        event_date: form.event_date || undefined,
      });

      if (data.error) {
        setError(data.error);
      } else if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setMeta(data.meta || null);
      } else {
        setError("No optimal recommendation could be computed with the given parameters.");
      }
    } catch (err) {
      setError("An unexpected error occurred while running the hybrid recommendation engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVisualizer = () => {
    if (!loggedIn) {
      setError("Please sign in to visualize custom AI concepts for your event.");
      return;
    }
    setShowPopup(true);
  };

  const handleImagesGenerated = (urls) => {
    setGeneratedImages(Array.isArray(urls) ? urls : [urls]);
  };

  const handleApplyChatPlan = (fields, recommendation) => {
    setForm((f) => ({
      ...f,
      event_type: fields.event_type ?? f.event_type,
      guests: fields.guests ?? f.guests,
      budget: fields.budget ?? f.budget,
      theme: fields.theme ?? f.theme,
      event_date: fields.event_date ?? f.event_date,
    }));
    setRecommendations([recommendation]);
    setMeta(null);
    setSelectedIdx(0);
    setError(null);
    setShowChat(false);
  };

  // --- Reservation Execution ---
  const handleReserve = async () => {
    if (!currentPlan) return;
    setReserving(true);
    setReserveError(null);

    try {
      const payload = {
        event_type: form.event_type,
        event_date: form.event_date,
        guests: Number(form.guests),
        budget: Number(form.budget),
        theme: form.theme,
        total_cost: currentPlan.total_cost,
        venue_name: currentPlan.venue.name,
        menu_name: currentPlan.menu.name,
        decoration_name: currentPlan.decoration.name,
        // Server re-validates and re-serialises these; it ignores any
        // client-supplied pricing entirely.
        image_url_list: generatedImages,
      };

      const res = await createReservation(payload);
      if (res.ok) {
        setReserved(true);
      } else {
        setReserveError(res.error || "Failed to complete reservation.");
      }
    } catch (err) {
      setReserveError("Could not complete the reservation. Please try again.");
    } finally {
      setReserving(false);
    }
  };

  return (
    <main>
      <section className="tool-hero">
        <div className="wrap">
          <span className="eyebrow">Hybrid Neuro-Symbolic AI Coordinator</span>
          <h1 className="display">Multi-Objective Event Planning</h1>
          <p>
            Powered by a 3-layer hybrid architecture combining symbolic rule verification, Pareto multi-objective optimization, and explainable AI.
          </p>
          <button type="button" className="chat-trigger-btn" onClick={() => setShowChat(true)}>
            <Sparkles size={18} strokeWidth={2.25} />
            Chat with Coordinator
          </button>
        </div>
      </section>

      {showPopup && (
        <DesignGeneratorPopup
          onClose={() => setShowPopup(false)}
          onGenerate={handleImagesGenerated}
          eventContext={{
            eventType: form.event_type,
            venueName: currentPlan?.venue?.name || "Crystal Ballroom",
            theme: form.theme,
            guests: Number(form.guests),
          }}
        />
      )}

      {showChat && (
        <ChatAssistantPopup
          onClose={() => setShowChat(false)}
          onApplyPlan={handleApplyChatPlan}
        />
      )}

      <section className="tool-body">
        <div className="wrap tool-grid">
          {/* Left Form Card */}
          <div className="form-card">
            <h2>Event Constraints</h2>
            <form onSubmit={handlePlanSubmit} className="f-grid">
              <div className="field">
                <label htmlFor="event_type">Event Type</label>
                <select id="event_type" value={form.event_type} onChange={update("event_type")}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="theme">Aesthetic Theme</label>
                <select id="theme" value={form.theme} onChange={update("theme")}>
                  {THEMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="guests">Guest Count</label>
                <input
                  id="guests"
                  type="number"
                  min="10"
                  max="500"
                  value={form.guests}
                  onChange={update("guests")}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="budget">
                  Budget <span className="opt">(LKR)</span>
                </label>
                <input
                  id="budget"
                  type="number"
                  min="50000"
                  step="10000"
                  value={form.budget}
                  onChange={update("budget")}
                  required
                />
              </div>

              <div className="field wide">
                <label htmlFor="event_date">
                  Event Date <span className="opt">· evaluated for weather risk</span>
                </label>
                <input
                  id="event_date"
                  type="date"
                  value={form.event_date}
                  onChange={update("event_date")}
                />
              </div>

              <div className="field wide mt-2">
                <button type="submit" className="btn btn-solid w-full" disabled={loading}>
                  {loading ? "Computing Optimal Pareto Frontiers..." : "Generate AI Recommendation"}
                </button>
              </div>
            </form>

            {error && <div className="err mt-4">{error}</div>}

            {meta && (
              <div className="meta-info-box mt-6">
                <div className="meta-item">
                  <span className="meta-label">Engine:</span>
                  <span className="meta-val">{meta.engine_version}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Feasible Combos Evaluated:</span>
                  <span className="meta-val">{meta.feasible_count}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Computation Latency:</span>
                  <span className="meta-val">{meta.processing_time_ms}ms</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Result & Comparison Column */}
          <div className="result-wrap">
            {!currentPlan && !loading && (
              <div className="empty-state">
                <div className="frond-deco">
                  <Frond stroke="currentColor" />
                </div>
                <p>Configure your event parameters and run the coordinator to view Pareto-optimal packages with full causal explanations.</p>
              </div>
            )}

            {loading && (
              <div className="empty-state" style={{ padding: "60px 40px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
                  <svg
                    style={{ animation: "spin 1.5s linear infinite", height: "40px", width: "40px", color: "var(--emerald)" }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      style={{ opacity: 0.75 }}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--emerald)", marginBottom: "8px" }}>
                      Synthesizing Multi-Objective Optimization
                    </h3>
                    <p style={{ color: "var(--mist)", fontSize: "0.95rem" }}>
                      Filtering rule constraints, evaluating venue feature embeddings, and computing Pareto fronts...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentPlan && !loading && (
              <div className="slip">
                {/* Pareto Package Selection Tabs */}
                {recommendations.length > 1 && (
                  <div className="pareto-tabs-wrapper mb-6">
                    <div className="pareto-tabs-header">
                      <span>Pareto Frontier Solutions ({recommendations.length}):</span>
                    </div>
                    <div className="pareto-tabs-grid">
                      {recommendations.map((rec, idx) => {
                        const isSel = idx === selectedIdx;
                        const badgeInfo = PACKAGE_BADGES[rec.label] || { icon: Award, color: "#1A3C34", bg: "#EBF2EE" };
                        const IconComponent = badgeInfo.icon;

                        return (
                          <button
                            key={rec.id || idx}
                            type="button"
                            className={`pareto-tab-btn ${isSel ? "active" : ""}`}
                            onClick={() => setSelectedIdx(idx)}
                          >
                            <div className="pareto-tab-top">
                              <span className="pareto-badge" style={{ backgroundColor: badgeInfo.bg, color: badgeInfo.color }}>
                                <IconComponent size={13} />
                                {rec.label}
                              </span>
                              <span className="pareto-score">
                                {Math.round((rec.aggregate || 0) * 100)}% Match
                              </span>
                            </div>
                            <div className="pareto-tab-venue">{rec.venue.name}</div>
                            <div className="pareto-tab-cost">{fmt(rec.total_cost)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Design Concept Section */}
                <div className="ai-concept-preview-card mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-emerald">Spatial Concept Visualization</h4>
                      <p className="text-xs text-stone-500">Multimodal architectural rendering of {currentPlan.venue.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenVisualizer}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                    >
                      <Sparkles size={14} className="text-gold" />
                      {generatedImages.length > 0 ? "Regenerate Perspectives" : "Generate 3D Visuals"}
                    </button>
                  </div>

                  {generatedImages.length > 0 ? (
                    <div>
                      <div style={{ display: "flex", overflowX: "auto", gap: "12px", paddingBottom: "10px" }}>
                        {generatedImages.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`AI Generated Architecture Perspective ${i + 1}`}
                            style={{ width: "260px", height: "260px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-stone-500 mt-2 italic text-center">Synchronized perspective renders (Entrance, Floorplan, Centerpiece, Ceiling)</p>
                    </div>
                  ) : (
                    <div className="concept-placeholder" onClick={handleOpenVisualizer}>
                      <Sparkles size={24} className="text-gold mb-2" />
                      <p className="text-sm font-medium">Click to synthesize 4 synchronized architectural perspectives for this venue.</p>
                    </div>
                  )}
                </div>

                {/* Package Head */}
                <div className="slip-head">
                  <div>
                    <h3>{currentPlan.label} Package</h3>
                    <span className="text-xs text-stone-500">{currentPlan.venue.name} · {currentPlan.guests} Guests</span>
                  </div>
                  <span className={`verdict ${currentPlan.within_budget ? "ok" : "over"}`}>
                    <span className="dot" />
                    {currentPlan.within_budget ? "Within budget" : "Over budget"}
                  </span>
                </div>

                {/* Itemized Line Items */}
                <div className="li">
                  <div>
                    <div className="li-name">{currentPlan.venue.name}</div>
                    <div className="li-sub">
                      Venue hire · {currentPlan.venue.is_outdoor ? "Open-air Garden" : "Indoor Climate Controlled"} (Cap: {currentPlan.venue.min_cap}–{currentPlan.venue.max_cap})
                    </div>
                  </div>
                  <div className="li-cost">{fmt(currentPlan.venue.cost)}</div>
                </div>

                <div className="li">
                  <div>
                    <div className="li-name">{currentPlan.menu.name}</div>
                    <div className="li-sub">{fmt(currentPlan.menu.price_per_head)} × {currentPlan.guests} guests</div>
                  </div>
                  <div className="li-cost">{fmt(currentPlan.menu.cost)}</div>
                </div>

                <div className="li">
                  <div>
                    <div className="li-name">{currentPlan.decoration.name}</div>
                    <div className="li-sub">
                      Theme: {currentPlan.decoration.theme.toUpperCase()} · Tier: {currentPlan.decoration.tier.toUpperCase()}
                    </div>
                  </div>
                  <div className="li-cost">{fmt(currentPlan.decoration.cost)}</div>
                </div>

                <div className="slip-total">
                  <span className="lbl">Total Estimated Investment</span>
                  <span className="val">{fmt(currentPlan.total_cost)}</span>
                </div>

                {/* Notices & Upsells */}
                {(currentPlan.warnings?.length > 0 || currentPlan.suggestions?.length > 0) && (
                  <div className="notices">
                    {currentPlan.warnings?.map((w, i) => (
                      <div key={`w${i}`} className="notice warn">
                        <AlertCircle size={14} className="inline mr-1" />
                        {w}
                      </div>
                    ))}
                    {currentPlan.suggestions?.map((s, i) => (
                      <div key={`s${i}`} className="notice tip">
                        <Sparkles size={14} className="inline mr-1" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {/* XAI Explanation Panel */}
                {currentPlan.explanation && (
                  <ExplanationPanel
                    explanation={currentPlan.explanation}
                    scores={currentPlan.scores || []}
                  />
                )}

                {/* Reservation Action Area */}
                <div className="reserve-area mt-6">
                  {reserved ? (
                    <div className="reserve-done">
                      <CheckCircle2 size={32} className="text-emerald mx-auto mb-2" />
                      <strong>Reservation Requested Successfully</strong>
                      <p>
                        Thank you{customerName ? `, ${customerName.split(" ")[0]}` : ""}. Your booking is pending confirmation. You can review your reservation details and submit feedback anytime.
                      </p>
                      <Link href="/account" className="btn btn-ghost mt-2">
                        View in Account Dashboard
                      </Link>
                    </div>
                  ) : !loggedIn ? (
                    <div className="reserve-login">
                      <p>Sign in to confirm and reserve this custom AI package.</p>
                      <div className="reserve-actions">
                        <Link href="/login" className="btn btn-solid">
                          Sign in
                        </Link>
                        <Link href="/register" className="btn btn-ghost">
                          Create account
                        </Link>
                      </div>
                    </div>
                  ) : !form.event_date ? (
                    <div className="reserve-note">
                      Please select an <strong>event date</strong> in the constraints form to reserve.
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-gold reserve-btn"
                        onClick={handleReserve}
                        disabled={reserving}
                      >
                        {reserving ? "Locking in Reservation..." : `Reserve ${currentPlan.label} (${fmt(currentPlan.total_cost)})`}
                      </button>
                      {reserveError && <div className="err mt-2">{reserveError}</div>}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
