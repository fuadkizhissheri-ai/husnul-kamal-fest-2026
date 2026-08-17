'use client';

import React, { useState, useEffect } from 'react';
import { downloadPDFReport } from '@/lib/pdfExporter';
import { downloadCSVReport } from '@/lib/csvExporter';
import PrintableCertificate from '@/components/PrintableCertificate';
import { Trophy, Plus, Edit3, Trash2, Download, Search, Printer, FileSpreadsheet, X, Medal, Sparkles, Award, Eye, EyeOff } from 'lucide-react';
import { calculateAutoPoints, PointsSettings, DEFAULT_POINTS_SETTINGS } from '@/lib/scoring';

interface ResultItem {
  id: string;
  position: string;
  points: number;
  certificateGenerated: boolean;
  isPublished: boolean;
  programme: {
    id: string;
    name: string;
    category: string;
    stage: string;
    isGroup?: boolean;
  };
  participant: {
    id: string;
    fullName: string;
    chestNumber: string;
    registrationId: string;
    group: string;
    category: string;
    madrasa?: string;
  };
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [pointsSettings, setPointsSettings] = useState<PointsSettings>(DEFAULT_POINTS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters Before Export
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedPosition, setSelectedPosition] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResultItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeCertResult, setActiveCertResult] = useState<ResultItem | null>(null);

  // Form Fields
  const [modalCategory, setModalCategory] = useState('ALL');
  const [programmeId, setProgrammeId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [position, setPosition] = useState('1st Place');
  const [points, setPoints] = useState(10);

  const fetchResults = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/results?all=true').then((r) => r.json()),
      fetch('/api/programmes').then((r) => r.json()),
      fetch('/api/participants').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([resData, progData, partData, setData]) => {
        if (resData.results) setResults(resData.results);
        if (progData.programmes) setProgrammes(progData.programmes);
        if (partData.participants) setParticipants(partData.participants);
        if (setData?.settings?.points_settings) {
          try {
            const parsed = JSON.parse(setData.settings.points_settings);
            setPointsSettings(parsed);
          } catch (e) {
            console.error('Failed to parse points_settings:', e);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const categories = ['ALL', 'Sub Junior', 'Junior', 'Senior', 'Super Senior'];
  const groups = ['ALL', 'MAVADDA', 'MAHABBA'];
  const positions = ['ALL', '1st Place', '2nd Place', '3rd Place', 'Grade A', 'Grade B', 'Participation'];

  const filteredResults = results.filter((r) => {
    if (!r.programme || !r.participant) return false;
    const matchesCategory = selectedCategory === 'ALL' || r.programme?.category === selectedCategory;
    const matchesGroup = selectedGroup === 'ALL' || r.participant?.group === selectedGroup;
    const matchesPosition = selectedPosition === 'ALL' || r.position?.includes(selectedPosition);
    const matchesSearch =
      (r.participant?.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.participant?.chestNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.programme?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesGroup && matchesPosition && matchesSearch;
  });

  const eligibleParticipants = participants.filter((p) =>
    p.registrations?.some((r: any) => r.programmeId === programmeId)
  );

  const eligibleProgrammes = programmes.filter(
    (p) => modalCategory === 'ALL' || p.category === modalCategory || p.category === 'General'
  );

  const handleModalCategoryChange = (newCat: string) => {
    setModalCategory(newCat);
    setProgrammeId('');
    setParticipantId('');
    setPoints(0);
  };

  // Auto-calculate points when programme or position changes
  const handlePositionOrProgChange = (newProgId: string, newPos: string) => {
    if (newProgId !== programmeId) {
      setParticipantId(''); // Reset participant when programme changes
    }
    setProgrammeId(newProgId);
    setPosition(newPos);

    const selectedProg = programmes.find((p) => p.id === newProgId);
    if (selectedProg) {
      const autoPts = calculateAutoPoints(selectedProg, newPos, pointsSettings);
      setPoints(autoPts);
    }
  };

  const handleOpenModal = (item?: ResultItem) => {
    if (item) {
      setEditingItem(item);
      setModalCategory(item.programme.category);
      setProgrammeId(item.programme.id);
      setParticipantId(item.participant.id);
      setPosition(item.position);
      setPoints(item.points);
    } else {
      setEditingItem(null);
      setModalCategory('ALL');
      setProgrammeId('');
      setParticipantId('');
      setPosition('1st Place');
      setPoints(0);
    }
    setIsModalOpen(true);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingItem?.id,
      programmeId,
      participantId,
      position,
      points,
    };

    const method = editingItem ? 'PUT' : 'POST';
    await fetch('/api/results', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setIsModalOpen(false);
    fetchResults();
  };

  const handleDeleteResult = async (id: string) => {
    await fetch(`/api/results?id=${id}`, { method: 'DELETE' });
    setConfirmDeleteId(null);
    fetchResults();
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setResults(prev => prev.map(r => r.id === id ? { ...r, isPublished: !currentStatus } : r));
    
    try {
      const res = await fetch(`/api/admin/results/${id}/toggle-publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus })
      });
      if (res.ok) {
        showToast(!currentStatus ? 'Result published successfully!' : 'Result hidden successfully!');
      } else {
        // Revert on failure
        setResults(prev => prev.map(r => r.id === id ? { ...r, isPublished: currentStatus } : r));
        showToast('Failed to update publish status.');
      }
    } catch (error) {
      // Revert on error
      setResults(prev => prev.map(r => r.id === id ? { ...r, isPublished: currentStatus } : r));
      showToast('Error updating publish status.');
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Exporters
  const handleExportPDF = () => {
    const headers = ['Position', 'Delegate Name', 'Chest No', 'House Group', 'Programme', 'Category', 'Points'];
    const rows = filteredResults.map((r) => [
      r.position,
      r.participant?.fullName || 'N/A',
      r.participant?.chestNumber || 'N/A',
      r.participant?.group || 'N/A',
      r.programme?.name || 'N/A',
      r.programme?.category || 'N/A',
      r.points,
    ]);
    downloadPDFReport('Official Scoreboard & Results Report', headers, rows, 'Husnul_Kamal_Results.pdf');
  };

  const handleExportCSV = () => {
    const headers = ['Position', 'Delegate Name', 'Chest No', 'House Group', 'Madrasa', 'Programme', 'Category', 'Points'];
    const rows = filteredResults.map((r) => [
      r.position,
      r.participant?.fullName || 'N/A',
      r.participant?.chestNumber || 'N/A',
      r.participant?.group || 'N/A',
      r.participant?.madrasa || 'Mifthahul Uloom Central',
      r.programme?.name || 'N/A',
      r.programme?.category || 'N/A',
      r.points,
    ]);
    downloadCSVReport('Husnul_Kamal_Results', headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-[#C8A86B]" />
            <span>Results &amp; Scoreboard Manager</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Publish winner scores, auto-calculate points per position, generate merit certificates, and export official reports.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-xs px-4 py-2 flex items-center space-x-1.5 shadow-lg hover:bg-[#9E741D]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Result</span>
        </button>
      </div>

      {/* FILTER PANEL BEFORE DOWNLOAD */}
      <div className="luxury-glass p-5 rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 shadow-luxury space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search delegate or programme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-full bg-white dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">
                Category: {c === 'Sub Junior' ? 'Sub Junior (Classes 3, 4)' : c === 'Junior' ? 'Junior (Classes 5, 6)' : c === 'Senior' ? 'Senior (Classes 7, 8)' : c === 'Super Senior' ? 'Super Senior (Classes 9-12)' : c}
              </option>
            ))}
          </select>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-4 py-2.5 rounded-full bg-white dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            {groups.map((g) => (
              <option key={g} value={g} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">House: {g}</option>
            ))}
          </select>

          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-4 py-2.5 rounded-full bg-white dark:bg-white/10 border border-slate-300 dark:border-[#C8A86B]/30 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            {positions.map((p) => (
              <option key={p} value={p} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Position: {p}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPDF}
              className="flex-1 btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-white dark:text-[#0B0B0B] font-bold text-xs py-2.5 flex items-center justify-center space-x-1 shadow"
              title="Download PDF Scoreboard"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 btn-pill-luxury bg-white/10 text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 font-bold text-xs py-2.5 flex items-center justify-center space-x-1"
              title="Export CSV Data"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* RESULTS TABLE */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading results...</div>
      ) : (
        <div className="luxury-glass rounded-[28px] overflow-hidden border border-[#9E741D]/25 dark:border-[#C8A86B]/30 shadow-luxury">
          <div className="w-full overflow-x-auto whitespace-nowrap [webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#18181B] text-[#F5E6C4] dark:bg-[#0B0B0B] dark:text-[#C8A86B] font-mono text-[11px] uppercase tracking-wider border-b border-[#9E741D]/20">
                  <th className="py-4 px-6 font-bold text-left w-[12%]">Position</th>
                  <th className="py-4 px-6 font-bold text-left w-[18%]">Delegate Name</th>
                  <th className="py-4 px-6 font-bold text-left w-[10%]">Chest No.</th>
                  <th className="py-4 px-6 font-bold text-left w-[12%]">House Group</th>
                  <th className="py-4 px-6 font-bold text-left w-[16%]">Programme Name</th>
                  <th className="py-4 px-6 font-bold text-left w-[10%]">Category</th>
                  <th className="py-4 px-6 font-bold text-center w-[8%]">Points</th>
                  <th className="py-4 px-6 font-bold text-center w-[8%]">Status</th>
                  <th className="py-4 px-6 font-bold text-right w-[16%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-800 dark:text-slate-200 font-sans">
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors align-middle">
                    <td className="py-4 px-6 font-bold font-serif align-middle">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold ${
                        r.position.includes('1st')
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                          : r.position.includes('2nd')
                          ? 'bg-slate-400/20 text-slate-700 dark:text-slate-300 border border-slate-400/40'
                          : r.position.includes('3rd')
                          ? 'bg-amber-700/20 text-amber-900 dark:text-amber-400 border border-amber-700/40'
                          : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                      }`}>
                        <Medal className="w-3.5 h-3.5 shrink-0" />
                        <span>{r.position}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold font-serif text-slate-900 dark:text-white align-middle">
                      {r.participant?.fullName}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-[#9E741D] dark:text-[#C8A86B] align-middle">
                      {r.participant?.chestNumber}
                    </td>
                    <td className="py-4 px-6 font-mono align-middle">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.participant?.group === 'MAVADDA'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        {r.participant?.group}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium align-middle">{r.programme?.name}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 align-middle">{r.programme?.category}</td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm align-middle">
                      +{r.points}
                    </td>
                    <td className="py-4 px-6 text-center align-middle">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${r.isPublished ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/40'}`}>
                        {r.isPublished ? 'PUBLISHED' : 'HIDDEN'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => togglePublish(r.id, r.isPublished)}
                          className={`w-11 h-11 flex items-center justify-center rounded-lg ${r.isPublished ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 dark:text-slate-400'}`}
                          title={r.isPublished ? "Hide Result" : "Publish Result"}
                        >
                          {r.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setActiveCertResult(r)}
                          className="px-3 py-2 min-h-[44px] rounded-lg bg-[#C8A86B]/20 text-[#9E741D] dark:text-[#C8A86B] font-bold text-xs hover:bg-[#C8A86B]/30 flex items-center space-x-1.5"
                          title="Generate Certificate"
                        >
                          <Award className="w-4 h-4" />
                          <span>Certificate</span>
                        </button>
                        <button
                          onClick={() => handleOpenModal(r)}
                          className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white"
                          title="Edit Result"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="w-11 h-11 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                          title="Delete Result"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT RESULT MODAL WITH AUTO POINTS CALCULATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="luxury-glass max-w-md w-full p-6 rounded-[28px] border border-[#C8A86B]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-serif text-[#C8A86B]">
                {editingItem ? 'Edit Result' : 'Publish Result Entry'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResult} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Category Filter</label>
                <select
                  value={modalCategory}
                  onChange={(e) => handleModalCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none"
                >
                  <option value="ALL" className="bg-slate-900 text-white">All Categories</option>
                  <option value="Sub Junior" className="bg-slate-900 text-white">Sub Junior</option>
                  <option value="Junior" className="bg-slate-900 text-white">Junior</option>
                  <option value="Senior" className="bg-slate-900 text-white">Senior</option>
                  <option value="Super Senior" className="bg-slate-900 text-white">Super Senior</option>
                  <option value="General" className="bg-slate-900 text-white">General</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Programme *</label>
                <select
                  value={programmeId}
                  onChange={(e) => handlePositionOrProgChange(e.target.value, position)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none"
                >
                  <option value="" disabled className="bg-slate-900 text-white">
                    {eligibleProgrammes.length === 0 ? 'No programmes found' : 'Select a Programme'}
                  </option>
                  {eligibleProgrammes.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name} ({p.category}) — {p.isGroup ? 'Group Item' : 'Single Item'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Participant Delegate *</label>
                <select
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  disabled={!programmeId || eligibleParticipants.length === 0}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none disabled:opacity-50"
                >
                  <option value="" disabled className="bg-slate-900 text-white">
                    {!programmeId 
                      ? 'Please select a programme first' 
                      : eligibleParticipants.length === 0 
                      ? 'No participants registered for this programme' 
                      : 'Select Participant'}
                  </option>
                  {eligibleParticipants.map((part) => (
                    <option key={part.id} value={part.id} className="bg-slate-900 text-white">
                      [{part.chestNumber}] {part.fullName} ({part.group} • {part.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Position Achieved *</label>
                  <select
                    value={position}
                    onChange={(e) => handlePositionOrProgChange(programmeId, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none"
                  >
                    <option value="1st Place" className="bg-slate-900 text-white">1st Place</option>
                    <option value="2nd Place" className="bg-slate-900 text-white">2nd Place</option>
                    <option value="3rd Place" className="bg-slate-900 text-white">3rd Place</option>
                    <option value="Grade A" className="bg-slate-900 text-white">Grade A</option>
                    <option value="Grade B" className="bg-slate-900 text-white">Grade B</option>
                    <option value="Participation" className="bg-slate-900 text-white">Participation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Auto Points (Editable)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-white/5 p-2.5 rounded-xl border border-white/10">
                ⚡ Points auto-populated based on Programme Type &amp; Position. You can manually adjust for exceptions.
              </div>

              <button
                type="submit"
                className="w-full btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-sm py-3 shadow-lg hover:bg-[#B8943A]"
              >
                Save &amp; Publish Result Score
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass p-6 rounded-[32px] border border-rose-500/40 max-w-sm w-full space-y-4 text-center">
            <h3 className="text-lg font-bold font-serif text-white">Delete Result?</h3>
            <p className="text-xs text-slate-400">Are you sure you want to delete this result entry? Scoreboards will re-calculate live.</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="py-2 bg-white/10 text-[#C8A86B] rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteResult(confirmDeleteId)}
                className="py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {activeCertResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full luxury-glass p-8 rounded-[32px] border border-[#C8A86B]/40 shadow-2xl flex flex-col items-center space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveCertResult(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold font-serif text-[#C8A86B]">Official Merit Certificate</h3>
            <PrintableCertificate result={activeCertResult} />
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#C8A86B] text-[#0B0B0B] font-bold px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 z-[100] flex items-center space-x-2">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
