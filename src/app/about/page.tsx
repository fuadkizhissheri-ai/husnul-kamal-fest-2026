'use client';

import React, { useEffect, useState } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { BookOpen, Eye, Target, Heart, Award, Sparkles, Globe } from 'lucide-react';

interface AboutSectionMap {
  header?: { title: string; body: string; extraJson?: any };
  stats?: { title: string; body: string; extraJson?: any };
  card1?: { title: string; body: string; extraJson?: any };
  card2?: { title: string; body: string; extraJson?: any };
  card3?: { title: string; body: string; extraJson?: any };
  card4?: { title: string; body: string; extraJson?: any };
}

import { fetchWithCache, invalidateCache } from '@/lib/clientCache';

export default function AboutPage() {
  const [aboutData, setAboutData] = useState<AboutSectionMap>({});

  const fetchAboutData = (bypassCache = false) => {
    if (bypassCache) invalidateCache('/api/about');
    fetchWithCache('/api/about')
      .then((data) => {
        if (data && data.about) setAboutData(data.about);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  useRealtimeSync(() => {
    fetchAboutData(true);
  });

  const header = aboutData.header || {
    title: 'About Husnul Kamal Fest',
    body: 'Discover our rich heritage, sacred vision, and commitment to nurturing artistic talent and Islamic values.',
    extraJson: { tagline: 'MIFTHAHUL ULOOM MADRASA' },
  };

  const st = aboutData.stats?.extraJson || {
    stat1Val: '450+', stat1Label: 'Delegates',
    stat2Val: '32', stat2Label: 'Programmes',
    stat3Val: '4', stat3Label: 'Categories',
    stat4Val: '4', stat4Label: 'Live Stages',
    stat5Val: '120+', stat5Label: 'Awards & Trophies',
  };

  const infoCards = [
    {
      key: 'card1',
      badge: aboutData.card1?.extraJson?.badge || 'HERITAGE',
      title: aboutData.card1?.title || 'Our Heritage & Journey',
      body: aboutData.card1?.body || 'Mifthahul Uloom Madrasa, Ullisherikkunnu has served as a beacon of Islamic learning, nurturing generations of students in Qirat, Islamic literature, and moral leadership.',
      icon: BookOpen,
    },
    {
      key: 'card2',
      badge: aboutData.card2?.extraJson?.badge || 'VISION',
      title: aboutData.card2?.title || 'Our Vision',
      body: aboutData.card2?.body || 'To inspire young hearts with authentic Islamic scholarship, artistic excellence, character refinement, and deep love for the Messenger of Allah ﷺ.',
      icon: Eye,
    },
    {
      key: 'card3',
      badge: aboutData.card3?.extraJson?.badge || 'MISSION',
      title: aboutData.card3?.title || 'Our Mission',
      body: aboutData.card3?.body || 'Empowering 450+ delegates across 4 competitive categories through transparent, real-time judged talent competitions and team sportsmanship.',
      icon: Target,
    },
    {
      key: 'card4',
      badge: aboutData.card4?.extraJson?.badge || 'MAHABBA & SUNNAH',
      title: aboutData.card4?.title || 'Love for Prophet Muhammad ﷺ',
      body: aboutData.card4?.body || 'Centering all artistic and literary performances around the love and praise of Holy Prophet Muhammad ﷺ, spreading peace and divine light.',
      icon: Heart,
    },
  ];

  return (
    <SmoothScroll>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C8A86B]">
            {header.extraJson?.tagline || 'MIFTHAHUL ULOOM MADRASA'}
          </span>
          <h1 className="text-3xl sm:text-6xl font-heading font-extrabold text-[#0B0B0B] dark:text-white">
            {header.title || 'About Husnul Kamal Fest'} <span className="text-[#C8A86B] font-serif">ﷺ</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
            {header.body || 'Discover our history, sacred vision, and commitment to nurturing artistic talent and Islamic values.'}
          </p>
        </div>

        {/* BENTO STATS COUNTERS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="luxury-glass p-6 rounded-[28px] text-center border border-[#C8A86B]/30 shadow-luxury">
            <div className="text-3xl sm:text-4xl font-heading font-black text-[#C8A86B]">{st.stat1Val || '450+'}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">{st.stat1Label || 'Delegates'}</div>
          </div>

          <div className="luxury-glass p-6 rounded-[28px] text-center border border-[#C8A86B]/30 shadow-luxury">
            <div className="text-3xl sm:text-4xl font-heading font-black text-[#0B0B0B] dark:text-white">{st.stat2Val || '32'}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">{st.stat2Label || 'Programmes'}</div>
          </div>

          <div className="luxury-glass p-6 rounded-[28px] text-center border border-[#C8A86B]/30 shadow-luxury">
            <div className="text-3xl sm:text-4xl font-heading font-black text-[#C8A86B]">{st.stat3Val || '4'}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">{st.stat3Label || 'Categories'}</div>
          </div>

          <div className="luxury-glass p-6 rounded-[28px] text-center border border-[#C8A86B]/30 shadow-luxury">
            <div className="text-3xl sm:text-4xl font-heading font-black text-[#0B0B0B] dark:text-white">{st.stat4Val || '4'}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">{st.stat4Label || 'Live Stages'}</div>
          </div>

          <div className="col-span-2 md:col-span-1 luxury-glass p-6 rounded-[28px] text-center border border-[#C8A86B]/30 shadow-luxury">
            <div className="text-3xl sm:text-4xl font-heading font-black text-[#C8A86B]">{st.stat5Val || '120+'}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">{st.stat5Label || 'Awards & Trophies'}</div>
          </div>
        </div>

        {/* INFO BENTO CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {infoCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="luxury-glass p-8 rounded-[28px] border border-[#C8A86B]/30 shadow-luxury space-y-4 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#C8A86B]/15 border border-[#C8A86B]/40 flex items-center justify-center text-[#C8A86B]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C8A86B]/15 text-[#C8A86B] border border-[#C8A86B]/30 font-mono">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-2xl font-heading font-bold text-[#0B0B0B] dark:text-white">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </SmoothScroll>
  );
}
