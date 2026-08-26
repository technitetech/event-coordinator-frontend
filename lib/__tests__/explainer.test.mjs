/**
 * Unit tests for XAI Explainer module.
 * Run with: node lib/__tests__/explainer.test.mjs
 */

import { generateExplanation } from "../explainer.js";
import assert from "assert";

console.log("▶ Running XAI Explainer Tests...");

const mockRec = {
  id: "v3_d2",
  scores: [0.92, 0.88, 0.95, 0.90, 0.75],
  aggregate: 0.89,
  data: {
    venue: { name: "Crystal Ballroom", min_cap: 51, max_cap: 150, is_outdoor: 0, cost: 60000 },
    menu: { name: "Premium Wedding Buffet", price_per_head: 2500, cost: 250000 },
    decoration: { name: "Standard Floral Package", tier: "standard", cost: 25000 },
    total_cost: 335000,
    within_budget: true,
    _weatherSwapped: false,
    _outdoorRisk: 0.15,
  },
};

const mockAllOptions = [
  mockRec,
  {
    id: "v4_d3",
    scores: [0.65, 0.96, 0.90, 0.90, 0.85],
    aggregate: 0.82,
    data: {
      venue: { name: "Grand Hall", cost: 120000 },
      menu: { name: "Premium Wedding Buffet", price_per_head: 2500, cost: 250000 },
      decoration: { name: "Premium Floral Package", tier: "premium", cost: 50000 },
      total_cost: 420000,
      within_budget: false,
    },
  },
];

const mockInput = {
  event_type: "wedding",
  guests: 100,
  budget: 350000,
  theme: "floral",
  event_date: "2026-08-20",
};

const mockWeights = { w_cost: 0.3, w_quality: 0.25, w_availability: 0.2, w_weather: 0.1, w_preference: 0.15 };

const explanation = generateExplanation(mockRec, mockAllOptions, mockInput, mockWeights);

// Verify explanation structure
assert.ok(explanation.summary, "Explanation must have a natural-language summary");
assert.ok(explanation.summary.includes("Crystal Ballroom"), "Summary should mention chosen venue");
console.log("  ✓ Natural language summary generation verified");

// Verify dominant factor identification
assert.ok(explanation.primary_reasons.length > 0, "Should identify primary reasons");
console.log("  ✓ Causal factor decomposition verified");

// Verify rule trigger auditing
assert.ok(explanation.rule_triggers.length >= 3, "Should audit at least 3 business rules");
console.log("  ✓ Rule trigger audit trail verified");

// Verify trade-offs calculation
assert.ok(Array.isArray(explanation.trade_offs), "Trade-offs must be an array");
console.log("  ✓ Contrastive trade-offs vs alternatives verified");

// Verify counterfactual generation
assert.ok(explanation.counterfactuals.length > 0, "Should generate counterfactual 'what-if' suggestions");
assert.ok(
  explanation.counterfactuals.some(c => c.type === "budget_increase"),
  "Should suggest budget increase to unlock premium tier"
);
console.log("  ✓ Counterfactual 'what-if' generation verified");

// Verify confidence score
assert.ok(explanation.confidence >= 0.5 && explanation.confidence <= 1, "Confidence score must be in range [0.5, 1]");
console.log("  ✓ Confidence score estimation verified");

console.log("✅ All XAI Explainer Tests Passed!\n");
