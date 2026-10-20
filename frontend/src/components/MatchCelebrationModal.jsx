import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, MessageCircle, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MatchCelebrationModal({ match, onClose, onStartChat }) {
  const { user } = useAuth();

  useEffect(() => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  if (!match) return null;

  const partner = match.partner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 border border-rose-500/30 text-center shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-3 border border-rose-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          Chandigarh University Match!
        </div>

        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 tracking-tight">
          It's a Match!
        </h2>
        <p className="text-xs text-gray-400 mt-1 mb-6">
          You and <span className="text-white font-medium">{partner.name}</span> have mutual interest in each other.
        </p>

        {/* Dual Avatars with heart in middle */}
        <div className="flex items-center justify-center -space-x-4 mb-6">
          <div className="w-20 h-20 rounded-full ring-4 ring-rose-500 overflow-hidden shadow-lg z-10">
            <img
              src={user?.photos?.[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center z-20 shadow-md ring-4 ring-slate-900 animate-pulse">
            <Heart className="w-5 h-5 fill-white" />
          </div>

          <div className="w-20 h-20 rounded-full ring-4 ring-rose-500 overflow-hidden shadow-lg z-10">
            <img
              src={partner.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
              alt={partner.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Mutual Interests */}
        {match.mutualInterests && match.mutualInterests.length > 0 && (
          <div className="mb-6 p-3 rounded-2xl bg-slate-800/60 border border-white/5">
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Common CU Ground:</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {match.mutualInterests.map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Call to actions */}
        <div className="space-y-2.5">
          <button
            onClick={() => onStartChat(match.matchId || match.id)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Send E2EE Secret Message
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-800/80 text-gray-300 hover:text-white text-xs font-medium hover:bg-slate-700/80 transition-all"
          >
            Keep Exploring Profiles
          </button>
        </div>
      </div>
    </div>
  );
}
