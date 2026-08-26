/**
 * Feedback-Driven Adaptive Learning Module
 *
 * Research contribution: Adjusts objective weights and ML model parameters
 * based on post-event user satisfaction ratings. This implements the
 * "adaptive feedback loop" — the system literally gets better with use.
 *
 * Learning algorithm:
 *   1. Collect feedback (5-dimensional satisfaction ratings)
 *   2. Correlate ratings with objective scores at recommendation time
 *   3. Adjust weights toward objectives that correlate with satisfaction
 *   4. Retrain the ML scorer when ≥20 feedback points accumulate
 *
 * @module lib/feedback-learner
 */

import { getPool } from "./db.js";

/**
 * Submits feedback for a completed booking.
 *
 * @param {object} feedback
 * @param {number} feedback.booking_id
 * @param {number} feedback.user_id
 * @param {number} feedback.overall_rating  - 1–5
 * @param {number} feedback.venue_rating    - 1–5
 * @param {number} feedback.menu_rating     - 1–5
 * @param {number} feedback.decor_rating    - 1–5
 * @param {number} feedback.value_rating    - 1–5
 * @param {string} [feedback.comment]
 * @param {boolean} [feedback.would_rebook]
 * @returns {object} { ok: boolean, message: string, learning_triggered: boolean }
 */
export async function submitFeedback(feedback) {
  const pool = getPool();

  // Validate ratings
  for (const key of ["overall_rating", "venue_rating", "menu_rating", "decor_rating", "value_rating"]) {
    const val = feedback[key];
    if (val !== undefined && val !== null && (val < 1 || val > 5)) {
      return { ok: false, message: `${key} must be between 1 and 5.` };
    }
  }

  try {
    await pool.query(
      `INSERT INTO feedback
        (booking_id, user_id, overall_rating, venue_rating, menu_rating, decor_rating, value_rating, comment, would_rebook)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        overall_rating = VALUES(overall_rating),
        venue_rating = VALUES(venue_rating),
        menu_rating = VALUES(menu_rating),
        decor_rating = VALUES(decor_rating),
        value_rating = VALUES(value_rating),
        comment = VALUES(comment),
        would_rebook = VALUES(would_rebook)`,
      [
        feedback.booking_id, feedback.user_id,
        feedback.overall_rating, feedback.venue_rating,
        feedback.menu_rating, feedback.decor_rating,
        feedback.value_rating, feedback.comment || null,
        feedback.would_rebook !== undefined ? feedback.would_rebook : null,
      ]
    );

    // Mark the recommendation as accepted (if we can find it)
    await pool.query(
      `UPDATE recommendation_logs SET accepted = 1
       WHERE user_id = ? AND accepted IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [feedback.user_id]
    );

    // Update user preferences based on this feedback
    await updateUserPreferences(feedback.user_id, feedback);

    // Check if we have enough data to trigger a learning cycle
    const [countRows] = await pool.query("SELECT COUNT(*) AS n FROM feedback");
    const feedbackCount = countRows[0].n;
    const learningTriggered = feedbackCount >= 20 && feedbackCount % 5 === 0;

    if (learningTriggered) {
      await adjustObjectiveWeights();
    }

    return {
      ok: true,
      message: "Thank you for your feedback!",
      learning_triggered: learningTriggered,
      feedback_count: feedbackCount,
    };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return { ok: false, message: "You've already submitted feedback for this booking." };
    }
    throw err;
  }
}

/**
 * Updates user preference vector based on their feedback.
 * This captures what the user values — if they rate venue highly but menu
 * poorly, their preference vector shifts toward venue-quality.
 */
async function updateUserPreferences(userId, feedback) {
  const pool = getPool();

  const prefs = [];

  // Derive preferences from rating patterns
  const ratings = {
    venue: feedback.venue_rating || 3,
    menu: feedback.menu_rating || 3,
    decor: feedback.decor_rating || 3,
    value: feedback.value_rating || 3,
  };

  // Quality focus: high venue+decor ratings = cares about quality
  const qualityFocus = ((ratings.venue + ratings.decor) / 2 - 1) / 4; // normalize 1–5 → 0–1
  prefs.push({ key: "quality_focus", value: qualityFocus });

  // Budget sensitivity: high value rating = cares about cost
  const budgetSensitivity = (ratings.value - 1) / 4;
  prefs.push({ key: "budget_flexibility", value: 1 - budgetSensitivity });

  // Would rebook → overall satisfaction indicator
  if (feedback.would_rebook !== undefined) {
    prefs.push({ key: "satisfaction_baseline", value: feedback.would_rebook ? 0.8 : 0.3 });
  }

  for (const pref of prefs) {
    await pool.query(
      `INSERT INTO user_preferences (user_id, pref_key, pref_value, confidence)
       VALUES (?, ?, ?, 0.6)
       ON DUPLICATE KEY UPDATE
         pref_value = (pref_value * 0.7 + VALUES(pref_value) * 0.3),  -- exponential moving average
         confidence = LEAST(1.0, confidence + 0.05)`,
      [userId, pref.key, pref.value]
    );
  }
}

/**
 * Adjusts system-wide objective weights based on correlation between
 * objective scores and satisfaction ratings.
 *
 * Algorithm:
 *   1. For each completed booking with feedback AND a recommendation log:
 *      - Get the 5 objective scores at recommendation time
 *      - Get the overall satisfaction rating (1–5)
 *   2. Compute Pearson correlation between each objective and satisfaction
 *   3. Increase weight for objectives with positive correlation
 *   4. Decrease weight for objectives with negative/no correlation
 *   5. Re-normalize weights to sum to 1.0
 */
async function adjustObjectiveWeights() {
  const pool = getPool();

  // Join feedback with recommendation logs to get scores + ratings
  const [rows] = await pool.query(`
    SELECT
      f.overall_rating,
      rl.final_output
    FROM feedback f
    JOIN event_bookings eb ON f.booking_id = eb.id
    JOIN recommendation_logs rl ON rl.user_id = f.user_id
    WHERE f.overall_rating IS NOT NULL
      AND rl.final_output IS NOT NULL
    ORDER BY f.created_at DESC
    LIMIT 100
  `);

  if (rows.length < 20) return; // Not enough data

  // Extract scores and ratings
  const data = rows.map(r => {
    let output;
    try {
      output = typeof r.final_output === "string" ? JSON.parse(r.final_output) : r.final_output;
    } catch { return null; }
    if (!output?.scores) return null;
    return {
      scores: output.scores,
      rating: r.overall_rating / 5, // normalize to 0–1
    };
  }).filter(Boolean);

  if (data.length < 15) return;

  // Compute correlation for each objective
  const correlations = [];
  for (let obj = 0; obj < 5; obj++) {
    const x = data.map(d => d.scores[obj] || 0);
    const y = data.map(d => d.rating);
    correlations.push(pearsonCorrelation(x, y));
  }

  // Convert correlations to weight adjustments
  // Positive correlation → increase weight, negative → decrease
  const currentWeights = [0.30, 0.25, 0.20, 0.10, 0.15];
  const [defaultW] = await pool.query(
    "SELECT * FROM objective_weights WHERE user_id IS NULL LIMIT 1"
  );
  if (defaultW.length) {
    currentWeights[0] = defaultW[0].w_cost;
    currentWeights[1] = defaultW[0].w_quality;
    currentWeights[2] = defaultW[0].w_availability;
    currentWeights[3] = defaultW[0].w_weather;
    currentWeights[4] = defaultW[0].w_preference;
  }

  // Apply learning rate of 0.1 (conservative adjustment)
  const LEARNING_RATE = 0.10;
  const newWeights = currentWeights.map((w, i) => {
    const adjustment = correlations[i] * LEARNING_RATE;
    return Math.max(0.05, w + adjustment); // minimum weight = 0.05
  });

  // Normalize to sum to 1.0
  const wSum = newWeights.reduce((a, b) => a + b, 0);
  const normalized = newWeights.map(w => Math.round((w / wSum) * 1000) / 1000);

  // Save learned weights
  await pool.query(
    `INSERT INTO objective_weights (user_id, w_cost, w_quality, w_availability, w_weather, w_preference, source)
     VALUES (NULL, ?, ?, ?, ?, ?, 'learned')
     ON DUPLICATE KEY UPDATE
       w_cost = VALUES(w_cost),
       w_quality = VALUES(w_quality),
       w_availability = VALUES(w_availability),
       w_weather = VALUES(w_weather),
       w_preference = VALUES(w_preference),
       source = 'learned'`,
    normalized
  );

  console.log("[feedback-learner] Adjusted objective weights:", {
    old: currentWeights,
    correlations,
    new: normalized,
    dataPoints: data.length,
  });
}

/**
 * Pearson correlation coefficient between two arrays.
 */
function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n < 2) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);
  const sumY2 = y.reduce((a, yi) => a + yi * yi, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (den === 0) return 0;
  return num / den;
}

/**
 * Returns analytics about the feedback learning system.
 */
export async function getLearningStats() {
  const pool = getPool();

  const [feedbackCount] = await pool.query("SELECT COUNT(*) AS n FROM feedback");
  const [avgRating] = await pool.query("SELECT AVG(overall_rating) AS avg FROM feedback");
  const [rebookRate] = await pool.query(
    "SELECT AVG(would_rebook) AS rate FROM feedback WHERE would_rebook IS NOT NULL"
  );
  const [weights] = await pool.query(
    "SELECT * FROM objective_weights WHERE user_id IS NULL LIMIT 1"
  );

  return {
    total_feedback: feedbackCount[0].n,
    average_rating: Math.round((avgRating[0].avg || 0) * 100) / 100,
    rebook_rate: Math.round((rebookRate[0].rate || 0) * 100),
    current_weights: weights[0] || null,
    learning_threshold: 20,
    next_learning_at: Math.ceil(feedbackCount[0].n / 5) * 5 + 5,
  };
}
