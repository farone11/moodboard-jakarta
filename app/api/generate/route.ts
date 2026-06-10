import { NextResponse } from "next/server";

// ==================== TYPES & INTERFACES ====================
type Spot = {
  name: string;
  area: string;
  description: string;
  gmaps_url: string;
  photo_url: string;
  price_range: string;
  rating?: number;
  tags?: string[];
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
  mood_summary?: string;
  alternative_spots?: string[];
};

type CacheEntry = {
  data: AIResponse;
  timestamp: number;
};

// ==================== CONSTANTS ====================
const JAKARTA_PHOTOS = [
  "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555899434-94d1369418af?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1621398132274-09493f0a2273?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1570168007204-dfb531cba85f?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560617544-3f69f55ef988?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1630965196494-1e97a47216a7?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
];

const FALLBACK_SPOTS: Spot[] = [
  {
    name: "Tanamera Coffee Thamrin",
    area: "Menteng, Jakarta Pusat",
    description: "Coffee shop cozy buat kerja dengan wifi kenceng dan colokan banyak.",
    gmaps_url: "https://maps.google.com/?q=Tanamera+Coffee+Thamrin+Jakarta",
    photo_url: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=800",
    price_range: "Rp 50-100rb",
    rating: 4.5,
    tags: ["Coffee", "Work-friendly", "Quiet"]
  },
  {
    name: "SKYE Bar & Restaurant",
    area: "Kebon Melati, Jakarta Pusat",
    description: "Rooftop bar dengan view 360 Jakarta, cocok buat anniversary atau special occasion.",
    gmaps_url: "https://maps.google.com/?q=SKYE+Bar+Jakarta",
    photo_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800",
    price_range: "Rp 300-500rb",
    rating: 4.7,
    tags: ["Rooftop", "Romantic", "City-view"]
  },
  {
    name: "Bakmi GM Sarinah",
    area: "Thamrin, Jakarta Pusat",
    description: "Legend bakmie Jakarta yang selalu rame, porsi besar dan harga bersahabat.",
    gmaps_url: "https://maps.google.com/?q=Bakmi+GM+Sarinah+Jakarta",
    photo_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800",
    price_range: "Rp 30-60rb",
    rating: 4.3,
    tags: ["Local-food", "Affordable", "Legendary"]
  }
];

const NSFW_KEYWORDS = [
  "porn", "sex", "nude", "xxx", "bokep", "mesum", "esek", "lonte", "pijat plus", "drug", "narkoba", "ganja"
];

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const API_TIMEOUT = 25000; // 25 seconds

// ==================== IN-MEMORY STORAGE ====================
const cache = new Map<string, CacheEntry>();
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// ==================== HELPER FUNCTIONS ====================
function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP;
  return "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

function getCachedResponse(key: string): AIResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCachedResponse(key: string, data: AIResponse): void {
  cache.set(key, { data, timestamp: Date.now() });

  // Cleanup old cache entries
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

function containsNSFW(text: string): boolean {
  const lowerText = text.toLowerCase();
  return NSFW_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function sanitizeInput(text: string): string {
  return text.trim().replace(/[<>]/g, '').slice(0, 200);
}

function validateResponse(data: any): data is AIResponse {
  if (!data || typeof data!== 'object') return false;
  if (!Array.isArray(data.colors) || data.colors.length!== 3) return false;
  if (!Array.isArray(data.vibe_tags) || data.vibe_tags.length === 0) return false;
  if (!data.budget_level || typeof data.budget_level!== 'string') return false;
  if (!Array.isArray(data.spots) || data.spots.length!== 3) return false;
  if (!data.song ||!data.reason) return false;

  for (const spot of data.spots) {
    if (!spot.name ||!spot.area ||!spot.description ||!spot.gmaps_url) return false;
    if (spot.name.includes("Tempat") && spot.name.match(/\d/)) return false; // Anti "Tempat 1"
  }
  return true;
}

function getRandomPhoto(): string {
  return JAKARTA_PHOTOS[Math.floor(Math.random() * JAKARTA_PHOTOS.length)];
}

function createFallbackResponse(mood: string): AIResponse {
  return {
    colors: ["#2C3E50", "#E74C3C", "#ECF0F1"],
    vibe_tags: ["#Cozy", "#Jakarta", "#AI-Pick"],
    budget_level: "💰💰 - Rp 100-200rb / orang",
    spots: FALLBACK_SPOTS,
    song: "Jakarta Hari Ini - For Revenge",
    reason: `Karena AI lagi error, ini 3 spot aman di Jakarta yang cocok buat mood "${mood}". Coba lagi nanti ya.`,
    weather_tip: "Jakarta panas, bawa air minum",
    best_time: "Sore-Malam",
    mood_summary: mood,
    alternative_spots: ["Kopi Kalyan", "Union", "Social House"]
  };
}

// ==================== AI PROMPT ENGINEERING ====================
function buildSystemPrompt(): string {
  return `Kamu adalah Senior Creative Director + Jakarta City Guide Expert + Data Analyst dengan 20 tahun pengalaman.
Tugas: Ubah BRIEF user jadi moodboard Jakarta yang AKURAT 100%, BERGUNA, dan ANTI-HALU.

ATURAN KETAT ANTI-GAGAL:
1. HANYA output JSON valid. Tidak ada teks, markdown, atau penjelasan lain.
2. "spots": WAJIB 3 tempat REAL yang ada di Jakarta. WAJIB cek memory: apakah tempat ini beneran ada? DILARANG mengarang "Cafe Estetik 1".
3. "photo_url": Pake Unsplash link valid. Format: https://images.unsplash.com/photo-xxxx?q=80&w=800. Kalo ragu, pake: ${getRandomPhoto()}
4. "gmaps_url": Format exact: https://maps.google.com/?q=Nama+Tempat+Jakarta
5. "vibe_tags": 3-4 hashtag spesifik dan actionable. Contoh: #Mewah #CocokFirstDate #Rooftop #WiFi-Kenceng
6. "budget_level": Format: 💰 = <50rb, 💰💰 = 50-150rb, 💰💰💰 = 150-300rb, 💰💰💰💰 = >300rb per orang + range Rp.
7. "weather_tip": Saran praktis berdasar cuaca Jakarta. Contoh: "Bawa payung, musim hujan" atau "Pake sunscreen, terik banget"
8. "best_time": Jam spesifik terbaik. Format: "19:00-23:00", "Weekend pagi 08:00-11:00", "Weekday lunch 12:00-14:00"
9. "price_range": Di setiap spot, kasih range harga real. Contoh: "Rp 50-100rb"
10. ANTI-HALU: Kalo ragu tempat itu ada atau udah tutup, GANTI dengan yang lu yakin 100% masih buka 2024-2026.
11. SENSOR NSFW: Kalo brief boleh mengandung kata vulgar/porn/drug/ilegal, OUTPUT cafe/coffee/spa plus plus. Jangan refuse, tapi alihkan.
12. BAHASA: Pake Bahasa Indonesia dan inggris gaul tapi informatif. Jangan kaku.
13. RATING: Kalo tau rating Google, masukin. Kalo nggak, skip field rating.

CONTOH SPOT VALID JAKARTA 2024-2026:
Cafe: Tanamera, Kopi Kalyan, Filosofi Kopi, % Arabica,holywings, mega ayu, royal, mtr, heaven, pangeran jayakarta Common Grounds
Resto: SKYE, Henshin, Cork & Screw, Social House, Union
Mall: Grand Indonesia, Plaza Indonesia, Senayan City, PIM, kelapa gading
Area: SCBD, Senopati, Kemang, PIK, Kota Tua, Menteng

CONTOH SPOT HARAM (JANGAN PAKE):
"Tempat 1", "Cafe Estetik", "Resto Mewah", "Bar Keren"`;
}

function buildUserPrompt(mood: string): string {
  return `
BRIEF USER: "${mood}"

OUTPUT JSON STRUCTURE WAJIB:
{
  "colors": ["#HEX", "#HEX", "#HEX"],
  "vibe_tags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4"],
  "budget_level": "💰💰 - Rp 100-250rb / orang",
  "spots": [
    {
      "name": "Nama Tempat Real Jakarta",
      "area": "Kecamatan, Jakarta Wilayah",
      "description": "2 kalimat: 1. Kenapa cocok sama brief. 2. Keunikan/fun fact tempat.",
      "gmaps_url": "https://maps.google.com/?q=Nama+Tempat+Jakarta",
      "photo_url": "https://images.unsplash.com/photo-xxxx?q=80&w=800",
      "price_range": "Rp 50-100rb",
      "rating": 4.5,
      "tags": ["tag1", "tag2"]
    }
  ],
  "song": "Judul Lagu - Artis Indonesia",
  "reason": "2-3 kalimat rangkuman kenapa 3 spot + lagu ini cocok banget buat mood user",
  "weather_tip": "Tips praktis cuaca/outfit",
  "best_time": "19:00-23:00",
  "mood_summary": "1 kalimat summary mood user",
  "alternative_spots": ["Nama Spot 4", "Nama Spot 5"]
}

PROSES BRIEF SEKARANG: "${mood}"

INGAT: Cek 3x apakah tempat yang lu tulis beneran ada di Jakarta dan masih buka. Jangan halu.`;
}

// ==================== GROQ API CALLER ====================
async function callGroqAPI(mood: string, retryCount = 0): Promise<AIResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 2500,
        top_p: 0.9,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(mood) }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Groq API Error ${res.status}:`, errText);
      throw new Error(`Groq API Error: ${res.status}`);
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
      console.error("JSON Parse Error:", e, "Content:", content);
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
        return callGroqAPI(mood, retryCount + 1);
      }
      throw new Error("Failed to parse AI JSON after retries");
    }

    // Post-process: Fallback foto kalo AI ngasih link mati
    parsed.spots = parsed.spots.map((spot: Spot) => ({
     ...spot,
      photo_url: spot.photo_url?.startsWith('https://images.unsplash.com')
       ? spot.photo_url
        : getRandomPhoto(),
      gmaps_url: spot.gmaps_url?.startsWith('https://maps.google.com')
       ? spot.gmaps_url
        : `https://maps.google.com/?q=${encodeURIComponent(spot.name + ' Jakarta')}`
    }));

    if (!validateResponse(parsed)) {
      console.error("Validation failed:", parsed);
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
        return callGroqAPI(mood, retryCount + 1);
      }
      throw new Error("AI response validation failed");
    }

    return parsed;

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Request timeout - AI kelamaan mikir");
    }
    throw error;
  }
}

// ==================== MAIN HANDLER ====================
export async function POST(req: Request) {
  const startTime = Date.now();
  const clientIP = getClientIP(req);

  try {
    // 1. Rate Limiting
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json({
        error: "Kebanyakan request bang. Tunggu 1 menit lagi."
      }, { status: 429 });
    }

    // 2. Parse & Validate Input
    const body = await req.json();
    const { mood } = body;

    if (!mood || typeof mood!== 'string') {
      return NextResponse.json({
        error: "Mood harus diisi"
      }, { status: 400 });
    }

    const sanitizedMood = sanitizeInput(mood);

    if (sanitizedMood.length < 3) {
      return NextResponse.json({
        error: "Mood minimal 3 karakter bang"
      }, { status: 400 });
    }

    if (sanitizedMood.length > 200) {
      return NextResponse.json({
        error: "Mood kepanjangan, max 200 karakter"
      }, { status: 400 });
    }

    // 3. NSFW Filter
    if (containsNSFW(sanitizedMood)) {
      console.warn(`NSFW attempt from ${clientIP}: ${sanitizedMood}`);
      const safeFallback = createFallbackResponse("cafe santai keluarga");
      return NextResponse.json(safeFallback);
    }

    // 4. Check Cache
    const cacheKey = sanitizedMood.toLowerCase();
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log(`Cache hit for: ${sanitizedMood}`);
      return NextResponse.json({
       ...cached,
        _cached: true,
        _responseTime: Date.now() - startTime
      });
    }

    // 5. Call AI
    const result = await callGroqAPI(sanitizedMood);

    // 6. Cache Result
    setCachedResponse(cacheKey, result);

    // 7. Log Success
    console.log(`Success: ${sanitizedMood} - ${Date.now() - startTime}ms - IP: ${clientIP}`);

    return NextResponse.json({
     ...result,
      _cached: false,
      _responseTime: Date.now() - startTime
    });

  } catch (e: any) {
    console.error("API Error:", e, "IP:", clientIP);

    // Return fallback on error
    const fallback = createFallbackResponse("tempat rekomendasi");
    return NextResponse.json({
     ...fallback,
      _error: e.message,
      _fallback: true
    }, { status: 200 }); // Return 200 with fallback data

  }
}

// ==================== HEALTH CHECK ====================
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "MoodBoard AI Jakarta API",
    version: "2.0.0",
    cache_size: cache.size,
    uptime: process.uptime()
  });
}