import { NextResponse } from "next/server";
import { getSession } from "../../(public)/auth-actions";

const API_KEY =
  process.env.FREELLM_API_KEY ||
  "freellmapi-f007dd429b105e24e58cb5946ce52ea5053b90c472821d37";
const API_URL = "http://127.0.0.1:31415/v1/images/generations";
const PRIMARY_TIMEOUT_MS = 25000;

function pollinationsUrl(fullPrompt, angle) {
  const seed = Math.floor(Math.random() * 90000) + 10000;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `${fullPrompt}. ${angle}`
  )}?width=1024&height=1024&nologo=true&seed=${seed}`;
}

async function requestPrimary(fullPrompt, angle) {
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

    const { prompt, venueName = "Ballroom" } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const fullPrompt = `${prompt}\n\nSTRICT ARCHITECTURAL DIRECTIVES: Photorealistic 8k interior architectural photography of luxury event venue. No human figures. Elegant Ceylon hill-country luxury decor, natural depth of field, warm architectural illumination.`;

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
        "Luxury Ceylon hill-country hotel event hall interior, photorealistic 8k",
        a
      ),
    }));
    return NextResponse.json({ data: fallback });
  }
}
