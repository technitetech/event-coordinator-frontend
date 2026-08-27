/**
 * Generates a synthetic bootstrap training set for lib/ml-scorer.js's
 * trainedScore() logistic regression.
 *
 * Why synthetic: the real `feedback` table has 0 rows and `recommendation_logs`
 * has only a couple, so there is no real usage data to learn from yet. This
 * script simulates plausible customer-satisfaction labels by taking the
 * existing heuristicScore() (hand-tuned domain rules) as a base probability,
 * adding a few synergy terms the heuristic does NOT encode, adding noise, and
 * Bernoulli-sampling a binary "would rate >= 4/5" label from that probability.
 *
 * This lets trainedScore() learn a genuine (if imperfect) statistical fit
 * rather than just re-deriving the heuristic. Once real feedback accumulates,
 * this dataset should be replaced by one built from actual `feedback` +
 * `recommendation_logs` rows.
 *
 * Run with: node scripts/generate-training-data.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { heuristicScore, FEATURE_NAMES } from "../lib/ml-scorer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const N_SAMPLES = 2000;
const EVENT_TYPES = ["wedding", "conference", "birthday", "dinner"];
const DECOR_TIERS = ["basic", "standard", "premium"];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// Box-Muller transform for Gaussian noise
function gaussianNoise(sigma) {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * sigma;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function synergyBonus({ venueFeatures, eventType, decorTier, capacityUtil }) {
  let bonus = 0;

  // Weddings with high ambiance AND premium decor reinforce each other
  // beyond their individual heuristic weights (a "wow factor" the linear
  // heuristic doesn't capture).
  if (eventType === "wedding" && decorTier === "premium" && venueFeatures.ambiance_score > 0.8) {
    bonus += 0.08;
  }

  // Conferences with both high tech AND high accessibility compound well
  // (a venue that's only good at one tends to disappoint more than the
  // heuristic's additive weighting implies).
  if (eventType === "conference" && venueFeatures.tech_readiness > 0.8 && venueFeatures.accessibility > 0.8) {
    bonus += 0.06;
  }

  // Near-perfect capacity utilization with low noise is a strong positive
  // signal for intimate event types.
  if ((eventType === "dinner" || eventType === "wedding") && capacityUtil > 0.65 && capacityUtil < 0.85 && venueFeatures.noise_level < 0.4) {
    bonus += 0.05;
  }

  return bonus;
}

function generateSample() {
  const venueFeatures = {
    ambiance_score: rand(0, 1),
    photo_score: rand(0, 1),
    accessibility: rand(0, 1),
    noise_level: rand(0, 1),
    natural_light: rand(0, 1),
    tech_readiness: rand(0, 1),
  };
  const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const decorTier = DECOR_TIERS[Math.floor(Math.random() * DECOR_TIERS.length)];
  const budgetRatio = rand(0.5, 1.4);
  const capacityUtil = rand(0.1, 1.1);

  const baseProb = heuristicScore({ venueFeatures, eventType, decorTier, budgetRatio, capacityUtil });
  let trueProb = baseProb + synergyBonus({ venueFeatures, eventType, decorTier, capacityUtil });
  trueProb = clamp01(trueProb + gaussianNoise(0.08));

  const label = Math.random() < trueProb ? 1 : 0;

  const tierValue = decorTier === "premium" ? 1.0 : decorTier === "standard" ? 0.6 : 0.25;
  const features = [
    venueFeatures.ambiance_score,
    venueFeatures.photo_score,
    venueFeatures.accessibility,
    1 - venueFeatures.noise_level,
    venueFeatures.natural_light,
    venueFeatures.tech_readiness,
    tierValue,
    budgetRatio,
    capacityUtil,
    eventType === "wedding" ? 1 : 0,
    eventType === "conference" ? 1 : 0,
    eventType === "birthday" ? 1 : 0,
    eventType === "dinner" ? 1 : 0,
  ];

  return { features, label };
}

function main() {
  const samples = Array.from({ length: N_SAMPLES }, generateSample);
  const positives = samples.filter((s) => s.label === 1).length;

  const outDir = path.join(__dirname, "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "ml-training-data.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify({ feature_names: FEATURE_NAMES, generated_at: new Date().toISOString(), samples }, null, 2)
  );

  console.log(`Generated ${samples.length} synthetic samples (${positives} positive, ${samples.length - positives} negative).`);
  console.log(`Written to ${outPath}`);
}

main();
