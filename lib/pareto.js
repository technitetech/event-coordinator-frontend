/**
 * Multi-Objective Pareto Optimizer
 * 
 * Research contribution: Implements weighted-sum scalarization over a
 * Pareto-optimal set of event planning options across 5 objectives:
 *   1. Cost efficiency (lower total / budget ratio = better)
 *   2. Quality (venue features + decoration tier)
 *   3. Availability (no date conflicts, capacity headroom)
 *   4. Weather suitability (outdoor risk given the event month)
 *   5. User preference alignment (how well it matches learned prefs)
 *
 * @module lib/pareto
 */

/**
 * Determines whether option A dominates option B in all objectives.
 * A dominates B iff A is >= B in ALL objectives AND strictly > in at least one.
 *
 * @param {number[]} a - Score vector for option A
 * @param {number[]} b - Score vector for option B
 * @returns {boolean}
 */
function dominates(a, b) {
  let dominated = true;
  let strictlyBetter = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) {
      dominated = false;
      break;
    }
    if (a[i] > b[i]) strictlyBetter = true;
  }
  return dominated && strictlyBetter;
}

/**
 * Extracts the Pareto-optimal front from a set of options.
 * Each option must have a `scores` array of objective values (all 0–1, higher = better).
 *
 * @param {Array<{id: string, scores: number[]}>} options
 * @returns {Array<{id: string, scores: number[], paretoRank: number}>}
 */
export function paretoFront(options) {
  if (!options.length) return [];

  const front = [];
  for (const candidate of options) {
    let dominated_ = false;
    for (const other of options) {
      if (candidate === other) continue;
      if (dominates(other.scores, candidate.scores)) {
        dominated_ = true;
        break;
      }
    }
    if (!dominated_) {
      front.push({ ...candidate, paretoRank: 1 });
    }
  }
  return front;
}

/**
 * Computes the weighted aggregate score for a single option.
 * Uses the user's objective weights (or system defaults).
 *
 * @param {number[]} scores - [cost, quality, availability, weather, preference]
 * @param {object} weights - {w_cost, w_quality, w_availability, w_weather, w_preference}
 * @returns {number} Aggregate score in [0, 1]
 */
export function weightedScore(scores, weights) {
  const w = [
    weights.w_cost || 0.30,
    weights.w_quality || 0.25,
    weights.w_availability || 0.20,
    weights.w_weather || 0.10,
    weights.w_preference || 0.15,
  ];
  // Normalize weights to sum to 1
  const wSum = w.reduce((a, b) => a + b, 0);
  let aggregate = 0;
  for (let i = 0; i < scores.length; i++) {
    aggregate += (w[i] / wSum) * scores[i];
  }
  return Math.round(aggregate * 10000) / 10000; // 4 decimal places
}

/**
 * Ranks all options by weighted aggregate score within the Pareto front,
 * then returns the top-N recommendations.
 *
 * @param {Array<{id: string, scores: number[], data: object}>} options
 * @param {object} weights
 * @param {number} topN
 * @returns {Array<{id: string, scores: number[], aggregate: number, rank: number, data: object}>}
 */
export function rankOptions(options, weights, topN = 3) {
  // Step 1: Compute aggregate score for every option
  const scored = options.map(opt => ({
    ...opt,
    aggregate: weightedScore(opt.scores, weights),
  }));

  // Step 2: Sort by aggregate descending
  scored.sort((a, b) => b.aggregate - a.aggregate);

  // Step 3: Assign ranks and label Pareto-optimal ones
  const front = new Set(paretoFront(options).map(o => o.id));

  return scored.slice(0, topN).map((opt, i) => ({
    ...opt,
    rank: i + 1,
    isPareto: front.has(opt.id),
    label: i === 0 ? "Best Overall" : i === 1 ? "Best Quality" : "Best Value",
  }));
}

/**
 * Computes objective scores for a single venue+menu+decoration combination.
 *
 * @param {object} params
 * @param {object} params.venue        - Venue row from DB
 * @param {object} params.menu         - Menu row from DB
 * @param {object} params.decoration   - Decoration row from DB
 * @param {object} params.venueFeatures - Venue feature vector from DB
 * @param {number} params.budget       - User's budget
 * @param {number} params.guests       - Number of guests
 * @param {number} params.outdoorRisk  - Weather risk 0–1 for the event month
 * @param {number} params.dateConflict - 1 if venue booked on that date, 0 otherwise
 * @param {object} params.userPrefs    - Learned preference vector (or empty)
 * @returns {number[]} [costScore, qualityScore, availabilityScore, weatherScore, prefScore]
 */
export function computeObjectiveScores({
  venue, menu, decoration, venueFeatures,
  budget, guests, outdoorRisk, dateConflict, userPrefs,
}) {
  const totalCost = venue.base_cost + (guests * menu.price_per_head) + (decoration?.cost || 10000);

  // 1. COST SCORE: how efficiently the recommendation uses the budget
  //    Perfect score = uses 85–95% of budget. Over-budget = penalty.
  const budgetRatio = totalCost / budget;
  let costScore;
  if (budgetRatio > 1.0) {
    // Over budget: sharp penalty
    costScore = Math.max(0, 1 - (budgetRatio - 1) * 3);
  } else if (budgetRatio >= 0.85 && budgetRatio <= 0.95) {
    // Sweet spot
    costScore = 1.0;
  } else if (budgetRatio < 0.85) {
    // Under-utilizing budget (could have gone higher quality)
    costScore = 0.5 + (budgetRatio / 0.85) * 0.5;
  } else {
    // 0.95–1.0: slightly tight
    costScore = 0.85 + (1.0 - budgetRatio) * 3;
  }

  // 2. QUALITY SCORE: derived from venue features + decoration tier
  const vf = venueFeatures || {};
  const tierScore = decoration?.tier === "premium" ? 1.0
    : decoration?.tier === "standard" ? 0.6 : 0.3;
  const venueQuality = (
    (vf.ambiance_score || 0.5) * 0.3 +
    (vf.photo_score || 0.5) * 0.2 +
    (vf.accessibility || 0.5) * 0.15 +
    (1 - (vf.noise_level || 0.5)) * 0.1 + // lower noise = better
    (vf.natural_light || 0.5) * 0.1 +
    (vf.tech_readiness || 0.5) * 0.15
  );
  const qualityScore = venueQuality * 0.6 + tierScore * 0.4;

  // 3. AVAILABILITY SCORE: capacity headroom + no date conflict
  const capacityRatio = guests / venue.max_capacity;
  const capacityScore = capacityRatio <= 0.8 ? 1.0 : // plenty of room
    capacityRatio <= 0.95 ? 0.7 : 0.4; // tight or at limit
  const availabilityScore = dateConflict ? 0 : capacityScore;

  // 4. WEATHER SCORE: outdoor risk inversion
  let weatherScore;
  if (venue.is_outdoor) {
    weatherScore = 1 - outdoorRisk; // outdoor venue: weather matters
  } else {
    weatherScore = 0.95; // indoor: almost no weather concern
  }

  // 5. PREFERENCE ALIGNMENT: dot product with user preference vector
  let prefScore = 0.5; // neutral default
  if (userPrefs && Object.keys(userPrefs).length > 0) {
    const alignments = [];
    // Check venue style preference
    if (userPrefs.venue_outdoor !== undefined) {
      const pref = userPrefs.venue_outdoor;
      const actual = venue.is_outdoor ? 1 : 0;
      alignments.push(1 - Math.abs(pref - actual));
    }
    // Check budget flexibility preference
    if (userPrefs.budget_flexibility !== undefined) {
      const flexibility = userPrefs.budget_flexibility;
      // High flexibility = ok with spending close to budget
      alignments.push(flexibility > 0.5 ? costScore : 1 - budgetRatio);
    }
    // Check quality preference
    if (userPrefs.quality_focus !== undefined) {
      alignments.push(userPrefs.quality_focus > 0.5 ? qualityScore : costScore);
    }
    if (alignments.length > 0) {
      prefScore = alignments.reduce((a, b) => a + b, 0) / alignments.length;
    }
  }

  return [
    clamp(costScore),
    clamp(qualityScore),
    clamp(availabilityScore),
    clamp(weatherScore),
    clamp(prefScore),
  ];
}

function clamp(v) {
  return Math.max(0, Math.min(1, v));
}

/** Objective labels for display */
export const OBJECTIVE_LABELS = ["Cost", "Quality", "Availability", "Weather", "Preference"];
