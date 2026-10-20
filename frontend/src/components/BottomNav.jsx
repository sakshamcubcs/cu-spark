import React from 'react';
import { Flame, MessageCircle, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, matchCount }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-panel border-t border-white/10 px-6 py-2 pb-safe max-w-md mx-auto sm:rounded-t-3xl">
      <div className="flex items-center justify-around">
        {/* Discover Tab */}
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex flex-col items-center gap-1 py-1 px-4 transition-all ${
            activeTab === 'discover'
              ? 'text-rose-400 font-semibold scale-105'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="relative">
            <Flame className={`w-6 h-6 ${activeTab === 'discover' ? 'text-rose-500 fill-rose-500/20' : ''}`} />
          </div>
          <span className="text-[11px]">Discover</span>
        </button>

        {/* Matches & Chat Tab */}
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center gap-1 py-1 px-4 transition-all relative ${
            activeTab === 'matches'
              ? 'text-rose-400 font-semibold scale-105'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="relative">
            <MessageCircle className={`w-6 h-6 ${activeTab === 'matches' ? 'text-rose-500 fill-rose-500/20' : ''}`} />
            {matchCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-rose-600 text-white font-bold text-[10px] rounded-full ring-2 ring-slate-900 animate-pulse">
                {matchCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Matches</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-4 transition-all ${
            activeTab === 'profile'
              ? 'text-rose-400 font-semibold scale-105'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <User className={`w-6 h-6 ${activeTab === 'profile' ? 'text-rose-500' : ''}`} />
          <span className="text-[11px]">Profile</span>
        </button>
      </div>
    </nav>
  );
}
