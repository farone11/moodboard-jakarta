"use client";
import { useState } from "react";

export default function Home() {
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    // Nanti API-nya kita isi di step berikutnya
    setTimeout(() => setLoading(false), 1000); 
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold mb-2">MoodBoard AI Jakarta</h1>
        <p className="text-zinc-400 mb-8">Ketik mood kamu, dapetin warna + spot + lagu buat hari ini</p>
        
        <div className="flex gap-2">
          <input 
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="cth: lagi pengen healing low budget"
            className="flex-1 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-zinc-600"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !mood}
            className="px-6 py-3 rounded-lg bg-white text-black font-medium disabled:opacity-50"
          >
            {loading ? "..." : "Generate"}
          </button>
        </div>
      </div>
    </main>
  );
}