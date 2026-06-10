"use client";
import { useState } from "react";

export default function Home() {
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ mood }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">MoodBoard AI Jakarta</h1>
          <p className="text-zinc-400">Ketik mood kamu, dapetin palette warna + spot + lagu buat hari ini</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-8">
          <input 
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="cth: lagi pengen healing low budget di Jaksel"
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-zinc-600"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !mood}
            className="px-6 py-3 rounded-xl bg-white text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Mikirin..." : "Generate"}
          </button>
        </div>

        {result && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-sm text-zinc-400 mb-3">Warna Hari Ini</h2>
              <div className="flex gap-3">
                {result.colors.map((c: string) => (
                  <div key={c} className="w-16 h-16 rounded-lg border border-zinc-800" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm text-zinc-400 mb-3">Spot Jakarta Buat Kamu</h2>
              <div className="flex flex-wrap gap-2">
                {result.spots.map((s: string) => (
                  <span key={s} className="px-3 py-1.5 bg-zinc-900 rounded-full text-sm border border-zinc-800">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm text-zinc-400 mb-3">Lagu</h2>
              <p className="text-lg">{result.song}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}