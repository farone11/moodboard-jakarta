import { NextResponse } from "next/server";

type Spot = {
  name: string;
  area: string;
  description: string;
  gmaps_url: string;
  photo_url: string;
  price_range: string;
};

type AIResponse = {
  colors: string[];
  vibe_tags: string[];
  budget_level: string;
  spots: Spot[];
  song: string;
  reason: string;
  weather_tip?: string;
  best_time?: string;
};

const JAKARTA_PHOTOS = [
  "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555899434-94d1369418af?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1621398132274-09493f0a2273?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1570168007204-dfb531cba85f?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560617544-3f69f55ef988?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1630965196494-1e97a47216a7?q=80&w=2070&auto=format&fit=crop",
];

function validateResponse(data: any): data is AIResponse {
  if (!data || typeof data!== 'object') return false;
  if (!Array.isArray(data.colors) || data.colors.length!== 3) return false;
  if (!Array.isArray(data.vibe_tags) || data.vibe_tags.length === 0) return false;
  if (!data.budget_level || typeof data.budget_level!== 'string') return false;
  if (!Array.isArray(data.spots) || data.spots.length!== 3) return false;
  if (!data.song ||!data.reason) return false;

  for (const spot of data.spots) {
    if (!spot.name ||!spot.area ||!spot.description ||!spot.gmaps_url) return false;
  }
  return true;
}

async function callGroqAPI(mood: string, retryCount = 0): Promise<AIResponse> {
  const systemPrompt = `Kamu adalah Senior Creative Director + Jakarta City Guide Expert + Data Analyst.
Tugas: Ubah BRIEF user jadi moodboard Jakarta yang AKURAT dan BERGUNA.

ATURAN KETAT:
1. HANYA output JSON valid. Tidak ada teks lain.
2. "spots": WAJIB 3 tempat REAL yang ada di Jakarta. DILARANG mengarang nama. Cek Google Maps di kepala lu.
3. "photo_url": Pake Unsplash link valid. Format: https://images.unsplash.com/photo-xxxx?q=80&w=800
4. "gmaps_url": Format https://maps.google.com/?q=Nama+Tempat+Jakarta
5. "vibe_tags": 3-4 hashtag spesifik. Contoh: #Mewah #CocokFirstDate #Rooftop
6. "budget_level": Format emoji + range. 💰 = <50rb, 💰💰 = 50-150rb, 💰💰💰 = 150-300rb, 💰💰💰💰 = >300rb per orang.
7. "weather_tip": Saran outfit/prepare berdasar cuaca Jakarta umum.
8. "best_time": Jam terbaik buat dateng. Contoh: "19:00-22:00" atau "Weekend pagi".
9. JANGAN HALU. Kalo ragu sama tempat, ganti yang lu yakin 100% ada.
10. SENSOR: Kalo brief vulgar/NSFW, alihkan ke rekomendasi cafe/coffee shop aman.`;

  const userPrompt = `
BRIEF USER: "${mood}"

OUTPUT JSON STRUCTURE:
{
  "colors": ["#HEX", "#HEX", "#HEX"],
  "vibe_tags": ["#Tag1", "#Tag2", "#Tag3"],
  "budget_level": "💰💰 - Rp 100-250rb / orang",
  "spots": [
    {
      "name": "Nama Tempat Real",
      "area": "Kecamatan, Jakarta",
      "description": "1 kalimat kenapa cocok sama brief + 1 keunikan tempat.",
      "gmaps_url": "https://maps.google.com/?q=Nama+Tempat+Jakarta",
      "photo_url": "https://images.unsplash.com/photo-xxxx?q=80&w=800",
      "price_range": "Rp 50-100rb"
    }
  ],
  "song": "Judul Lagu - Artis Indonesia",
  "reason": "2 kalimat rangkuman kenapa moodboard ini pas buat brief user",
  "weather_tip": "Bawa jaket kalo malem, Jakarta suka angin",
  "best_time": "19:00-23:00"
}

PROSES BRIEF SEKARANG: "${mood}"`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API Error: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned empty content");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 1000));
      return callGroqAPI(mood, retryCount + 1);
    }
    throw new Error("Failed to parse AI JSON after retries");
  }

  // Fallback foto kalo AI ngasih link mati
  parsed.spots = parsed.spots.map((spot: Spot) => ({
   ...spot,
    photo_url: spot.photo_url || JAKARTA_PHOTOS[Math.floor(Math.random() * JAKARTA_PHOTOS.length)]
  }));

  if (!validateResponse(parsed)) {
    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 1000));
      return callGroqAPI(mood, retryCount + 1);
    }
    throw new Error("AI response validation failed");
  }

  return parsed;
}

export async function POST(req: Request) {
  try {
    const { mood } = await req.json();

    if (!mood || typeof mood!== 'string' || mood.trim().length < 3) {
      return NextResponse.json({
        error: "Mood minimal 3 karakter bang"
      }, { status: 400 });
    }

    if (mood.length > 200) {
      return NextResponse.json({
        error: "Mood kepanjangan, max 200 karakter"
      }, { status: 400 });
    }

    const result = await callGroqAPI(mood.trim());
    return NextResponse.json(result);

  } catch (e: any) {
    console.error("API Error:", e);
    return NextResponse.json({
      error: e.message || "Server error, coba lagi nanti"
    }, { status: 500 });
  }
}