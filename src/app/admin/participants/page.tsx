'use client';

import React, { useState, useEffect } from 'react';
import PrintableIDCard from '@/components/PrintableIDCard';
import { downloadPDFReport } from '@/lib/pdfExporter';
import { Users, Search, Download, Trash2, Edit, X, ShieldCheck, Sparkles, MessageCircle, AlertCircle, Save, Upload, Loader2 } from 'lucide-react';
import TableSkeleton from '@/components/TableSkeleton';
import { useDebounce } from '@/hooks/useDebounce';

interface Participant {
  id: string;
  registrationId: string;
  chestNumber: string;
  fullName: string;
  group: string;
  category: string;
  gender: string;
  dob: string;
  whatsapp: string;
  madrasa?: string;
  photoUrl?: string | null;
  registrations: any[];
}

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Available Programmes for Edit
  const [programmes, setProgrammes] = useState<any[]>([]);

  // Modal States
  const [activeIDCardParticipant, setActiveIDCardParticipant] = useState<Participant | null>(null);
  const [editParticipant, setEditParticipant] = useState<Participant | null>(null);
  const [sendingWaId, setSendingWaId] = useState<string | null>(null);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editChestNumber, setEditChestNumber] = useState('');
  const [editGroup, setEditGroup] = useState('MAVADDA');
  const [editCategory, setEditCategory] = useState('Sub Junior');
  const [editGender, setEditGender] = useState('Male');
  const [editDob, setEditDob] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editMadrasa, setEditMadrasa] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editProgrammeIds, setEditProgrammeIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editingProgrammes, setEditingProgrammes] = useState<boolean>(false);
  
  // Bulk Upload State
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkUploadRows, setBulkUploadRows] = useState<any[]>([]);
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchParticipants = async () => {
    setLoading(true);
    fetch('/api/participants')
      .then((res) => res.json())
      .then((data) => {
        if (data.participants) setParticipants(data.participants);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchProgrammes = () => {
    fetch('/api/programmes')
      .then((res) => res.json())
      .then((data) => {
        if (data.programmes) setProgrammes(data.programmes);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchParticipants();
    fetchProgrammes();
  }, []);

  const handleSendWhatsAppConfirmation = async (participantId: string, studentName: string) => {
    setSendingWaId(participantId);
    try {
      const res = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`WhatsApp confirmation message sent successfully to ${studentName}! (Provider: ${data.method})`);
      } else {
        alert(`WhatsApp notification dispatch status for ${studentName}:\n${data.info || data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to send WhatsApp message: ${err.message}`);
    } finally {
      setSendingWaId(null);
    }
  };

  const openEditModal = (p: Participant) => {
    setEditParticipant(p);
    setEditName(p.fullName);
    setEditChestNumber(p.chestNumber);
    setEditGroup(p.group);
    setEditCategory(p.category);
    setEditGender(p.gender || 'Male');
    setEditDob(p.dob || '');
    setEditWhatsapp(p.whatsapp || '');
    setEditMadrasa(p.madrasa || 'Mifthahul Uloom Madrasa');
    setEditPhotoUrl(p.photoUrl || '');
    setEditProgrammeIds(p.registrations ? p.registrations.map((r) => r.programmeId || r.programme?.id) : []);
    setEditError('');
  };

  const handleFileUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setEditPhotoUrl(data.url);
      } else {
        alert(data.error || 'Photo upload failed');
      }
    } catch (e: any) {
      alert(`Upload error: ${e.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editParticipant) return;
    setSavingEdit(true);
    setEditError('');

    // Warn if Group or Chest Number changed
    if (editGroup !== editParticipant.group || editChestNumber !== editParticipant.chestNumber) {
      if (!confirm(`This will change the student's chest number/group from ${editParticipant.chestNumber} (${editParticipant.group}) to ${editChestNumber} (${editGroup}). Any previously generated certificates or ID cards should be regenerated. Continue?`)) {
        setSavingEdit(false);
        return;
      }
    }

    try {
      const payload = {
        id: editParticipant.id,
        fullName: editName,
        chestNumber: editChestNumber,
        group: editGroup,
        category: editCategory,
        gender: editGender,
        dob: editDob,
        whatsapp: editWhatsapp,
        madrasa: editMadrasa,
        photoUrl: editPhotoUrl,
        programmeIds: editProgrammeIds,
      };

      const res = await fetch('/api/participants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchParticipants();
        setEditParticipant(null);
      } else {
        setEditError(data.error || 'Failed to save changes.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Server error saving changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleBulkUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setBulkUploadError(null);
    setBulkUploadRows([]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', 'parse');

    try {
      const res = await fetch('/api/participants/bulk-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to parse PDF');

      if (data.rows && data.rows.length > 0) {
        setBulkUploadRows(data.rows);
      } else {
        setBulkUploadError('No participant rows could be extracted from the PDF.');
      }
    } catch (err: any) {
      setBulkUploadError(err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleConfirmBulkInsert = async () => {
    setIsUploading(true);
    setBulkUploadError(null);

    const formData = new FormData();
    formData.append('action', 'insert');
    formData.append('items', JSON.stringify(bulkUploadRows));

    try {
      const res = await fetch('/api/participants/bulk-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to bulk insert');

      setIsBulkUploadModalOpen(false);
      setBulkUploadRows([]);
      fetchParticipants();
      alert(`Successfully added ${data.count} participants!`);
    } catch (err: any) {
      setBulkUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateBulkRow = (id: string, field: string, value: any) => {
    setBulkUploadRows((prev) => 
      prev.map(row => row.id === id ? { ...row, [field]: value } : row)
    );
  };

  const handleDeleteBulkRow = (id: string) => {
    setBulkUploadRows((prev) => prev.filter(row => row.id !== id));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant?')) return;
    try {
      const res = await fetch(`/api/participants?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchParticipants();
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['ALL', 'Sub Junior', 'Junior', 'Senior', 'Super Senior'];

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.chestNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.registrationId.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const availableEditProgrammes = programmes.filter(
    (pr) => pr.category === editCategory || pr.category === 'General'
  );

  const handleDownloadPDF = () => {
    const filterTitle = `Admin Participants Report — Category: ${selectedCategory}`;
    const headers = ['Reg ID', 'Chest No', 'Full Delegate Name', 'Group', 'Category', 'Madrasa', 'WhatsApp'];

    const rows = filtered.map((p) => [
      p.registrationId,
      p.chestNumber,
      p.fullName.toUpperCase(),
      p.group,
      p.category,
      p.madrasa || 'Mifthahul Uloom Madrasa',
      p.whatsapp,
    ]);

    const filename = `Admin_Participants_Report_${selectedCategory.replace(/\s+/g, '_')}.pdf`;
    downloadPDFReport(filterTitle, headers, rows, filename);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#C8A86B]" />
            <span>Participants Directory &amp; Records</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            View, edit details, assign programmes, send WhatsApp confirmations, and generate 4K ID passes.
          </p>
        </div>

        {/* Download PDF Button & Bulk Add Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="btn-pill-luxury bg-[#FAF8F3] text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-bold text-xs px-4 py-2 flex items-center space-x-1.5 shadow-md hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <FileText className="w-4 h-4" />
            <span>Bulk Add via PDF</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-xs px-4 py-2 flex items-center space-x-1.5 shadow-md hover:bg-[#B8943A]"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="luxury-glass p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, chest no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/5 dark:bg-white/10 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-semibold">Category:</span>
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === c
                    ? 'bg-[#C8A86B] text-[#0B0B0B]'
                    : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="luxury-glass border border-[#9E741D]/25 dark:border-[#C8A86B]/20 rounded-2xl overflow-hidden shadow-xl">
          <div className="w-full overflow-x-auto whitespace-nowrap [webkit-overflow-scrolling:touch]">
            <table className="hk-table">
              <thead>
                <tr>
                  <th className="py-3.5 px-4">Reg ID</th>
                  <th className="py-3.5 px-4">Chest No</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Group</th>
                  <th className="py-3.5 px-4">Madrasa</th>
                  <th className="py-3.5 px-4">WhatsApp</th>
                  <th className="py-3.5 px-4 text-right">4K ID Pass</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-200 text-xs">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[#9E741D] dark:text-[#C8A86B] font-bold">{p.registrationId}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">{p.chestNumber}</td>
                    <td className="py-3.5 px-4 font-serif font-bold text-slate-900 dark:text-white uppercase">{p.fullName}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{p.category}</td>
                    <td className="py-3.5 px-4">
                      <span className={p.group === 'MAVADDA' ? 'hk-badge-gold' : 'hk-badge-green'}>
                        {p.group}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{p.madrasa || 'Mifthahul Uloom Madrasa'}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{p.whatsapp}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveIDCardParticipant(p)}
                        className="btn-pill-luxury bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-[#C8A86B]/10 dark:text-[#C8A86B] dark:border-[#C8A86B]/30 text-[11px] px-3 py-1 font-semibold"
                      >
                        Generate 4K ID Pass
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1 text-amber-500 hover:text-amber-400 inline-flex items-center"
                        title="Edit Participant Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendWhatsAppConfirmation(p.id, p.fullName)}
                        disabled={sendingWaId === p.id}
                        className="p-1 text-emerald-500 hover:text-emerald-400 disabled:opacity-50 inline-flex items-center"
                        title="Send/Resend WhatsApp Confirmation Message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 inline-flex items-center"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT PARTICIPANT MODAL */}
      {editParticipant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-3xl border border-[#C8A86B]/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-xs font-sans text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2">
                  <Edit className="w-4 h-4 text-[#C8A86B]" />
                  <span>Edit Participant Details — {editParticipant.registrationId}</span>
                </h3>
                <p className="text-[10px] text-slate-400">Update delegate record, chest number, group, and programme selections.</p>
              </div>
              <button onClick={() => setEditParticipant(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Delegate Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Chest Number *</label>
                  <input
                    type="text"
                    required
                    value={editChestNumber}
                    onChange={(e) => setEditChestNumber(e.target.value)}
                    placeholder="e.g. 105"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Mavadda: 101–299 | Mahabba: 301–499</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">House Group *</label>
                  <select
                    value={editGroup}
                    onChange={(e) => setEditGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="MAVADDA">MAVADDA HOUSE (101–299)</option>
                    <option value="MAHABBA">MAHABBA HOUSE (301–499)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category *</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="Sub Junior">Sub Junior (Classes 3, 4)</option>
                    <option value="Junior">Junior (Classes 5, 6)</option>
                    <option value="Senior">Senior (Classes 7, 8)</option>
                    <option value="Super Senior">Super Senior (Classes 9-12)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Madrasa Affiliation *</label>
                  <input
                    type="text"
                    required
                    value={editMadrasa}
                    onChange={(e) => setEditMadrasa(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Passport Photo (ID Card)</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={editPhotoUrl}
                      onChange={(e) => setEditPhotoUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[10px]"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-[11px] flex items-center space-x-1 shrink-0">
                      {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8A86B]" /> : <Upload className="w-3.5 h-3.5 text-[#C8A86B]" />}
                      <span>{uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* PROGRAMMES SELECTION */}
              <div className="pt-2 space-y-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#C8A86B] text-xs">Registered Programmes ({editProgrammeIds.length} Selected)</span>
                  <span className="text-[10px] text-slate-400">Category: {editCategory} &amp; General</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {availableEditProgrammes.map((pr) => {
                    const isChecked = editProgrammeIds.includes(pr.id);
                    return (
                      <label
                        key={pr.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-[11px] ${
                          isChecked
                            ? 'bg-[#C8A86B]/20 border-[#C8A86B] text-white font-bold'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/30'
                        }`}
                      >
                        <div className="space-y-0.5 pr-2">
                          <div>{pr.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{pr.category} • {pr.stage}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditProgrammeIds([...editProgrammeIds, pr.id]);
                            } else {
                              setEditProgrammeIds(editProgrammeIds.filter((id) => id !== pr.id));
                            }
                          }}
                          className="w-4 h-4 accent-[#C8A86B]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditParticipant(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-xs px-6 py-2 shadow-lg flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Saving Changes...' : 'Save Delegate Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* BULK UPLOAD MODAL */}
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass p-6 rounded-[32px] border border-[#C8A86B]/30 max-w-5xl w-full space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-serif text-white">
                Bulk Add Participants via PDF
              </h3>
              <button onClick={() => { setIsBulkUploadModalOpen(false); setBulkUploadRows([]); setBulkUploadError(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkUploadError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                {bulkUploadError}
              </div>
            )}

            {!bulkUploadRows.length ? (
              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-700 rounded-2xl">
                <FileText className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-slate-300 text-sm mb-4">Upload a PDF containing participant lists to extract rows.</p>
                <label className="cursor-pointer bg-[#C8A86B] text-slate-950 px-6 py-2 rounded-xl font-bold text-xs shadow-lg hover:bg-[#b09259] transition-colors">
                  {isUploading ? 'Parsing PDF...' : 'Select PDF File'}
                  <input type="file" accept=".pdf" className="hidden" onChange={handleBulkUploadFile} disabled={isUploading} />
                </label>
                <p className="text-slate-500 text-[10px] mt-4 max-w-md text-center">
                  Note: PDF text extraction is a heuristic process. After uploading, you will be able to review and fix the columns before saving to the database.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto border border-white/10 rounded-xl bg-black/20 p-2">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="text-slate-400 border-b border-white/10">
                        <th className="p-2 font-semibold">Action</th>
                        <th className="p-2 font-semibold">Reg ID & Chest No</th>
                        <th className="p-2 font-semibold min-w-[200px]">Extracted Text / Name</th>
                        <th className="p-2 font-semibold">Group & Category</th>
                        <th className="p-2 font-semibold">Madrasa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bulkUploadRows.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5">
                          <td className="p-2">
                            <button onClick={() => handleDeleteBulkRow(row.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
                          </td>
                          <td className="p-2 flex flex-col gap-1">
                            <input type="text" value={row.registrationId} onChange={(e) => handleUpdateBulkRow(row.id, 'registrationId', e.target.value)} className="bg-transparent border border-white/20 rounded px-2 py-1 w-24 text-white placeholder-slate-500" placeholder="Reg ID" />
                            <input type="text" value={row.chestNumber} onChange={(e) => handleUpdateBulkRow(row.id, 'chestNumber', e.target.value)} className="bg-transparent border border-white/20 rounded px-2 py-1 w-24 text-white placeholder-slate-500" placeholder="Chest No" />
                          </td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={row.fullName} 
                              onChange={(e) => handleUpdateBulkRow(row.id, 'fullName', e.target.value)}
                              className="bg-transparent border border-white/20 rounded px-2 py-1 w-full text-white"
                            />
                            <div className="text-[9px] text-slate-500 truncate mt-1" title={row.rawLine}>Raw: {row.rawLine}</div>
                          </td>
                          <td className="p-2 flex flex-col gap-1">
                            <select value={row.group} onChange={(e) => handleUpdateBulkRow(row.id, 'group', e.target.value)} className="bg-slate-900 border border-white/20 rounded px-2 py-1 text-white">
                              <option value="MAVADDA">MAVADDA</option>
                              <option value="MAHABBA">MAHABBA</option>
                            </select>
                            <select value={row.category} onChange={(e) => handleUpdateBulkRow(row.id, 'category', e.target.value)} className="bg-slate-900 border border-white/20 rounded px-2 py-1 text-white">
                              <option value="General">General</option>
                              <option value="Sub Junior">Sub Junior</option>
                              <option value="Junior">Junior</option>
                              <option value="Senior">Senior</option>
                              <option value="Super Senior">Super Senior</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.madrasa} onChange={(e) => handleUpdateBulkRow(row.id, 'madrasa', e.target.value)} className="bg-transparent border border-white/20 rounded px-2 py-1 w-32 text-white" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="pt-2 flex justify-end gap-3 border-t border-white/10 mt-2">
                  <button onClick={() => setBulkUploadRows([])} className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white">
                    Cancel & Upload Different File
                  </button>
                  <button onClick={handleConfirmBulkInsert} disabled={isUploading} className="px-6 py-2 bg-[#C8A86B] text-slate-950 text-xs font-bold rounded-xl hover:bg-[#b09259] disabled:opacity-50">
                    {isUploading ? 'Inserting...' : `Confirm & Insert ${bulkUploadRows.length} Rows`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
