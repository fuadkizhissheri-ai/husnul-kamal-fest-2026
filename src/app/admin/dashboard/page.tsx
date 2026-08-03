'use client';

import React, { useEffect, useState } from 'react';
import { Users, Sparkles, Trophy, Bell, Calendar, TrendingUp, Clock, Tv, Power, Radio, ExternalLink, CheckCircle2 } from 'lucide-react';

interface StatsData {
  stats: {
    totalParticipants: number;
    totalProgrammes: number;
    resultsPublished: number;
    announcementsCount: number;
  };
  growthChart: { date: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [castStatus, setCastStatus] = useState<'active' | 'stopped'>('active');
  const [updatingCast, setUpdatingCast] = useState(false);

  const [liveSchedules, setLiveSchedules] = useState<any[]>([]);

  const fetchDashboardData = () => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((d) => {
        if (d.stats) setData(d);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    fetch('/api/schedule?status=LIVE')
      .then((res) => res.json())
      .then((d) => {
        if (d.schedules) setLiveSchedules(d.schedules);
      })
      .catch((err) => console.error(err));

    fetch('/api/settings')
      .then((res) => res.json())
      .then((d) => {
        if (d.settings?.live_cast_status) {
          setCastStatus(d.settings.live_cast_status as any);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleRemoteCast = async (newStatus: 'active' | 'stopped') => {
    setUpdatingCast(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'live_cast_status',
          value: newStatus,
        }),
      });
      setCastStatus(newStatus);
    } catch (err) {
      alert('Error updating live cast status');
    } finally {
      setUpdatingCast(false);
    }
  };

  const festDate = new Date('2026-09-15');
  const now = new Date();
  const diffDays = Math.ceil((festDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (loading || !data) {
    return <div className="text-slate-400 py-10">Loading dashboard statistics...</div>;
  }

  const { stats, growthChart } = data;
  const maxGrowth = Math.max(...growthChart.map((g) => g.count), 1);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">
          Admin Dashboard Overview
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Live statistics, screen-casting control desk, and event countdown.
        </p>
      </div>

      {/* LIVE SCREEN-CASTING REMOTE CONTROL CARD */}
      <div className="luxury-glass p-6 rounded-2xl border border-[#9E741D]/30 dark:border-[#C8A86B]/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#9E741D]/15 dark:bg-[#C8A86B]/20 border border-[#9E741D] dark:border-[#C8A86B] text-[#9E741D] dark:text-[#C8A86B] flex items-center justify-center">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">Live Screen-Casting TV Control Desk</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                castStatus === 'active' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/40'
              }`}>
                {castStatus === 'active' ? '● BROADCAST ACTIVE' : '■ CAST STOPPED'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Control live score screens, remote stop signal, and cast launcher.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <a
            href="/live"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] text-xs px-4 py-2.5 font-bold flex items-center justify-center space-x-1.5 shadow-lg hover:bg-[#9E741D] dark:hover:bg-[#B8943A]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Launch TV Screen</span>
          </a>

          {castStatus === 'active' ? (
            <button
              onClick={() => handleToggleRemoteCast('stopped')}
              disabled={updatingCast}
              className="flex-1 md:flex-none btn-pill-luxury bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-2.5 font-bold flex items-center justify-center space-x-1.5 shadow-lg disabled:opacity-50"
            >
              <Power className="w-4 h-4" />
              <span>Remote Stop All Casts</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleRemoteCast('active')}
              disabled={updatingCast}
              className="flex-1 md:flex-none btn-pill-luxury bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 font-bold flex items-center justify-center space-x-1.5 shadow-lg disabled:opacity-50"
            >
              <Radio className="w-4 h-4" />
              <span>Resume Broadcast</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-STAGE SIMULTANEOUS LIVE MONITOR */}
      <div className="luxury-glass p-6 rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">4-Stage Simultaneous Live Status Desk</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#9E741D] dark:text-[#C8A86B] uppercase">
            {liveSchedules.length} / 4 STAGES LIVE NOW
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            { id: 'aura', label: 'Aura Stage', color: 'border-purple-500/50 text-purple-700 dark:text-purple-400 bg-purple-500/10' },
            { id: 'legacy', label: 'Legacy Stage', color: 'border-blue-500/50 text-blue-700 dark:text-blue-400 bg-blue-500/10' },
            { id: 'lumina', label: 'Lumina Stage', color: 'border-amber-500/50 text-amber-800 dark:text-amber-400 bg-amber-500/10' },
            { id: 'zenith', label: 'Zenith Stage', color: 'border-emerald-500/50 text-emerald-800 dark:text-emerald-400 bg-emerald-500/10' },
          ].map((st) => {
            const liveItem = liveSchedules.find((s) => s.stage && s.stage.toLowerCase() === st.id);
            return (
              <div key={st.id} className={`p-4 rounded-2xl border ${st.color} space-y-2 relative overflow-hidden`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-[11px]">{st.label}</span>
                  {liveItem ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/30 text-rose-700 dark:text-rose-300 animate-pulse flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>LIVE NOW</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                      IDLE
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  {liveItem ? (
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{liveItem.programme?.name}</p>
                      <p className="text-[10px] opacity-80">{liveItem.programme?.category} • {liveItem.startTime}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">No programme live currently</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="luxury-glass p-5 rounded-2xl border border-[#9E741D]/25 dark:border-amber-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-[#9E741D] dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Delegates</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black font-serif text-slate-900 dark:text-white">{stats.totalParticipants}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Registered across all categories</div>
        </div>

        <div className="luxury-glass p-5 rounded-2xl border border-[#9E741D]/25 dark:border-amber-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-[#9E741D] dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Programmes</span>
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black font-serif text-slate-900 dark:text-white">{stats.totalProgrammes}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Active competition items</div>
        </div>

        <div className="luxury-glass p-5 rounded-2xl border border-[#9E741D]/25 dark:border-amber-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-[#9E741D] dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Results Published</span>
            <Trophy className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black font-serif text-slate-900 dark:text-white">{stats.resultsPublished}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Official winner records</div>
        </div>

        <div className="luxury-glass p-5 rounded-2xl border border-[#9E741D]/25 dark:border-amber-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-[#9E741D] dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Announcements</span>
            <Bell className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black font-serif text-slate-900 dark:text-white">{stats.announcementsCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Official fest circulars</div>
        </div>
      </div>

    </div>
  );
}
