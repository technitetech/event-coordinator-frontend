/**
 * ML Scoring Model for Event Recommendations
 *
 * Research contribution: A hybrid scoring function that starts as a
 * weighted heuristic (Phase 1: no training data) and transitions to
 * a trained model once feedback accumulates (Phase 2: ≥20 ratings).
 *
 * The heuristic encodes expert knowledge about event planning:
 * - Weddings value ambiance, photography, floral aesthetics
 * - Conferences value tech readiness, accessibility, low noise
 * - Birthdays value flexibility, fun factor, value for money
 * - Gala dinners value ambiance, premium tier, exclusivity
 *
 * @module lib/ml-scorer
 */

/**
 * Event-type specific feature weight profiles.
 * These encode DOMAIN EXPERTISE — the kind of knowledge an experienced
 * event planner uses intuitively. In research terms, this is the
 * "knowledge engineering" step of building the expert system.
 */
const EVENT_PROFILES = {
  wedding: {
    ambiance:     0.25,
    photo_score:  0.25,
    accessibility: 0.05,
    noise:        0.10,  // lower is better for ceremony
    natural_light: 0.15,
    tech:         0.05,
    tier_bonus:   0.15,  // premium decoration matters more
  },
  conference: {
    ambiance:     0.05,
    photo_score:  0.05,
    accessibility: 0.25,
    noise:        0.20,  // acoustics critical for speeches
    natural_light: 0.05,
    tech:         0.30,  // AV equipment is key
    tier_bonus:   0.10,
  },
  birthday: {
    ambiance:     0.15,
    photo_score:  0.10,
    accessibility: 0.15,
    noise:        0.05,  // noise is ok at a party
    natural_light: 0.10,
    tech:         0.15,  // music, projector for slideshow
    tier_bonus:   0.30,  // decoration tier = fun factor
  },
  dinner: {
    ambiance:     0.30,
    photo_score:  0.15,
    accessibility: 0.10,
    noise:        0.15,  // intimate ambiance needs quiet
    natural_light: 0.10,
    tech:         0.05,
    tier_bonus:   0.15,
  },
};

/**
 * Computes the ML score for a single venue+menu+decoration combination.
 * Phase 1: Weighted heuristic based on event-type profiles.
 *
 * @param {object} params
 * @param {object} params.venueFeatures - Row from venue_features table
 * @param {string} params.eventType     - 'wedding' | 'conference' | 'birthday' | 'dinner'
 * @param {string} params.decorTier     - 'basic' | 'standard' | 'premium'
 * @param {number} params.budgetRatio   - totalCost / budget (0.x–1.x+)
 * @param {number} params.capacityUtil  - guests / max_capacity (0.x–1.0)
 * @returns {number} ML score in [0, 1]
 */
export function heuristicScore({ venueFeatures, eventType, decorTier, budgetRatio, capacityUtil }) {
  const profile = EVENT_PROFILES[eventType] || EVENT_PROFILES.birthday;
  const vf = venueFeatures || {};

  const tierValue = decorTier === "premium" ? 1.0
    : decorTier === "standard" ? 0.6 : 0.25;

  // Compute weighted feature score
  let score = 0;
  score += profile.ambiance * (vf.ambiance_score || 0.5);
  score += profile.photo_score * (vf.photo_score || 0.5);
  score += profile.accessibility * (vf.accessibility || 0.5);
  score += profile.noise * (1 - (vf.noise_level || 0.5)); // invert: low noise = good
  score += profile.natural_light * (vf.natural_light || 0.5);
  score += profile.tech * (vf.tech_readiness || 0.5);
  score += profile.tier_bonus * tierValue;

  // Capacity utilization bonus: 60–85% is ideal (not too cramped, not too empty)
  if (capacityUtil >= 0.60 && capacityUtil <= 0.85) {
    score *= 1.05; // 5% bonus for ideal capacity utilization
  } else if (capacityUtil > 0.95) {
    score *= 0.90; // 10% penalty for near-capacity
  }

  // Budget efficiency adjustment
  if (budgetRatio > 1.0) {
    score *= Math.max(0.3, 1 - (budgetRatio - 1) * 2); // Heavy penalty for over-budget
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Trained model scorer — uses logistic regression weights learned from feedback.
 * Falls back to heuristicScore when no trained weights exist.
 *
 * @param {object} params - Same as heuristicScore
 * @param {object|null} trainedWeights - Learned feature weights from feedback
 * @returns {number} Predicted satisfaction score [0, 1]
 */
export function trainedScore(params, trainedWeights) {
  if (!trainedWeights || !trainedWeights.coefficients) {
    return heuristicScore(params);
  }

  const vf = params.venueFeatures || {};
  const tierValue = params.decorTier === "premium" ? 1.0
    : params.decorTier === "standard" ? 0.6 : 0.25;

  // Feature vector (same order as training)
  const x = [
    vf.ambiance_score || 0.5,
    vf.photo_score || 0.5,
    vf.accessibility || 0.5,
    1 - (vf.noise_level || 0.5),
    vf.natural_light || 0.5,
    vf.tech_readiness || 0.5,
    tierValue,
    params.budgetRatio,
    params.capacityUtil,
    // Event type one-hot encoding
    params.eventType === "wedding" ? 1 : 0,
    params.eventType === "conference" ? 1 : 0,
    params.eventType === "birthday" ? 1 : 0,
    params.eventType === "dinner" ? 1 : 0,
  ];

  // Logistic regression: sigmoid(w·x + b)
  const w = trainedWeights.coefficients;
  const b = trainedWeights.intercept || 0;
  let z = b;
  for (let i = 0; i < Math.min(x.length, w.length); i++) {
    z += w[i] * x[i];
  }
  return sigmoid(z);
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Returns the feature names used by the model, for interpretability.
 */
export const FEATURE_NAMES = [
  "Ambiance", "Photo Quality", "Accessibility", "Quietness",
  "Natural Light", "Tech Readiness", "Decoration Tier",
  "Budget Ratio", "Capacity Utilization",
  "Is Wedding", "Is Conference", "Is Birthday", "Is Dinner",
];
