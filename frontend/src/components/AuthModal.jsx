import React, { useState } from 'react';
import { Flame, Shield, Mail, KeyRound, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { sendOtp, verifyOtp, demoLogin, demoUsers } = useAuth();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await sendOtp(email);
      setDevOtp(res.devOtp || '');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(email, otp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 p-6 shadow-2xl space-y-5">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/25">
            <Flame className="w-8 h-8 text-white animate-pulse" />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">CU Spark</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold border border-rose-500/20">
            <Shield className="w-3.5 h-3.5" />
            Chandigarh University Unofficial
          </div>
          <p className="text-xs text-gray-400">
            Exclusive campus dating with zero-leakage encrypted chat & 1-on-1 calls.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Step 1: University Email */}
        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Chandigarh University Student Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rohit.22bcs1044@cuchd.in"
                  className="w-full bg-slate-800 text-white text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-white/10 outline-none focus:border-rose-500/60 placeholder:text-gray-500"
                  required
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1 pl-1">
                Accepted: <span className="text-rose-400 font-mono">@cumail.in</span> or <span className="text-rose-400 font-mono">@cuchd.in</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-rose-500/25"
            >
              {loading ? 'Sending Verification Code...' : 'Get Student OTP'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Enter 6-digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-slate-800 text-white text-sm font-mono tracking-widest pl-10 pr-3.5 py-3 rounded-2xl border border-white/10 outline-none focus:border-rose-500/60 text-center"
                  required
                />
              </div>

              {devOtp && (
                <div className="mt-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[11px] text-emerald-400">
                    Test Mode OTP: <strong className="font-mono text-white text-xs">{devOtp}</strong>
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-rose-500/25"
            >
              {loading ? 'Verifying...' : 'Verify & Enter Campus'}
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-center text-xs text-gray-400 hover:text-white pt-1"
            >
              Back to email
            </button>
          </form>
        )}

        {/* Demo Student Fast Access for instant testing */}
        {demoUsers.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-[11px] text-gray-400 mb-2 text-center font-medium flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Instant Test: Login as a CU Student
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.slice(0, 4).map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => demoLogin(u.id)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-left border border-white/5 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <img
                    src={u.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                    alt={u.name}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-white truncate">{u.name}</p>
                    <p className="text-[9px] text-rose-300 truncate">{u.department?.split(' ')[0]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
