'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // LIST SEMUA FOTO JAKARTA. MASUKIN LINK LU DI SINI
  const jakartaPhotos = [
    "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=2071&auto=format&fit=crop", // Bundaran HI Malam
    "https://images.unsplash.com/photo-1555899434-94d1369418af?q=80&w=2070&auto=format&fit=crop", // Monas Siang
    "https://images.unsplash.com/photo-1621398132274-09493f0a2273?q=80&w=2070&auto=format&fit=crop", // SCBD Golden Hour
    "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=2070&auto=format&fit=crop", // Kota Tua
    "https://images.unsplash.com/photo-1570168007204-dfb531cba85f?q=80&w=1974&auto=format&fit=crop", // JPO Sudirman
  ];

  const [bgImage, setBgImage] = useState(jakartaPhotos[0]);
  const fallbackImg = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop";

  // PAS PERTAMA BUKA WEB, LANGSUNG RANDOM BG
  useEffect(() => {
    changeBackground();
  }, []);

  const changeBackground = () => {
    let newBg;
    do {
      newBg = jakartaPhotos[Math.floor(Math.random() * jakartaPhotos.length)];
    } while (newBg === bgImage && jakartaPhotos.length > 1); // ANTI SAMA 2X BERTURUT
    setBgImage(newBg);
  };

  const handleGenerate = async () => {
    if (!mood) return alert('Isi mood dulu bang');
    setLoading(true);
    setResult(null);
    changeBackground(); // GANTI BG TIAP KLIK GENERATE

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal');
      setResult(data);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen text-white flex flex-col items-center p-4 relative">
      {/* BACKGROUND GACHA JAKARTA */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/70 backdrop-blur-[2px]" />

      <div className="w-full max-w-5xl flex flex-col flex-grow z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-2 text-center drop-shadow-lg">MoodBoard AI Jakarta</h1>
        <p className="text-gray-200 mb-8 text-center">Ketik mood kamu, dapetin spot + vibe + budget Jakarta</p>

        <div className="flex gap-2 w-full mb-8">
          <input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="night club abis gajian"
            className="flex-1 p-4 rounded-lg bg-black/30 border border-white/20 backdrop-blur-md placeholder:text-gray-400"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-8 py-4 bg-white/20 rounded-lg backdrop-blur-md hover:bg-white/30 disabled:opacity-50 font-semibold"
          >
            {loading? 'Mikirin...' : 'Generate'}
          </button>
        </div>

        {result && (
          <div className="space-y-8 animate-fadeIn flex-grow">
            <div className="text-center space-y-4">
              <div className="flex gap-2 justify-center flex-wrap">
                {result.vibe_tags?.map((tag: string) => (
                  <span key={tag} className="bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-md border border-white/20">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="inline-block bg-black/50 backdrop-blur-md px-6 py-3 rounded-lg border border-white/20">
                <p className="text-xs text-gray-300">Estimasi Budget</p>
                <p className="text-xl font-bold">{result.budget_level}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              {result.colors?.map((c: string) => (
                <div
                  key={c}
                  onClick={() => {navigator.clipboard.writeText(c); alert(`Copied ${c}`)}}
                  title={`Copy ${c}`}
                  className="w-8 h-8 rounded cursor-pointer border border-white/30 hover:scale-125 transition"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {result.spots?.map((spot: any, i: number) => (
                <div key={i} className="bg-black/50 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 flex flex-col">
                  <img
                    src={spot.photo_url}
                    alt={spot.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.currentTarget.src = fallbackImg }}
                  />
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-xl leading-tight">{spot.name}</h3>
                    <p className="text-sm text-gray-300 mb-2">{spot.area}</p>
                    <p className="text-gray-200 mb-4 flex-grow text-sm">{spot.description}</p>
                    <a href={spot.gmaps_url} target="_blank" className="mt-auto inline-block bg-white/20 px-4 py-2 rounded-lg text-sm hover:bg-white/30 text-center font-semibold">
                      Buka di Maps →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-black/50 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
              <p className="text-sm text-gray-300">Lagu yang cocok:</p>
              <p className="text-2xl font-bold">{result.song}</p>
              <p className="text-gray-300 mt-4 italic text-sm">"{result.reason}"</p>
            </div>
          </div>
        )}

        <footer className="w-full mt-auto pt-12 pb-4 text-center text-sm text-white/70">
          <p>Created by <b className="text-white">Setiawan F</b></p>
          <p className="mt-1 text-xs">Moodboard ini dibuat AI. Hasil tempat & foto bisa aja ngaco. Cek lagi sebelum berangkat.</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </main>
  );
}