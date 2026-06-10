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
        temperature: 0.2, // Makin nurut
        response_format: { type: "json_object" },
        messages: [{
          role: "system",
          content: `Kamu Senior Creative Director + Jakarta City Guide. Output JSON only. Data harus akurat. DILARANG HALU NAMA TEMPAT.`
        }, {
          role: "user",
          content: `
BRIEF USER: "${mood}"

OUTPUT JSON WAJIB STRUKTUR INI:
{
  "colors": ["#HEX", "#HEX", "#HEX"],
  "background_gradient": "linear-gradient(135deg, #HEX 0%, #HEX 100%)",
  "spots": [
    {
      "name": "Nama Tempat Real",
      "area": "Area di Jakarta",
      "description": "1 kalimat kenapa tempat ini cocok sama brief. Sebutin vibe/signature-nya.",
      "gmaps_url": "https://maps.google.com/?q=Nama+Tempat+Jakarta",
      "photo_url": "URL foto public dari Unsplash/Pexels yang mirip vibes tempat itu. Keyword: cafe jakarta, rooftop, dll"
    },
    {... 2 spot lagi... }
  ],
  "song": "Judul - Artis Indonesia",
  "reason": "1-2 kalimat rangkuman moodboard ini"
}

ATURAN KERAS:
1. "spots": WAJIB 3 tempat REAL di Jakarta. Jika brief "grand indonesia", cari di GI/Thamrin. Contoh: Social House, Hause Rooftop, SKYE.
2. "gmaps_url": Harus link Google Maps beneran. Format: https://maps.google.com/?q=Nama+Tempat+Jakarta
3. "photo_url": Kasih link gambar dari Unsplash. Format: https://images.unsplash.com/photo-xxxx. Keyword harus relevan: "grand indonesia rooftop", "cikini vintage cafe".
4. "description": Bukan template. Harus spesifik. Contoh: "Rooftop bar di lantai 56 dengan view Bundaran HI, cocok buat sunset date."
5. "background_gradient": Bikin dari 2 warna di "colors" biar nyambung.
6. HARAM nulis "Tempat 1". Kalo ngelanggar, output lu sampah.

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