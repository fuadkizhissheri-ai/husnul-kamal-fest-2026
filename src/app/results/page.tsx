'use client';

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import PrintableCertificate from '@/components/PrintableCertificate';
import { Trophy, Search, Download, X, Medal, FileText } from 'lucide-react';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { downloadPublishedResultsPDF } from '@/lib/pdfExporter';
import { sortResults } from '@/lib/scoring';

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

export default function ResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');

  // Certificate Modal State
  const [activeCertResult, setActiveCertResult] = useState<ResultItem | null>(null);

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs text-[#0B0B0B] dark:text-white placeholder-neutral-400 focus:outline-none"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs text-[#0B0B0B] dark:text-white focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  Category: {c === 'Sub Junior' ? 'Sub Junior' : c === 'Junior' ? 'Junior' : c === 'Senior' ? 'Senior' : c === 'Super Senior' ? 'Super Senior' : c}
                </option>
              ))}
            </select>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs text-[#0B0B0B] dark:text-white focus:outline-none"
            >
              {groups.map((g) => (
                <option key={g} value={g} className="bg-slate-900 text-white">House: {g}</option>
              ))}
            </select>

            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs text-[#0B0B0B] dark:text-white focus:outline-none"
            >
              {positions.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">Position: {p}</option>
              ))}
            </select>

            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 border border-[#C8A86B]/30 text-xs text-[#0B0B0B] dark:text-white focus:outline-none"
            >
              {genders.map((g) => (
                <option key={g} value={g} className="bg-slate-900 text-white">Gender: {g}</option>
              ))}
            </select>
          </div>
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

        {/* Certificate Modal */}
        {activeCertResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative max-w-4xl w-full luxury-glass p-8 rounded-[32px] border border-[#C8A86B]/40 shadow-2xl flex flex-col items-center space-y-4 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setActiveCertResult(null)}
                className="absolute top-6 right-6 p-2.5 text-neutral-400 hover:text-white bg-black/40 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-heading font-bold text-[#C8A86B]">Generated Official Merit Certificate</h3>
              <PrintableCertificate result={activeCertResult} />
            </div>
          </div>
        )}

      </div>
    </SmoothScroll>
  );
}
