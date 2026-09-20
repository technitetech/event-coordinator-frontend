import { NextResponse } from "next/server";
import { getSession } from "../../(public)/auth-actions";
import { checkRateLimit } from "../../../lib/rate-limiter";
import { ANGLES, buildScenePrompt, buildAnglePrompt } from "../../../lib/design-prompt";

// Never fall back to a hardcoded key — if the env var is absent, requests
// skip the primary API and use the pollinations fallback instead.
const API_KEY = process.env.FREELLM_API_KEY ?? null;
const API_URL = "http://127.0.0.1:31415/v1/images/generations";
const PRIMARY_TIMEOUT_MS = 25000;

// 16:9 suits architectural interiors far better than the previous 1:1 square,
// which cropped away the width that makes a floorplan shot readable. These
// dimensions are also a native flux resolution, so nothing is upscaled.
const IMG_W = 1344;
const IMG_H = 768;

// Optional. Without a registered token Pollinations stamps its own watermark
// on every render regardless of `nologo` — set POLLINATIONS_TOKEN in
// .env.local to get clean, unbranded images.
const POLLINATIONS_TOKEN = process.env.POLLINATIONS_TOKEN ?? null;

function pollinationsUrl(prompt, seed) {
  const qs = new URLSearchParams({
    model: "flux",     // markedly higher fidelity than the default turbo model
    width: String(IMG_W),
    height: String(IMG_H),
    seed: String(seed),
    nologo: "true",
    enhance: "false",  // keep our hand-tuned prompt verbatim rather than let it be rewritten
  });
  if (POLLINATIONS_TOKEN) qs.set("token", POLLINATIONS_TOKEN);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${qs}`;
}

async function requestPrimary(prompt) {
  // Skip primary if no API key is configured
  if (!API_KEY) return null;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        model: "auto",
        n: 1,
        size: `${IMG_W}x${IMG_H}`,
        quality: "hd",
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const url = data?.data?.[0]?.url;
    return url || null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate-limit: each call fires 4 parallel external image requests
    const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown")
      .split(",")[0].trim();
    const rl = checkRateLimit(`design:${session.id}:${ip}`, 10, 60_000); // 10 per min
    if (!rl.ok) {
      return NextResponse.json({ error: `Rate limit exceeded. Retry in ${rl.retryAfter}s.` }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));

    // The prompt is composed server-side from allow-listed values, so an
    // over-long or injected client string can no longer reach the model. This
    // is what removes the old "Prompt must not exceed 500 characters" failure:
    // length is now bounded by construction rather than rejected after the fact.
    const scene = buildScenePrompt({
      answers:   body?.answers ?? {},
      venueName: body?.venueName,
      eventType: body?.eventType,
      theme:     body?.theme,
      guests:    body?.guests,
    });

    // One random base seed per request keeps the four angles visually coherent
    // as a set, while the prime-spaced offsets keep each perspective distinct.
    // A fresh base each call means "Regenerate" genuinely produces new concepts.
    const baseSeed = Math.floor(Math.random() * 1_000_000);

    // Fire all 4 angle requests against the primary API in parallel. Each one
    // that fails or times out falls back to the pollinations render for that
    // specific angle, so we always return 4 synchronized perspectives.
    const results = await Promise.all(
      ANGLES.map(async (angle, i) => {
        const prompt = buildAnglePrompt(scene, angle);
        const seed = (baseSeed + i * 7919) % 1_000_000;
        const primary = await requestPrimary(prompt);
        return {
          url: primary || pollinationsUrl(prompt, seed),
          key: angle.key,
          label: angle.label,
        };
      })
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Image generation error:", error);
    // Absolute-last-resort: 4 generic perspectives so the UI still gets a gallery
    const scene = buildScenePrompt({});
    const baseSeed = Math.floor(Math.random() * 1_000_000);
    const fallback = ANGLES.map((angle, i) => ({
      url: pollinationsUrl(buildAnglePrompt(scene, angle), (baseSeed + i * 7919) % 1_000_000),
      key: angle.key,
      label: angle.label,
    }));
    return NextResponse.json({ data: fallback });
  }
}
