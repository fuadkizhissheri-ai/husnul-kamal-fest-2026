'use client';

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import TableSkeleton from '@/components/TableSkeleton';
import PrintableIDCard from '@/components/PrintableIDCard';
import { downloadPDFReport } from '@/lib/pdfExporter';
import { useRealtimeSync } from '@/components/useRealtimeSync';
import { Users, Search, Download, ShieldCheck, Flame, Filter, Sparkles, AlertCircle, Lock, ShieldAlert, X } from 'lucide-react';

interface Participant {
  id: string;
  registrationId: string;
  chestNumber: string;
  fullName: string;
  group: string;
  category: string;
  gender: string;
  whatsapp: string;
  madrasa?: string;
  photoUrl?: string | null;
  registrations: Array<{ programme: { name: string } }>;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Gate State
  const [authRequired, setAuthRequired] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Login Modal State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Filters State
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ID Pass Modal State
  const [activeIDCardParticipant, setActiveIDCardParticipant] = useState<Participant | null>(null);

  const checkAuth = () => {
    setAuthLoading(true);
    fetch('/api/register/me')
      .then((r) => r.json())
      .then((d) => {
        setAuthRequired(d.authRequired !== false);
        setAuthenticated(d.authenticated === true);
      })
      .catch((err) => console.error(err))
      .finally(() => setAuthLoading(false));
  };

  const fetchParticipants = () => {
    setLoading(true);
    fetch('/api/participants')
      .then((res) => res.json())
      .then((data) => {
        if (data.participants) {
          setParticipants(data.participants);
        }
      })
      .catch((err) => console.error('Failed to load participants:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    checkAuth();
    fetchParticipants();
  }, []);

  useRealtimeSync(fetchParticipants);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginSubmitting(true);
    setLoginError('');

    try {
      const res = await fetch('/api/register/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
        setLoginPassword('');
        fetchParticipants();
      } else {
        setLoginError(data.error || 'Incorrect username or password');
      }
    } catch (err: any) {
      setLoginError('Authentication failed. Please try again.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filtered and Sorted (by Chest Number Ascending) Participants
  const filteredParticipants = useMemo(() => {
    let result = [...participants];

    if (selectedGroup !== 'ALL') {
      result = result.filter((p) => p.group === selectedGroup);
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.chestNumber.toLowerCase().includes(q) ||
          p.registrationId.toLowerCase().includes(q) ||
          (p.madrasa && p.madrasa.toLowerCase().includes(q))
      );
    }

    // Sort by Chest Number Ascending
    return result.sort((a, b) => a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true }));
  }, [participants, selectedGroup, selectedCategory, deferredSearchQuery]);

  const handleDownloadPDF = () => {
    const filterTitle = `Participants Directory — Group: ${selectedGroup} | Category: ${selectedCategory}`;
    const headers = ['Chest No', 'Full Delegate Name', 'Group', 'Category', 'Registered Programmes'];

    const rows = filteredParticipants.map((p) => [
      p.chestNumber,
      p.fullName.toUpperCase(),
      p.group,
      p.category,
      p.registrations ? p.registrations.map((r) => r.programme?.name).filter(Boolean).join(', ') : '',
    ]);

    const filename = `Participants_Report_${selectedGroup}_${selectedCategory.replace(/\s+/g, '_')}.pdf`;
    downloadPDFReport(filterTitle, headers, rows, filename);
  };

  if (authLoading || (loading && participants.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            Participants Directory
          </h1>
          <p className="text-xs text-slate-500">Loading registered delegates...</p>
        </div>
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  // COORDINATOR ACCESS LOGIN REQUIRED SCREEN
  if (authRequired && !authenticated) {
    return (
      <SmoothScroll>
        <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-12">
          <div className="max-w-md w-full luxury-glass p-8 rounded-[32px] border border-[#C8A86B]/40 shadow-2xl space-y-6 text-center">
            
            <div className="w-14 h-14 rounded-full bg-[#18181B] dark:bg-white text-[#C8A86B] dark:text-[#0B0B0B] border border-[#C8A86B]/40 flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C8A86B]">
                CONFIDENTIAL DELEGATE DIRECTORY
              </span>
              <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                Coordinator Login Required
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                The full participant list contains delegate details and requires coordinator credentials to view.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center space-x-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs font-sans text-left">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. coordinator"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loginSubmitting}
                className="w-full btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-sm py-3.5 shadow-xl hover:bg-[#9E741D] flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Unlock Directory Access</span>
              </button>
            </form>

          </div>
        </div>
      </SmoothScroll>
    );
  }

  return (
    <SmoothScroll>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#C8A86B] uppercase tracking-widest mb-1">
              <Users className="w-4 h-4" />
              <span>OFFICIAL DELEGATES DIRECTORY</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-[#0B0B0B] dark:text-white">
              Registered Participants
            </h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-sans">
              Complete list of delegates sorted by Chest Number ascending with Group and Category filter criteria.
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-xs px-5 py-3 shadow-lg hover:bg-[#9E741D] flex items-center space-x-2 shrink-0 self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Download Formatted PDF Report</span>
          </button>
        </div>

        {/* CONTROLS BAR: FILTERS & SEARCH */}
        <div className="luxury-glass p-5 rounded-[28px] border border-[#C8A86B]/30 shadow-luxury space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by name, chest no, madrasa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-white/10 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Group Filter Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                House Group Filter
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="ALL" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">ALL GROUPS (Mavadda + Mahabba)</option>
                <option value="MAVADDA" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">MAVADDA HOUSE ONLY</option>
                <option value="MAHABBA" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">MAHABBA HOUSE ONLY</option>
              </select>
            </div>

            {/* Category Filter Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Category Filter
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="ALL" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">ALL CATEGORIES</option>
                <option value="Sub Junior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">SUB JUNIOR (Classes 3, 4)</option>
                <option value="Junior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">JUNIOR (Classes 5, 6)</option>
                <option value="Senior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">SENIOR (Classes 7, 8)</option>
                <option value="Super Senior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">SUPER SENIOR (Classes 9-12)</option>
              </select>
            </div>

          </div>

          <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10 text-xs font-mono">
            <span className="text-slate-500">
              Showing <strong className="text-[#C8A86B]">{filteredParticipants.length}</strong> of {participants.length} registered delegates
            </span>
            {(selectedGroup !== 'ALL' || selectedCategory !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedGroup('ALL');
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                className="text-[#C8A86B] hover:underline font-bold text-[11px]"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* MOBILE CARD VIEW (< md screens) */}
        <div className="md:hidden space-y-4">
          {filteredParticipants.length === 0 ? (
            <div className="luxury-glass p-8 rounded-2xl text-center text-slate-400 text-xs">
              No matching participants found for current filter criteria.
            </div>
          ) : (
            filteredParticipants.map((p) => (
              <div key={p.id} className="luxury-glass p-5 rounded-2xl border border-[#C8A86B]/30 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                    {p.chestNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                    p.group === 'MAVADDA'
                      ? 'bg-[#C8A86B]/15 text-[#C8A86B] border-[#C8A86B]/40'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {p.group}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-slate-900 dark:text-white text-sm uppercase">
                    {p.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                    Category: <strong className="text-slate-800 dark:text-slate-200">{p.category}</strong>
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Registered Programmes</div>
                  <div className="flex flex-wrap gap-1">
                    {p.registrations && p.registrations.length > 0 ? (
                      p.registrations.map((r, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                          {r.programme?.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[10px]">No events</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/10 flex justify-end">
                  <button
                    onClick={() => setActiveIDCardParticipant(p)}
                    className="btn-pill-luxury bg-[#C8A86B]/15 text-[#C8A86B] border border-[#C8A86B]/30 text-xs px-4 py-2 font-bold min-h-[44px]"
                  >
                    Generate 4K ID Pass
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP PARTICIPANTS TABLE (>= md screens) */}
        <div className="hidden md:block luxury-glass border border-[#C8A86B]/30 rounded-[28px] overflow-hidden shadow-luxury">
          <div className="w-full overflow-x-auto whitespace-nowrap [webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[650px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/10 dark:bg-white/5 border-b border-black/10 dark:border-white/10 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-4 px-5">Chest No</th>
                  <th className="py-4 px-5">Student Name</th>
                  <th className="py-4 px-5">Group</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Registered Programmes</th>
                  <th className="py-4 px-5 text-right">4K Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No matching participants found for current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => (
                    <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-5 font-mono font-black text-slate-900 dark:text-white text-sm">
                        {p.chestNumber}
                      </td>
                      <td className="py-4 px-5 font-serif font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        {p.fullName}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border ${
                          p.group === 'MAVADDA'
                            ? 'bg-[#C8A86B]/15 text-[#C8A86B] border-[#C8A86B]/40'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {p.group}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-300">
                        {p.category}
                      </td>
                      <td className="py-4 px-5 max-w-sm">
                        <div className="flex flex-wrap gap-1">
                          {p.registrations && p.registrations.length > 0 ? (
                            p.registrations.map((r, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                                {r.programme?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px]">No events</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setActiveIDCardParticipant(p)}
                          className="btn-pill-luxury bg-[#C8A86B]/10 hover:bg-[#C8A86B]/20 text-[#C8A86B] border border-[#C8A86B]/30 text-[10px] px-3 py-1 font-bold"
                        >
                          4K Pass
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4K ID CARD MODAL */}
        {activeIDCardParticipant && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 p-6 rounded-3xl border border-[#C8A86B]/30 max-w-lg w-full flex flex-col items-center space-y-4">
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold font-serif text-white">
                  Official Delegate 4K ID Pass
                </h3>
                <button onClick={() => setActiveIDCardParticipant(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <PrintableIDCard participant={activeIDCardParticipant} />
            </div>
          </div>
        )}

      </div>
    </SmoothScroll>
  );
}
