import React from 'react';
import { Flame, Shield, ShieldAlert, Users, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar({ privacyMode, setPrivacyMode, onOpenProfile }) {
  const { user, demoUsers, demoLogin, logout } = useAuth();
  const { onlineUsers } = useSocket();

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 py-2.5 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-transparent">
                CU Spark
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                CU Unofficial
              </span>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Verified CU Campus Dating
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Panic / Privacy Shield Toggle */}
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            title={privacyMode ? "Privacy Blur is ON (Click to unblur)" : "Turn ON Privacy Shield (Prevents peeking)"}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-all ${
              privacyMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800/80 text-gray-300 hover:bg-slate-700/80 border border-white/5'
            }`}
          >
            {privacyMode ? (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="hidden sm:inline">Shield Active</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Privacy Shield</span>
              </>
            )}
          </button>

          {/* Quick Demo Student Switcher */}
          {demoUsers.length > 0 && (
            <div className="relative group">
              <select
                aria-label="Switch Demo Student"
                value={user?.id || ''}
                onChange={(e) => demoLogin(e.target.value)}
                className="bg-slate-800/90 text-xs text-gray-300 border border-white/10 rounded-xl px-2.5 py-1.5 outline-none hover:border-rose-500/50 cursor-pointer max-w-[130px] sm:max-w-[160px] truncate"
              >
                <option disabled value="">Switch Student...</option>
                {demoUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department?.split(' ')[0] || 'CU'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User Avatar / Profile Button */}
          {user && (
            <button
              onClick={onOpenProfile}
              className="relative rounded-full ring-2 ring-rose-500/40 hover:ring-rose-500 transition-all cursor-pointer"
            >
              <img
                src={user.photos?.[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
