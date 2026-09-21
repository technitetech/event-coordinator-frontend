import { NextResponse } from "next/server";
import { getSession } from "../../(public)/auth-actions";
import { checkRateLimit } from "../../../lib/rate-limiter";
import { buildScenePrompt } from "../../../lib/design-prompt";
import { startConceptJob, getConceptJob } from "../../../lib/concept-jobs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown")
      .split(",")[0].trim();
    // Each job serialises its renders, so the cost per call is time, not burst.
    const rl = checkRateLimit(`design:${session.id}:${ip}`, 6, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: `Rate limit exceeded. Retry in ${rl.retryAfter}s.` }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));

    // Composed server-side from allow-listed values, so the prompt length is
    // bounded by construction and client strings cannot reach the model.
    const scene = buildScenePrompt({
      answers:   body?.answers ?? {},
      venueName: body?.venueName,
      eventType: body?.eventType,
      theme:     body?.theme,
      guests:    body?.guests,
    });

    const { jobId, angles } = startConceptJob({ scene, count: body?.count });
    return NextResponse.json({ jobId, angles });
  } catch (error) {
    console.error("Concept job start failed:", error);
    return NextResponse.json({ error: "Could not start the concept render." }, { status: 500 });
  }
}

export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  const job = getConceptJob(jobId);
  if (!job) return NextResponse.json({ error: "Job not found or expired." }, { status: 404 });

  return NextResponse.json(job);
}
