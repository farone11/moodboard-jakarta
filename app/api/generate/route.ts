import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { mood } = await req.json();
    if (!mood) return NextResponse.json({ error: "Mood kosong" }, { status: 400 });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{
          role: "system",
          content: `Kamu Senior Creative Director + Jakarta City Guide. Output JSON only. DILARANG HALU NAMA TEMPAT.`
        }, {
          role: "user",
          content: `
BRIEF USER: "${mood}"

OUTPUT JSON WAJIB STRUKTUR INI:
{
  "colors": ["#HEX", "#HEX", "#HEX"],
  "vibe_tags": ["#Elegant", "#RamahKantong", "#Instagramable"],
  "budget_level": "💰💰 - Rp 100-250rb / orang",
  "spots": [
    {
      "name": "Nama Tempat Real",
      "area": "Area di Jakarta",
      "description": "1 kalimat kenapa tempat ini cocok sama brief.",
      "gmaps_url": "https://maps.google.com/?q=Nama+Tempat+Jakarta",
      "photo_url": "https://images.unsplash.com/photo-xxxx?q=80&w=800"
    },
    {... 2 spot lagi... }
  ],
  "song": "Judul - Artis Indonesia",
  "reason": "1-2 kalimat rangkuman moodboard ini"
}

ATURAN:
1. "vibe_tags": 3 hashtag yg ngegambarin mood. Contoh: #Mewah, #Cozy, #Nongkrong.
2. "budget_level": Kasih range harga. 💰 = <50rb, 💰💰 = 50-150rb, 💰💰💰 = 150-300rb, 💰💰💰💰 = >300rb /orang.
3. "spots": WAJIB 3 tempat REAL di Jakarta. HARAM "Tempat 1".
4. "photo_url": Pake Unsplash. Kalo bingung pake ini: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800

PROSES BRIEF: "${mood}"`
        }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq: ${err}`);
    }

    const data = await res.json();
    const content = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(content);

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}