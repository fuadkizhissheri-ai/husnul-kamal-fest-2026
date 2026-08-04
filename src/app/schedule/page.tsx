'use client';

import React, { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import { getStageInfo, FIXED_STAGES } from '@/lib/stages';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { Calendar, Search, MapPin, Clock, Radio, CheckCircle2, Hourglass, LayoutGrid, List } from 'lucide-react';
import { fetchWithCache, invalidateCache } from '@/lib/clientCache';

interface ScheduleItem {
  id: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  programme?: {
    name: string;
    category: string;
    participantLimit: number;
  };
}

export default function SchedulePage() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');

  const fetchSchedule = (bypassCache = false) => {
    if (bypassCache) invalidateCache('/api/schedule');
    fetchWithCache('/api/schedule')
      .then((data) => {
        const items = data?.schedules || data?.schedule || [];
        console.log(`[Public Schedule Page] Fetched ${items.length} schedule items from API`);
        setScheduleItems(items);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleRealtimeUpdate = useCallback(() => {
    fetchSchedule(true);
  }, []);

  useRealtimeSync(handleRealtimeUpdate);

  const categories = ['ALL', 'Sub Junior', 'Junior', 'Senior', 'Super Senior'];

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filtered = useMemo(() => {
    return scheduleItems.filter((item) => {
      const itemStageId = getStageInfo(item.stage || 'Aura').id.toLowerCase();
      const targetStageId = selectedStage.toLowerCase();

      const matchesStage =
        selectedStage === 'ALL' ||
        itemStageId === targetStageId ||
        (item.stage && item.stage.toLowerCase().includes(targetStageId));

      const itemCategory = item.programme?.category || 'General';
      const matchesCategory = selectedCategory === 'ALL' || itemCategory === selectedCategory;

      const progName = item.programme?.name || 'Untitled Programme';
      const q = deferredSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        progName.toLowerCase().includes(q) ||
        (item.stage || '').toLowerCase().includes(q);

      return matchesStage && matchesCategory && matchesSearch;
    });
  }, [scheduleItems, selectedStage, selectedCategory, deferredSearchQuery]);

  useEffect(() => {
    console.log(`[Public Schedule Page] Rendering ${filtered.length} of ${scheduleItems.length}...`);
  }, [filtered.length, scheduleItems.length]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="hk-badge-live">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>LIVE NOW</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="hk-badge-completed">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>COMPLETED</span>
          </span>
        );
      default:
        return (
          <span className="hk-badge-upcoming">
            <Hourglass className="w-3.5 h-3.5" />
            <span>UPCOMING</span>
          </span>
        );
    }
  };

  return (
    <SmoothScroll>
      <div className="min-h-screen pt-24 pb-20 font-sans">
        
        {/* HEADER SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full hk-badge-gold">
            <Calendar className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B]" />
            <span>Official Event Itinerary • 4 Stages</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading font-black tracking-tight text-slate-900 dark:text-white">
            PROGRAMME <span className="text-[#9E741D] dark:text-[#C8A86B] font-serif font-normal italic">SCHEDULE</span>
          </h1>

          <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Real-time stage schedules categorized across 4 fixed venues: <strong className="text-purple-600 dark:text-purple-400">Aura</strong>, <strong className="text-blue-600 dark:text-blue-400">Legacy</strong>, <strong className="text-[#9E741D] dark:text-[#C8A86B]">Lumina</strong>, and <strong className="text-emerald-600 dark:text-emerald-400">Zenith</strong>.
          </p>
        </section>

        {/* STAGE FILTER TABS */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8">
          <div className="flex items-center justify-center flex-wrap gap-3">
            <button
              onClick={() => setSelectedStage('ALL')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold font-mono transition-all border ${
                selectedStage === 'ALL'
                  ? 'bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] border-transparent shadow-lg scale-105'
                  : 'bg-black/5 dark:bg-white/5 text-slate-700 dark:text-neutral-300 border-slate-300 dark:border-white/10 hover:border-[#9E741D]'
              }`}
            >
              All Stages
            </button>

            {FIXED_STAGES.map((st) => {
              const isActive = selectedStage.toLowerCase() === st.id.toLowerCase();
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStage(st.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold font-mono transition-all border ${
                    isActive
                      ? `${st.badgeClass} scale-105 shadow-lg`
                      : 'bg-black/5 dark:bg-white/5 text-slate-700 dark:text-neutral-300 border-slate-300 dark:border-white/10 hover:border-[#9E741D]'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6">
          <div className="luxury-glass p-4 rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search programme or stage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hk-input pl-11"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
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
                  {cat === 'Sub Junior' ? 'Sub Junior (Cl 3,4)' : cat === 'Junior' ? 'Junior (Cl 5,6)' : cat === 'Senior' ? 'Senior (Cl 7,8)' : cat === 'Super Senior' ? 'Super Senior (Cl 9-12)' : cat}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center space-x-1 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-slate-300 dark:border-white/10 shrink-0">
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-[#18181B] text-white dark:bg-[#C8A86B] dark:text-[#070709]'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Timeline View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#18181B] text-white dark:bg-[#C8A86B] dark:text-[#070709]'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

          </div>
        </section>

        {/* MAIN SCHEDULE DISPLAY */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8">
          {loading ? (
            <div className="text-center py-20 text-slate-500 font-mono">Loading stage schedules...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 luxury-glass rounded-[32px] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-neutral-400">
              No scheduled programmes match your selected stage or filters.
            </div>
          ) : viewMode === 'timeline' ? (
            /* TIMELINE VIEW */
            <div className="space-y-4">
              {filtered.map((item) => {
                const stageInfo = getStageInfo(item.stage);
                return (
                  <div
                    key={item.id}
                    className="luxury-glass p-6 rounded-[28px] border border-[#9E741D]/25 dark:border-white/10 hover:border-[#9E741D] dark:hover:border-[#C8A86B]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-mono font-extrabold ${stageInfo.badgeClass}`}>
                          {stageInfo.label}
                        </span>

                        <span className="hk-badge-gold">
                          {item.programme?.category || 'General'}
                        </span>

                        {getStatusBadge(item.status || 'UPCOMING')}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white group-hover:text-[#9E741D] dark:group-hover:text-[#C8A86B] transition-colors">
                        {item.programme?.name || 'Untitled Programme'}
                      </h3>

                      <div className="flex items-center space-x-4 text-xs font-mono text-slate-600 dark:text-neutral-400">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-[#9E741D] dark:text-[#C8A86B]" />
                          <span className={stageInfo.textClass}>{item.stage || 'Stage: TBA'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-[#9E741D] dark:text-[#C8A86B]" />
                          <span>{item.startTime || '09:00 AM'} - {item.endTime || '11:00 AM'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right border-t md:border-t-0 border-slate-200 dark:border-white/10 pt-3 md:pt-0">
                      <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">Capacity Limit</span>
                      <div className="text-lg font-heading font-black text-[#9E741D] dark:text-[#C8A86B]">
                        {item.programme?.participantLimit ?? 10} Seats
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => {
                const stageInfo = getStageInfo(item.stage || 'Aura');
                return (
                  <div
                    key={item.id}
                    className="luxury-glass p-6 rounded-[28px] border border-[#9E741D]/25 dark:border-white/10 space-y-4 hover:border-[#9E741D] dark:hover:border-[#C8A86B]/40 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-mono font-extrabold ${stageInfo.badgeClass}`}>
                          {stageInfo.label}
                        </span>
                        {getStatusBadge(item.status || 'UPCOMING')}
                      </div>

                      <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white">
                        {item.programme?.name || 'Untitled Programme'}
                      </h3>

                      <div className="text-xs font-mono text-slate-600 dark:text-neutral-400 space-y-1">
                        <p className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-[#9E741D] dark:text-[#C8A86B]" />
                          <span className={stageInfo.textClass}>{item.stage || 'Stage: TBA'}</span>
                        </p>
                        <p className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-[#9E741D] dark:text-[#C8A86B]" />
                          <span>{item.startTime || '09:00 AM'} - {item.endTime || '11:00 AM'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <span className="hk-badge-gold">
                        {item.programme?.category || 'General'}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#9E741D] dark:text-[#C8A86B]">
                        Limit: {item.programme?.participantLimit ?? 10}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </SmoothScroll>
  );
}
