/**
 * lib/design-prompt.js — shared contract for the AI Event Concept Visualiser.
 *
 * DESIGN_OPTIONS is the single source of truth: the popup renders these as
 * dropdowns and the API route validates submitted values against the same
 * lists. Because every aesthetic field is drawn from a fixed allow-list the
 * composed prompt is bounded in length *by construction* — only `specialNotes`
 * is free text, and it is capped and flattened to a single line.
 *
 * This replaces the previous design where the browser concatenated a large
 * prompt string and the server merely length-checked it. That check rejected
 * the default selections (~585 chars against a 500 limit), so the feature
 * failed on every click before the user had typed anything.
 */

export const DESIGN_OPTIONS = {
  colorPalette:       ["Pastel", "Earth Tones", "Jewel Tones", "Monochrome", "Vibrant"],
  lightingStyle:      ["Fairy Lights", "Chandeliers", "Neon Signs", "Lanterns", "Spotlights"],
  seatingArrangement: ["Round Tables", "Banquet Style", "Lounge Seating", "U-Shape"],
  centerpieceType:    ["Tall Floral", "Short Floral", "Candles", "Geometric", "Minimalist"],
  floralArrangement:  ["Roses", "Wildflowers", "Peonies", "Tropical", "Orchids"],
  tableclothMaterial: ["Satin", "Sequins", "Velvet", "Linen", "Chiffon"],
  flooring:           ["White Seamless", "Wooden", "Checkerboard", "LED", "Custom Decal"],
  backdropStyle:      ["Floral Wall", "Drape & Fairy Lights", "Neon Sign", "Archway", "Greenery"],
  ceilingDraping:     ["Starburst", "Parallel", "Tent Style", "None", "Mixed with Florals"],
  entranceDecor:      ["Floral Arch", "Red Carpet", "Lantern Pathway", "Signage", "Welcome Drink Station"],
};

export const MAX_SPECIAL_NOTES = 300;
export const MAX_VENUE_NAME    = 80;
export const MAX_GUESTS        = 2000;

/**
 * The four camera positions, in render order. Exported so the gallery can
 * label each image correctly — the previous hardcoded caption listed them in
 * the wrong order relative to the array the route actually iterates.
 */
export const ANGLES = [
  {
    key: "wide",
    label: "Wide Floorplan",
    clause: "Wide establishing shot from the rear of the hall showing the full floorplan, table layout and overall lighting atmosphere.",
  },
  {
    key: "centerpiece",
    label: "Centrepiece Detail",
    clause: "Tight close-up of a single dressed table capturing linen texture, glassware, cutlery and the centrepiece arrangement in shallow focus.",
  },
  {
    key: "entrance",
    label: "Entrance Approach",
    clause: "Eye-level view from the entrance threshold looking down the aisle toward the illuminated stage backdrop.",
  },
  {
    key: "overhead",
    label: "Ceiling & Draping",
    clause: "High overhead shot angled upward and across, emphasising the ceiling draping, suspended lighting and floral installations.",
  },
];

/**
 * Camera and quality directives appended to every angle, including the
 * negative clause. Stated as concrete photographic parameters rather than
 * vague adjectives ("8k", "masterpiece"), which is what actually steers a
 * diffusion model toward architectural realism.
 */
const QUALITY_SUFFIX =
  "Photorealistic architectural interior photography, full-frame camera, 24mm tilt-shift lens at f/8, " +
  "balanced three-point lighting, natural depth of field, true-to-life material textures, " +
  "architectural magazine editorial quality, ultra-detailed, sharp focus, high dynamic range. " +
  "No people, no text, no lettering, no watermark, no warped geometry.";

function pickOption(answers, key) {
  const allowed = DESIGN_OPTIONS[key];
  const value = answers?.[key];
  return allowed.includes(value) ? value : allowed[0];
}

/** Flatten free text to a single line and cap it. */
export function sanitiseNotes(value, maxLen = MAX_SPECIAL_NOTES) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function sanitiseLabel(value, fallback, maxLen) {
  if (typeof value !== "string") return fallback;
  const clean = value.replace(/\s+/g, " ").trim().slice(0, maxLen);
  return clean || fallback;
}

/**
 * Compose the scene description shared by all four angles.
 *
 * Written as flowing descriptive prose rather than "Label: value" lines —
 * diffusion models weight natural phrasing far more reliably than key-value
 * pairs, which is the single largest quality gain available here.
 */
export function buildScenePrompt({ answers = {}, venueName, eventType, theme, guests } = {}) {
  const venue    = sanitiseLabel(venueName, "Crystal Ballroom", MAX_VENUE_NAME);
  const type     = sanitiseLabel(eventType, "wedding", 40).toLowerCase();
  const themeTxt = sanitiseLabel(theme, "floral", 40).toLowerCase();

  const guestNum = Number(guests);
  const guestCount = Number.isFinite(guestNum) && guestNum > 0
    ? Math.min(Math.round(guestNum), MAX_GUESTS)
    : 100;

  const colour      = pickOption(answers, "colorPalette");
  const lighting    = pickOption(answers, "lightingStyle");
  const seating     = pickOption(answers, "seatingArrangement");
  const centrepiece = pickOption(answers, "centerpieceType");
  const florals     = pickOption(answers, "floralArrangement");
  const linen       = pickOption(answers, "tableclothMaterial");
  const floor       = pickOption(answers, "flooring");
  const backdrop    = pickOption(answers, "backdropStyle");
  const draping     = pickOption(answers, "ceilingDraping");
  const entrance    = pickOption(answers, "entranceDecor");

  const notes = sanitiseNotes(answers.specialNotes);

  const parts = [
    `The ${venue} at a luxury Sri Lankan beachfront hotel, dressed for a ${guestCount}-guest ${type} with a ${themeTxt} theme.`,
    `${colour} colour palette throughout.`,
    `${lighting} provide the primary illumination.`,
    `${seating} seating dressed in ${linen} linen.`,
    `${centrepiece} centrepieces arranged with ${florals}.`,
    `${floor} flooring underfoot.`,
    `A ${backdrop} backdrop behind the stage.`,
    draping === "None"
      ? "Bare architectural ceiling left undraped."
      : `${draping} ceiling draping overhead.`,
    `${entrance} framing the entrance.`,
  ];

  if (notes) parts.push(notes.endsWith(".") ? notes : `${notes}.`);

  return parts.join(" ");
}

/** Full prompt for one camera angle: position → scene → quality directives. */
export function buildAnglePrompt(scene, angle) {
  return `${angle.clause} ${scene} ${QUALITY_SUFFIX}`;
}
