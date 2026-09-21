/**
 * lib/concept-jobs.js — background render engine for AI event concepts.
 *
 * Pollinations' free tier admits roughly ONE concurrent render per IP: firing
 * the angles in parallel returns 429 for all but one, which is why the old
 * Promise.all approach surfaced a single image (or none). Renders are therefore
 * issued strictly one at a time with backoff, and each result is written to
 * disk so the browser loads a local file instead of re-triggering a render.
 */

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { ANGLES, buildAnglePrompt } from "./design-prompt.js";

const OUT_DIR    = path.join(process.cwd(), "public", "images", "concepts");
const PUBLIC_REL = "/images/concepts";

const MAX_ATTEMPTS   = 4;
// The free "seed" tier admits one request per 5s; anonymous is stricter still.
const GAP_MS         = 5000;   // pause between consecutive renders
const FETCH_TIMEOUT  = 120_000;
const JOB_TTL_MS     = 30 * 60_000;

// A registered (free "seed" tier) token lifts the anonymous rate limit to one
// request per 5s and drops the watermark. Sent as a Bearer header because the
// API docs warn tokens in query strings leak through logs and referrers.
const TOKEN = process.env.POLLINATIONS_TOKEN ?? null;

// `sana` is currently the only model the image endpoint serves — /models
// returns exactly ["sana"], and the old flux/turbo names now 500 or silently
// resolve to sana anyway. Second tier is a smaller retry for capacity errors.
const TIERS = [
  { model: "sana", width: 1280, height: 720 },
  { model: "sana", width: 1024, height: 576 },
];

// Survives module re-evaluation during dev hot reloads.
const store = (globalThis.__conceptJobs ??= new Map());

const sleep = ms => new Promise(r => setTimeout(r, ms));

function buildUrl(prompt, seed, tier) {
  const qs = new URLSearchParams({
    model:   tier.model,
    width:   String(tier.width),
    height:  String(tier.height),
    seed:    String(seed),
    enhance: "false",
  });
  // nologo is only honoured for authenticated requests; harmless without one.
  if (TOKEN) qs.set("nologo", "true");
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${qs}`;
}

async function fetchImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    });
    if (!res.ok) return { ok: false, status: res.status };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024) return { ok: false, status: 502 };
    return { ok: true, buf, type: res.headers.get("content-type") || "image/jpeg" };
  } catch (err) {
    return { ok: false, status: err.name === "AbortError" ? 408 : 0 };
  } finally {
    clearTimeout(timer);
  }
}

/** Render one angle, retrying across tiers and attempts. Returns a public path. */
async function renderAngle(jobId, angle, prompt, seed) {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Drop to the more permissive tier once the preferred one has failed twice.
    const tier = TIERS[Math.min(TIERS.length - 1, attempt <= 2 ? 0 : 1)];
    const result = await fetchImage(buildUrl(prompt, seed, tier));

    if (result.ok) {
      const ext  = result.type.includes("png") ? "png" : "jpg";
      const name = `${jobId}-${angle.key}.${ext}`;
      await mkdir(OUT_DIR, { recursive: true });
      await writeFile(path.join(OUT_DIR, name), result.buf);
      return `${PUBLIC_REL}/${name}`;
    }

    lastStatus = result.status;
    if (attempt < MAX_ATTEMPTS) {
      // 429 means the rate window is still closed — back off harder than for a 5xx.
      const base = result.status === 429 ? 8000 : 5000;
      await sleep(base * attempt);
    }
  }

  throw new Error(
    lastStatus === 429
      ? "Render queue is busy — try again in a moment."
      : `Render service returned ${lastStatus || "no response"}.`
  );
}

async function runJob(jobId, scene, angles, baseSeed) {
  const job = store.get(jobId);
  if (!job) return;

  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    const slot  = job.angles[i];
    slot.status = "rendering";

    try {
      const prompt = buildAnglePrompt(scene, angle);
      const seed   = (baseSeed + i * 7919) % 1_000_000;
      slot.url     = await renderAngle(jobId, angle, prompt, seed);
      slot.status  = "done";
    } catch (err) {
      slot.status = "error";
      slot.error  = err.message;
    }

    if (i < angles.length - 1) await sleep(GAP_MS);
  }

  job.finishedAt = Date.now();
}

/** Start a job and return its descriptor immediately; rendering continues in background. */
export function startConceptJob({ scene, count }) {
  const n      = Math.max(1, Math.min(ANGLES.length, Number(count) || ANGLES.length));
  const angles = ANGLES.slice(0, n);
  const jobId  = randomUUID();

  store.set(jobId, {
    createdAt: Date.now(),
    finishedAt: null,
    angles: angles.map(a => ({ key: a.key, label: a.label, status: "queued", url: null, error: null })),
  });

  // Intentionally not awaited — the client polls for progress.
  runJob(jobId, scene, angles, Math.floor(Math.random() * 1_000_000))
    .catch(err => {
      const job = store.get(jobId);
      if (job) job.angles.forEach(a => { if (a.status !== "done") { a.status = "error"; a.error = err.message; } });
    });

  purgeExpired();
  return { jobId, angles: store.get(jobId).angles };
}

export function getConceptJob(jobId) {
  const job = store.get(jobId);
  if (!job) return null;
  const pending = job.angles.some(a => a.status === "queued" || a.status === "rendering");
  return { angles: job.angles, done: !pending };
}

function purgeExpired() {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of store) if (job.createdAt < cutoff) store.delete(id);
}
