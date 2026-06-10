'use client';
import { useState } from 'react';

export default function Home() {
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!mood) return alert('Isi mood dulu bang');
    setLoading(true);
    setResult(null);
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

  // Foto background Jakarta. Ganti sesuka lu
  const bgIndonesia = "https://images.unsplash.com/photo-1555899434-94d1369418af?q=80&w=2070&auto=format&fit=crop"; // Monas
  const fallbackImg = "https://images.unsplash.com/photo-1559339352-11d03564f473?q=80&w=1974&auto=format&fit=crop"; // Cafe generik

  return (
    <main className="min-h-screen text-white flex flex-col items-center p-4 relative">
      {/* BACKGROUND FOTO INDONESIA */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000" 
        style={{ backgroundImage: `url(${bgIndonesia})` }}
      />
      {/* OVERLAY GELAP BIAR TEKS KEBACA */}
      <div className="fixed inset-0 z-0 bg-black/60 backdrop-blur-sm" />

      <div className="w-full max-w-5xl flex flex-col flex-grow z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-2 text-center drop-shadow-lg">MoodBoard AI Jakarta</h1>
        <p className="text-gray-200 mb-8 text-center">Ketik mood kamu, dapetin spot + foto + maps Jakarta</p>

        <div className="flex gap-2 w-full mb-8">
          <input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="makan bakmie ayam"
            className="flex-1 p-4 rounded-lg bg-black/30 border border-white/20 backdrop-blur-md"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-8 py-4 bg-white/20 rounded-lg backdrop-blur-md hover:bg-white/30 disabled:opacity-50"
          >
            {loading ? 'Mikirin...' : 'Generate'}
          </button>
        </div>

        {result && (
          <div className="space-y-8 animate-fadeIn flex-grow">
            <div className="flex gap-4 justify-center">
              {result.colors.map((c: string) => (
                <div key={c} onClick={() => navigator.clipboard.writeText(c)} title={`Copy ${c}`} className="w-20 h-20 rounded-lg cursor-pointer shadow-lg border-2 border-white/30 hover:scale-105 transition" style={{ backgroundColor: c }} />
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {result.spots.map((spot: any, i: number) => (
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
                    <p className="text-gray-200 mb-4 flex-grow">{spot.description}</p>
                    <a href={spot.gmaps_url} target="_blank" className="mt-auto inline-block bg-white/20 px-4 py-2 rounded-lg text-sm hover:bg-white/30 text-center">
                      Buka di Maps →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-black/50 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
              <p className="text-sm text-gray-300">Lagu yang cocok:</p>
              <p className="text-2xl font-bold">{result.song}</p>
              <p className="text-gray-300 mt-4 italic">"{result.reason}"</p>
            </div>
          </div>
        )}
        
        {/* FOOTER AUTHOR - DIJAMIN MUNCUL */}
        <footer className="w-full mt-auto pt-12 pb-4 text-center text-sm text-white/70">
          <p>Created by <b className="text-white">Setiawan F</b></p>
          <p className="mt-1">Moodboard ini dibuat AI. Hasil tempat & foto bisa aja ngaco. Cek lagi sebelum berangkat.</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
       .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </main>
  );
}