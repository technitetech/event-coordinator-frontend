/**
 * Unit tests for Pareto multi-objective optimizer.
 * Run with: node lib/__tests__/pareto.test.mjs
 */

import { paretoFront, weightedScore, rankOptions, computeObjectiveScores } from "../pareto.js";
import assert from "assert";

console.log("▶ Running Pareto Multi-Objective Optimizer Tests...");

// Test 1: Pareto dominance logic
const candidates = [
  { id: "optA", scores: [0.9, 0.4, 0.8, 0.9, 0.5] }, // High cost efficiency
  { id: "optB", scores: [0.4, 0.95, 0.8, 0.9, 0.8] }, // High quality
  { id: "optC", scores: [0.3, 0.3, 0.5, 0.5, 0.4] },  // Dominated by both A and B
];

const front = paretoFront(candidates);
assert.strictEqual(front.length, 2, "Pareto front should contain exactly 2 non-dominated solutions");
assert.ok(front.some(f => f.id === "optA"), "optA should be on Pareto front");
assert.ok(front.some(f => f.id === "optB"), "optB should be on Pareto front");
assert.ok(!front.some(f => f.id === "optC"), "optC should NOT be on Pareto front");
console.log("  ✓ Pareto non-dominated front extraction passed");

// Test 2: Weighted sum scalarization
const weights = { w_cost: 0.4, w_quality: 0.3, w_availability: 0.1, w_weather: 0.1, w_preference: 0.1 };
const scoreA = weightedScore(candidates[0].scores, weights);
const scoreB = weightedScore(candidates[1].scores, weights);
assert.ok(scoreA > scoreB, "Option A should score higher with cost-heavy weights");
console.log("  ✓ Weighted scalarization scoring passed");

// Test 3: Ranking options
const ranked = rankOptions(candidates, weights, 3);
assert.strictEqual(ranked.length, 3, "Ranked list should return 3 options");
assert.strictEqual(ranked[0].id, "optA", "Top option should be optA");
assert.strictEqual(ranked[0].rank, 1, "Top rank should be 1");
console.log("  ✓ Multi-option ranking and labeling passed");

// Test 4: Objective score vector generation
const objScores = computeObjectiveScores({
  venue: { base_cost: 60000, max_capacity: 150, is_outdoor: 0 },
  menu: { price_per_head: 2500 },
  decoration: { cost: 25000, tier: "standard" },
  venueFeatures: { ambiance_score: 0.9, photo_score: 0.85, accessibility: 0.8, noise_level: 0.4, natural_light: 0.5, tech_readiness: 0.7 },
  budget: 350000,
  guests: 100,
  outdoorRisk: 0.2,
  dateConflict: 0,
  userPrefs: { venue_outdoor: 0, quality_focus: 0.8 },
});

assert.strictEqual(objScores.length, 5, "Objective score vector must have 5 dimensions");
objScores.forEach((s, i) => {
  assert.ok(s >= 0 && s <= 1, `Objective score ${i} (${s}) must be normalized between 0 and 1`);
});
console.log("  ✓ 5-dimensional objective vector computation passed");

console.log("✅ All Pareto Optimizer Tests Passed!\n");
