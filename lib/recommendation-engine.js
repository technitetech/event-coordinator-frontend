/**
 * Hybrid Neuro-Symbolic Recommendation Engine
 *
 * ARCHITECTURE:
 * ┌──────────────────────────────────────────────┐
 * │         LAYER 3: EXPLANATION ENGINE           │
 * │   Causal + Contrastive + Counterfactual XAI   │
 * ├──────────────────────────────────────────────┤
 * │       LAYER 2: PARETO MULTI-OBJECTIVE         │
 * │   Weighted-sum optimization across 5 dims     │
 * ├──────────────────────────────────────────────┤
 * │  LAYER 1a: RULES    │   LAYER 1b: ML SCORER  │
 * │  Hard constraints   │   Heuristic / Trained   │
 * └─────────────────────┴────────────────────────┘
 *
 * This is the main entry point for generating recommendations.
 *
 * @module lib/recommendation-engine
 */

import { getPool } from "./db.js";
import { computeObjectiveScores, rankOptions, OBJECTIVE_LABELS } from "./pareto.js";
import { heuristicScore, trainedScore } from "./ml-scorer.js";
import { generateExplanation } from "./explainer.js";
import trainedWeights from "./trained-weights.json";

/**
 * Main entry point: generates hybrid recommendations.
 *
 * @param {object} input
 * @param {string} input.event_type - 'wedding' | 'conference' | 'birthday' | 'dinner'
 * @param {number} input.guests     - Number of guests
 * @param {number} input.budget     - Budget in LKR
 * @param {string} input.theme      - 'floral' | 'modern' | 'tropical' | 'classic'
 * @param {string} [input.event_date] - 'YYYY-MM-DD'
 * @param {number} [input.user_id]  - Logged-in user ID (for preference learning)
 * @returns {object} { recommendations: [...], meta: {...} }
 */
export async function getHybridRecommendations(input) {
  const { event_type, guests, budget, theme, event_date, user_id } = input;
  const pool = getPool();
  const startTime = Date.now();

  // =====================================================
  //  LAYER 1a: RULE ENGINE — Hard Constraints
  //  Returns ALL feasible options (not just the cheapest)
  // =====================================================

  // Rule 1: Get ALL venues that can host this many guests
  const [allVenues] = await pool.query(
    "SELECT * FROM venues WHERE ? BETWEEN min_capacity AND max_capacity ORDER BY base_cost ASC",
    [guests]
  );
  if (!allVenues.length) {
    return { error: `No venue can host ${guests} guests (max is 500).` };
  }

  // Get venue feature vectors for ML scoring
  const venueIds = allVenues.map(v => v.id);
  const [venueFeatures] = await pool.query(
    `SELECT * FROM venue_features WHERE venue_id IN (${venueIds.map(() => "?").join(",")})`,
    venueIds
  );
  const featureMap = {};
  for (const vf of venueFeatures) featureMap[vf.venue_id] = vf;

  // Rule 2: Get menu for this event type
  let [menus] = await pool.query("SELECT * FROM menus WHERE event_type = ? LIMIT 1", [event_type]);
  if (!menus.length) {
    [menus] = await pool.query("SELECT * FROM menus WHERE event_type = 'birthday' LIMIT 1");
  }
  const menu = menus[0];

  // Rule 3: Get ALL decoration tiers for this theme
  const [allDecorations] = await pool.query(
    "SELECT * FROM decorations WHERE theme = ? ORDER BY cost ASC", [theme]
  );

  // Get weather data for the event month
  let outdoorRisk = 0;
  if (event_date) {
    const month = new Date(event_date).getMonth() + 1;
    const [weatherRows] = await pool.query(
      "SELECT outdoor_risk FROM weather_data WHERE month = ?", [month]
    );
    if (weatherRows.length) outdoorRisk = weatherRows[0].outdoor_risk;
  }

  // Get user preferences if logged in
  let userPrefs = {};
  if (user_id) {
    const [prefRows] = await pool.query(
      "SELECT pref_key, pref_value FROM user_preferences WHERE user_id = ?", [user_id]
    );
    for (const p of prefRows) userPrefs[p.pref_key] = p.pref_value;
  }

  // Get objective weights (user-specific or default)
  let weights = { w_cost: 0.30, w_quality: 0.25, w_availability: 0.20, w_weather: 0.10, w_preference: 0.15 };
  if (user_id) {
    const [wRows] = await pool.query(
      "SELECT * FROM objective_weights WHERE user_id = ? LIMIT 1", [user_id]
    );
    if (wRows.length) weights = wRows[0];
  }
  if (!weights.w_cost) {
    const [defaultW] = await pool.query(
      "SELECT * FROM objective_weights WHERE user_id IS NULL LIMIT 1"
    );
    if (defaultW.length) weights = defaultW[0];
  }

  // =====================================================
  //  GENERATE ALL FEASIBLE COMBINATIONS
  // =====================================================
  const combinations = [];
  const warnings = [];

  for (const venue of allVenues) {
    // Rule 1b: Rainy season check
    let weatherSwapped = false;
    let effectiveVenue = venue;

    if (event_date && venue.is_outdoor && outdoorRisk > 0.5) {
      // Flag it but still include outdoor option with penalty
      weatherSwapped = true;
      warnings.push(
        `'${venue.name}' is outdoor during rainy season (${Math.round(outdoorRisk * 100)}% risk).`
      );
    }

    // Rule 5: Date conflict check
    let dateConflict = 0;
    if (event_date) {
      const [conflictRows] = await pool.query(
        "SELECT COUNT(*) AS n FROM event_bookings WHERE venue_id = ? AND event_date = ? AND status != 'cancelled'",
        [venue.id, event_date]
      );
      dateConflict = conflictRows[0].n > 0 ? 1 : 0;
    }

    for (const decoration of allDecorations) {
      const menuCost = guests * menu.price_per_head;
      const totalCost = venue.base_cost + menuCost + decoration.cost;

      // Hard constraint: skip if more than 30% over budget (not feasible)
      if (totalCost > budget * 1.3) continue;

      const comboId = `v${venue.id}_d${decoration.id}`;

      // =====================================================
      //  LAYER 1b: ML SCORING — heuristic + trained logistic
      //  regression blend (trainedWeights loaded from
      //  lib/trained-weights.json, produced by `npm run train:ml`)
      // =====================================================
      const scoringParams = {
        venueFeatures: featureMap[venue.id],
        eventType: event_type,
        decorTier: decoration.tier,
        budgetRatio: totalCost / budget,
        capacityUtil: guests / venue.max_capacity,
      };
      const heuristicComponent = heuristicScore(scoringParams);
      const trainedComponent = trainedScore(scoringParams, trainedWeights);
      const mlScore = 0.4 * heuristicComponent + 0.6 * trainedComponent;

      // =====================================================
      //  LAYER 2: MULTI-OBJECTIVE SCORING
      // =====================================================
      const scores = computeObjectiveScores({
        venue, menu, decoration,
        venueFeatures: featureMap[venue.id],
        budget, guests, outdoorRisk,
        dateConflict, userPrefs,
      });

      combinations.push({
        id: comboId,
        scores,
        mlScore,
        data: {
          venue: {
            name: venue.name, cost: venue.base_cost,
            min_cap: venue.min_capacity, max_cap: venue.max_capacity,
            is_outdoor: venue.is_outdoor,
          },
          menu: {
            name: menu.name, price_per_head: menu.price_per_head,
            cost: menuCost,
          },
          decoration: {
            name: decoration.name, cost: decoration.cost,
            tier: decoration.tier, theme: decoration.theme,
          },
          total_cost: totalCost,
          within_budget: totalCost <= budget,
          guests,
          budget,
          _weatherSwapped: weatherSwapped,
          _outdoorRisk: outdoorRisk,
          _dateConflict: dateConflict,
          _mlScore: mlScore,
          _heuristicScore: heuristicComponent,
          _trainedScore: trainedComponent,
        },
      });
    }
  }

  if (!combinations.length) {
    return { error: `No feasible event configuration found for ${guests} guests within 130% of your budget.` };
  }

  // =====================================================
  //  RANK AND SELECT TOP 3
  // =====================================================
  const ranked = rankOptions(combinations, weights, 3);

  // Assign descriptive labels based on objective strengths
  if (ranked.length >= 2) {
    // Find which is best on cost vs quality
    const costBest = [...ranked].sort((a, b) => b.scores[0] - a.scores[0])[0];
    const qualityBest = [...ranked].sort((a, b) => b.scores[1] - a.scores[1])[0];

    for (const r of ranked) {
      if (r.id === costBest.id && r.id !== qualityBest.id) r.label = "Best Value";
      else if (r.id === qualityBest.id && r.id !== costBest.id) r.label = "Best Quality";
      else r.label = "Best Overall";
    }
  }

  // =====================================================
  //  LAYER 3: EXPLANATION ENGINE
  // =====================================================
  const recommendations = ranked.map(rec => ({
    ...rec.data,
    rank: rec.rank,
    label: rec.label,
    isPareto: rec.isPareto,
    aggregate: rec.aggregate,
    scores: rec.scores,
    scoreLabels: OBJECTIVE_LABELS,
    explanation: generateExplanation(rec, combinations, input, weights),
  }));

  // Add upsell suggestions for the top recommendation
  const topRec = recommendations[0];
  if (topRec.within_budget && (budget - topRec.total_cost) > budget * 0.20) {
    const [pkgs] = await pool.query(
      "SELECT name, add_on_cost FROM event_packages WHERE event_type = ?", [event_type]
    );
    const suggestions = pkgs.map(pkg =>
      `You have surplus budget — add ${pkg.name} (+LKR ${pkg.add_on_cost.toLocaleString()})?`
    );
    recommendations[0].suggestions = suggestions;
  }

  // Collect all warnings
  for (const rec of recommendations) {
    rec.warnings = [...warnings];
    if (!rec.within_budget) {
      const over = rec.total_cost - budget;
      rec.warnings.push(
        `Budget insufficient by LKR ${over.toLocaleString()}. See counterfactuals for optimization ideas.`
      );
    }
    if (rec._dateConflict) {
      rec.warnings.push(
        `'${rec.venue.name}' is already booked on ${event_date}. Please choose another date.`
      );
    }
  }

  // =====================================================
  //  LOG THE RECOMMENDATION (for ML training data)
  // =====================================================
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await pool.query(
      `INSERT INTO recommendation_logs
        (user_id, session_id, input_params, rule_output, ml_scores, final_output, explanation, counterfactuals, pareto_rank)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        sessionId,
        JSON.stringify(input),
        JSON.stringify({ feasible_count: combinations.length, venues: allVenues.map(v => v.name) }),
        JSON.stringify(ranked.map(r => ({
          id: r.id,
          ml: r.mlScore,
          heuristic: r.data._heuristicScore,
          trained: r.data._trainedScore,
          agg: r.aggregate,
        }))),
        JSON.stringify(recommendations[0]),
        JSON.stringify(recommendations[0].explanation),
        JSON.stringify(recommendations[0].explanation?.counterfactuals || []),
        1,
      ]
    );
  } catch (logErr) {
    // Non-fatal: logging failure shouldn't break the recommendation
    console.warn("[recommendation-engine] Failed to log recommendation:", logErr.message);
  }

  return {
    recommendations,
    meta: {
      sessionId,
      feasible_count: combinations.length,
      engine_version: "hybrid-v1.0",
      processing_time_ms: Date.now() - startTime,
      weights_used: {
        cost: weights.w_cost,
        quality: weights.w_quality,
        availability: weights.w_availability,
        weather: weights.w_weather,
        preference: weights.w_preference,
        source: weights.source || "default",
      },
    },
  };
}
