'use client';

import React, { useState, useEffect, useMemo, useDeferredValue, Suspense, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SmoothScroll from '@/components/SmoothScroll';
import PrintableCertificate from '@/components/PrintableCertificate';
import { Trophy, Search, Download, X, Medal, FileText, Loader2, Crown, Sparkles, Award } from 'lucide-react';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { downloadPublishedResultsPDF, downloadCategoryTalentsPDF } from '@/lib/pdfExporter';
import { sortResults, calculateCategoryTalents, TalentStudent } from '@/lib/scoring';

interface ResultItem {
  id: string;
  position: string;
  points: number;
  certificateGenerated: boolean;
  programme: {
    id: string;
    name: string;
    category: string;
    stage: string;
  };
  participant: {
    id: string;
    fullName: string;
    chestNumber: string;
    registrationId: string;
    group: string;
    category: string;
    gender?: string;
  };
}

function ResultsContent() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Filters State from URL
  const selectedCategory = searchParams.get('category') || 'ALL';
  const selectedGroup = searchParams.get('group') || 'ALL';
  const selectedPosition = searchParams.get('position') || 'ALL';
  const selectedGender = searchParams.get('gender') || 'ALL';
  const searchQuery = searchParams.get('search') || '';
  
  // Local state for search input (debounced to URL)
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setLocalSearch('');
      router.replace('?', { scroll: false });
    });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateFilter('search', localSearch);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [localSearch]);

  const hasActiveFilters = selectedGroup !== 'ALL' || selectedCategory !== 'ALL' || selectedGender !== 'ALL' || selectedPosition !== 'ALL' || searchQuery !== '';

  // Certificate & Talent Student Modal State
  const [activeCertResult, setActiveCertResult] = useState<ResultItem | null>(null);
  const [activeTalentStudent, setActiveTalentStudent] = useState<TalentStudent | null>(null);

  const categoryTalents = useMemo(() => {
    return calculateCategoryTalents(results);
  }, [results]);

  const handleDownloadCategoryTalentsPDF = () => {
    downloadCategoryTalentsPDF(results);
  };

  const fetchResults = () => {
    fetch('/api/results')
      .then((res) => res.json())
      .then((data) => {
        if (data.results) setResults(data.results);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResults();
  }, []);

  useRealtimeSync(() => {
    fetchResults();
  });

  const categories = ['ALL', 'Sub Junior', 'Junior', 'Senior', 'Super Senior'];
  const groups = ['ALL', 'MAVADDA', 'MAHABBA'];
  const positions = ['ALL', '1st Place', '2nd Place', '3rd Place'];
  const genders = ['ALL', 'Male', 'Female'];

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredResults = useMemo(() => {
    const filtered = results.filter((r) => {
      if (!r.programme || !r.participant) return false;
      const matchesCategory = selectedCategory === 'ALL' || r.programme?.category === selectedCategory;
      const matchesGroup = selectedGroup === 'ALL' || r.participant?.group === selectedGroup;
      const matchesPosition = selectedPosition === 'ALL' || r.position?.includes(selectedPosition);
      const matchesGender = selectedGender === 'ALL' || r.participant?.gender === selectedGender;
      const q = deferredSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.participant?.fullName ?? '').toLowerCase().includes(q) ||
        (r.participant?.chestNumber ?? '').toLowerCase().includes(q) ||
        (r.programme?.name ?? '').toLowerCase().includes(q);

      return matchesCategory && matchesGroup && matchesPosition && matchesGender && matchesSearch;
    });
    
    return sortResults(filtered);
  }, [results, selectedCategory, selectedGroup, selectedPosition, selectedGender, deferredSearchQuery]);

  const handleDownloadPDF = () => {
    const filterTitle = `Category: ${selectedCategory} | House: ${selectedGroup} | Position: ${selectedPosition} | Gender: ${selectedGender}`;
    downloadPublishedResultsPDF(
      filterTitle,
      filteredResults,
      `Husnul_Kamal_Scoreboard_Results_${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  return (
    <SmoothScroll>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C8A86B]">Husnul Kamal Scoreboard</span>
          <h1 className="text-3xl sm:text-6xl font-heading font-extrabold text-[#0B0B0B] dark:text-white">
            Results & Merit Certificates
          </h1>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Official scoreboard records. Search by delegate name or chest number to download official JPEG merit certificates.
          </p>
        </div>

        {/* CATEGORY TALENTS SHOWCASE SECTION */}
        <div className="luxury-glass p-6 sm:p-8 rounded-[32px] border border-[#C8A86B]/40 shadow-luxury space-y-6 bg-gradient-to-b from-amber-500/5 to-transparent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#C8A86B]/20 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-[#C8A86B]/15 border border-[#C8A86B]/30 rounded-2xl text-[#C8A86B]">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#0B0B0B] dark:text-white flex items-center gap-2">
                  <span>Category Talents & Individual Champions</span>
                  <Sparkles className="w-5 h-5 text-[#C8A86B] animate-pulse" />
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Individual toppers calculated across Sub Junior, Junior, Senior & Super Senior categories.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadCategoryTalentsPDF}
              className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] text-xs px-5 py-2.5 font-bold shadow-lg hover:bg-amber-400 flex items-center space-x-2 w-full sm:w-auto justify-center shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>Download Category Talents (PDF)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categoryTalents.map((ct) => {
              const top = ct.topStudent;
              return (
                <div
                  key={ct.category}
                  className="bg-black/5 dark:bg-white/5 border border-[#C8A86B]/30 rounded-2xl p-5 hover:border-[#C8A86B] transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#C8A86B]/20 text-[#C8A86B] border border-[#C8A86B]/30">
                      {ct.category}
                    </span>
                    <Trophy className="w-4 h-4 text-[#C8A86B]" />
                  </div>

                  {top ? (
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-[#0B0B0B] dark:text-white leading-tight uppercase">
                        {top.fullName}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className="text-[#C8A86B] font-bold">{top.chestNumber}</span>
                        <span className="text-neutral-400">•</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C8A86B]/15 text-[#C8A86B]">
                          {top.group}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/10">
                        <span className="text-lg font-bold font-mono text-[#C8A86B]">
                          {top.totalPoints} Pts
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                          1st: {top.firstPlaceCount} | 2nd: {top.secondPlaceCount}
                        </span>
                      </div>

                      {top.wonProgrammes && top.wonProgrammes.length > 0 && (
                        <button
                          onClick={() => setActiveTalentStudent(top)}
                          className="mt-2 w-full text-center text-[11px] font-bold text-[#C8A86B] hover:underline bg-[#C8A86B]/10 py-1.5 rounded-xl border border-[#C8A86B]/20 transition-colors"
                        >
                          View Won Items ({top.wonProgrammes.length})
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-neutral-500 italic">
                      Awaiting published results...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="luxury-glass p-5 rounded-[28px] border border-[#C8A86B]/30 shadow-luxury space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-[#C8A86B] uppercase tracking-widest hidden md:block">Scoreboard Filters</h3>
            <button
              onClick={handleDownloadPDF}
              className="btn-pill-luxury bg-[#0B0B0B] text-[#C8A86B] dark:bg-[#C8A86B] dark:text-[#0B0B0B] text-xs px-5 py-2.5 font-bold shadow-md hover:bg-[#1A1A1A] flex items-center space-x-2 ml-auto w-full sm:w-auto justify-center"
            >
              <FileText className="w-4 h-4" />
              <span>Download Results (PDF)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Name, Chest No..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs text-[#0B0B0B] dark:text-white placeholder-neutral-400 focus:outline-none"
              />
              {isPending && <Loader2 className="w-4 h-4 text-neutral-400 animate-spin absolute right-4 top-3" />}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs font-bold text-[#0B0B0B] dark:text-white focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  Category: {c === 'Sub Junior' ? 'Sub Junior' : c === 'Junior' ? 'Junior' : c === 'Senior' ? 'Senior' : c === 'Super Senior' ? 'Super Senior' : c}
                </option>
              ))}
            </select>

            <select
              value={selectedGroup}
              onChange={(e) => updateFilter('group', e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs font-bold text-[#0B0B0B] dark:text-white focus:outline-none"
            >
              {groups.map((g) => (
                <option key={g} value={g} className="bg-slate-900 text-white">House: {g}</option>
              ))}
            </select>

            <select
              value={selectedPosition}
              onChange={(e) => updateFilter('position', e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs font-bold text-[#0B0B0B] dark:text-white focus:outline-none"
            >
              {positions.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">Position: {p}</option>
              ))}
            </select>

            <select
              value={selectedGender}
              onChange={(e) => updateFilter('gender', e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs font-bold text-[#0B0B0B] dark:text-white focus:outline-none"
            >
              {genders.map((g) => (
                <option key={g} value={g} className="bg-slate-900 text-white">Gender: {g}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end pt-2 border-t border-black/5 dark:border-white/10 mt-4">
              <button
                onClick={clearFilters}
                className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            </div>
          )}

        </div>

        {/* Scoreboard Table */}
        {loading ? (
          <div className="text-center py-16 text-neutral-500">Loading results...</div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-16 luxury-glass rounded-[28px] border border-[#C8A86B]/20 text-neutral-500">
            No results published matching search criteria.
          </div>
        ) : (
          <div className="luxury-glass rounded-[28px] border border-[#C8A86B]/30 shadow-luxury overflow-hidden">
            <div className="w-full overflow-x-auto whitespace-nowrap [webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead>
                  <tr className="bg-black/10 dark:bg-white/10 text-[#C8A86B] font-heading font-bold uppercase tracking-wider border-b border-[#C8A86B]/20">
                    <th className="py-4 px-6">Position</th>
                    <th className="py-4 px-6">Delegate Name</th>
                    <th className="py-4 px-6">Chest No</th>
                    <th className="py-4 px-6">House</th>
                    <th className="py-4 px-6">Programme</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6 text-center">Points</th>
                    <th className="py-4 px-6 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[#0B0B0B] dark:text-white">
                  {filteredResults.map((res) => (
                    <tr key={res.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-heading font-bold text-[#C8A86B] flex items-center space-x-2">
                        <Medal className="w-4 h-4 text-[#C8A86B]" />
                        <span>{res.position}</span>
                      </td>

                      <td className="py-4 px-6 font-heading font-bold text-sm">
                        {res.participant.fullName}
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-[#C8A86B]">
                        {res.participant.chestNumber}
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#C8A86B]/15 text-[#C8A86B] border border-[#C8A86B]/30">
                          {res.participant.group}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-sans">
                        {res.programme.name}
                      </td>

                      <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">
                        {res.programme.category}
                      </td>

                      <td className="py-4 px-6 text-center font-mono font-bold text-[#C8A86B] text-sm">
                        +{res.points}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setActiveCertResult(res)}
                          className="btn-pill-luxury bg-[#0B0B0B] text-[#C8A86B] dark:bg-white dark:text-[#0B0B0B] text-[11px] px-3 py-1.5 ml-auto"
                        >
                          <Download className="w-3 h-3" />
                          <span>Certificate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CERTIFICATE MODAL */}
        {activeCertResult && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 p-6 rounded-3xl border border-[#C8A86B]/30 max-w-lg w-full flex flex-col items-center space-y-4">
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#C8A86B]" /> Merit Certificate
                </h3>
                <button onClick={() => setActiveCertResult(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <PrintableCertificate result={activeCertResult} />
            </div>
          </div>
        )}

        {/* TALENT STUDENT WON PROGRAMMES MODAL */}
        {activeTalentStudent && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 p-6 rounded-3xl border border-[#C8A86B]/30 max-w-md w-full flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-white">
                  <Crown className="w-5 h-5 text-[#C8A86B]" />
                  <h3 className="text-base font-bold font-heading">{activeTalentStudent.fullName}</h3>
                </div>
                <button onClick={() => setActiveTalentStudent(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-slate-400">Chest No: <strong className="text-amber-400">{activeTalentStudent.chestNumber}</strong></p>
                <p className="text-slate-400">Category: <strong className="text-white">{activeTalentStudent.category}</strong></p>
                <p className="text-slate-400">House: <strong className="text-amber-400">{activeTalentStudent.group}</strong></p>
                <p className="text-slate-400">Total Individual Points: <strong className="text-emerald-400">{activeTalentStudent.totalPoints} Pts</strong></p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <h4 className="text-xs font-bold text-[#C8A86B] uppercase tracking-wider">Won Items & Achievements</h4>
                {activeTalentStudent.wonProgrammes.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/50 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-amber-400">{item.position}</div>
                    </div>
                    <div className="font-mono font-bold text-emerald-400">+{item.points} pts</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </SmoothScroll>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-6">
        <div className="text-center">Loading Results...</div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
