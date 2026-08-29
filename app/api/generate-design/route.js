import { NextResponse } from "next/server";
import { getSession } from "../../(public)/auth-actions";
import { checkRateLimit } from "../../../lib/rate-limiter";

// Never fall back to a hardcoded key — if the env var is absent, requests
// skip the primary API and use the pollinations fallback instead.
const API_KEY = process.env.FREELLM_API_KEY ?? null;
const API_URL = "http://127.0.0.1:31415/v1/images/generations";
const PRIMARY_TIMEOUT_MS = 25000;

const MAX_PROMPT_LEN   = 500;
const MAX_VENUE_NAME_LEN = 100;

function pollinationsUrl(fullPrompt, angle) {
  const seed = Math.floor(Math.random() * 90000) + 10000;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `${fullPrompt}. ${angle}`
  )}?width=1024&height=1024&nologo=true&seed=${seed}`;
}

async function requestPrimary(fullPrompt, angle) {
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
        prompt: `${fullPrompt}. ${angle}`,
        model: "auto",
        n: 1,
        size: "1024x1024",
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

    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const venueName = typeof body.venueName === "string" ? body.venueName.trim().slice(0, MAX_VENUE_NAME_LEN) : "Ballroom";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LEN) {
      return NextResponse.json({ error: `Prompt must not exceed ${MAX_PROMPT_LEN} characters.` }, { status: 400 });
    }

    const fullPrompt = `${prompt}\n\nSTRICT ARCHITECTURAL DIRECTIVES: Photorealistic 8k interior architectural photography of luxury event venue. No human figures. Elegant Ceylon beachfront coastal luxury decor, natural depth of field, warm architectural illumination.`;

    const angles = [
      `Wide panoramic architectural angle of ${venueName} showcasing the spatial floorplan and full lighting atmosphere`,
      `Close-up cinematic focus on the VIP table setting, linen textures, and handcrafted centerpiece arrangement`,
      `Perspective from the grand entrance corridor gazing toward the illuminated stage backdrop`,
      `Overhead perspective highlighting the ceiling draping design, chandeliers, and floral installations`,
    ];

    // Fire all 4 angle requests against the primary API in parallel. Each
    // one that fails or times out falls back to the pollinations render for
    // that specific angle, so we always return 4 synchronized perspectives.
    const results = await Promise.all(
      angles.map(async (angle) => {
        const primary = await requestPrimary(fullPrompt, angle);
        return { url: primary || pollinationsUrl(fullPrompt, angle) };
      })
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Image generation error:", error);
    // Absolute-last-resort: 4 generic perspectives so the UI still gets a gallery
    const angles = [
      "wide panoramic hall view",
      "close-up centerpiece detail",
      "entrance corridor perspective",
      "overhead ceiling installation",
    ];
    const fallback = angles.map((a) => ({
      url: pollinationsUrl(
        "Luxury Ceylon beachfront resort hotel event hall interior, photorealistic 8k",
        a
      ),
    }));
    return NextResponse.json({ data: fallback });
  }
}
