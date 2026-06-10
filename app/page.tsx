'use client';
import { useState } from 'react';

export default function Home() {
  const [mood, setMood] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood }),
    });
    
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-2">MoodBoard AI Jakarta</h1>
      <p className="mb-8 text-gray-400">Ketik mood kamu, dapetin palette warna + spot + lagu buat hari ini</p>
      
      <div className="flex gap-2 w-full max-w-xl">
        <input
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="lagi butuh tempat nongkrong aesthetic di jaksel sore-sore"
          className="flex-1 bg-gray-800 p-3 rounded-lg"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="bg-gray-700 px-6 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Mikirin...' : 'Generate'}
        </button>
      </div>

      {result && (
        <div className="mt-8 w-full max-w-xl">
          <div className="flex gap-2 mb-4">
            {result.colors.map((c: string) => (
              <div key={c} style={{ backgroundColor: c }} className="w-20 h-20 rounded-lg" />
            ))}
          </div>
          <p className="mb-2"><b>Spot:</b> {result.spots.join(', ')}</p>
          <p><b>Lagu:</b> {result.song}</p>
        </div>
      )}
    </main>
  );
}