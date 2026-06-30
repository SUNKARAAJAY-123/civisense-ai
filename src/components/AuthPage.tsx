import React, { useState } from 'react';
import { Shield, Sparkles, User, Mail, Lock, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
      : { email, password, name, role };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setIsLoading(false);
    }
  };

  // Preset accounts for judges to instantly preview both Citizen and Admin views
  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: presetEmail, password: presetPass })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full filter blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-[#0d0d0f] border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>Community Hero</span>
            <Sparkles className="w-5 h-5 text-orange-400" />
          </h1>
          <p className="text-xs text-slate-400">
            AI-powered hyperlocal community complaint resolver.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-2xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute top-2.5 left-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunkara Ajay"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20 transition"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-2xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Portal Registration Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('citizen')}
                    className={`py-2 text-xs rounded-xl border font-semibold transition ${
                      role === 'citizen'
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                        : 'bg-[#0a0a0b] border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    Citizen Hero
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 text-xs rounded-xl border font-semibold transition ${
                      role === 'admin'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                        : 'bg-[#0a0a0b] border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    Municipal Authority
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-2xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute top-2.5 left-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-2xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute top-2.5 left-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-xs text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/10 cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Portal' : 'Register Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="text-center text-xs">
          <span className="text-slate-500">
            {isLogin ? "New to Community Hero? " : "Already have an account? "}
          </span>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-orange-400 hover:text-orange-300 font-bold transition cursor-pointer"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </div>

        {/* Quick Testing accounts for judges */}
        <div className="border-t border-white/5 pt-5 space-y-3">
          <div className="flex items-center gap-1 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Hackathon Evaluation Presets</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleQuickLogin('ajay@hero.com', 'citizen123')}
              className="p-2.5 bg-[#0a0a0b] border border-white/5 rounded-xl text-left hover:bg-white/5 transition flex flex-col gap-0.5 group cursor-pointer"
            >
              <span className="text-[10px] font-bold text-slate-200 group-hover:text-orange-400 transition">Ajay (Citizen)</span>
              <span className="text-[8px] text-slate-500">Accrued points, verify others</span>
            </button>

            <button
              onClick={() => handleQuickLogin('admin@hero.org', 'admin123')}
              className="p-2.5 bg-[#0a0a0b] border border-white/5 rounded-xl text-left hover:bg-white/5 transition flex flex-col gap-0.5 group cursor-pointer"
            >
              <span className="text-[10px] font-bold text-slate-200 group-hover:text-indigo-400 transition">Sarah (Admin)</span>
              <span className="text-[8px] text-slate-500">Dispatch, change status, logs</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
