/**
 * Unit tests for ML Scorer.
 * Run with: node lib/__tests__/ml-scorer.test.mjs
 */

import { heuristicScore, trainedScore, FEATURE_NAMES } from "../ml-scorer.js";
import assert from "assert";

console.log("▶ Running ML Scorer Tests...");

// Test 1: Feature names completeness
assert.strictEqual(FEATURE_NAMES.length, 13, "Feature vector should contain 13 features");
console.log("  ✓ Feature names definition verified");

// Test 2: Heuristic wedding vs conference domain weighting
const weddingParams = {
  venueFeatures: { ambiance_score: 0.95, photo_score: 0.9, accessibility: 0.5, noise_level: 0.2, natural_light: 0.8, tech_readiness: 0.3 },
  eventType: "wedding",
  decorTier: "premium",
  budgetRatio: 0.9,
  capacityUtil: 0.75,
};

const conferenceParams = {
  venueFeatures: { ambiance_score: 0.4, photo_score: 0.3, accessibility: 0.9, noise_level: 0.2, natural_light: 0.5, tech_readiness: 0.95 },
  eventType: "conference",
  decorTier: "basic",
  budgetRatio: 0.8,
  capacityUtil: 0.70,
};

const weddingScore = heuristicScore(weddingParams);
const conferenceScore = heuristicScore(conferenceParams);

assert.ok(weddingScore > 0.7, "High-ambiance wedding venue should score > 0.7");
assert.ok(conferenceScore > 0.7, "High-tech conference venue should score > 0.7");

// Invert tests: wedding params evaluated with conference event type should score lower
const crossScore = heuristicScore({ ...weddingParams, eventType: "conference" });
assert.ok(weddingScore > crossScore, "Wedding should score higher with wedding profile than conference profile");
console.log("  ✓ Domain-specific feature heuristic scoring verified");

// Test 3: Trained logistic regression scorer fallback and evaluation
const mockModel = {
  coefficients: [0.5, 0.4, 0.2, 0.3, 0.2, 0.5, 0.4, -0.8, -0.3, 0.2, 0.1, 0.1, 0.1],
  intercept: -0.2,
};
const tScore = trainedScore(weddingParams, mockModel);
assert.ok(tScore >= 0 && tScore <= 1, "Logistic regression prediction must be in range [0, 1]");
console.log("  ✓ Logistic regression prediction & sigmoid activation verified");

console.log("✅ All ML Scorer Tests Passed!\n");
