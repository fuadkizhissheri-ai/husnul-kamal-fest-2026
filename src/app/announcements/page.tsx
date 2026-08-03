'use client';

import React, { useState, useEffect } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import { downloadOfficialCircularPDF } from '@/lib/circularPdfExporter';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { Bell, Search, Download, Calendar, FileText } from 'lucide-react';
import { fetchWithCache, invalidateCache } from '@/lib/clientCache';

interface Announcement {
  id: string;
  title: string;
  body: string;
  categoryBadge: string;
  refNumber?: string | null;
  coordinatorName?: string | null;
  coordinatorDesignation?: string | null;
  pdfUrl?: string | null;
  publishedAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const fetchAnnouncements = (bypassCache = false) => {
    if (bypassCache) invalidateCache('/api/announcements');
    fetchWithCache('/api/announcements')
      .then((data) => {
        if (data && data.announcements) setAnnouncements(data.announcements);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useRealtimeSync(() => {
    fetchAnnouncements(true);
  });

  const categories = ['ALL', 'Fest News', 'Schedule Update', 'Rules', 'Results'];

  const filtered = announcements.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.categoryBadge === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.refNumber && item.refNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <SmoothScroll>
      <div className="min-h-screen pt-24 pb-20 font-sans">
        
        {/* HEADER SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full hk-badge-gold">
            <Bell className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B]" />
            <span>Official News & Circulars Desk</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading font-black tracking-tight text-slate-900 dark:text-white">
            OFFICIAL <span className="text-[#9E741D] dark:text-[#C8A86B] font-serif font-normal italic">ANNOUNCEMENTS</span>
          </h1>

          <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Official fest notices, schedule updates, competition guidelines, and signed coordinator circulars.
          </p>
        </section>

        {/* SEARCH & FILTER BAR */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-10">
          <div className="luxury-glass p-4 rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search circulars or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hk-input pl-11"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border ${
                    selectedCategory === cat
                      ? 'bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] border-transparent shadow-md'
                      : 'bg-black/5 dark:bg-white/5 text-slate-700 dark:text-neutral-300 border-slate-300 dark:border-white/10 hover:border-[#9E741D]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>
        </section>

        {/* ANNOUNCEMENTS LIST */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8">
          {loading ? (
            <div className="text-center py-16 text-slate-500">Loading official circulars...</div>
          ) : filtered.length === 0 ? (
            <div className="luxury-glass p-12 rounded-[28px] text-center text-slate-500 text-sm">
              No circulars found matching the filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="luxury-glass p-6 rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 shadow-luxury space-y-4 flex flex-col justify-between hover:-translate-y-1 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="hk-badge-gold">
                        {item.categoryBadge}
                      </span>
                      {item.refNumber && (
                        <span className="text-[10px] font-mono text-[#9E741D] dark:text-[#C8A86B] font-bold">
                          {item.refNumber}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-neutral-300 font-sans leading-relaxed line-clamp-4">
                      {item.body}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-500 font-mono text-[10px]">
                      <Calendar className="w-3.5 h-3.5 text-[#9E741D] dark:text-[#C8A86B]" />
                      <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                    </div>

                    <button
                      onClick={() => downloadOfficialCircularPDF(item)}
                      className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-white dark:text-[#0B0B0B] text-[11px] px-3.5 py-1.5 font-bold shadow-md hover:bg-[#9E741D] dark:hover:bg-[#C8A86B]"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Circular PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </SmoothScroll>
  );
}
