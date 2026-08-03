'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 p-8 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center font-bold text-2xl mx-auto">
            ﷺ
          </div>
          <h1 className="text-2xl font-black font-serif text-white">
            Admin Panel Login
          </h1>
          <p className="text-xs text-amber-300">
            Husnul Kamal — Meelad Fest 2026
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 dark:border-amber-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 dark:border-amber-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In to Control Panel'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          Default Admin Login: <code className="text-amber-300 font-mono">admin</code> / <code className="text-amber-300 font-mono">admin123</code>
        </div>

      </div>
    </div>
  );
}
