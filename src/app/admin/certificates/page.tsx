'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, Award, Users, Filter, ChevronDown, Eye, IdCard, Printer } from 'lucide-react';
import PrintableCertificate from '@/components/PrintableCertificate';
import PrintableIDCard from '@/components/PrintableIDCard';

interface ResultItem {
  id: string;
  position: string;
  points: number;
  createdAt: string;
  programme: { name: string; category: string; stage: string };
  participant: {
    id: string;
    fullName: string;
    chestNumber: string;
    registrationId: string;
    group: string;
    category: string;
    whatsapp: string;
    gender: string;
    madrasa?: string;
    photoUrl?: string | null;
  };
}

interface ParticipantItem {
  id: string;
  registrationId: string;
  fullName: string;
  chestNumber: string;
  group: string;
  category: string;
  gender: string;
  whatsapp: string;
  madrasa?: string;
  photoUrl?: string | null;
  registrations?: Array<{ id: string; programme: { name: string; category: string } }>;
}

type Mode = 'certificates' | 'idcards';

export default function AdminCertificatesPage() {
  const [mode, setMode] = useState<Mode>('certificates');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterPosition, setFilterPosition] = useState('All');

  const [previewResult, setPreviewResult] = useState<ResultItem | null>(null);
  const [previewParticipant, setPreviewParticipant] = useState<ParticipantItem | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/results').then((r) => r.json()),
      fetch('/api/participants').then((r) => r.json()),
    ])
      .then(([resData, partData]) => {
        if (resData.results) setResults(resData.results);
        if (partData.participants) setParticipants(partData.participants);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter results
  const filteredResults = results.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      r.participant.fullName.toLowerCase().includes(q) ||
      r.participant.chestNumber.toLowerCase().includes(q) ||
      r.programme.name.toLowerCase().includes(q);
    const matchCat = filterCategory === 'All' || r.programme.category === filterCategory;
    const matchGrp = filterGroup === 'All' || r.participant.group === filterGroup;
    const matchPos = filterPosition === 'All' || r.position === filterPosition;
    return matchSearch && matchCat && matchGrp && matchPos;
  });

  // Filter participants
  const filteredParticipants = participants.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.chestNumber.toLowerCase().includes(q);
    const matchGrp = filterGroup === 'All' || p.group === filterGroup;
    return matchSearch && matchGrp;
  });

  const categories = ['All', ...Array.from(new Set(results.map((r) => r.programme.category)))];
  const positions = ['All', '1st Place', '2nd Place', '3rd Place', 'Participation'];

  const POSITION_BADGE: Record<string, string> = {
    '1st Place': 'bg-[#F5E6C4] text-[#7A5600] border-[#E5C578] dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/40',
    '2nd Place': 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-400/20 dark:text-slate-300 dark:border-slate-400/40',
    '3rd Place': 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/40',
  };

  const handleBatchPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-[#9E741D] dark:text-[#C8A86B]" />
            <span>Certificates &amp; ID Pass Generator</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Generate, preview, and batch-export official A4 landscape certificates and delegate passes.
          </p>
        </div>

        {/* Mode Toggle & Batch Print */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBatchPrint}
            className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] text-xs px-4 py-2 font-bold shadow-md flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Batch Print ({mode === 'certificates' ? filteredResults.length : filteredParticipants.length})</span>
          </button>

          <div className="flex items-center space-x-2 bg-black/5 dark:bg-black/30 border border-slate-300 dark:border-white/10 p-1 rounded-full">
            <button
              onClick={() => setMode('certificates')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                mode === 'certificates' ? 'bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B]' : 'text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certificates</span>
            </button>
            <button
              onClick={() => setMode('idcards')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                mode === 'idcards' ? 'bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B]' : 'text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <IdCard className="w-3.5 h-3.5" />
              <span>ID Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Results', value: results.length, color: 'text-[#9E741D] dark:text-[#C8A86B]' },
          { label: 'Winners (1st–3rd)', value: results.filter(r => ['1st Place','2nd Place','3rd Place'].includes(r.position)).length, color: 'text-amber-700 dark:text-yellow-400' },
          { label: 'Total Delegates', value: participants.length, color: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Filtered Items', value: mode === 'certificates' ? filteredResults.length : filteredParticipants.length, color: 'text-blue-700 dark:text-blue-400' },
        ].map((s) => (
          <div key={s.label} className="luxury-glass p-4 rounded-[20px] border border-[#9E741D]/25 dark:border-white/10 text-center">
            <div className={`text-2xl font-black font-heading ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className="luxury-glass p-4 rounded-[20px] border border-[#9E741D]/25 dark:border-white/10 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or chest number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="hk-input pl-9 py-2"
          />
        </div>

        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="hk-select py-2 text-xs w-auto">
          <option value="All" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">All Groups</option>
          <option value="MAVADDA" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Mavadda</option>
          <option value="MAHABBA" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Mahabba</option>
        </select>

        {mode === 'certificates' && (
          <>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="hk-select py-2 text-xs w-auto">
              {categories.map((c) => <option key={c} value={c} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">{c === 'All' ? 'All Categories' : c}</option>)}
            </select>
            <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} className="hk-select py-2 text-xs w-auto">
              {positions.map((p) => <option key={p} value={p} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">{p === 'All' ? 'All Positions' : p}</option>)}
            </select>
          </>
        )}
      </div>

      {/* ============ CERTIFICATES MODE ============ */}
      {mode === 'certificates' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-slate-500 text-sm py-10 text-center font-mono">Loading results...</div>
          ) : filteredResults.length === 0 ? (
            <div className="luxury-glass p-10 rounded-[24px] text-center text-slate-500 text-sm">No results found matching filters.</div>
          ) : (
            <>
              {/* Preview Canvas */}
              {previewResult && (
                <div className="luxury-glass p-6 rounded-[24px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Certificate Preview</h3>
                    <button
                      onClick={() => setPreviewResult(null)}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-[#9E741D] dark:hover:text-[#C8A86B] underline"
                    >
                      ← Back to list
                    </button>
                  </div>
                  <div className="overflow-x-auto flex justify-center py-4">
                    <PrintableCertificate result={previewResult} />
                  </div>
                </div>
              )}

              {/* Results Table */}
              {!previewResult && (
                <div className="luxury-glass rounded-[24px] border border-[#9E741D]/25 dark:border-white/10 overflow-hidden shadow-luxury">
                  <div className="w-full overflow-x-auto whitespace-nowrap [webkit-overflow-scrolling:touch]">
                    <table className="hk-table">
                      <thead>
                        <tr>
                          <th>Chest No</th>
                          <th>Student Name</th>
                          <th>Programme</th>
                          <th>Category</th>
                          <th>Stage</th>
                          <th>Group</th>
                          <th>Position</th>
                          <th>Points</th>
                          <th className="text-center">Certificate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                        {filteredResults.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                            <td className="font-mono font-bold text-[#9E741D] dark:text-[#C8A86B]">{r.participant.chestNumber}</td>
                            <td className="font-semibold text-slate-900 dark:text-white font-serif">{r.participant.fullName}</td>
                            <td className="text-slate-700 dark:text-slate-300">{r.programme.name}</td>
                            <td className="text-slate-500 dark:text-slate-400">{r.programme.category}</td>
                            <td>
                              <span className="hk-badge-gold">
                                {r.programme.stage || '—'}
                              </span>
                            </td>
                            <td>
                              <span className={r.participant.group === 'MAVADDA' ? 'hk-badge-gold' : 'hk-badge-green'}>
                                {r.participant.group}
                              </span>
                            </td>
                            <td>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${POSITION_BADGE[r.position] || 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-slate-300'}`}>
                                {r.position}
                              </span>
                            </td>
                            <td className="font-bold text-slate-900 dark:text-white">{r.points}</td>
                            <td className="text-center">
                              <button
                                onClick={() => setPreviewResult(r)}
                                className="inline-flex items-center space-x-1.5 px-4 py-2 min-h-[44px] bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-[#C8A86B]/15 dark:border-[#C8A86B]/40 dark:text-[#C8A86B] rounded-lg text-xs font-bold hover:bg-[#9E741D] hover:text-white transition-all shadow-sm"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Preview &amp; Export</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============ ID CARDS MODE ============ */}
      {mode === 'idcards' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-slate-500 text-sm py-10 text-center font-mono">Loading delegates...</div>
          ) : filteredParticipants.length === 0 ? (
            <div className="luxury-glass p-10 rounded-[24px] text-center text-slate-500 text-sm">No delegates found.</div>
          ) : (
            <>
              {previewParticipant && (
                <div className="luxury-glass p-6 rounded-[24px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">ID Pass Preview</h3>
                    <button
                      onClick={() => setPreviewParticipant(null)}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-[#9E741D] dark:hover:text-[#C8A86B] underline"
                    >
                      ← Back to list
                    </button>
                  </div>
                  <div className="flex justify-center py-4">
                    <PrintableIDCard participant={previewParticipant} />
                  </div>
                </div>
              )}

              {!previewParticipant && (
                <div className="luxury-glass rounded-[24px] border border-[#9E741D]/25 dark:border-white/10 overflow-hidden shadow-luxury">
                  <div className="w-full overflow-x-auto whitespace-nowrap [webkit-overflow-scrolling:touch]">
                    <table className="hk-table">
                      <thead>
                        <tr>
                          <th>Reg ID</th>
                          <th>Chest No</th>
                          <th>Delegate Name</th>
                          <th>Category</th>
                          <th>House Group</th>
                          <th className="text-center">ID Card Pass</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                        {filteredParticipants.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                            <td className="font-mono text-slate-500 dark:text-slate-400">{p.registrationId}</td>
                            <td className="font-mono font-bold text-[#9E741D] dark:text-[#C8A86B]">{p.chestNumber}</td>
                            <td className="font-semibold text-slate-900 dark:text-white font-serif">{p.fullName}</td>
                            <td className="text-slate-600 dark:text-slate-300">{p.category}</td>
                            <td>
                              <span className={p.group === 'MAVADDA' ? 'hk-badge-gold' : 'hk-badge-green'}>
                                {p.group}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                onClick={() => setPreviewParticipant(p)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-[#C8A86B]/15 dark:border-[#C8A86B]/40 dark:text-[#C8A86B] rounded-lg text-[10px] font-bold hover:bg-[#9E741D] hover:text-white transition-all shadow-sm"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Generate ID Pass</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}
