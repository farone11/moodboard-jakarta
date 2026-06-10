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

  return (
    <main
      className="min-h-screen text-white flex flex-col items-center p-4 transition-all duration-1000"
      style={{ background: result?.background_gradient || '#000' }}
    >
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-2 text-center drop-shadow-lg">MoodBoard AI Jakarta</h1>
        <p className="text-gray-200 mb-8 text-center">Ketik mood kamu, dapetin spot + foto + maps Jakarta</p>

        <div className="flex gap-2 w-full mb-8">
          <input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="grand indonesia buat meeting klien penting"
            className="flex-1 p-4 rounded-lg bg-black/30 border border-white/20 backdrop-blur-md"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-8 py-4 bg-white/20 rounded-lg backdrop-blur-md hover:bg-white/30 disabled:opacity-50"
          >
            {loading? 'Mikirin...' : 'Generate'}
          </button>
        </div>

        {result && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex gap-4 justify-center">
              {result.colors.map((c: string) => (
                <div key={c} onClick={() => navigator.clipboard.writeText(c)} title="Klik copy" className="w-20 h-20 rounded-lg cursor-pointer shadow-lg border-2 border-white/20" style={{ backgroundColor: c }} />
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {result.spots.map((spot: any, i: number) => (
                <div key={i} className="bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/10">
                  <img src={spot.photo_url} alt={spot.name} className="w-full h-48 object-cover" />
                  <div className="p-5">
                    <h3 className="font-bold text-xl">{spot.name}</h3>
                    <p className="text-sm text-gray-300 mb-2">{spot.area}</p>
                    <p className="text-gray-200 mb-4">{spot.description}</p>
                    <a href={spot.gmaps_url} target="_blank" className="inline-block bg-white/20 px-4 py-2 rounded-lg text-sm hover:bg-white/30">
                      Buka di Maps →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10 text-center">
              <p className="text-sm text-gray-300">Lagu yang cocok:</p>
              <p className="text-2xl font-bold">{result.song}</p>
              <p className="text-gray-300 mt-4 italic">"{result.reason}"</p>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
       .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </main>
  );
}