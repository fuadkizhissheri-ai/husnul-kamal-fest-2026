'use client';

import React, { useState, useEffect } from 'react';
import { downloadPDFReport } from '@/lib/pdfExporter';
import { downloadCSVReport } from '@/lib/csvExporter';
import { downloadOfficialCircularPDF } from '@/lib/circularPdfExporter';
import { Bell, Plus, Edit3, Trash2, Download, Search, Printer, FileSpreadsheet, X, FileText, UserCheck, ShieldAlert } from 'lucide-react';

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  categoryBadge: string;
  refNumber?: string | null;
  coordinator1Name?: string | null;
  coordinator1Designation?: string | null;
  coordinator2Name?: string | null;
  coordinator2Designation?: string | null;
  signatoryOption?: string | null;
  coordinatorName?: string | null;
  coordinatorDesignation?: string | null;
  pdfUrl?: string | null;
  publishedAt: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryBadge, setCategoryBadge] = useState('Fest News');
  const [refNumber, setRefNumber] = useState('');
  
  // Dual Coordinators
  const [signatoryOption, setSignatoryOption] = useState<'BOTH' | 'COORD1' | 'COORD2'>('BOTH');
  const [coordinator1Name, setCoordinator1Name] = useState('FUAD JALALI');
  const [coordinator1Designation, setCoordinator1Designation] = useState('Fest Convenor');
  const [coordinator2Name, setCoordinator2Name] = useState('MIDLAJ ROSHAN KAMALI');
  const [coordinator2Designation, setCoordinator2Designation] = useState('Coordinator');

  const fetchAnnouncements = () => {
    setLoading(true);
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (data.announcements) setAnnouncements(data.announcements);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const badges = ['ALL', 'Fest News', 'Schedule Update', 'Rules', 'Results'];

  const filtered = announcements.filter((item) => {
    const matchesBadge = selectedBadge === 'ALL' || item.categoryBadge === selectedBadge;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.refNumber && item.refNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBadge && matchesSearch;
  });

  const handleOpenModal = (item?: AnnouncementItem) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setBody(item.body);
      setCategoryBadge(item.categoryBadge);
      setRefNumber(item.refNumber || '');
      setSignatoryOption((item.signatoryOption as any) || 'BOTH');
      setCoordinator1Name(item.coordinator1Name || 'FUAD JALALI');
      setCoordinator1Designation(item.coordinator1Designation || 'Fest Convenor');
      setCoordinator2Name(item.coordinator2Name || 'MIDLAJ ROSHAN KAMALI');
      setCoordinator2Designation(item.coordinator2Designation || 'Coordinator');
    } else {
      setEditingItem(null);
      setTitle('');
      setBody('');
      setCategoryBadge('Fest News');
      setRefNumber(`HK/2026/CIR-${String(announcements.length + 1).padStart(3, '0')}`);
      setSignatoryOption('BOTH');
      setCoordinator1Name('FUAD JALALI');
      setCoordinator1Designation('Fest Convenor');
      setCoordinator2Name('MIDLAJ ROSHAN KAMALI');
      setCoordinator2Designation('Coordinator');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingItem?.id,
      title,
      body,
      categoryBadge,
      refNumber,
      signatoryOption,
      coordinator1Name,
      coordinator1Designation,
      coordinator2Name,
      coordinator2Designation,
    };

    const method = editingItem ? 'PUT' : 'POST';
    await fetch('/api/announcements', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setIsModalOpen(false);
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
    setConfirmDeleteId(null);
    fetchAnnouncements();
  };

  // Exporters
  const handleExportPDF = () => {
    const headers = ['Ref No', 'Title', 'Category Badge', 'Published Date', 'Content Snippet'];
    const rows = filtered.map((a) => [
      a.refNumber || 'N/A',
      a.title,
      a.categoryBadge,
      new Date(a.publishedAt).toLocaleDateString(),
      a.body.slice(0, 80) + '...',
    ]);
    downloadPDFReport('Official Announcements & Circulars Report', headers, rows, 'Husnul_Kamal_Announcements.pdf');
  };

  const handleExportCSV = () => {
    const headers = ['Ref No', 'Title', 'Category Badge', 'Published Date', 'Body Text', 'Coordinators'];
    const rows = filtered.map((a) => [
      a.refNumber || 'N/A',
      a.title,
      a.categoryBadge,
      new Date(a.publishedAt).toLocaleDateString(),
      a.body,
      'FUAD JALALI & MIDLAJ ROSHAN KAMALI',
    ]);
    downloadCSVReport('Husnul_Kamal_Announcements', headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">Announcements Manager</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">Publish news circulars, export official dual-signed PDFs (Fuad Jalali & Midlaj Roshan Kamali), and manage announcements.</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-xs px-4 py-2 flex items-center space-x-1.5 shadow-lg hover:bg-[#9E741D]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Announcement</span>
        </button>
      </div>

      {/* FILTER PANEL BEFORE DOWNLOAD */}
      <div className="luxury-glass p-5 rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 shadow-luxury space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search circular title or ref no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hk-input pl-11"
            />
          </div>

          <select
            value={selectedBadge}
            onChange={(e) => setSelectedBadge(e.target.value)}
            className="hk-select"
          >
            {badges.map((b) => (
              <option key={b} value={b} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Badge: {b}</option>
            ))}
          </select>

          {/* Export Action Buttons */}
          <div className="flex items-center space-x-2 sm:col-span-2">
            <button
              onClick={handleExportPDF}
              className="flex-1 btn-pill-luxury bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-[#C8A86B]/20 dark:text-[#C8A86B] dark:border-[#C8A86B]/40 text-xs px-3 py-2.5 font-bold"
              title="Download Filtered PDF Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Report</span>
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

      {/* ANNOUNCEMENTS GRID */}
      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading announcements...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <div key={item.id} className="luxury-glass p-6 rounded-[28px] border border-[#9E741D]/25 dark:border-[#C8A86B]/30 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="hk-badge-gold">
                    {item.categoryBadge}
                  </span>
                  <span className="text-[11px] font-mono text-[#9E741D] dark:text-[#C8A86B] font-bold">
                    {item.refNumber || 'HK/2026/CIR'}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed line-clamp-3">{item.body}</p>

                <div className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 pt-1 flex items-center justify-between">
                  <span>Signatories: {item.coordinator1Name || 'FUAD JALALI'} & {item.coordinator2Name || 'MIDLAJ ROSHAN KAMALI'}</span>
                  <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* ACTION BUTTONS (DOWNLOAD DUAL-SIGNED OFFICIAL CIRCULAR PDF) */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <button
                  onClick={() => downloadOfficialCircularPDF(item)}
                  className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] text-xs px-3.5 py-1.5 font-bold flex items-center space-x-1.5 shadow-md hover:bg-[#9E741D]"
                  title="Download Dual-Signed Letterhead Circular (PDF)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Dual Circular PDF</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass p-6 rounded-[32px] border border-[#C8A86B]/30 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-serif text-white">
                {editingItem ? 'Edit Dual-Signed Circular' : 'New Official Circular'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Circular Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                  placeholder="e.g. Notice Regarding Stage Schedule Change"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none font-mono"
                    placeholder="HK/2026/CIR-001"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category Badge</label>
                  <select
                    value={categoryBadge}
                    onChange={(e) => setCategoryBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Fest News" className="bg-slate-900 text-white">Fest News</option>
                    <option value="Schedule Update" className="bg-slate-900 text-white">Schedule Update</option>
                    <option value="Rules" className="bg-slate-900 text-white">Rules</option>
                    <option value="Results" className="bg-slate-900 text-white">Results</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Announcement Body Text *</label>
                <textarea
                  rows={4}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                  placeholder="Type official circular message body here..."
                />
              </div>

              {/* DUAL SIGNATORY SELECTION */}
              <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="block text-[#C8A86B] font-bold">Select Official Signatories for PDF</label>

                <div className="flex items-center space-x-4 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-white">
                    <input
                      type="radio"
                      name="signatory"
                      checked={signatoryOption === 'BOTH'}
                      onChange={() => setSignatoryOption('BOTH')}
                      className="accent-[#C8A86B]"
                    />
                    <span>Both Coordinators (Dual Column)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-white">
                    <input
                      type="radio"
                      name="signatory"
                      checked={signatoryOption === 'COORD1'}
                      onChange={() => setSignatoryOption('COORD1')}
                      className="accent-[#C8A86B]"
                    />
                    <span>Fuad Jalali Only</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-white">
                    <input
                      type="radio"
                      name="signatory"
                      checked={signatoryOption === 'COORD2'}
                      onChange={() => setSignatoryOption('COORD2')}
                      className="accent-[#C8A86B]"
                    />
                    <span>Midlaj Roshan Only</span>
                  </label>
                </div>
              </div>

              {/* COORDINATOR 1 DETAILS */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Coordinator 1 Name</label>
                  <input
                    type="text"
                    value={coordinator1Name}
                    onChange={(e) => setCoordinator1Name(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Coordinator 1 Designation</label>
                  <input
                    type="text"
                    value={coordinator1Designation}
                    onChange={(e) => setCoordinator1Designation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* COORDINATOR 2 DETAILS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Coordinator 2 Name</label>
                  <input
                    type="text"
                    value={coordinator2Name}
                    onChange={(e) => setCoordinator2Name(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Coordinator 2 Designation</label>
                  <input
                    type="text"
                    value={coordinator2Designation}
                    onChange={(e) => setCoordinator2Designation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#C8A86B] text-slate-950 font-bold rounded-xl mt-2">
                Publish & Save Circular
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass p-6 rounded-[32px] border border-rose-500/40 max-w-sm w-full space-y-4 text-center">
            <h3 className="text-lg font-bold font-serif text-white">Delete Circular?</h3>
            <p className="text-xs text-slate-400">Are you sure you want to delete this announcement?</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="py-2 bg-white/10 text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
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
