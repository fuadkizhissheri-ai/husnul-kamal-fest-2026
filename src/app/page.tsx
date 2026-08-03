'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SmoothScroll from '@/components/SmoothScroll';
import ArabicCalligraphyCanvas from '@/components/ArabicCalligraphyCanvas';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { useLogo } from '@/lib/useLogo';
import {
  Sparkles,
  ArrowUpRight,
  Radio,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Trophy,
  Users,
  ChevronRight,
  Flame,
  ArrowDown,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_COMMITTEE = [
  {
    name: 'Midlaj Roshan Kamali',
    position: 'Chief Convener',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Fuad Jalali',
    position: 'Programme Coordinator',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Husain Saqafi',
    position: 'Chairman',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Rashid Wafi',
    position: 'General Secretary',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Anas Al-Hasan',
    position: 'Finance Controller',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  },
];

export default function HomePage() {
  const [cms, setCms] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { logoUrl } = useLogo();

  const fetchCMS = (bypassCache = false) => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.settings) setCms(data.settings);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchCMS();
  }, []);

  const handleRealtimeUpdate = useCallback(() => {
    fetchCMS(true);
  }, []);

  useRealtimeSync(handleRealtimeUpdate);

  // Countdown timer logic
  useEffect(() => {
    const targetDate = cms.countdown_target ? new Date(cms.countdown_target) : new Date('2026-08-26T07:00:00');
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [cms.countdown_target]);

  const scrollToNextSection = () => {
    const nextElem = document.getElementById('ticker-marquee') || document.getElementById('our-onboard') || document.getElementById('stages-preview');
    if (nextElem) {
      nextElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Parse Committee Members from CMS or use default 5 members
  const committeeMembers = React.useMemo(() => {
    if (cms.committee_members) {
      try {
        const parsed = JSON.parse(cms.committee_members);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse committee_members CMS:', e);
      }
    }
    return DEFAULT_COMMITTEE;
  }, [cms.committee_members]);

  return (
    <SmoothScroll>
      <div className="space-y-16 sm:space-y-24 pb-20 selection:bg-[#C8A86B] selection:text-[#0B0B0B]">

        {/* ================= HERO SECTION ================= */}
        <section className="relative min-h-[85vh] flex items-center justify-center pt-10 sm:pt-12 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
          
          {/* Background Ambient Glow & Mesh */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&w=2000&q=90"
              alt="Cinematic background"
              className="w-full h-full object-cover scale-105 filter brightness-75 dark:brightness-50 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#F8F8F8]/90 via-[#F8F8F8]/60 to-[#F8F8F8] dark:from-[#0B0B0B]/90 dark:via-[#0B0B0B]/70 dark:to-[#0B0B0B]" />
          </div>

          {/* Corner Islamic Geometric Accent Vectors (Subtle 5% Opacity) */}
          <div className="absolute top-6 left-6 w-32 h-32 text-[#C8A86B]/10 pointer-events-none z-0 hidden lg:block">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35" />
              <polygon points="50,15 60,40 85,50 60,60 50,85 40,60 15,50 40,40" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>
          <div className="absolute bottom-6 right-6 w-32 h-32 text-[#C8A86B]/10 pointer-events-none z-0 hidden lg:block rotate-45">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35" />
              <polygon points="50,15 60,40 85,50 60,60 50,85 40,60 15,50 40,40" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          {/* Interactive Floating Arabic Calligraphy Canvas */}
          {cms.hero_arabic_bg_enabled !== 'false' && <ArabicCalligraphyCanvas />}

          {/* Center Hero Content Container */}
          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4 sm:space-y-5 pt-0">
            
            {/* HERO FEST LOGO / CALLIGRAPHY EMBLEM (ANCHORED ABOVE BADGE PILL) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex justify-center mx-auto my-4 sm:my-6 mb-4 sm:mb-6"
            >
              <div className="relative group cursor-pointer">
                {/* Soft Radial Ambient Gold Glow behind Logo */}
                <div className="absolute inset-0 bg-[#9E741D]/25 dark:bg-[#C8A86B]/30 blur-3xl rounded-full scale-125 group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Husnul Kamal Fest Logo Emblem"
                    className="w-64 sm:w-80 md:w-96 lg:w-[420px] h-64 sm:h-80 md:h-96 lg:h-[420px] object-contain mx-auto relative z-10 filter drop-shadow-[0_12px_28px_rgba(158,116,29,0.45)] group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-64 sm:w-80 md:w-96 lg:w-[420px] h-64 sm:h-80 md:h-96 lg:h-[420px] rounded-full bg-gradient-to-br from-[#18181B] via-[#2D2D30] to-[#0B0B0B] dark:from-white dark:via-neutral-100 dark:to-neutral-200 border-4 border-[#C8A86B] text-[#C8A86B] dark:text-[#0B0B0B] font-serif font-bold text-7xl sm:text-8xl flex items-center justify-center shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500">
                    ﷺ
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tag Badge Pill with Shimmer & Pulse */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full luxury-glass border border-[#9E741D]/30 dark:border-[#C8A86B]/40 text-[#7A5600] dark:text-[#C8A86B] text-xs font-semibold tracking-wide shadow-luxury relative overflow-hidden group"
            >
              <Sparkles className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B] animate-pulse" />
              <span>{cms.fest_subtitle || 'Mifthahul Uloom Madrasa, Ullisherikkunnu • Grand Meelad 2026'}</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-[#C8A86B]/20 to-transparent pointer-events-none" />
            </motion.div>

            {/* Headline with Soft Radial Gold Glow Background */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 relative"
            >
              {/* Soft Radial Ambient Gold Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[180px] bg-[#9E741D]/10 dark:bg-[#C8A86B]/15 blur-[90px] rounded-full pointer-events-none" />

              <h1
                className="font-bebas font-black uppercase text-center relative z-10 space-y-2 sm:space-y-3 py-2 leading-none"
                suppressHydrationWarning
              >
                <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[115px] font-black tracking-wide leading-none bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 dark:from-[#FFE8B2] dark:via-[#E5C158] dark:to-[#B8860B] bg-clip-text text-transparent filter drop-shadow-[0_6px_24px_rgba(217,119,6,0.35)]">
                  HUSNUL KAMAL
                </span>
                <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[88px] font-black tracking-wider leading-none uppercase bg-gradient-to-r from-amber-700 via-amber-500 to-amber-400 dark:from-[#E5C158] dark:via-[#FFE8B2] dark:to-[#B8860B] bg-clip-text text-transparent filter drop-shadow-[0_4px_18px_rgba(217,119,6,0.3)]">
                  MEELAD FEST 2026
                </span>
              </h1>

              {/* Soft Gold Underline Divider */}
              <div className="h-0.5 w-32 mx-auto bg-gradient-to-r from-transparent via-[#9E741D]/60 dark:via-[#C8A86B]/60 to-transparent my-3 opacity-80" />

              <p className="text-base sm:text-xl font-heading text-[#9E741D] dark:text-[#C8A86B] font-bold uppercase tracking-wider text-center max-w-2xl mx-auto leading-snug">
                <span className="block">CELEBRATING ISLAMIC HERITAGE</span>
                <span className="block">DIVINE QIRAT &amp; DEVOTION</span>
              </p>
            </motion.div>

            {/* Intro Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl mx-auto px-4 text-xs sm:text-sm text-slate-700 dark:text-neutral-300 font-sans leading-relaxed tracking-wide text-center uppercase font-semibold"
              suppressHydrationWarning
            >
              {(cms.about_description || 'MIFTHAHUL ULOOM MADRASA ULLISHERIKKUNNU PROUDLY PRESENTS HUSNUL KAMAL MEELAD FEST 2026 A GRAND CELEBRATION OF TALENT, SPIRITUALITY, AND ARTISTIC BRILLIANCE.').replace(/[-–—]/g, ' ')}
            </motion.p>

            {/* Primary & Secondary Pill CTAs with Smooth Hover States */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-2 w-full"
            >
              <Link
                href="/register"
                className="w-full max-w-xs sm:w-auto flex items-center justify-center gap-2 font-bebas text-lg sm:text-xl font-bold tracking-wider leading-none py-3.5 px-8 rounded-full bg-stone-900 text-amber-300 dark:bg-stone-900 dark:text-amber-300 shadow-md hover:bg-black dark:hover:bg-black hover:-translate-y-0.5 hover:shadow-gold-glow transition-all duration-300 group"
              >
                <span suppressHydrationWarning>{(cms.hero_cta_text || 'REGISTER AS DELEGATE').toUpperCase()}</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                href="/schedule"
                className="w-full max-w-xs sm:w-auto flex items-center justify-center gap-2 font-bebas text-lg sm:text-xl font-bold tracking-wider leading-none py-3.5 px-8 rounded-full border-2 border-amber-600/50 dark:border-amber-500/50 text-slate-900 dark:text-amber-300 bg-white/80 dark:bg-stone-900/80 hover:bg-amber-500/10 hover:-translate-y-0.5 shadow-sm transition-all duration-300 group"
              >
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                <span>EXPLORE SCHEDULE</span>
              </Link>
            </motion.div>

            {/* FLOATING STATISTIC CARDS WITH HOVER GLOW */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto"
            >
              {/* Card 1: Countdown */}
              <div className="luxury-glass p-4 rounded-[28px] text-center border border-[#9E741D]/25 dark:border-[#C8A86B]/30 animate-float hover:-translate-y-1 hover:border-[#9E741D]/70 dark:hover:border-[#C8A86B]/70 hover:shadow-gold-glow transition-all duration-300 cursor-default">
                <div className="text-xl sm:text-2xl font-heading font-black text-[#9E741D] dark:text-[#C8A86B]" suppressHydrationWarning>
                  {timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0 ? (
                    `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold animate-pulse text-lg">LIVE NOW</span>
                  )}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  {timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0 ? 'Fest Countdown' : 'Event Status'}
                </div>
              </div>

              {/* Card 2: Delegates */}
              <div className="luxury-glass p-4 rounded-[28px] text-center border border-[#9E741D]/25 dark:border-[#C8A86B]/30 animate-float-delayed hover:-translate-y-1 hover:border-[#9E741D]/70 dark:hover:border-[#C8A86B]/70 hover:shadow-gold-glow transition-all duration-300 cursor-default">
                <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white" suppressHydrationWarning>
                  {cms.hero_delegates_count || '350+'}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  Delegates
                </div>
              </div>

              {/* Card 3: Programmes */}
              <div className="luxury-glass p-4 rounded-[28px] text-center border border-[#9E741D]/25 dark:border-[#C8A86B]/30 animate-float hover:-translate-y-1 hover:border-[#9E741D]/70 dark:hover:border-[#C8A86B]/70 hover:shadow-gold-glow transition-all duration-300 cursor-default">
                <div className="text-2xl sm:text-3xl font-heading font-black text-[#9E741D] dark:text-[#C8A86B]" suppressHydrationWarning>
                  {cms.hero_programmes_count || '100+'}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  Programmes
                </div>
              </div>

              {/* Card 4: Stages */}
              <div className="luxury-glass p-4 rounded-[28px] text-center border border-[#9E741D]/25 dark:border-[#C8A86B]/30 animate-float-delayed hover:-translate-y-1 hover:border-[#9E741D]/70 dark:hover:border-[#C8A86B]/70 hover:shadow-gold-glow transition-all duration-300 cursor-default">
                <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white" suppressHydrationWarning>
                  {cms.hero_stages_count || '4 Stages'}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  Live Venues
                </div>
              </div>
            </motion.div>

            {/* Clickable Bounce Scroll-down Indicator */}
            <div className="pt-6 flex justify-center">
              <button
                onClick={scrollToNextSection}
                title="Scroll down to announcements & stages"
                className="w-9 h-12 rounded-full border-2 border-[#C8A86B]/40 hover:border-[#C8A86B] flex items-center justify-center text-[#C8A86B] animate-bounce transition-colors group cursor-pointer focus:outline-none"
              >
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>

          </div>
        </section>


        {/* ================= MARQUEE TICKER STRIP ================= */}
        <section id="ticker-marquee" className="w-full bg-[#18181B] dark:bg-[#0B0B0B] border-y border-[#9E741D]/25 dark:border-[#C8A86B]/20 py-2.5 sm:py-3.5 overflow-hidden shadow-md relative flex flex-col sm:flex-row items-stretch sm:items-center">
          
          {/* FIXED LIVE BADGE (Above on mobile, Left on desktop) */}
          <div className="shrink-0 px-4 sm:px-6 z-20 bg-[#18181B] dark:bg-[#0B0B0B] flex items-center justify-between sm:justify-start space-x-2.5 border-b sm:border-b-0 sm:border-r border-slate-700 dark:border-white/10 shadow-lg py-1.5 sm:py-0.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="font-bold font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#F5E6C4] dark:text-white shrink-0">
                <span className="hidden sm:inline">LIVE FEST ANNOUNCEMENT:</span>
                <span className="sm:hidden">ANNOUNCEMENT:</span>
              </span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 font-bold sm:hidden uppercase tracking-widest">LIVE TICKER</span>
          </div>

          {/* CONTINUOUSLY SCROLLING MARQUEE CONTAINER */}
          <div className="overflow-hidden flex-1 relative w-full py-1.5 sm:py-0">
            <div className="animate-marquee hover:[animation-play-state:paused] flex items-center text-xs font-mono whitespace-nowrap">
              
              {/* SEQUENCE COPY 1 */}
              <div className="flex items-center space-x-6 px-4 shrink-0">
                <span className="text-[#F5E6C4] dark:text-[#C8A86B] font-bold">DELEGATE REGISTRATION OPEN FOR MAVADDA &amp; MAHABBA HOUSES</span>
                <span className="text-slate-400 dark:text-white/40 font-bold">•</span>
                <span className="text-emerald-400 font-bold">4 STAGES OPERATING SIMULTANEOUSLY: AURA · LEGACY · LUMINA · ZENITH</span>
                <span className="text-slate-400 dark:text-white/40 font-bold">•</span>
                <span className="text-amber-300 font-bold">100+ COMPETITION ITEMS CATALOGUE PUBLISHED</span>
                <span className="text-slate-400 dark:text-white/40 font-bold">•</span>
                <span className="text-slate-300 font-bold">MIFTHAHUL ULOOM MADRASA, ULLISHERIKKUNNU</span>
                <span className="text-slate-400 dark:text-white/40 font-bold">•</span>
              </div>

              {/* SEQUENCE COPY 2 (DUPLICATED FOR SEAMLESS INFINITE WRAP) */}
              <div className="flex items-center space-x-6 px-4 shrink-0">
                <span className="text-[#F5E6C4] dark:text-[#C8A86B] font-bold">DELEGATE REGISTRATION OPEN FOR MAVADDA &amp; MAHABBA HOUSES</span>
                <span className="text-slate-400 dark:text-white/40 font-bold">•</span>
                <span className="text-emerald-400 font-bold">4 STAGES OPERATING SIMULTANEOUSLY: AURA · LEGACY · LUMINA · ZENITH</span>
                <span className="text-slate-400 dark:text-white/40 font-bold">•</span>
                <span className="text-amber-300 font-bold">100+ COMPETITION ITEMS CATALOGUE PUBLISHED</span>
                <span className="text-slate-400 dark:text-white/40 font-bold">•</span>
                <span className="text-slate-300 font-bold">MIFTHAHUL ULOOM MADRASA, ULLISHERIKKUNNU</span>
                <span className="text-slate-400 dark:text-white/40 font-bold">•</span>
              </div>

            </div>
          </div>

        </section>


        {/* ================= OUR ONBOARD (COMMITTEE / TEAM) SECTION ================= */}
        <motion.section
          id="our-onboard"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-6 sm:px-8 space-y-10 py-6"
        >
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#9E741D] dark:text-[#C8A86B] flex items-center justify-center space-x-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#9E741D] dark:text-[#C8A86B]" />
              <span>THE TEAM BEHIND HUSNUL KAMAL</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-[#0B0B0B] dark:text-white">
              Meet Our <span className="bg-gradient-to-r from-[#9E741D] via-[#C8A86B] to-[#9E741D] bg-clip-text text-transparent">Onboard</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 max-w-xl mx-auto font-sans" suppressHydrationWarning>
              {cms.committee_subtitle || 'The dedicated leadership team guiding Husnul Kamal Meelad Fest 2026.'}
            </p>
          </div>

          {/* 5 Members Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {committeeMembers.map((member: any, idx: number) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="luxury-glass p-5 rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 hover:border-[#9E741D]/70 dark:hover:border-[#C8A86B]/70 hover:shadow-gold-glow transition-all duration-300 flex flex-col items-center text-center group cursor-default"
              >
                {/* Photo Container with Gold Ring */}
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-[#D4AF37] via-[#C9A227] to-[#1F3A3A] shadow-lg shrink-0 overflow-hidden relative mb-3 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#18181B] flex items-center justify-center">
                    {member.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                      />
                    ) : (
                      <User className="w-10 h-10 text-[#C8A86B]" />
                    )}
                  </div>
                </div>

                {/* Member Name */}
                <h3 className="text-sm sm:text-base font-bold font-serif text-slate-900 dark:text-white leading-snug">
                  {member.name}
                </h3>

                {/* Member Position */}
                <div className="text-[10.5px] font-bold font-mono text-[#9E741D] dark:text-[#C8A86B] uppercase tracking-wider mt-1">
                  {member.position}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>


        {/* ================= 4 STAGES PREVIEW SECTION ================= */}
        <motion.section
          id="stages-preview"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-6 sm:px-8 space-y-8"
        >
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C8A86B] flex items-center justify-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Simultaneous Live Venues</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-[#0B0B0B] dark:text-white">
              The 4 Live Competition Stages
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
              Husnul Kamal Fest operates across four specialized venues concurrently.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stage 1: Aura */}
            <div className="luxury-glass p-6 rounded-[28px] border border-purple-500/30 hover:border-purple-500/70 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:-translate-y-1 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40">
                  Main Stage
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Aura Stage</h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-mono mt-0.5 font-bold">
                  {cms.stage_aura_note || 'Main Stage • Recitation & Oratory'}
                </p>
              </div>
              <p className="text-xs text-slate-700 dark:text-neutral-300 font-sans leading-relaxed">
                Hosts Qirat, Quranic Memorization, Arabic Oratory, and Grand Inauguration items.
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-purple-700 dark:text-purple-400 font-bold">
                <span>Imam Bukhari Campus</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Stage 2: Legacy */}
            <div className="luxury-glass p-6 rounded-[28px] border border-blue-500/30 hover:border-blue-500/70 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] hover:-translate-y-1 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40">
                  Stage 2
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Legacy Stage</h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-mono mt-0.5 font-bold">
                  {cms.stage_legacy_note || 'Stage 2 • Group Choral & Songs'}
                </p>
              </div>
              <p className="text-xs text-slate-700 dark:text-neutral-300 font-sans leading-relaxed">
                Hosts Group Madf, Naat Recitations, and Group Choral Performances.
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-blue-700 dark:text-blue-400 font-bold">
                <span>Imam Shafi Campus</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Stage 3: Lumina */}
            <div className="luxury-glass p-6 rounded-[28px] border border-[#9E741D]/30 hover:border-[#9E741D]/70 hover:shadow-gold-glow hover:-translate-y-1 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-[#C8A86B]/20 dark:text-[#C8A86B] dark:border-[#C8A86B]/40">
                  Stage 3
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#9E741D] dark:bg-[#C8A86B]" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Lumina Stage</h3>
                <p className="text-xs text-[#7A5600] dark:text-[#C8A86B] font-mono mt-0.5 font-bold">
                  {cms.stage_lumina_note || 'Stage 3 • Calligraphy & Arts'}
                </p>
              </div>
              <p className="text-xs text-slate-700 dark:text-neutral-300 font-sans leading-relaxed">
                Hosts Arabic Calligraphy, Islamic Art Exhibitions, and Creative Design items.
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#7A5600] dark:text-[#C8A86B] font-bold">
                <span>Art Studio Wing</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Stage 4: Zenith */}
            <div className="luxury-glass p-6 rounded-[28px] border border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] hover:-translate-y-1 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40">
                  Stage 4
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Zenith Stage</h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-mono mt-0.5 font-bold">
                  {cms.stage_zenith_note || 'Stage 4 • Quiz & Literary Items'}
                </p>
              </div>
              <p className="text-xs text-slate-700 dark:text-neutral-300 font-sans leading-relaxed">
                Hosts Islamic Quiz, Extempore Oratory, Essay Writing, and Literary Competitions.
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                <span>Imam Malik Auditorium</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

          </div>
        </motion.section>

      </div>
    </SmoothScroll>
  );
}
