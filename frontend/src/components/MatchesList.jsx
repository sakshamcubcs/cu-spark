import React, { useState, useEffect } from 'react';
import { MessageCircle, Heart, Lock, Sparkles, MapPin, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function MatchesList({ onSelectMatch }) {
  const { token } = useAuth();
  const { onlineUsers } = useSocket();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMatches = () => {
    fetch('/api/matches/list', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMatches(data.matches);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMatches();
  }, [token]);

  const filtered = matches.filter(m =>
    m.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.partner.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-2 select-none">
      {/* Search Header */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search matches by name or branch..."
          className="w-full bg-slate-900/80 text-xs text-white pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 outline-none focus:border-rose-500/50 placeholder:text-gray-500"
        />
      </div>

      {/* Zero matches state */}
      {matches.length === 0 ? (
        <div className="text-center py-16 px-6 glass-panel rounded-3xl border border-white/10">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
            <Heart className="w-8 h-8 text-rose-400" />
          </div>
          <h4 className="font-bold text-white mb-1">No Matches Yet</h4>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
            Swipe right on students in the Discover tab! When someone likes you back, your secure E2EE chat unlocks here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="font-semibold text-rose-300">Mutual CU Matches ({matches.length})</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Lock className="w-3 h-3 text-emerald-400" /> E2EE Protected
            </span>
          </div>

          {filtered.map(match => {
            const partner = match.partner;
            const isOnline = onlineUsers.has(partner.id);

            return (
              <div
                key={match.matchId}
                onClick={() => onSelectMatch(match.matchId)}
                className="glass-panel p-3.5 rounded-2xl border border-white/10 hover:border-rose-500/40 cursor-pointer transition-all hover:bg-slate-800/60 flex items-center gap-3.5"
              >
                {/* Avatar with online status */}
                <div className="relative flex-shrink-0">
                  <img
                    src={partner.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                    alt={partner.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-rose-500/30"
                  />
                  {isOnline && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                  )}
                </div>

                {/* Match Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white truncate">{partner.name}</h4>
                    <span className="text-[10px] text-gray-400">
                      {isOnline ? (
                        <span className="text-emerald-400 font-medium">Online</span>
                      ) : (
                        partner.year
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-rose-300/80 truncate mt-0.5">
                    {partner.department}
                  </p>

                  {/* Mutual Interests Badge */}
                  {match.mutualInterests && match.mutualInterests.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-300">
                      <Sparkles className="w-3 h-3 text-rose-400 flex-shrink-0" />
                      <span className="truncate">
                        Both like: {match.mutualInterests.slice(0, 2).join(', ')}
                        {match.mutualInterests.length > 2 ? ` +${match.mutualInterests.length - 2}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <MessageCircle className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
