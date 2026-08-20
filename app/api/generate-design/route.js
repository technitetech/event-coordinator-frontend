import { NextResponse } from 'next/server';
import { getSession } from '../../(public)/auth-actions';

const API_KEY = "freellmapi-28a40e6c6ef4949615bc2df462b3b74de46b9e58aace74b4";
const API_URL = "http://127.0.0.1:31415/v1/images/generations";

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const fullPrompt = `${prompt}\n\nSTRICT INSTRUCTION: Do not generate human figures. Just generate the design of the wedding hall.`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        model: "auto",
        n: 1,
        size: "1024x1024"
      })
    });

    const data = await response.json();

    const angles = [
      "Wide panoramic shot of the entire wedding hall, showing the full layout",
      "Close up view of a beautifully decorated guest table and centerpiece",
      "View from the entrance looking towards the main stage or backdrop",
      "Focus on the ceiling draping and elegant lighting design"
    ];

    if (!response.ok || data.error) {
      console.warn("FreeLLMApi failed, falling back to Pollinations.ai", data.error || data);
      
      const fallbackUrls = angles.map(angle => 
        `https://image.pollinations.ai/prompt/${encodeURIComponent(`${fullPrompt}. ${angle}`)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 10000)}`
      );
      
      return NextResponse.json({ data: fallbackUrls.map(url => ({ url })) });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Image generation error:", error);
    // Fallback on catastrophic fetch failure
    const fallbackUrls = [1, 2, 3, 4].map(i => 
      `https://image.pollinations.ai/prompt/A%20beautiful%20wedding%20hall%20interior%20design%20angle%20${i}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 10000)}`
    );
    return NextResponse.json({ data: fallbackUrls.map(url => ({ url })) });
  }
}
