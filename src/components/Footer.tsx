'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Globe, Share2, MessageSquare } from 'lucide-react';
import { fetchWithCache, invalidateCache } from '@/lib/clientCache';
import { useRealtimeSync } from '@/components/useRealtimeSync';

export default function Footer() {
  const [cms, setCms] = useState<Record<string, string>>({});

  const loadSettings = (bypassCache = false) => {
    if (bypassCache) invalidateCache('/api/settings');
    fetchWithCache('/api/settings')
      .then((data) => {
        if (data && data.settings) setCms(data.settings);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useRealtimeSync(() => {
    loadSettings(true);
  });

  const email = cms.contact_email || 'mifthahululoomuk@gmail.com';
  const phone = cms.contact_phone || '+91 73064 80848 / Control Desk';
  const venue = cms.venue_name
    ? `${cms.venue_name}${cms.venue_address ? `, ${cms.venue_address}` : ''}`
    : 'Mifthahul Uloom Madrasa, Ullisherikkunnu Campus, Kerala';
  const copyright = cms.footer_copyright || '© 2026 Husnul Kamal Meelad Fest. Mifthahul Uloom Madrasa, Ullisherikkunnu.';

  return (
    <footer className="mt-20 border-t border-[#9E741D]/20 dark:border-[#C8A86B]/20 bg-[#FAF8F3] dark:bg-[#0B0B0B] text-slate-900 dark:text-white pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Calligraphic Divider */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">
          <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 border border-[#9E741D]/30 dark:border-[#C8A86B]/30 flex items-center justify-center text-[#9E741D] dark:text-[#C8A86B] font-serif text-2xl font-bold mb-3">
            ﷺ
          </div>
          <p className="text-xs font-serif italic text-[#7A5600] dark:text-[#C8A86B]/90 max-w-lg tracking-wide">
            &ldquo;Verily, in the Messenger of Allah you have a noble example for him who looks to Allah and the Last Day.&rdquo;
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#9E741D] dark:via-[#C8A86B] to-transparent mt-4 opacity-40" />
        </div>

        {/* 4 COLUMNS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {cms.fest_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cms.fest_logo_url} alt="Husnul Kamal Fest Logo" className="h-10 object-contain mb-2" />
              ) : (
                <span className="font-heading font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
                  Husnul Kamal <span className="text-[#9E741D] dark:text-[#C8A86B]">2026</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed font-sans" suppressHydrationWarning>
              Hosted by <strong className="text-slate-900 dark:text-white font-medium">{cms.fest_subtitle || 'Mifthahul Uloom Madrasa, Ullisherikkunnu'}</strong>. Celebrating student talent, Islamic knowledge, Qirat, and authentic devotion for the Messenger of Allah ﷺ.
            </p>
            {/* Social Icons */}
            <div className="flex items-center space-x-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-[#9E741D] dark:hover:border-[#C8A86B] hover:text-[#9E741D] dark:hover:text-[#C8A86B] flex items-center justify-center transition-all">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-[#9E741D] dark:hover:border-[#C8A86B] hover:text-[#9E741D] dark:hover:text-[#C8A86B] flex items-center justify-center transition-all">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-[#9E741D] dark:hover:border-[#C8A86B] hover:text-[#9E741D] dark:hover:text-[#C8A86B] flex items-center justify-center transition-all">
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#9E741D] dark:text-[#C8A86B]">
              Quick Navigation
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-neutral-400">
              <li>
                <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1">
                  <span>About History & Vision</span>
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Announcements & PDF Circulars
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Programme Schedule & Stage Times
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Live Scoreboard & Merit Certificates
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Delegate Registration Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories & Groups */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#9E741D] dark:text-[#C8A86B]">
              Categories & Houses
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-neutral-400">
              <li className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                <span>Sub Junior</span>
                <span className="text-[#9E741D] dark:text-[#C8A86B] font-mono text-[10px]">SJ Prefix</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                <span>Junior</span>
                <span className="text-[#9E741D] dark:text-[#C8A86B] font-mono text-[10px]">JR Prefix</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                <span>Senior</span>
                <span className="text-[#9E741D] dark:text-[#C8A86B] font-mono text-[10px]">SR Prefix</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                <span>Super Senior</span>
                <span className="text-[#9E741D] dark:text-[#C8A86B] font-mono text-[10px]">SS Prefix</span>
              </li>
              <li className="pt-2 text-[11px] text-[#9E741D] dark:text-[#C8A86B]">
                Houses: <strong className="text-slate-900 dark:text-white font-semibold">MAVADDA</strong> & <strong className="text-slate-900 dark:text-white font-semibold">MAHABBA</strong>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Venue */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#9E741D] dark:text-[#C8A86B]">
              Venue & Contact
            </h3>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-neutral-400">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B] shrink-0 mt-0.5" />
                <span suppressHydrationWarning>{venue}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, '') || '917306480848'}?text=${encodeURIComponent('Hi, I have a question about Husnul Kamal Fest 2026')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#9E741D] dark:hover:text-[#C8A86B] underline transition-colors flex items-center space-x-1.5"
                  title="Click to chat on WhatsApp with Control Desk"
                >
                  <span suppressHydrationWarning>{phone}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">WhatsApp</span>
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B] shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-[#9E741D] dark:hover:text-[#C8A86B] underline transition-colors"
                >
                  <span suppressHydrationWarning>{email}</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT BAR */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-neutral-500 space-y-4 sm:space-y-0">
          <p suppressHydrationWarning>{copyright}</p>
          <p className="flex items-center space-x-1">
            <span>Crafted with</span>
            <span className="text-[#9E741D] dark:text-[#C8A86B] font-bold">Luxury Excellence</span>
            <span>for Mifthahul Uloom Madrasa</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
