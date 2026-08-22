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
  groupId?: string | null;
  certificateGenerated: boolean;
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
        const processedGroups = new Set<string>();

        resultsList.forEach((r) => {
          if (r.groupId) {
            if (processedGroups.has(r.groupId)) return;
            processedGroups.add(r.groupId);
          }
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
  }, []);

  // 1. Instant Signal Listener (BroadcastChannel & LocalStorage)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('cast_control');
        bc.onmessage = (event) => {
          if (event.data?.status === 'stopped') {
            setIsStoppedRemotely(true);
            cleanUpAndExit();
          } else if (event.data?.status === 'active') {
            setIsStoppedRemotely(false);
            fetchLiveData();
          }
        };
      } catch (e) {}
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hk_live_cast_status' && e.newValue === 'stopped') {
        setIsStoppedRemotely(true);
        cleanUpAndExit();
      } else if (e.key === 'hk_live_cast_status' && e.newValue === 'active') {
        setIsStoppedRemotely(false);
        fetchLiveData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 2. Near-instant real-time listener across browser tabs & SSE stream
  useRealtimeSync((data) => {
    if (data?.key === 'live_cast_status' || data?.live_cast_status) {
      const status = data.value || data.live_cast_status;
      if (status === 'stopped') {
        setIsStoppedRemotely(true);
        cleanUpAndExit();
        return;
      } else if (status === 'active') {
        setIsStoppedRemotely(false);
      }
    }
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
    <div className="fixed inset-0 z-50 bg-[#FAF8F3] dark:bg-[#070709] text-slate-900 dark:text-white overflow-y-auto sm:overflow-hidden flex flex-col justify-between font-sans select-none">
      
      {/* Arabic Calligraphy Ambient Background */}
      <ArabicCalligraphyCanvas />

      {/* TOP TV HEADER / BRANDING */}
      <header className="relative z-20 px-3 sm:px-8 py-2 landscape:py-1.5 flex flex-col md:flex-row items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-black/80 backdrop-blur-md gap-2 shrink-0">
        <div className="flex items-center space-x-2.5 text-center md:text-left">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#070709] flex items-center justify-center font-serif font-extrabold text-base sm:text-xl shadow-lg shrink-0">
            ﷺ
          </div>
          <div>
            <h1 className="font-heading font-black text-base sm:text-2xl tracking-wide text-slate-900 dark:text-white flex items-center justify-center md:justify-start space-x-1.5">
              <span>HUSNUL KAMAL</span>
              <span className="text-[#9E741D] dark:text-[#C8A86B] font-serif">2026</span>
            </h1>
            <p className="hidden md:block text-[10px] sm:text-xs text-slate-500 dark:text-neutral-400 font-mono">Mifthahul Uloom Madrasa • Live Screen-Casting Mode</p>
          </div>
        </div>

        {/* Live Indicator & Controls */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-1.5 sm:gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-emerald-500/30 text-[9px] sm:text-xs font-mono font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>REALTIME</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-rose-500/40 text-[9px] sm:text-xs font-bold font-mono animate-pulse">
            <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>LIVE TV</span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-200/80 dark:bg-white/10 border border-slate-300 dark:border-white/10 p-0.5 sm:p-1 rounded-full">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
              title={isPaused ? 'Resume Auto-Slide' : 'Pause Auto-Slide'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9E741D] dark:text-[#C8A86B]" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
              title="Toggle Alert Audio"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9E741D] dark:text-[#C8A86B]" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-full hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={handleManualStopCast}
              className="p-1.5 sm:p-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 border border-rose-500/40 min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center transition-all cursor-pointer"
              title="Stop Live Cast / Exit Player"
            >
              <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* STOP LIVE CAST / CLOSE PLAYER BUTTON */}
          <button
            onClick={handleManualStopCast}
            className="btn-pill-luxury bg-rose-600 hover:bg-rose-700 text-white font-bebas tracking-wider text-xs sm:text-sm uppercase px-3 sm:px-4 py-1.5 shadow-md transition-all duration-300 flex items-center justify-center gap-1.5 shrink-0 leading-none cursor-pointer"
            title="Stop Live Cast & Exit Player"
          >
            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="leading-none translate-y-[1px]">Stop Cast</span>
          </button>
        </div>
      </header>

      {/* SIMULTANEOUS 4-STAGE LIVE BROADCAST TICKER BAR */}
      <div className="relative z-10 w-full bg-white/95 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-3 sm:px-8 py-1.5 landscape:py-1 flex items-center overflow-x-auto no-scrollbar [webkit-overflow-scrolling:touch] text-[10px] sm:text-xs shrink-0">
        <div className="flex items-center space-x-1.5 font-mono font-bold text-rose-600 dark:text-rose-400 uppercase whitespace-nowrap pr-3 border-r border-slate-300 dark:border-white/10 shrink-0 sticky left-0 bg-white/95 dark:bg-black/90 z-20 py-0.5 shadow-sm">
          <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse text-rose-500" />
          <span>4-STAGE MONITOR:</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 py-0.5 pl-3 shrink-0 flex-nowrap">
          {[
            { id: 'aura', label: 'Aura Stage', badgeClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40', slideIdx: 1 },
            { id: 'legacy', label: 'Legacy Stage', badgeClass: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40', slideIdx: 2 },
            { id: 'lumina', label: 'Lumina Stage', badgeClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40', slideIdx: 3 },
            { id: 'zenith', label: 'Zenith Stage', badgeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40', slideIdx: 0 },
          ].map((st) => {
            const liveItem = liveSchedules.find(
              (s) => s.stage && (s.stage.toLowerCase() === st.id || s.stage.toLowerCase().includes(st.id))
            );
            const progName = liveItem?.programme?.name || (liveItem as any)?.name;
            const progCategory = liveItem?.programme?.category || (liveItem as any)?.category;
            const isCurrentStage = currentSlide === st.slideIdx;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setCurrentSlide(st.slideIdx)}
                className={`relative inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-xs transition-all shrink-0 ${
                  isCurrentStage
                    ? 'ring-1 ring-[#C8A86B]/50 bg-slate-800/80 shadow-sm'
                    : 'hover:bg-slate-800'
                }`}
              >
                <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold font-mono border ${st.badgeClass}`}>
                  {st.label}
                </span>
                {liveItem ? (
                  <span className="text-slate-900 dark:text-white font-bold font-serif flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>{progName}</span>
                    <span className="text-[9px] font-mono text-[#C8A86B] font-semibold">({progCategory || 'General'})</span>
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-neutral-500 italic">No live item</span>
                )}

                {/* Active Tab Indicator Underline */}
                {isCurrentStage && (
                  <motion.div
                    layoutId="activeStageMonitorTab"
                    className="absolute -bottom-0.5 left-2 right-2 h-0.5 bg-[#9E741D] dark:bg-[#C8A86B] rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CAROUSEL SLIDES */}
      <main className="relative z-10 flex-1 px-3 sm:px-8 py-3 sm:py-6 flex flex-col items-center justify-center min-h-[70vh] max-w-7xl mx-auto w-full overflow-y-auto">
        
        {loading ? (
          <div className="text-center text-slate-500 dark:text-neutral-400 font-mono">Connecting to live score feed...</div>
        ) : isStoppedRemotely ? (
          <div className="text-center space-y-4 luxury-glass p-8 sm:p-10 rounded-[36px] border border-rose-500/40">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-white">Live Screen-Casting Stopped</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">The live broadcast session was remotely stopped by Admin Desk. Redirecting to home...</p>
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
                className="w-full max-w-6xl space-y-5 sm:space-y-10 text-center"
              >
                <div className="space-y-1 sm:space-y-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#9E741D] dark:text-[#C8A86B]">Slide 1 of 4 • Overall House Standing</span>
                  <h2 className="text-xl sm:text-5xl lg:text-6xl font-heading font-black text-slate-900 dark:text-white">
                    HOUSE CHAMPIONSHIP SCOREBOARD
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 w-full">
                  <div className="w-full luxury-glass p-5 sm:p-8 lg:p-10 rounded-[24px] sm:rounded-[36px] border-2 border-[#9E741D]/40 dark:border-[#C8A86B]/40 shadow-2xl space-y-2 sm:space-y-4 relative overflow-hidden bg-gradient-to-b from-[#9E741D]/10 via-[#9E741D]/5 to-transparent dark:from-[#C8A86B]/15 dark:to-transparent flex flex-col items-center justify-center">
                    <div className="text-[10px] sm:text-xs font-mono font-bold uppercase text-[#9E741D] dark:text-[#C8A86B] tracking-widest">House Group 1</div>
                    <h3 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tight uppercase truncate max-w-full px-2">MAVADDA</h3>
                    <div className="text-4xl sm:text-7xl lg:text-8xl font-heading font-black text-[#9E741D] dark:text-[#C8A86B]">
                      {groupScores.MAVADDA}
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-neutral-400 font-mono">Total Cumulative Points</p>
                  </div>

                  <div className="w-full luxury-glass p-5 sm:p-8 lg:p-10 rounded-[24px] sm:rounded-[36px] border-2 border-slate-300 dark:border-white/20 shadow-2xl space-y-2 sm:space-y-4 relative overflow-hidden bg-gradient-to-b from-black/5 to-transparent dark:from-white/10 dark:to-transparent flex flex-col items-center justify-center">
                    <div className="text-[10px] sm:text-xs font-mono font-bold uppercase text-slate-500 dark:text-neutral-400 tracking-widest">House Group 2</div>
                    <h3 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tight uppercase truncate max-w-full px-2">MAHABBA</h3>
                    <div className="text-4xl sm:text-7xl lg:text-8xl font-heading font-black text-slate-900 dark:text-white">
                      {groupScores.MAHABBA}
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-neutral-400 font-mono">Total Cumulative Points</p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 max-w-4xl mx-auto pt-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold font-mono">
                    <span className="text-[#9E741D] dark:text-[#C8A86B]">MAVADDA ({mavaddaPct}%)</span>
                    <span className="text-slate-900 dark:text-white">MAHABBA ({mahabbaPct}%)</span>
                  </div>
                  <div className="h-5 sm:h-6 w-full rounded-full bg-slate-200 dark:bg-white/10 p-1 flex overflow-hidden border border-slate-300 dark:border-white/20">
                    <div
                      style={{ width: `${mavaddaPct}%` }}
                      className="h-full bg-gradient-to-r from-[#9E741D] to-[#C8A86B] rounded-l-full transition-all duration-1000 shadow-lg"
                    />
                    <div
                      style={{ width: `${mahabbaPct}%` }}
                      className="h-full bg-slate-900 dark:bg-white rounded-r-full transition-all duration-1000 shadow-lg"
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
                className="w-full max-w-6xl space-y-4 sm:space-y-6 text-center"
              >
                <div className="space-y-1 sm:space-y-2 mb-6 sm:mb-8 text-center">
                  <span className="tracking-[0.2em] text-[10px] sm:text-xs font-semibold text-amber-400/80 uppercase block">Slide 2 of 4 • Individual Performers</span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                    <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 shrink-0" />
                    <span className="text-center leading-tight">MADRASA TOP TALENTS</span>
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-neutral-400 font-mono mt-1 sm:mt-0">Top performing individual student per Madrasa unit</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto w-full px-4 sm:px-6">
                  {madrasaTalents.map((mt, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl transition-all duration-300 hover:border-amber-500/50 text-left space-y-3 sm:space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] sm:text-[10px] font-mono text-amber-400 font-bold uppercase mb-1">{mt.madrasa}</div>
                        <div className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase leading-snug">{mt.topStudent?.fullName}</div>
                      </div>
                      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/10">
                        <span className="text-slate-400 text-xs sm:text-sm font-medium">Chest: {mt.topStudent?.chestNumber}</span>
                        <span className="bg-amber-500/20 text-amber-400 font-bold px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border border-amber-500/30">{mt.topStudent?.singlePoints} Pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SLIDE 3: CATEGORY TALENT */}
            {currentSlide === 2 && (
              <motion.div
                key="slide-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl space-y-4 sm:space-y-6 text-center"
              >
                <div className="space-y-1 sm:space-y-2 mb-6 sm:mb-8 text-center">
                  <span className="tracking-[0.2em] text-[10px] sm:text-xs font-semibold text-amber-400/80 uppercase block">Slide 3 of 4 • Category Champions</span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                    <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 shrink-0" />
                    <span className="text-center leading-tight">CATEGORY CHAMPIONS</span>
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-neutral-400 font-mono mt-1 sm:mt-0">Top performing individual student per category</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto w-full px-4 sm:px-6">
                  {categoryTalents.map((ct, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl transition-all duration-300 hover:border-amber-500/50 text-center flex flex-col justify-between items-center space-y-3 sm:space-y-4">
                      <div className="text-[9px] sm:text-[10px] font-mono text-amber-400 font-bold uppercase">{ct.category}</div>
                      <div className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase leading-snug">{ct.topStudent?.fullName}</div>
                      <div className="text-slate-400 text-xs sm:text-sm font-medium">Chest: {ct.topStudent?.chestNumber}</div>
                      <div className="bg-amber-500/20 text-amber-400 font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-base sm:text-lg border border-amber-500/30 mt-1 sm:mt-2">{ct.topStudent?.totalPoints} Pts</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SLIDE 4: LATEST RESULTS */}
            {currentSlide === 3 && (
              <motion.div
                key="slide-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl space-y-4 sm:space-y-6 text-center"
              >
                <div className="space-y-1 sm:space-y-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#9E741D] dark:text-[#C8A86B]">Slide 4 of 4 • Recent Published Results</span>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-slate-900 dark:text-white flex items-center justify-center space-x-2 sm:space-x-3">
                    <Flame className="w-6 h-6 sm:w-10 sm:h-10 text-rose-500 animate-pulse" />
                    <span>LATEST PUBLISHED RESULTS</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {latestResults.slice(0, 4).map((res) => (
                    <div key={res.id} className="luxury-glass p-4 rounded-[20px] sm:rounded-[28px] border border-slate-300 dark:border-white/10 text-left flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-[#9E741D] dark:text-[#C8A86B] font-bold uppercase">{res.programme?.name}</div>
                        <div className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white uppercase">{res.participant?.fullName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">Chest: {res.participant?.chestNumber} • House: {res.participant?.group}</div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">{res.position}</div>
                        <div className="text-xs sm:text-sm font-bold text-[#9E741D] dark:text-[#C8A86B] font-mono">+{res.points} Pts</div>
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E0E12] border border-rose-500/40 p-6 rounded-[28px] max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Power className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white">Stop Live Screen-Casting?</h3>
              <p className="text-xs text-neutral-400 font-sans">
                This will disconnect live data listeners, stop auto-sliding, and return to the main homepage.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setIsConfirmingStop(false)}
                className="py-3 rounded-2xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmStopCast}
                className="py-3 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-all shadow-lg min-h-[44px]"
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
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <div className="max-w-2xl w-full luxury-glass p-6 sm:p-10 rounded-[28px] sm:rounded-[36px] border-2 border-[#C8A86B] text-center space-y-4 sm:space-y-6 shadow-2xl relative overflow-hidden">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#C8A86B] text-[#070709] flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-mono font-bold uppercase text-[#C8A86B] tracking-widest animate-pulse">
                  🏆 BREAKING RESULT ANNOUNCEMENT
                </span>
                <h3 className="text-xl sm:text-4xl font-heading font-black text-white">
                  {breakingAlert.programme.name}
                </h3>
              </div>

              <div className="bg-[#C8A86B]/20 p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] border border-[#C8A86B]/40 space-y-2">
                <div className="text-lg sm:text-2xl font-heading font-bold text-white">
                  {breakingAlert.position} — {breakingAlert.participant.fullName}
                </div>
                <div className="text-[10px] sm:text-xs font-mono text-[#C8A86B] font-bold">
                  {breakingAlert.participant.madrasa} • House: {breakingAlert.participant.group} • Chest No: {breakingAlert.participant.chestNumber} • Awarded +{breakingAlert.points} Points
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM SLIDE CONTROL & CAROUSEL TICKER BAR */}
      <footer className="relative z-20 px-4 sm:px-8 py-3 border-t border-white/10 bg-black/70 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center space-x-2">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all min-h-[24px] min-w-[24px] flex items-center justify-center ${
                currentSlide === idx ? 'w-8 bg-[#C8A86B]' : 'w-2.5 bg-white/20 hover:bg-white/40'
              }`}
              title={`Jump to Slide ${idx + 1}`}
            />
          ))}
        </div>

        <div className="text-[10px] sm:text-xs font-mono text-neutral-400">
          Auto-Rotating Screen-Cast Mode • Real-time Sync Every 5s
        </div>
      </footer>

    </div>
  );
}
