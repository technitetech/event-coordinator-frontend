/**
 * Tests for lib/pareto.js and lib/ml-scorer.js
 * Upgrades the existing plain assert tests to Vitest with broader coverage.
 */

import { describe, it, expect } from "vitest";
import {
  paretoFront,
  weightedScore,
  rankOptions,
  computeObjectiveScores,
  OBJECTIVE_LABELS,
} from "../lib/pareto.js";
import { heuristicScore, FEATURE_NAMES } from "../lib/ml-scorer.js";

// ─── paretoFront ──────────────────────────────────────────────────────────────

describe("paretoFront", () => {
  it("identifies 2 non-dominated options from 3", () => {
    const opts = [
      { id: "A", scores: [0.9, 0.4, 0.8, 0.9, 0.5] },
      { id: "B", scores: [0.4, 0.9, 0.8, 0.9, 0.8] },
      { id: "C", scores: [0.3, 0.3, 0.5, 0.5, 0.4] }, // dominated
    ];
    const front = paretoFront(opts);
    expect(front.map(f => f.id)).toContain("A");
    expect(front.map(f => f.id)).toContain("B");
    expect(front.map(f => f.id)).not.toContain("C");
  });

  it("returns all options when none dominates another", () => {
    const opts = [
      { id: "X", scores: [1, 0, 0, 0, 0] },
      { id: "Y", scores: [0, 1, 0, 0, 0] },
      { id: "Z", scores: [0, 0, 1, 0, 0] },
    ];
    expect(paretoFront(opts)).toHaveLength(3);
  });

  it("returns a single option when it dominates all others", () => {
    const opts = [
      { id: "Best", scores: [1, 1, 1, 1, 1] },
      { id: "Worse", scores: [0.5, 0.5, 0.5, 0.5, 0.5] },
    ];
    const front = paretoFront(opts);
    expect(front).toHaveLength(1);
    expect(front[0].id).toBe("Best");
  });

  it("returns empty array for empty input", () => {
    expect(paretoFront([])).toHaveLength(0);
  });

  it("assigns paretoRank: 1 to all front members", () => {
    const opts = [
      { id: "A", scores: [0.8, 0.6, 0.7, 0.9, 0.5] },
      { id: "B", scores: [0.5, 0.9, 0.8, 0.7, 0.9] },
    ];
    paretoFront(opts).forEach(o => {
      expect(o.paretoRank).toBe(1);
    });
  });

  it("does not mutate the original options array", () => {
    const opts = [
      { id: "A", scores: [0.9, 0.8, 0.7, 0.6, 0.5] },
    ];
    const before = JSON.stringify(opts);
    paretoFront(opts);
    expect(JSON.stringify(opts)).toBe(before);
  });
});

// ─── weightedScore ────────────────────────────────────────────────────────────

describe("weightedScore", () => {
  const weights = { w_cost: 0.4, w_quality: 0.3, w_availability: 0.1, w_weather: 0.1, w_preference: 0.1 };

  it("cost-heavy weights favor a cost-efficient option", () => {
    const costOpt  = { scores: [0.9, 0.4, 0.5, 0.5, 0.5] };
    const qualOpt  = { scores: [0.4, 0.9, 0.5, 0.5, 0.5] };
    expect(weightedScore(costOpt.scores, weights)).toBeGreaterThan(weightedScore(qualOpt.scores, weights));
  });

  it("returns a value between 0 and 1", () => {
    const score = weightedScore([0.8, 0.6, 0.7, 0.5, 0.9], weights);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("returns 1.0 for a perfect score vector", () => {
    const uniformWeights = { w_cost: 0.2, w_quality: 0.2, w_availability: 0.2, w_weather: 0.2, w_preference: 0.2 };
    expect(weightedScore([1, 1, 1, 1, 1], uniformWeights)).toBeCloseTo(1.0);
  });

  it("returns 0.0 for an all-zero score vector", () => {
    expect(weightedScore([0, 0, 0, 0, 0], weights)).toBeCloseTo(0.0);
  });
});

// ─── rankOptions ─────────────────────────────────────────────────────────────

describe("rankOptions", () => {
  const options = [
    { id: "A", scores: [0.9, 0.4, 0.8, 0.9, 0.5] },
    { id: "B", scores: [0.4, 0.9, 0.8, 0.9, 0.8] },
    { id: "C", scores: [0.3, 0.3, 0.5, 0.5, 0.4] },
  ];
  const weights = { w_cost: 0.4, w_quality: 0.3, w_availability: 0.1, w_weather: 0.1, w_preference: 0.1 };

  it("returns requested number of results", () => {
    expect(rankOptions(options, weights, 3)).toHaveLength(3);
    expect(rankOptions(options, weights, 2)).toHaveLength(2);
  });

  it("assigns sequential ranks starting from 1", () => {
    const ranked = rankOptions(options, weights, 3);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].rank).toBe(3);
  });

  it("result is sorted descending by aggregate score", () => {
    const ranked = rankOptions(options, weights, 3);
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].aggregate).toBeGreaterThanOrEqual(ranked[i + 1].aggregate);
    }
  });

  it("handles empty options array gracefully", () => {
    expect(rankOptions([], weights, 3)).toHaveLength(0);
  });
});

// ─── computeObjectiveScores ───────────────────────────────────────────────────

describe("computeObjectiveScores", () => {
  const baseInput = {
    venue: { base_cost: 60_000, max_capacity: 150, is_outdoor: 0 },
    menu: { price_per_head: 2_500 },
    decoration: { cost: 25_000, tier: "standard" },
    venueFeatures: {
      ambiance_score: 0.9, photo_score: 0.85, accessibility: 0.8,
      noise_level: 0.4, natural_light: 0.5, tech_readiness: 0.7,
    },
    budget: 350_000,
    guests: 100,
    outdoorRisk: 0.2,
    dateConflict: 0,
    userPrefs: { venue_outdoor: 0, quality_focus: 0.8 },
  };

  it("returns a vector of exactly 5 scores", () => {
    const scores = computeObjectiveScores(baseInput);
    expect(scores).toHaveLength(5);
  });

  it("all scores are normalized between 0 and 1", () => {
    const scores = computeObjectiveScores(baseInput);
    scores.forEach((s, i) => {
      expect(s, `score[${i}] = ${s}`).toBeGreaterThanOrEqual(0);
      expect(s, `score[${i}] = ${s}`).toBeLessThanOrEqual(1);
    });
  });

  it("a date conflict reduces availability score", () => {
    const noConflict  = computeObjectiveScores({ ...baseInput, dateConflict: 0 });
    const hasConflict = computeObjectiveScores({ ...baseInput, dateConflict: 1 });
    // availability is index 2
    expect(noConflict[2]).toBeGreaterThan(hasConflict[2]);
  });

  it("high outdoor risk reduces weather score for outdoor venue", () => {
    const indoorScore  = computeObjectiveScores({ ...baseInput, venue: { ...baseInput.venue, is_outdoor: 0 }, outdoorRisk: 0.9 });
    const outdoorScore = computeObjectiveScores({ ...baseInput, venue: { ...baseInput.venue, is_outdoor: 1 }, outdoorRisk: 0.9 });
    // weather is index 3
    expect(indoorScore[3]).toBeGreaterThan(outdoorScore[3]);
  });

  it("over-budget option has lower cost-efficiency score", () => {
    const within = computeObjectiveScores({ ...baseInput, budget: 500_000 });
    const over   = computeObjectiveScores({ ...baseInput, budget: 100_000 }); // same costs, smaller budget
    // cost efficiency is index 0
    expect(within[0]).toBeGreaterThan(over[0]);
  });
});

// ─── OBJECTIVE_LABELS ─────────────────────────────────────────────────────────

describe("OBJECTIVE_LABELS", () => {
  it("has exactly 5 labels matching the 5 objectives", () => {
    expect(OBJECTIVE_LABELS).toHaveLength(5);
  });
  it("all labels are non-empty strings", () => {
    OBJECTIVE_LABELS.forEach(l => {
      expect(typeof l).toBe("string");
      expect(l.length).toBeGreaterThan(0);
    });
  });
});

// ─── heuristicScore (ml-scorer.js) ───────────────────────────────────────────

describe("heuristicScore", () => {
  // heuristicScore({ venueFeatures, eventType, decorTier, budgetRatio, capacityUtil })
  const baseInput = {
    venueFeatures: {
      ambiance_score: 0.85, photo_score: 0.80, accessibility: 0.9,
      noise_level: 0.2, natural_light: 0.7, tech_readiness: 0.8,
    },
    eventType: "wedding",
    decorTier: "standard",
    budgetRatio: 0.7,    // cost / budget — 0.7 means 70% used (generous)
    capacityUtil: 0.6,   // guests / max_capacity
  };

  it("returns a score between 0 and 1", () => {
    const s = heuristicScore(baseInput);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it("gives lower score with poor budget ratio (over-budget)", () => {
    const generous  = heuristicScore({ ...baseInput, budgetRatio: 0.5 }); // under budget
    const tight     = heuristicScore({ ...baseInput, budgetRatio: 1.5 }); // over budget
    expect(generous).toBeGreaterThan(tight);
  });

  it("works for all supported event types", () => {
    ["wedding", "conference", "birthday", "dinner"].forEach(eventType => {
      const s = heuristicScore({ ...baseInput, eventType });
      expect(typeof s, `eventType=${eventType}`).toBe("number");
      expect(s, `eventType=${eventType}`).toBeGreaterThanOrEqual(0);
      expect(s, `eventType=${eventType}`).toBeLessThanOrEqual(1);
    });
  });

  it("returns higher score for premium decoration tier vs budget", () => {
    const budget  = heuristicScore({ ...baseInput, decorTier: "budget" });
    const premium = heuristicScore({ ...baseInput, decorTier: "premium" });
    expect(premium).toBeGreaterThan(budget);
  });

  it("FEATURE_NAMES is a non-empty array", () => {
    expect(Array.isArray(FEATURE_NAMES)).toBe(true);
    expect(FEATURE_NAMES.length).toBeGreaterThan(0);
    FEATURE_NAMES.forEach(name => expect(typeof name).toBe("string"));
  });
});
