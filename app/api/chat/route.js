import { NextResponse } from "next/server";
import { getSession } from "../../(public)/auth-actions";
import { chatCompletion } from "../../../lib/freellm";
import { getHybridRecommendations } from "../../../lib/recommendation-engine";
import { checkRateLimit } from "../../../lib/rate-limiter";

const REQUIRED_FIELDS = ["event_type", "guests", "budget", "theme"];
const EVENT_TYPES = ["wedding", "conference", "birthday", "dinner"];
const THEMES = ["floral", "modern", "tropical", "classic"];

const FIELD_QUESTIONS = {
  event_type: "What kind of event are you planning — a wedding, conference, birthday, or gala dinner?",
  guests: "About how many guests are you expecting?",
  budget: "What's your approximate budget in LKR?",
  theme: "Do you have a decoration theme in mind — floral, modern, tropical, or classic?",
};

function isReady(sessionState) {
  return REQUIRED_FIELDS.every((f) => sessionState[f] !== undefined && sessionState[f] !== null && sessionState[f] !== "");
}

function nextMissingField(sessionState) {
  return REQUIRED_FIELDS.find((f) => sessionState[f] === undefined || sessionState[f] === null || sessionState[f] === "");
}

function stripCodeFences(text) {
  return text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
}


function extractFieldsRuleBased(message, pendingField) {
  const fields = {};
  const lower = message.toLowerCase().trim();

  for (const t of EVENT_TYPES) {
    if (lower.includes(t)) fields.event_type = t;
  }
  if (lower.includes("wedding")) fields.event_type = "wedding";
  if (lower.includes("gala") || lower.includes("dinner")) fields.event_type = "dinner";

  for (const t of THEMES) {
    if (lower.includes(t)) fields.theme = t;
  }
  if (lower.includes("gold") || lower.includes("classic")) fields.theme = "classic";

  const guestsMatch = lower.match(/(\d[\d,]*)\s*(guests|people|pax)/);
  if (guestsMatch) fields.guests = Number(guestsMatch[1].replace(/,/g, ""));

  const budgetMatch = lower.match(/(?:budget|lkr|rs\.?)\s*[:\-]?\s*(\d[\d,]*)/) || lower.match(/(\d[\d,]*)\s*(?:lkr|rupees)/);
  if (budgetMatch) fields.budget = Number(budgetMatch[1].replace(/,/g, ""));

  const dateMatch = message.match(/\d{4}-\d{2}-\d{2}/);
  if (dateMatch) fields.event_date = dateMatch[0];

  // Bare-answer fallback: nothing above matched this specific field yet, but
  // the message is short and directly answers what was just asked.
  const bareNumberMatch = lower.match(/^[^\d]*(\d[\d,]*)[^\d]*$/);
  if (bareNumberMatch) {
    const n = Number(bareNumberMatch[1].replace(/,/g, ""));
    if (pendingField === "guests" && fields.guests === undefined) fields.guests = n;
    else if (pendingField === "budget" && fields.budget === undefined) fields.budget = n;
  }
  if (pendingField === "event_type" && fields.event_type === undefined) {
    if (lower === "birthday" || lower === "conference") fields.event_type = lower;
  }
  if (pendingField === "theme" && fields.theme === undefined) {
    if (lower === "modern" || lower === "tropical") fields.theme = lower;
  }

  return fields;
}

async function extractFields(messages, sessionState) {
  const systemPrompt = `You extract event-planning details from a conversation for a hotel booking assistant.
Known fields so far: ${JSON.stringify(sessionState)}.
Respond with ONLY a JSON object (no prose, no code fences) with this exact shape:
{
  "event_type": "wedding" | "conference" | "birthday" | "dinner" | null,
  "guests": number | null,
  "budget": number | null,
  "theme": "floral" | "modern" | "tropical" | "classic" | null,
  "event_date": "YYYY-MM-DD" | null,
  "ready": boolean,
  "reply_if_not_ready": "a short, friendly question asking for the next missing detail"
}
Only set "ready" to true if event_type, guests, budget, and theme are all known (from this conversation or the known fields above). Only fill fields you are confident about from the conversation; use null otherwise.`;

  const text = await chatCompletion([
    { role: "system", content: systemPrompt },
    ...messages,
  ]);

  const parsed = JSON.parse(stripCodeFences(text));
  return parsed;
}

async function phraseReply(recommendation, input) {
  const { explanation, venue, decoration, total_cost } = recommendation;
  const counterfactual = explanation?.counterfactuals?.[0];

  const systemPrompt = `You are a warm, concise hotel event-planning assistant. Summarize the recommendation below for the guest in 2-4 sentences. Mention the venue, decoration, and total cost, reference the main reason it was picked, and if a counterfactual is provided, briefly mention it as an optional tweak. Do not invent details beyond what's given.`;
  const userPrompt = `Event: ${input.event_type} for ${input.guests} guests, budget LKR ${input.budget}.
Recommended venue: ${venue.name}. Decoration: ${decoration.name}. Total cost: LKR ${total_cost}.
Why it was picked: ${explanation?.summary || "best overall match for the given constraints"}.
${counterfactual ? `Optional tweak: ${counterfactual.change} -> ${counterfactual.effect}` : ""}`;

  return chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
}

function templatedReply(recommendation, input) {
  const { venue, decoration, total_cost, explanation } = recommendation;
  return `Based on your ${input.event_type} for ${input.guests} guests, I'd recommend ${venue.name} with ${decoration.name} for a total of LKR ${Number(total_cost).toLocaleString()}. ${explanation?.summary || ""}`.trim();
}

/** Strip client-supplied sessionState down to only the fields we use, each coerced to a safe type. */
function sanitiseSessionState(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  const et = String(raw.event_type || "").toLowerCase();
  if (EVENT_TYPES.includes(et)) out.event_type = et;
  const g = Number(raw.guests);
  if (Number.isInteger(g) && g >= 1 && g <= 500) out.guests = g;
  const b = Number(raw.budget);
  if (Number.isFinite(b) && b > 0) out.budget = b;
  const th = String(raw.theme || "").toLowerCase();
  if (THEMES.includes(th)) out.theme = th;
  // event_date: accept only YYYY-MM-DD
  if (typeof raw.event_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.event_date)) {
    out.event_date = raw.event_date;
  }
  return out;
}

export async function POST(req) {
  try {
    // Rate-limit by IP — each call invokes an LLM, so abuse is expensive.
    const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown")
      .split(",")[0].trim();
    const rl = checkRateLimit(`chat:${ip}`, 30, 60_000); // 30 req / min per IP
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Retry in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const session = await getSession();
    const body = await req.json();

    // Guard: messages must be a non-empty array of role/content objects
    if (!Array.isArray(body.messages) || !body.messages.length) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }
    const messages = body.messages
      .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
      .slice(0, 50)  // cap history depth — large payloads inflate LLM cost
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })); // cap per-message length

    if (!messages.length) {
      return NextResponse.json({ error: "No valid messages provided" }, { status: 400 });
    }

    // Sanitise client-supplied session state — only allowlisted values enter the engine
    let sessionState = sanitiseSessionState(body.sessionState);

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const pendingField = nextMissingField(sessionState);

    let extracted;
    let extractionFailed = false;
    try {
      extracted = await extractFields(messages, sessionState);
    } catch {
      extractionFailed = true;
      extracted = extractFieldsRuleBased(lastUserMessage, pendingField);
    }

    for (const key of ["event_type", "guests", "budget", "theme", "event_date"]) {
      if (extracted[key] !== undefined && extracted[key] !== null && extracted[key] !== "") {
        sessionState[key] = extracted[key];
      }
    }

    // Backstop: if the field that was just being asked about is still
    // missing after the primary extraction (LLM or fallback), make one more
    // pass with the rule-based bare-answer logic before giving up on it —
    // guards against the LLM path succeeding but missing a terse reply.
    if (pendingField && (sessionState[pendingField] === undefined || sessionState[pendingField] === null || sessionState[pendingField] === "")) {
      const backstop = extractFieldsRuleBased(lastUserMessage, pendingField);
      if (backstop[pendingField] !== undefined) sessionState[pendingField] = backstop[pendingField];
    }

    if (!isReady(sessionState)) {
      const missing = nextMissingField(sessionState);
      const reply = !extractionFailed && extracted.reply_if_not_ready
        ? extracted.reply_if_not_ready
        : FIELD_QUESTIONS[missing];
      return NextResponse.json({ reply, sessionState, recommendation: null });
    }

    const input = {
      event_type: sessionState.event_type,
      guests: Number(sessionState.guests),
      budget: Number(sessionState.budget),
      theme: sessionState.theme,
      event_date: sessionState.event_date || undefined,
      user_id: session?.id || null,
    };

    const result = await getHybridRecommendations(input);

    if (result.error) {
      return NextResponse.json({ reply: result.error, sessionState, recommendation: null });
    }

    const topRecommendation = result.recommendations[0];

    let reply;
    try {
      reply = await phraseReply(topRecommendation, input);
    } catch {
      reply = templatedReply(topRecommendation, input);
    }

    return NextResponse.json({ reply, sessionState, recommendation: topRecommendation });
  } catch (error) {
    console.error("[chat route] Error:", error);
    return NextResponse.json({
      reply: "Sorry, I ran into a problem putting that together. Could you try rephrasing your event details?",
      sessionState: {},
      recommendation: null,
    });
  }
}
