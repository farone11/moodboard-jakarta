'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Clock, Star, Train, Share2, Download } from 'lucide-react';

//... type Spot, MoodboardResult update sesuai route.ts

export default function Home() {
  //... state lama
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  // Load favorites
  useEffect(() => {
    const saved = localStorage.getItem('moodboard-favs');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (spotName: string) => {
    const updated = favorites.includes(spotName)
     ? favorites.filter(f => f!== spotName)
      : [...favorites, spotName];
    setFavorites(updated);
    localStorage.setItem('moodboard-favs', JSON.stringify(updated));
    toast.success(favorites.includes(spotName)? 'Dihapus dari favorit' : 'Ditambah ke favorit');
  };

  const downloadStory = async () => {
    if (!result) return;
    toast.info('Fitur IG Story coming soon! Sementara screenshot aja ya');
    // Nanti bisa pake html2canvas buat generate 1080x1920
  };

  //... handleGenerate dll tetap

  return (
    <main className="min-h-screen text-white flex flex-col items-center p-4 relative overflow-hidden font-poppins">
      <Toaster position="top-center" richColors />
      {/*... BG img tetap... */}

      <div className="w-full max-w-6xl flex flex-col flex-grow z-10">
        {/* HEADER + TOMBOL FAVORIT */}
        <header className="flex justify-between items-center mb-8 pt-8">
          <div className="text-center flex-1">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-3 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              MoodBoard AI Jakarta
            </h1>
            <p className="text-gray-300 text-lg">Ketik mood kamu, AI carikan spot + vibe + budget terbaik</p>
          </div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="p-3 bg-white/20 rounded-xl hover:bg-white/30 relative"
          >
            <Heart className={`w-6 h-6 ${favorites.length > 0? 'fill-red-500 text-red-500' : ''}`} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>
        </header>

        {/*... input mood tetap... */}

        {result &&!loading && (
          <div className="space-y-8 animate-fadeIn flex-grow">
            {/*... vibe_tags, budget tetap... */}

            {/* SPOT CARDS UPGRADE */}
            <div className="grid md:grid-cols-3 gap-6">
              {result.spots.map((spot, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-black/50 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 flex flex-col hover:border-white/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={spot.photo_url}
                      alt={spot.name}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMG }}
                    />
                    <button
                      onClick={() => toggleFavorite(spot.name)}
                      className="absolute top-3 left-3 p-2 bg-black/70 rounded-full hover:bg-black/90"
                    >
                      <Heart className={`w-5 h-5 ${favorites.includes(spot.name)? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                    <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {spot.rating || '4.5'}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-xl leading-tight mb-1">{spot.name}</h3>
                    <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {spot.area}
                    </p>
                    <p className="text-gray-200 mb-4 flex-grow text-sm leading-relaxed">{spot.description}</p>

                    {/* INFO TAMBAHAN */}
                    <div className="space-y-2 mb-4 text-xs text-gray-300">
                      {spot.busy_times && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" /> <span>Rame: {spot.busy_times}</span>
                        </div>
                      )}
                      {spot.transit && (
                        <div className="flex items-center gap-2">
                          <Train className="w-4 h-4" /> <span>{spot.transit}</span>
                        </div>
                      )}
                    </div>

                    {/* GOOGLE MAPS EMBED KECIL */}
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(spot.name + ' Jakarta')}&output=embed`}
                      className="w-full h-32 rounded-lg mb-3 border-0"
                      loading="lazy"
                    />

                    <a
                      href={spot.gmaps_url}
                      target="_blank"
                      className="mt-auto inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-3 rounded-xl text-sm hover:bg-gray-200 text-center font-bold transition"
                    >
                      Buka di Maps →
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* SPOTIFY EMBED + SHARE */}
            <div className="bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-400 mb-2">🎵 Lagu yang cocok:</p>
                  <p className="text-3xl font-bold mb-3">{result.song}</p>
                  <p className="text-gray-300 italic text-sm max-w-2xl">"{result.reason}"</p>
                  <div className="flex gap-3 mt-6 justify-center md:justify-start">
                    <button
                      onClick={handleShare}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button
                      onClick={downloadStory}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> IG Story
                    </button>
                  </div>
                </div>
                {result.spotify_track_id && (
                  <iframe
                    src={`https://open.spotify.com/embed/track/${result.spotify_track_id}`}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="encrypted-media"
                    className="rounded-xl"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL FAVORITES */}
        <AnimatePresence>
          {showFavorites && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowFavorites(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4">Spot Favorit Kamu ❤️</h2>
                {favorites.length === 0? (
                  <p className="text-gray-400">Belum ada spot favorit. Klik ❤️ di card spot.</p>
                ) : (
                  <div className="space-y-2">
                    {favorites.map(fav => (
                      <div key={fav} className="p-3 bg-white/10 rounded-lg">{fav}</div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/*... footer tetap... */}
      </div>
    </main>
  );
}