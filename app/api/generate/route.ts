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
        model: "llama-3.3-70b-versatile", // UPGRADE: Model 70B, jauh lebih pinter
        temperature: 0.5, // TURUNIN: Biar nggak ngarang
        response_format: { type: "json_object" },
        messages: [{
          role: "system",
          content: `Kamu adalah Senior Creative Director di agensi Jakarta. Ahli color theory, F&B Jakarta, dan musik Indonesia. Tugasmu mengubah brief user jadi moodboard JSON profesional. JANGAN PERNAH PAKAI KATA "Tempat 1", "Tempat 2". Harus nama tempat real.`
        }, {
          role: "user",
          content: `BRIEF: "${mood}"

OUTPUT HARUS JSON DENGAN FORMAT INI. TIDAK BOLEH MELENCENG:
{
  "colors": ["#HEX", "#HEX", "#HEX"],
  "spots": ["Nama Tempat Asli - Area", "Nama Tempat Asli - Area", "Nama Tempat Asli - Area"],
  "song": "Judul - Artis",
  "reason": "1 kalimat kenapa cocok sama brief"
}

ATURAN KERAS:
1. "spots": WAJIB nama cafe/restoran/bar real di Jakarta. Cek Google Maps di kepala lu. Jika user sebut "Grand Indonesia", cari tempat di GI. Contoh: "Social House - Grand Indonesia", "Hause Rooftop - Grand Indonesia", "Plaza Indonesia Entertainment Xenter - Thamrin".
2. DILARANG KERAS nulis "Tempat 1 - Jaksel". Kalo lu nulis itu, lu dipecat.
3. "colors": Ambil dari brand atau suasana tempat. GI = mewah, gold/navy. Cikini = vintage, terracotta.
4. "song": Lagu Indonesia yang relevan sama lokasi/vibe. GI = lagu city pop/modern.
5. "reason": Jelaskan singkat.

BRIEF: "${mood}"`
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