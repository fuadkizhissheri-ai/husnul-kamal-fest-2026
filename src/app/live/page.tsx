'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Trophy, Play, Pause, Maximize, Flame, Award, Sparkles, Volume2, VolumeX, Radio, Medal, Clock, MapPin, Building2, Crown, UserCheck, Star, Power, XCircle, AlertCircle, LogOut } from 'lucide-react';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { getStageInfo } from '@/lib/stages';

// ── Lazy-load heavy canvas + framer-motion animations ──
// Deferred so the live scoreboard data renders first.
const ArabicCalligraphyCanvas = dynamic(
  () => import('@/components/ArabicCalligraphyCanvas'),
  { ssr: false, loading: () => null }
);
import { motion, AnimatePresence } from 'framer-motion';

interface GroupScores {
  MAVADDA: number;
  MAHABBA: number;
}

interface ResultItem {
  id: string;
  position: string;
  points: number;
  createdAt: string;
  programme: {
    name: string;
    category: string;
    stage: string;
    isGroup: boolean;
  };
  participant: {
    id: string;
    fullName: string;
    chestNumber: string;
    group: string;
    category: string;
    madrasa?: string;
    photoUrl?: string | null;
  };
}

interface MadrasaSingleTalent {
  madrasa: string;
  topStudent: {
    id: string;
    fullName: string;
    chestNumber: string;
    group: string;
    category: string;
    madrasa: string;
    photoUrl?: string | null;
    singlePoints: number;
    firstPlaceCount: number;
    wonProgrammes: { name: string; position: string; points: number }[];
  };
}

interface CategoryTalent {
  category: string;
  topStudent: {
    id: string;
    fullName: string;
    chestNumber: string;
    group: string;
    category: string;
    madrasa: string;
    photoUrl?: string | null;
    totalPoints: number;
    firstPlaceCount: number;
    wonProgrammes: { name: string; position: string; points: number }[];
  };
}

export default function LiveDisplayPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);
  const [isStoppedRemotely, setIsStoppedRemotely] = useState(false);
  
  // Real-time Data
  const [groupScores, setGroupScores] = useState<GroupScores>({ MAVADDA: 0, MAHABBA: 0 });
  const [latestResults, setLatestResults] = useState<ResultItem[]>([]);
  const [madrasaTalents, setMadrasaTalents] = useState<MadrasaSingleTalent[]>([]);
  const [categoryTalents, setCategoryTalents] = useState<CategoryTalent[]>([]);
  const [liveSchedules, setLiveSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Breaking News Alert State
  const [breakingAlert, setBreakingAlert] = useState<ResultItem | null>(null);
  const lastResultIdRef = useRef<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Live Data & Check Remote Settings
  const fetchLiveData = async () => {
    try {
      // 1. Check Remote Live Cast Status
      const settingsRes = await fetch('/api/settings').then((r) => r.json()).catch(() => null);
      if (settingsRes?.settings?.live_cast_status === 'stopped') {
        setIsStoppedRemotely(true);
        cleanUpAndExit();
        return;
      }

      // 2. Fetch Live Schedules across all 4 Stages
      const resSchedules = await fetch('/api/schedule?status=LIVE').then((r) => r.json()).catch(() => null);
      if (resSchedules?.schedules) {
        setLiveSchedules(resSchedules.schedules);
      }

      // 3. Fetch Results
      const resResults = await fetch('/api/results').then((r) => r.json());

      if (resResults.results) {
        const resultsList: ResultItem[] = resResults.results;
        setLatestResults(resultsList);

        // Calculate House Totals
        let mavaddaPoints = 0;
        let mahabbaPoints = 0;

        resultsList.forEach((r) => {
          if (r.participant?.group === 'MAVADDA') mavaddaPoints += r.points;
          if (r.participant?.group === 'MAHABBA') mahabbaPoints += r.points;
        });
        setGroupScores({ MAVADDA: mavaddaPoints, MAHABBA: mahabbaPoints });

        // MADRASA TALENT CALCULATION (Individual Items)
        const singleResults = resultsList.filter((r) => !r.programme?.isGroup);
        const studentSingleMap: { [pId: string]: any } = {};

        singleResults.forEach((r) => {
          const p = r.participant;
          if (!p) return;
          if (!studentSingleMap[p.id]) {
            studentSingleMap[p.id] = {
              ...p,
              madrasa: p.madrasa || 'Mifthahul Uloom Central',
              singlePoints: 0,
              firstPlaceCount: 0,
              wonProgrammes: [],
            };
          }
          studentSingleMap[p.id].singlePoints += r.points;
          if (r.position.includes('1st')) studentSingleMap[p.id].firstPlaceCount += 1;
          studentSingleMap[p.id].wonProgrammes.push({
            name: r.programme.name,
            position: r.position,
            points: r.points,
          });
        });

        const madrasaGroups: { [mName: string]: any[] } = {};
        Object.values(studentSingleMap).forEach((st: any) => {
          if (!madrasaGroups[st.madrasa]) madrasaGroups[st.madrasa] = [];
          madrasaGroups[st.madrasa].push(st);
        });

        const calculatedMadrasaTalents: MadrasaSingleTalent[] = [];
        Object.entries(madrasaGroups).forEach(([mName, students]) => {
          students.sort((a, b) => {
            if (b.singlePoints !== a.singlePoints) return b.singlePoints - a.singlePoints;
            return b.firstPlaceCount - a.firstPlaceCount;
          });
          if (students.length > 0) {
            calculatedMadrasaTalents.push({
              madrasa: mName,
              topStudent: students[0],
            });
          }
        });

        calculatedMadrasaTalents.sort((a, b) => b.topStudent.singlePoints - a.topStudent.singlePoints);
        setMadrasaTalents(calculatedMadrasaTalents);

        // CATEGORY TALENT CALCULATION
        const categoriesList = ['Sub Junior', 'Junior', 'Senior', 'Super Senior'];
        const studentCatMap: { [pId: string]: any } = {};

        resultsList.forEach((r) => {
          const p = r.participant;
          if (!p) return;
          if (!studentCatMap[p.id]) {
            studentCatMap[p.id] = {
              ...p,
              madrasa: p.madrasa || 'Mifthahul Uloom Central',
              totalPoints: 0,
              firstPlaceCount: 0,
              wonProgrammes: [],
            };
          }
          studentCatMap[p.id].totalPoints += r.points;
          if (r.position.includes('1st')) studentCatMap[p.id].firstPlaceCount += 1;
          studentCatMap[p.id].wonProgrammes.push({
            name: r.programme.name,
            position: r.position,
            points: r.points,
          });
        });

        const calculatedCatTalents: CategoryTalent[] = [];
        categoriesList.forEach((cat) => {
          const catStudents = Object.values(studentCatMap).filter((st: any) => st.category === cat);
          catStudents.sort((a: any, b: any) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            return b.firstPlaceCount - a.firstPlaceCount;
          });
          if (catStudents.length > 0) {
            calculatedCatTalents.push({
              category: cat,
              topStudent: catStudents[0],
            });
          }
        });

        setCategoryTalents(calculatedCatTalents);

        // Detect New Breaking Result
        if (resultsList.length > 0) {
          const newest = resultsList[0];
          if (lastResultIdRef.current && lastResultIdRef.current !== newest.id) {
            triggerBreakingNewsAlert(newest);
          }
          lastResultIdRef.current = newest.id;
        }
      }
    } catch (err) {
      console.error('Error fetching live display data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    pollIntervalRef.current = setInterval(fetchLiveData, 5000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Near-instant real-time listener across browser tabs & SSE stream
  useRealtimeSync(() => {
    fetchLiveData();
  });

  // Auto-Slide Loop (4 slides rotate every 8 seconds)
  useEffect(() => {
    if (isPaused || breakingAlert || isStoppedRemotely) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 8000);
    return () => clearInterval(timer);
  }, [isPaused, breakingAlert, isStoppedRemotely]);

  // Clean Up Listeners and Exit
  const cleanUpAndExit = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const handleManualStopCast = () => {
    setIsConfirmingStop(true);
  };

  const confirmStopCast = () => {
    setIsConfirmingStop(false);
    cleanUpAndExit();
  };

  // Audio Beep for Breaking Alert
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerBreakingNewsAlert = (result: ResultItem) => {
    setBreakingAlert(result);
    playAlertSound();
    setTimeout(() => {
      setBreakingAlert(null);
    }, 7000);
  };

  const totalPoints = groupScores.MAVADDA + groupScores.MAHABBA || 1;
  const mavaddaPct = Math.round((groupScores.MAVADDA / totalPoints) * 100);
  const mahabbaPct = Math.round((groupScores.MAHABBA / totalPoints) * 100);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F3] dark:bg-[#070709] text-slate-900 dark:text-white overflow-hidden flex flex-col justify-between font-sans select-none">
      
      {/* Arabic Calligraphy Ambient Background */}
      <ArabicCalligraphyCanvas />

      {/* TOP TV HEADER / BRANDING */}
      <header className="relative z-20 px-8 py-5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-2xl bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#070709] flex items-center justify-center font-serif font-extrabold text-xl shadow-lg">
            ﷺ
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl tracking-wide text-slate-900 dark:text-white flex items-center space-x-2">
              <span>HUSNUL KAMAL</span>
              <span className="text-[#9E741D] dark:text-[#C8A86B] font-serif">2026</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">Mifthahul Uloom Madrasa • Live Screen-Casting Mode</p>
          </div>
        </div>

        {/* Live Indicator & Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-emerald-500/15 text-emerald-400 px-3.5 py-1.5 rounded-full border border-emerald-500/30 text-xs font-mono font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>REALTIME SYNCED</span>
          </div>

          <div className="flex items-center space-x-2 bg-rose-500/20 text-rose-400 px-4 py-1.5 rounded-full border border-rose-500/40 text-xs font-bold font-mono animate-pulse">
            <Radio className="w-4 h-4" />
            <span>LIVE BROADCAST</span>
          </div>

          <div className="flex items-center space-x-2 bg-white/5 border border-white/10 p-1 rounded-full">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white"
              title={isPaused ? 'Resume Auto-Slide' : 'Pause Auto-Slide'}
            >
              {isPaused ? <Play className="w-4 h-4 text-[#C8A86B]" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white"
              title="Toggle Alert Audio"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#C8A86B]" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>

            {/* STOP SCREEN CAST BUTTON (Top-Right Header) */}
            <button
              onClick={handleManualStopCast}
              className="flex items-center space-x-1.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-full transition-all border border-rose-400/30 shadow-lg cursor-pointer ml-2"
              title="Stop Live Screen Casting"
            >
              <Power className="w-4 h-4" />
              <span>Stop Cast</span>
            </button>
          </div>
        </div>
      </header>

      {/* SIMULTANEOUS 4-STAGE LIVE BROADCAST TICKER BAR */}
      <div className="relative z-10 bg-black/60 backdrop-blur-md border-b border-white/10 px-8 py-2.5 flex items-center justify-between overflow-x-auto text-xs">
        <div className="flex items-center space-x-2 font-mono font-bold text-rose-400 uppercase whitespace-nowrap">
          <Radio className="w-4 h-4 animate-pulse text-rose-500" />
          <span>4-STAGE LIVE MONITOR:</span>
        </div>

        <div className="flex items-center space-x-6 overflow-x-auto">
          {[
            { id: 'aura', label: 'Aura Stage', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
            { id: 'legacy', label: 'Legacy Stage', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
            { id: 'lumina', label: 'Lumina Stage', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
            { id: 'zenith', label: 'Zenith Stage', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
          ].map((st) => {
            const liveItem = liveSchedules.find((s) => s.stage && s.stage.toLowerCase() === st.id);
            return (
              <div key={st.id} className="flex items-center space-x-2 whitespace-nowrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${st.badgeClass}`}>
                  {st.label}
                </span>
                {liveItem ? (
                  <span className="text-white font-bold font-serif flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>{liveItem.programme?.name}</span>
                  </span>
                ) : (
                  <span className="text-neutral-500 italic text-[11px]">No live item</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CAROUSEL SLIDES */}
      <main className="relative z-10 flex-1 px-8 py-6 flex items-center justify-center">
        
        {loading ? (
          <div className="text-center text-neutral-400 font-mono">Connecting to live score feed...</div>
        ) : isStoppedRemotely ? (
          <div className="text-center space-y-4 luxury-glass p-10 rounded-[36px] border border-rose-500/40">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto animate-bounce" />
            <h2 className="text-3xl font-heading font-bold text-white">Live Screen-Casting Stopped</h2>
            <p className="text-xs text-neutral-400">The live broadcast session was remotely stopped by Admin Desk. Redirecting to home...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* SLIDE 1: GROUP LIVE SCOREBOARD */}
            {currentSlide === 0 && (
              <motion.div
                key="slide-0"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl space-y-12 text-center"
              >
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C8A86B]">Slide 1 of 4 • Overall House Standing</span>
                  <h2 className="text-4xl sm:text-6xl font-heading font-black text-white">
                    HOUSE CHAMPIONSHIP SCOREBOARD
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="luxury-glass p-10 rounded-[36px] border-2 border-[#C8A86B]/40 shadow-2xl space-y-4 relative overflow-hidden bg-gradient-to-b from-[#C8A86B]/15 to-transparent">
                    <div className="text-xs font-mono font-bold uppercase text-[#C8A86B] tracking-widest">House Group 1</div>
                    <h3 className="text-3xl sm:text-5xl font-heading font-black text-white">MAVADDA</h3>
                    <div className="text-6xl sm:text-8xl font-heading font-black text-[#C8A86B]">
                      {groupScores.MAVADDA}
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">Total Cumulative Points</p>
                  </div>

                  <div className="luxury-glass p-10 rounded-[36px] border-2 border-white/20 shadow-2xl space-y-4 relative overflow-hidden bg-gradient-to-b from-white/10 to-transparent">
                    <div className="text-xs font-mono font-bold uppercase text-neutral-400 tracking-widest">House Group 2</div>
                    <h3 className="text-3xl sm:text-5xl font-heading font-black text-white">MAHABBA</h3>
                    <div className="text-6xl sm:text-8xl font-heading font-black text-white">
                      {groupScores.MAHABBA}
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">Total Cumulative Points</p>
                  </div>
                </div>

                <div className="space-y-3 max-w-4xl mx-auto pt-4">
                  <div className="flex items-center justify-between text-sm font-bold font-mono">
                    <span className="text-[#C8A86B]">MAVADDA ({mavaddaPct}%)</span>
                    <span className="text-white">MAHABBA ({mahabbaPct}%)</span>
                  </div>
                  <div className="h-6 w-full rounded-full bg-white/10 p-1 flex overflow-hidden border border-white/20">
                    <div
                      style={{ width: `${mavaddaPct}%` }}
                      className="h-full bg-gradient-to-r from-[#C8A86B] to-[#e6ca94] rounded-l-full transition-all duration-1000 shadow-lg"
                    />
                    <div
                      style={{ width: `${mahabbaPct}%` }}
                      className="h-full bg-white rounded-r-full transition-all duration-1000 shadow-lg"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLIDE 2: MADRASA TALENT */}
            {currentSlide === 1 && (
              <motion.div
                key="slide-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl space-y-6 text-center"
              >
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C8A86B]">Slide 2 of 4 • Individual Performers</span>
                  <h2 className="text-3xl sm:text-5xl font-heading font-black text-white flex items-center justify-center space-x-3">
                    <UserCheck className="w-10 h-10 text-[#C8A86B]" />
                    <span>MADRASA TOP TALENTS</span>
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">Top performing individual student per Madrasa unit</p>
                </div>

                {madrasaTalents.length === 0 ? (
                  <div className="text-neutral-500 py-10">No individual results published yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {madrasaTalents.slice(0, 3).map((m, idx) => (
                      <div
                        key={m.madrasa}
                        className="luxury-glass p-8 rounded-[32px] border border-[#C8A86B]/40 space-y-4 relative overflow-hidden bg-gradient-to-b from-[#C8A86B]/15 to-transparent text-left shadow-2xl"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C8A86B] text-black">
                            {m.madrasa}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#C8A86B]">
                            #{idx + 1} Ranked
                          </span>
                        </div>

                        <div className="space-y-1 pt-2">
                          <div className="text-2xl font-heading font-extrabold text-white">
                            {m.topStudent.fullName}
                          </div>
                          <div className="flex items-center space-x-2 text-xs font-mono text-neutral-300">
                            <span className="text-[#C8A86B] font-bold">Chest: {m.topStudent.chestNumber}</span>
                            <span>•</span>
                            <span>{m.topStudent.group}</span>
                            <span>•</span>
                            <span>{m.topStudent.category}</span>
                          </div>
                        </div>

                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                          <span className="text-xs font-sans text-neutral-400">Individual Points:</span>
                          <span className="text-2xl font-heading font-black text-[#C8A86B]">
                            {m.topStudent.singlePoints} pts
                          </span>
                        </div>

                        <div className="space-y-1 pt-1 text-[11px] font-mono text-neutral-400">
                          <div className="text-[10px] font-bold uppercase text-[#C8A86B]">Won Individual Events:</div>
                          {m.topStudent.wonProgrammes.map((p, i) => (
                            <div key={i} className="flex justify-between truncate">
                              <span className="truncate">• {p.name}</span>
                              <span className="text-white font-bold ml-2">{p.position}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* SLIDE 3: CATEGORY TALENT */}
            {currentSlide === 2 && (
              <motion.div
                key="slide-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl space-y-6 text-center"
              >
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C8A86B]">Slide 3 of 4 • Star Performers</span>
                  <h2 className="text-3xl sm:text-5xl font-heading font-black text-white flex items-center justify-center space-x-3">
                    <Star className="w-10 h-10 text-[#C8A86B]" />
                    <span>CATEGORY CHAMPION TALENTS</span>
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">Highest cumulative scorer per category across all programmes</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                  {categoryTalents.map((ct) => (
                    <div
                      key={ct.category}
                      className="luxury-glass p-6 rounded-[28px] border-2 border-[#C8A86B]/40 space-y-4 relative overflow-hidden bg-gradient-to-b from-[#C8A86B]/20 to-transparent text-left shadow-2xl flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-heading font-bold text-[#C8A86B] uppercase tracking-wider">
                            {ct.category}
                          </span>
                          <Trophy className="w-4 h-4 text-[#C8A86B]" />
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-heading font-extrabold text-xl text-white leading-snug">
                            {ct.topStudent.fullName}
                          </h4>
                          <p className="text-[11px] text-[#C8A86B] font-mono font-semibold">
                            Chest No: {ct.topStudent.chestNumber}
                          </p>
                        </div>

                        <div className="text-xs text-neutral-300 font-sans space-y-0.5">
                          <p className="font-bold">{ct.topStudent.madrasa}</p>
                          <p className="text-[#C8A86B] font-mono font-bold">House: {ct.topStudent.group}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-400">Total Points</span>
                        <span className="text-2xl font-heading font-black text-[#C8A86B]">
                          {ct.topStudent.totalPoints} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SLIDE 4: LATEST PUBLISHED RESULTS TICKER */}
            {currentSlide === 3 && (
              <motion.div
                key="slide-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl space-y-6"
              >
                <div className="text-center space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C8A86B]">Slide 4 of 4 • Winners Ticker</span>
                  <h2 className="text-3xl sm:text-5xl font-heading font-black text-white">
                    LATEST PUBLISHED RESULTS
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {latestResults.slice(0, 6).map((res) => (
                    <div
                      key={res.id}
                      className="luxury-glass p-5 rounded-[24px] border border-[#C8A86B]/30 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A86B]/20 text-[#C8A86B]">
                            {res.position}
                          </span>
                          <span className="text-xs font-mono text-neutral-400">{res.programme.category}</span>
                          {res.programme.stage && (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${getStageInfo(res.programme.stage).badgeClass}`}>
                              {res.programme.stage}
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading font-bold text-base text-white">{res.participant.fullName}</h4>
                        <p className="text-xs text-neutral-400 font-sans">{res.programme.name} • <span className="text-[#C8A86B] font-mono">{res.participant.madrasa}</span></p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-xl font-heading font-black text-[#C8A86B]">+{res.points} pts</div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white">
                          {res.participant.group} ({res.participant.chestNumber})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

      </main>

      {/* CONFIRMATION PROMPT MODAL FOR STOP SCREEN CAST */}
      {isConfirmingStop && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="luxury-glass p-8 rounded-[36px] border-2 border-rose-500/40 max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Power className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-extrabold text-white">Stop Live Screen-Casting?</h3>
              <p className="text-xs text-neutral-400 font-sans">
                This will disconnect live data listeners, stop auto-sliding, and return to the main homepage.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setIsConfirmingStop(false)}
                className="py-3 rounded-2xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmStopCast}
                className="py-3 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-all shadow-lg"
              >
                Yes, Stop & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BREAKING RESULT CELEBRATION POPUP OVERLAY */}
      <AnimatePresence>
        {breakingAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-2xl w-full luxury-glass p-10 rounded-[36px] border-2 border-[#C8A86B] text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-[#C8A86B] text-[#070709] flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase text-[#C8A86B] tracking-widest animate-pulse">
                  🏆 BREAKING RESULT ANNOUNCEMENT
                </span>
                <h3 className="text-3xl sm:text-4xl font-heading font-black text-white">
                  {breakingAlert.programme.name}
                </h3>
              </div>

              <div className="bg-[#C8A86B]/20 p-6 rounded-[28px] border border-[#C8A86B]/40 space-y-2">
                <div className="text-2xl font-heading font-bold text-white">
                  {breakingAlert.position} — {breakingAlert.participant.fullName}
                </div>
                <div className="text-xs font-mono text-[#C8A86B] font-bold">
                  {breakingAlert.participant.madrasa} • House: {breakingAlert.participant.group} • Chest No: {breakingAlert.participant.chestNumber} • Awarded +{breakingAlert.points} Points
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM SLIDE CONTROL & CAROUSEL TICKER BAR */}
      <footer className="relative z-20 px-8 py-4 border-t border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-10 bg-[#C8A86B]' : 'w-2.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <div className="text-xs font-mono text-neutral-400">
          Auto-Rotating Screen-Cast Mode • Real-time Sync Every 5s
        </div>
      </footer>

    </div>
  );
}
