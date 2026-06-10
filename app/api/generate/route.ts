import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { mood } = await req.json();
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: `Mood: "${mood}". Balas HANYA JSON: {"colors": ["#hex","#hex","#hex"], "spots": ["Tempat 1 - Jaksel", "Tempat 2 - Senopati", "Tempat 3 - Blok M"], "song": "Judul - Artis Indonesia"}` }]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Groq error');
    return NextResponse.json(JSON.parse(data.choices[0].message.content));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}