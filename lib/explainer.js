/**
 * Explainable AI (XAI) — Explanation & Counterfactual Generator
 *
 * Research contribution: Generates human-readable explanations for WHY
 * a specific event recommendation was made, plus counterfactual "what-if"
 * alternatives that show the user what would change if they adjusted their inputs.
 *
 * Three types of explanations:
 *   1. Causal: "We chose X because Y"
 *   2. Contrastive: "X was chosen over Z because of A"
 *   3. Counterfactual: "If you changed B, you'd get C instead"
 *
 * @module lib/explainer
 */

import { OBJECTIVE_LABELS } from "./pareto.js";

/**
 * Generates a complete explanation object for a recommendation.
 *
 * @param {object} recommendation - The chosen option with scores
 * @param {Array} allOptions      - All feasible options (for contrast)
 * @param {object} input          - User input {event_type, guests, budget, theme, event_date}
 * @param {object} weights        - Active objective weights
 * @returns {object} Structured explanation
 */
export function generateExplanation(recommendation, allOptions, input, weights) {
  const rec = recommendation;

  return {
    summary: generateSummary(rec, input),
    primary_reasons: identifyDominantFactors(rec, weights),
    rule_triggers: listActiveRules(rec, input),
    trade_offs: computeTradeOffs(rec, allOptions),
    counterfactuals: generateCounterfactuals(rec, allOptions, input),
    confidence: computeConfidence(rec, allOptions),
    scores_breakdown: formatScoresBreakdown(rec.scores, weights),
  };
}

/**
 * One-sentence natural-language summary of the recommendation.
 */
function generateSummary(rec, input) {
  const venue = rec.data.venue.name;
  const total = rec.data.total_cost;
  const budget = input.budget;
  const pct = Math.round((total / budget) * 100);

  if (total <= budget) {
    return `We recommend ${venue} with ${rec.data.menu.name} and ${rec.data.decoration.name}. ` +
      `This uses ${pct}% of your LKR ${budget.toLocaleString()} budget and scores highest ` +
      `on ${identifyStrongestObjective(rec.scores)}.`;
  } else {
    const over = total - budget;
    return `The best feasible option is ${venue}, but it exceeds your budget by ` +
      `LKR ${over.toLocaleString()} (${pct}% of budget). Consider the trade-offs below.`;
  }
}

/**
 * Identifies which objectives contributed most to this option's ranking.
 * Returns top-2 factors with human-readable reasoning.
 */
function identifyDominantFactors(rec, weights) {
  const wArr = [
    weights.w_cost || 0.30,
    weights.w_quality || 0.25,
    weights.w_availability || 0.20,
    weights.w_weather || 0.10,
    weights.w_preference || 0.15,
  ];

  const contributions = rec.scores.map((s, i) => ({
    objective: OBJECTIVE_LABELS[i],
    score: s,
    weight: wArr[i],
    contribution: s * wArr[i],
  }));

  contributions.sort((a, b) => b.contribution - a.contribution);

  return contributions.slice(0, 3).map(c => ({
    factor: c.objective,
    score: Math.round(c.score * 100),
    reason: generateFactorReason(c.objective, c.score, rec.data),
  }));
}

/**
 * Generates a natural-language reason for why a specific objective scored well/poorly.
 */
function generateFactorReason(objective, score, data) {
  const pct = Math.round(score * 100);
  switch (objective) {
    case "Cost":
      if (pct >= 90) return `Excellent value — uses your budget efficiently without overspending.`;
      if (pct >= 70) return `Good cost efficiency, though there's room for a more premium option.`;
      return `This option is tight on budget. Consider increasing your budget or reducing guests.`;

    case "Quality":
      if (pct >= 80) return `${data.venue.name} has high ambiance and photo scores, paired with ${data.decoration.tier || "standard"}-tier decoration.`;
      if (pct >= 60) return `Decent quality for this budget range. Upgrading decoration would improve this.`;
      return `Quality is limited by budget constraints. The venue and decoration are basic tier.`;

    case "Availability":
      if (pct >= 90) return `${data.venue.name} is available on your date with comfortable capacity headroom.`;
      if (pct >= 50) return `Available but at near-capacity. Consider a larger venue for more comfort.`;
      return `This venue may be unavailable or at full capacity on your chosen date.`;

    case "Weather":
      if (pct >= 80) return `Low weather risk — either an indoor venue or a dry-season date.`;
      if (pct >= 50) return `Moderate weather risk. Consider an indoor alternative if the date is flexible.`;
      return `High outdoor weather risk for your event date (rainy season). An indoor venue is strongly recommended.`;

    case "Preference":
      if (pct >= 70) return `This option aligns well with your known preferences from past events.`;
      return `We don't have enough preference data yet. Rate past events to improve future recommendations.`;

    default:
      return `Scored ${pct}% on ${objective}.`;
  }
}

/**
 * Lists which business rules were triggered for this recommendation.
 */
function listActiveRules(rec, input) {
  const rules = [];
  const d = rec.data;

  // Rule 1: Venue capacity match
  rules.push({
    rule: "Capacity Match",
    description: `${d.venue.name} fits ${input.guests} guests (capacity: ${d.venue.min_cap || "?"}–${d.venue.max_cap || "?"}).`,
    type: "constraint",
  });

  // Rule 2: Menu by event type
  rules.push({
    rule: "Menu Selection",
    description: `${d.menu.name} selected for ${input.event_type} events at LKR ${d.menu.price_per_head?.toLocaleString() || "?"}/head.`,
    type: "constraint",
  });

  // Rule 3: Decoration tier by remaining budget
  rules.push({
    rule: "Decoration Tier",
    description: `${d.decoration.name} (${d.decoration.tier || "standard"} tier) chosen based on remaining budget after venue and menu.`,
    type: "optimization",
  });

  // Rule 1b: Rainy season swap
  if (d._weatherSwapped) {
    rules.push({
      rule: "Rainy Season Swap",
      description: `Original outdoor venue was swapped for indoor due to rainy season risk (${Math.round(d._outdoorRisk * 100)}%).`,
      type: "safety",
    });
  }

  // Rule 5: Date conflict
  if (d._dateConflict) {
    rules.push({
      rule: "Date Conflict",
      description: `⚠ ${d.venue.name} is already booked on ${input.event_date}. Choose another date.`,
      type: "warning",
    });
  }

  return rules;
}

/**
 * Computes trade-offs: what you gain vs. lose compared to the next-best option.
 */
function computeTradeOffs(rec, allOptions) {
  if (allOptions.length < 2) return [];

  // Find the second-best option
  const sorted = [...allOptions].sort((a, b) => (b.aggregate || 0) - (a.aggregate || 0));
  const best = sorted[0];
  const second = sorted.find(o => o.id !== rec.id) || sorted[1];

  if (!second || !second.scores) return [];

  const tradeoffs = [];
  for (let i = 0; i < OBJECTIVE_LABELS.length; i++) {
    const diff = (rec.scores[i] || 0) - (second.scores[i] || 0);
    if (Math.abs(diff) > 0.05) { // Only report meaningful differences
      tradeoffs.push({
        objective: OBJECTIVE_LABELS[i],
        diff: Math.round(diff * 100),
        direction: diff > 0 ? "better" : "worse",
        vs: second.data?.venue?.name || "Alternative",
      });
    }
  }

  return tradeoffs;
}

/**
 * Generates counterfactual "what-if" suggestions.
 * "If you changed X, you'd get Y instead."
 */
function generateCounterfactuals(rec, allOptions, input) {
  const counterfactuals = [];
  const totalCost = rec.data.total_cost;
  const budget = input.budget;

  // CF1: Budget increase → unlock premium decoration
  if (rec.data.decoration?.tier !== "premium") {
    const premiumCost = rec.data.decoration?.tier === "basic" ? 40000 : 25000;
    counterfactuals.push({
      type: "budget_increase",
      change: `Increase budget by LKR ${premiumCost.toLocaleString()}`,
      effect: `Unlocks Premium ${input.theme || "Floral"} Package, improving Quality score by ~20%.`,
      newBudget: budget + premiumCost,
    });
  }

  // CF2: Fewer guests → cheaper venue tier
  if (input.guests > 50) {
    const reducedGuests = Math.max(10, Math.round(input.guests * 0.7));
    const savings = Math.round(input.guests * 0.3 * (rec.data.menu?.price_per_head || 1500));
    counterfactuals.push({
      type: "guest_reduction",
      change: `Reduce guests from ${input.guests} to ${reducedGuests}`,
      effect: `Saves approximately LKR ${savings.toLocaleString()} on catering, possibly unlocking a smaller, more intimate venue.`,
      newGuests: reducedGuests,
    });
  }

  // CF3: Change event date → avoid rainy season
  if (rec.data._outdoorRisk > 0.4) {
    counterfactuals.push({
      type: "date_change",
      change: `Move event to January–March (dry season)`,
      effect: `Reduces weather risk from ${Math.round(rec.data._outdoorRisk * 100)}% to <20%, unlocking outdoor venue options.`,
    });
  }

  // CF4: Alternative venue → better quality/cost tradeoff
  const betterQuality = allOptions.find(o =>
    o.id !== rec.id && o.scores && o.scores[1] > (rec.scores[1] + 0.1)
  );
  if (betterQuality) {
    const costDiff = (betterQuality.data?.total_cost || 0) - totalCost;
    counterfactuals.push({
      type: "venue_upgrade",
      change: `Switch to ${betterQuality.data?.venue?.name || "alternative venue"}`,
      effect: `Quality improves by ${Math.round((betterQuality.scores[1] - rec.scores[1]) * 100)}% ` +
        (costDiff > 0 ? `but costs LKR ${costDiff.toLocaleString()} more.` : `and saves LKR ${Math.abs(costDiff).toLocaleString()}.`),
    });
  }

  return counterfactuals;
}

/**
 * Computes a confidence score for the recommendation (0–1).
 * Higher confidence = more data available, clearer winner among options.
 */
function computeConfidence(rec, allOptions) {
  if (allOptions.length <= 1) return 0.5; // only one option = medium confidence

  // Margin of victory: how much better is this than second-best?
  const sorted = [...allOptions].sort((a, b) => (b.aggregate || 0) - (a.aggregate || 0));
  const topScore = sorted[0]?.aggregate || 0;
  const secondScore = sorted[1]?.aggregate || 0;
  const margin = topScore - secondScore;

  // Confidence = sigmoid of margin (scaled)
  return Math.min(0.99, 0.5 + margin * 2);
}

/**
 * Formats the 5-objective score breakdown with labels and percentages.
 */
function formatScoresBreakdown(scores, weights) {
  const wArr = [
    weights.w_cost || 0.30,
    weights.w_quality || 0.25,
    weights.w_availability || 0.20,
    weights.w_weather || 0.10,
    weights.w_preference || 0.15,
  ];

  return OBJECTIVE_LABELS.map((label, i) => ({
    label,
    score: Math.round((scores[i] || 0) * 100),
    weight: Math.round(wArr[i] * 100),
    contribution: Math.round((scores[i] || 0) * wArr[i] * 100),
  }));
}

function identifyStrongestObjective(scores) {
  let maxIdx = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[maxIdx]) maxIdx = i;
  }
  return OBJECTIVE_LABELS[maxIdx].toLowerCase();
}
