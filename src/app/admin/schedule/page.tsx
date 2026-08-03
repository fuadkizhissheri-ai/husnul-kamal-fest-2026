'use client';

import React, { useState, useEffect } from 'react';
import { downloadPDFReport } from '@/lib/pdfExporter';
import { downloadCSVReport } from '@/lib/csvExporter';
import { FIXED_STAGES, getStageInfo, checkDoubleBooking } from '@/lib/stages';
import { Calendar, Plus, Edit3, Trash2, Download, Search, Printer, FileSpreadsheet, X, MapPin, Clock, AlertTriangle } from 'lucide-react';

interface ScheduleItem {
  id: string;
  programmeId: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  programme: {
    name: string;
    category: string;
  };
}

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters Before Export
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [doubleBookingError, setDoubleBookingError] = useState<string | null>(null);

  // Form Fields
  const [programmeId, setProgrammeId] = useState('');
  const [stage, setStage] = useState('Aura');
  const [date, setDate] = useState('2026-09-15');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [status, setStatus] = useState('UPCOMING');

  const fetchSchedules = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/schedule').then((r) => r.json()),
      fetch('/api/programmes').then((r) => r.json()),
    ])
      .then(([schData, progData]) => {
        if (schData.schedules) setSchedules(schData.schedules);
        if (progData.programmes) setProgrammes(progData.programmes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const categories = ['ALL', 'Sub Junior', 'Junior', 'Senior', 'Super Senior', 'General'];
  const statuses = ['ALL', 'LIVE', 'UPCOMING', 'COMPLETED'];

  const filteredSchedules = schedules.filter((s) => {
    const matchesStage = selectedStageFilter === 'ALL' || s.stage.toLowerCase() === selectedStageFilter.toLowerCase();
    const matchesCategory = selectedCategory === 'ALL' || s.programme?.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    const matchesSearch =
      s.programme?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.stage.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStage && matchesCategory && matchesStatus && matchesSearch;
  });

  const handleOpenModal = (item?: ScheduleItem) => {
    setDoubleBookingError(null);
    if (item) {
      setEditingItem(item);
      setProgrammeId(item.programmeId);
      setStage(item.stage);
      setDate(item.date);
      setStartTime(item.startTime);
      setEndTime(item.endTime);
      setStatus(item.status);
    } else {
      setEditingItem(null);
      setProgrammeId(programmes[0]?.id || '');
      setStage('Aura');
      setDate('2026-09-15');
      setStartTime('09:00 AM');
      setEndTime('11:00 AM');
      setStatus('UPCOMING');
    }
    setIsModalOpen(true);
  };

  const handleCycleStatus = async (item: ScheduleItem) => {
    const sequence: Record<string, string> = {
      UPCOMING: 'LIVE',
      LIVE: 'COMPLETED',
      COMPLETED: 'UPCOMING',
    };
    const nextStatus = sequence[item.status.toUpperCase()] || 'UPCOMING';

    if (nextStatus === 'LIVE') {
      const existingLiveSameStage = schedules.find(
        (s) => s.id !== item.id && s.stage.toLowerCase() === item.stage.toLowerCase() && s.status.toUpperCase() === 'LIVE'
      );
      if (existingLiveSameStage) {
        const confirmOverride = window.confirm(
          `STAGE CONFLICT WARNING: "${existingLiveSameStage.programme?.name}" is currently marked LIVE on ${item.stage} Stage. Do you want to mark this programme LIVE as well?`
        );
        if (!confirmOverride) return;
      }
    }

    await fetch('/api/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        programmeId: item.programmeId,
        stage: item.stage,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        status: nextStatus,
      }),
    });

    fetchSchedules();
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoubleBookingError(null);

    // Validate Double Booking
    const isConflict = checkDoubleBooking(schedules, stage, date, startTime, editingItem?.id);
    if (isConflict) {
      setDoubleBookingError(`DOUBLE-BOOKING WARNING: Another programme is already scheduled on ${stage} Stage on ${date} at ${startTime}. Please select a different stage or timing.`);
      return;
    }

    const payload = {
      id: editingItem?.id,
      programmeId,
      stage,
      date,
      startTime,
      endTime,
      status,
    };

    const method = editingItem ? 'PUT' : 'POST';
    await fetch('/api/schedule', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setIsModalOpen(false);
    fetchSchedules();
  };

  const handleDeleteSchedule = async (id: string) => {
    await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
    setConfirmDeleteId(null);
    fetchSchedules();
  };

  // Exporters
  const handleExportPDF = () => {
    const headers = ['Stage Venue', 'Programme Name', 'Category', 'Date', 'Time Slot', 'Status'];
    const rows = filteredSchedules.map((s) => [
      s.stage,
      s.programme?.name || 'N/A',
      s.programme?.category || 'N/A',
      s.date,
      `${s.startTime} - ${s.endTime}`,
      s.status,
    ]);
    downloadPDFReport('Official Stage Schedule & Itinerary', headers, rows, 'Husnul_Kamal_Schedule.pdf');
  };

  const handleExportCSV = () => {
    const headers = ['Stage Venue', 'Programme Name', 'Category', 'Date', 'Start Time', 'End Time', 'Status'];
    const rows = filteredSchedules.map((s) => [
      s.stage,
      s.programme?.name || 'N/A',
      s.programme?.category || 'N/A',
      s.date,
      s.startTime,
      s.endTime,
      s.status,
    ]);
    downloadCSVReport('Husnul_Kamal_Schedule', headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">Schedule Manager</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">Manage stage timings (Aura, Legacy, Lumina, Zenith), prevent double bookings, and export filtered itineraries.</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-xs px-4 py-2 flex items-center space-x-1.5 shadow-lg hover:bg-[#9E741D]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Schedule Entry</span>
        </button>
      </div>

      {/* FILTER PANEL BEFORE DOWNLOAD */}
      <div className="luxury-glass p-5 rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 shadow-luxury space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search programme or stage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hk-input pl-11"
            />
          </div>

          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="hk-select"
          >
            <option value="ALL" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Stage: All Stages</option>
            {FIXED_STAGES.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Stage: {s.label}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="hk-select"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Category: {c}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="hk-select"
          >
            {statuses.map((st) => (
              <option key={st} value={st} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Status: {st}</option>
            ))}
          </select>

          {/* Export Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPDF}
              className="flex-1 btn-pill-luxury bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-[#C8A86B]/20 dark:text-[#C8A86B] dark:border-[#C8A86B]/40 text-xs px-3 py-2.5 font-bold"
              title="Download Filtered PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex-1 btn-pill-luxury bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 text-xs px-3 py-2.5 font-bold"
              title="Export as CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-pill-luxury bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-300 dark:border-white/20 text-xs px-3 py-2.5 font-bold"
              title="Print Table"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SCHEDULE TABLE */}
      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading schedule...</div>
      ) : (
        <div className="luxury-glass rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 overflow-hidden shadow-luxury">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-black/40 text-[#9E741D] dark:text-[#C8A86B] font-bold uppercase tracking-wider border-b-2 border-[#9E741D]/30 dark:border-white/10">
                <th className="py-4 px-6 text-[#9E741D] dark:text-[#C8A86B]">Stage Venue</th>
                <th className="py-4 px-6 text-[#9E741D] dark:text-[#C8A86B]">Status</th>
                <th className="py-4 px-6 text-[#9E741D] dark:text-[#C8A86B]">Programme</th>
                <th className="py-4 px-6 text-[#9E741D] dark:text-[#C8A86B]">Category</th>
                <th className="py-4 px-6 text-[#9E741D] dark:text-[#C8A86B]">Timing</th>
                <th className="py-4 px-6 text-right text-[#9E741D] dark:text-[#C8A86B]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-900 dark:text-white">
              {filteredSchedules.map((s) => {
                const stageInfo = getStageInfo(s.stage);
                return (
                  <tr key={s.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-bold">
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-mono font-extrabold ${stageInfo.badgeClass}`}>
                        {stageInfo.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold">
                      <button
                        onClick={() => handleCycleStatus(s)}
                        title="Click to toggle status: Upcoming → Live → Completed"
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase font-mono transition-all flex items-center space-x-1.5 cursor-pointer shadow-md border ${
                          s.status.toUpperCase() === 'LIVE'
                            ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/50 animate-pulse hover:bg-rose-200 dark:hover:bg-rose-500/30'
                            : s.status.toUpperCase() === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                            : 'bg-[#F5E6C4] text-[#7A5600] border-[#E5C578] dark:bg-[#C8A86B]/20 dark:text-[#C8A86B] dark:border-[#C8A86B]/40 hover:bg-[#9E741D] hover:text-white'
                        }`}
                      >
                        {s.status.toUpperCase() === 'LIVE' && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
                        <span>{s.status}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 font-bold text-sm font-serif text-slate-900 dark:text-white">{s.programme?.name}</td>
                    <td className="py-4 px-6 font-mono text-[#9E741D] dark:text-[#C8A86B] font-bold">{s.programme?.category}</td>
                    <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-400">{s.startTime} - {s.endTime}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(s)}
                          className="p-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white rounded-lg"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(s.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass p-6 rounded-[32px] border border-[#C8A86B]/30 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-serif text-white">
                {editingItem ? 'Edit Schedule Entry' : 'Add Schedule Entry'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {doubleBookingError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <span>{doubleBookingError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Programme</label>
                <select
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Stage Venue</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  {FIXED_STAGES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.label} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                    placeholder="09:00 AM"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                    placeholder="11:00 AM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  <option value="UPCOMING" className="bg-slate-900 text-white">UPCOMING</option>
                  <option value="LIVE" className="bg-slate-900 text-white">LIVE NOW</option>
                  <option value="COMPLETED" className="bg-slate-900 text-white">COMPLETED</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#C8A86B] text-slate-950 font-bold rounded-xl mt-2">
                Save Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass p-6 rounded-[32px] border border-rose-500/40 max-w-sm w-full space-y-4 text-center">
            <h3 className="text-lg font-bold font-serif text-white">Delete Schedule Entry?</h3>
            <p className="text-xs text-slate-400">Are you sure you want to delete this schedule entry?</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="py-2 bg-white/10 text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSchedule(confirmDeleteId)}
                className="py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
