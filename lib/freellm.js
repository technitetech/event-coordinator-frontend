/**
 * Shared config/helper for calling the local FreeLLM gateway's chat
 * completions endpoint. Mirrors the fetch/timeout/fallback pattern already
 * used in app/api/generate-design/route.js for image generation.
 */

export const FREELLM_BASE_URL = process.env.FREELLM_BASE_URL || "http://127.0.0.1:31415";
export const FREELLM_API_KEY = process.env.FREELLM_API_KEY || "";

/**
 * Calls the FreeLLM gateway's chat completions endpoint.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [options]
 * @param {number} [options.timeoutMs=20000]
 * @returns {Promise<string>} the assistant's reply text
 * @throws if the call fails, times out, or the response is malformed —
 *   callers are expected to catch this and fall back to non-LLM logic.
 */
export async function chatCompletion(messages, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${FREELLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(FREELLM_API_KEY ? { Authorization: `Bearer ${FREELLM_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: "auto",
        messages,
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`FreeLLM gateway responded with status ${res.status}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("FreeLLM gateway returned no message content");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}
