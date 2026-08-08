'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { downloadPDFReport, downloadScoreCardPDF, downloadBatchScoreCardsPDF } from '@/lib/pdfExporter';
import { downloadCSVReport } from '@/lib/csvExporter';
import { FIXED_STAGES, getStageInfo } from '@/lib/stages';
import {
  Sparkles, Plus, Edit3, Trash2, Download,
  Search, Printer, FileSpreadsheet, X, Users, FilterX, RotateCcw,
} from 'lucide-react';
import { useGlobalModal } from '@/components/TabNavigationProvider';

interface ProgrammeItem {
  id: string;
  name: string;
  category: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  participantLimit: number;
  isGroup: boolean;
  isActive: boolean;
  registeredCount?: number;
  mavaddaCount?: number;
  mahabbaCount?: number;
  groupCount?: { MAVADDA?: number; MAHABBA?: number };
  results?: Array<{ id: string }>;
  registrations?: Array<{
    id: string;
    participant: {
      chestNumber: string;
      fullName?: string;
      madrasa?: string;
      group: string;
      category?: string;
    };
  }>;
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  selectedStageFilter: string;
  selectedType: string;
  selectedDate: string;
  selectedStatus: string;
}

/**
 * 🛠️ Stage Normalization Helper
 * Strips whitespace, case variations, and "stage" suffixes so "Aura", "Aura Stage", "aura" all match.
 */
export function normalizeStage(s?: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/stage/g, '').trim();
}

/**
 * 🎯 CENTRALIZED FILTER FUNCTION
 * Combines Search, Category, Stage, Type, Date, and Status using strict AND logic.
 */
export function filterProgrammeList(programmes: ProgrammeItem[], filters: FilterState): ProgrammeItem[] {
  if (
    !filters.searchQuery &&
    filters.selectedCategory === 'ALL' &&
    filters.selectedStageFilter === 'ALL' &&
    filters.selectedType === 'ALL' &&
    filters.selectedDate === 'ALL' &&
    filters.selectedStatus === 'ALL'
  ) {
    return programmes;
  }

  return programmes.filter((p) => {
    // 1. Search Query (Matches programme name, stage, category, or date)
    const q = (filters.searchQuery || '').trim().toLowerCase();
    const matchSearch =
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.stage || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.date || '').toLowerCase().includes(q);

    // 2. Category Match
    const matchCat =
      !filters.selectedCategory ||
      filters.selectedCategory === 'ALL' ||
      p.category === filters.selectedCategory;

    // 3. Stage Match
    const resolvedStageId = getStageInfo(p.stage || '').id.toLowerCase();
    const targetStageId = (filters.selectedStageFilter || 'ALL').trim().toLowerCase();

    const matchStage =
      !filters.selectedStageFilter ||
      filters.selectedStageFilter === 'ALL' ||
      resolvedStageId === targetStageId ||
      (p.stage || '').toLowerCase().includes(targetStageId);

    // 4. Type Match (Single Item vs Group Item)
    const matchType =
      !filters.selectedType ||
      filters.selectedType === 'ALL' ||
      (filters.selectedType === 'Single Item' && !p.isGroup) ||
      (filters.selectedType === 'Group Item' && p.isGroup);

    // 5. Scheduled Date Match
    const matchDate =
      !filters.selectedDate ||
      filters.selectedDate === 'ALL' ||
      p.date === filters.selectedDate;

    // 6. Programme Status Match (Upcoming, Live, Completed)
    const hasResults = Boolean(p.results && p.results.length > 0);
    let matchStatus = true;
    if (filters.selectedStatus === 'Completed') {
      matchStatus = hasResults;
    } else if (filters.selectedStatus === 'Live') {
      matchStatus = Boolean(p.isActive && !hasResults);
    } else if (filters.selectedStatus === 'Upcoming') {
      matchStatus = Boolean(!hasResults);
    }

    // Strict AND Intersection
    return matchSearch && matchCat && matchStage && matchType && matchDate && matchStatus;
  });
}

/* ── Shared Badge Component ── */
function Badge({
  children,
  className = '',
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`
        inline-flex items-center justify-center
        px-2.5 py-[3px] min-w-[64px] max-w-[120px]
        rounded-full border
        text-[10px] font-bold uppercase tracking-wide
        whitespace-nowrap transition-all duration-200
        ${className}
      `}
    >
      {children}
    </span>
  );
}

/* ── Category Short Form Helper ── */
const CATEGORY_SHORT: Record<string, string> = {
  'Sub Junior': 'Sub Jr',
  'Junior': 'Jr',
  'Senior': 'Sr',
  'Super Senior': 'Sup Sr',
  'General': 'Gen',
};

function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORY_SHORT[category] ?? category;
  return (
    <Badge
      title={category}
      className="bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30"
    >
      {label}
    </Badge>
  );
}

/* ── Stage Badge Component ── */
const STAGE_DOT: Record<string, { dot: string; label: string; badge: string }> = {
  aura:   { dot: 'bg-purple-500', label: 'Aura',   badge: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30' },
  legacy: { dot: 'bg-blue-500',   label: 'Legacy', badge: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30' },
  lumina: { dot: 'bg-[#9E741D]',  label: 'Lumina',  badge: 'bg-[#F5E6C4] text-[#7A5600] border-[#E5C578] dark:bg-[#C8A86B]/15 dark:text-[#C8A86B] dark:border-[#C8A86B]/30' },
  zenith: { dot: 'bg-emerald-500', label: 'Zenith', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30' },
};

function StageBadge({ stage }: { stage: string }) {
  const key = normalizeStage(stage);
  const cfg = STAGE_DOT[key] ?? STAGE_DOT.lumina;
  return (
    <span
      title={`${cfg.label} Stage`}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-[3px]
        rounded-full border text-[10px] font-bold uppercase tracking-wide
        whitespace-nowrap ${cfg.badge}
      `}
    >
      <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ── Status Badge Component ── */
function StatusBadge({ hasResults, isActive }: { hasResults: boolean; isActive: boolean }) {
  if (hasResults) {
    return (
      <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
        Completed
      </Badge>
    );
  }
  if (isActive) {
    return (
      <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
        Live / Ready
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-slate-300 dark:border-white/20">
      Upcoming
    </Badge>
  );
}

/* ── Item Type Badge ── */
function TypeBadge({ isGroup }: { isGroup: boolean }) {
  return (
    <Badge className={isGroup
      ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
      : 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30'}
    >
      {isGroup ? 'Group' : 'Single'}
    </Badge>
  );
}

/* ── Group Registrations Mini-Block ── */
function GroupRegBlock({
  mavadda,
  mahabba,
  limit,
}: {
  mavadda: number;
  mahabba: number;
  limit: number;
}) {
  const mavPct = limit > 0 ? Math.min(100, Math.round((mavadda / limit) * 100)) : 0;
  const mabPct = limit > 0 ? Math.min(100, Math.round((mahabba / limit) * 100)) : 0;
  const cap = limit > 0 ? limit : '∞';

  return (
    <div className="flex flex-col gap-1.5 text-[10px] font-mono">
      {/* Mavadda */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9E741D] dark:bg-[#C8A86B] flex-shrink-0" />
        <span className="text-[#9E741D] dark:text-[#C8A86B] font-bold w-14">Mavadda</span>
        <span className="text-slate-900 dark:text-white font-bold w-10 text-right">{mavadda}/{cap}</span>
        {limit > 0 && (
          <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex-shrink-0">
            <div
              className="h-full rounded-full bg-[#9E741D] dark:bg-[#C8A86B] transition-all"
              style={{ width: `${mavPct}%` }}
            />
          </div>
        )}
      </div>
      {/* Mahabba */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        <span className="text-emerald-700 dark:text-emerald-400 font-bold w-14">Mahabba</span>
        <span className="text-slate-900 dark:text-white font-bold w-10 text-right">{mahabba}/{cap}</span>
        {limit > 0 && (
          <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex-shrink-0">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${mabPct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminProgrammesPage() {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<ProgrammeItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🎯 Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgrammeItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk Upload State
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkUploadRows, setBulkUploadRows] = useState<any[]>([]);
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Score Card Modal State
  const [scoreCardProg, setScoreCardProg] = useState<ProgrammeItem | null>(null);
  const [judgeCount, setJudgeCount] = useState<number>(3);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [includeRemarks, setIncludeRemarks] = useState<boolean>(true);
  const [scoreCardGroupFilter, setScoreCardGroupFilter] = useState<string>('ALL');

  // Global Modal Registrations for hardware back button
  useGlobalModal(isModalOpen, () => { setIsModalOpen(false); setFormError(null); }, 'add-programme-modal');
  useGlobalModal(isBulkUploadModalOpen, () => { setIsBulkUploadModalOpen(false); setBulkUploadRows([]); setBulkUploadError(null); }, 'bulk-upload-programme-modal');
  useGlobalModal(!!confirmDeleteId, () => setConfirmDeleteId(null), 'delete-programme-modal');
  useGlobalModal(!!scoreCardProg, () => setScoreCardProg(null), 'score-card-modal');

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sub Junior');
  const [stage, setStage] = useState('Aura');
  const [date, setDate] = useState('2026-09-15');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [participantLimit, setParticipantLimit] = useState(10);
  const [isGroup, setIsGroup] = useState(false);

  const fetchProgrammes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/programmes');
      const data = await res.json();

      let items: ProgrammeItem[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (Array.isArray(data.programmes)) {
        items = data.programmes;
      } else if (data.categoryProgrammes || data.generalProgrammes) {
        items = [...(data.categoryProgrammes || []), ...(data.generalProgrammes || [])];
      }
      setProgrammes(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgrammes();
  }, []);

  // Dynamically extract distinct dates available in database
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    programmes.forEach((p) => {
      if (p.date) set.add(p.date);
    });
    return Array.from(set).sort();
  }, [programmes]);

  // Centralized filter execution
  const filteredProgrammes = useMemo(() => {
    return filterProgrammeList(programmes, {
      searchQuery,
      selectedCategory,
      selectedStageFilter,
      selectedType,
      selectedDate,
      selectedStatus,
    });
  }, [programmes, searchQuery, selectedCategory, selectedStageFilter, selectedType, selectedDate, selectedStatus]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== 'ALL') count++;
    if (selectedStageFilter !== 'ALL') count++;
    if (selectedType !== 'ALL') count++;
    if (selectedDate !== 'ALL') count++;
    if (selectedStatus !== 'ALL') count++;
    return count;
  }, [searchQuery, selectedCategory, selectedStageFilter, selectedType, selectedDate, selectedStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStageFilter('ALL');
    setSelectedType('ALL');
    setSelectedDate('ALL');
    setSelectedStatus('ALL');
  };

  const handleOpenModal = (item?: ProgrammeItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name); setCategory(item.category); setStage(item.stage || 'Aura');
      setDate(item.date); setStartTime(item.startTime); setEndTime(item.endTime);
      setParticipantLimit(item.participantLimit); setIsGroup(item.isGroup);
    } else {
      setEditingItem(null); setName(''); setCategory('Sub Junior'); setStage('Aura');
      setDate('2026-09-15'); setStartTime('09:00 AM'); setEndTime('11:00 AM');
      setParticipantLimit(10); setIsGroup(false);
    }
    setFormError(null);
    setIsModalOpen(true);
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
      const res = await fetch('/api/programmes/bulk-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to parse PDF');

      if (data.rows && data.rows.length > 0) {
        setBulkUploadRows(data.rows);
      } else {
        setBulkUploadError('No programme rows could be extracted from the PDF.');
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
      const res = await fetch('/api/programmes/bulk-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to bulk insert');

      setIsBulkUploadModalOpen(false);
      setBulkUploadRows([]);
      fetchProgrammes();
      alert(`Successfully added ${data.count} programmes!`);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      id: editingItem?.id,
      name, category, stage, date, startTime, endTime, participantLimit, isGroup,
    };
    const method = editingItem ? 'PUT' : 'POST';
    
    try {
      const res = await fetch('/api/programmes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setFormError('Session expired or unauthorized (401). Please refresh the page and log in again.');
        } else {
          setFormError(data.error || 'Failed to save programme. Please try again.');
        }
        return;
      }

      setIsModalOpen(false);
      
      // Update local state instantly for snappy UI
      if (data.programme) {
        if (method === 'POST') {
          setProgrammes((prev) => [...prev, data.programme]);
        } else if (method === 'PUT') {
          setProgrammes((prev) => prev.map((p) => p.id === data.programme.id ? data.programme : p));
        }
      }

      fetchProgrammes();
      router.refresh();
    } catch (error: any) {
      console.error('Save programme error:', error);
      setFormError(error.message || 'Network error occurred while saving.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/programmes?id=${id}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      fetchProgrammes();
      router.refresh();
    } catch (e) {
      console.error('Failed to delete programme:', e);
    }
  };

  const handleExportPDF = () => {
    const headers = ['Programme Name', 'Category', 'Stage', 'Type', 'Date', 'Start', 'End', 'Limit'];
    const rows = filteredProgrammes.map((p) => [p.name, p.category, p.stage, p.isGroup ? 'Group' : 'Single', p.date, p.startTime, p.endTime, p.participantLimit]);
    
    const label = activeFilterCount > 0 ? 'Filtered' : 'All';
    downloadPDFReport(`Official Programmes Master Catalogue (${label})`, headers, rows, `Husnul_Kamal_Programmes_${label}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = ['Programme Name', 'Category', 'Stage', 'Type', 'Date', 'Start', 'End', 'Limit'];
    const rows = filteredProgrammes.map((p) => [p.name, p.category, p.stage, p.isGroup ? 'Group' : 'Single', p.date, p.startTime, p.endTime, p.participantLimit]);
    downloadCSVReport('Husnul_Kamal_Programmes', headers, rows);
  };

  // Single Programme Score Card Download (Chest Number Only)
  const handleDownloadScoreCard = () => {
    if (!scoreCardProg) return;

    let rawParticipants = (scoreCardProg.registrations || [])
      .map((r) => r.participant)
      .filter(Boolean);

    if (scoreCardGroupFilter !== 'ALL') {
      rawParticipants = rawParticipants.filter((p) => p.group === scoreCardGroupFilter);
    }

    downloadScoreCardPDF(
      {
        programmeName: scoreCardProg.name,
        category: scoreCardProg.category,
        stage: scoreCardProg.stage || 'Aura Stage',
        date: scoreCardProg.date,
        startTime: scoreCardProg.startTime,
        judgeCount,
        orientation,
        includeRemarks,
      },
      rawParticipants
    );
  };

  // Batch Download Score Cards for ALL Currently Filtered Programmes
  const handleBatchScoreCards = () => {
    if (filteredProgrammes.length === 0) return;

    const batchItems = filteredProgrammes.map((p) => ({
      config: {
        programmeName: p.name,
        category: p.category,
        stage: p.stage || 'Aura Stage',
        date: p.date,
        startTime: p.startTime,
        judgeCount,
        orientation: 'landscape' as const,
        includeRemarks: true,
      },
      participants: (p.registrations || []).map((r) => r.participant).filter(Boolean),
    }));

    const stageLabel = selectedStageFilter !== 'ALL' ? selectedStageFilter : 'Filtered';
    const catLabel = selectedCategory !== 'ALL' ? `_${selectedCategory.replace(/\s+/g, '_')}` : '';
    downloadBatchScoreCardsPDF(batchItems, `Batch_ScoreCards_${stageLabel}${catLabel}.pdf`);
  };

  return (
    <div className="space-y-5 font-sans">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9E741D] dark:text-[#C8A86B]" />
            Programmes &amp; Score Cards Manager
          </h1>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            Add programmes, view registered delegates by event, and export official printable Judge Score Cards.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBatchScoreCards}
            disabled={filteredProgrammes.length === 0}
            className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-md whitespace-nowrap disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Batch Score Sheets ({filteredProgrammes.length})</span>
          </button>
          <button
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="btn-pill-luxury bg-[#FAF8F3] text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-bold text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-md whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Add via PDF</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-pill-luxury bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-white/10 dark:text-white dark:border-white/20 font-bold text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Programme</span>
          </button>
        </div>
      </div>

      {/* ── Search & Multi-Filter Control Bar (6 Filters) ── */}
      <div className="luxury-glass p-4 rounded-[24px] border border-[#9E741D]/25 dark:border-white/10 space-y-3 shadow-luxury">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by programme name, stage, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hk-input pl-9 text-xs"
            />
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Stage Filter (Aura, Legacy, Lumina, Zenith) */}
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="hk-select py-2 text-xs w-auto"
            >
              <option value="ALL" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">All Stages</option>
              {FIXED_STAGES.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">
                  {s.label}
                </option>
              ))}
            </select>

            {/* 2. Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="hk-select py-2 text-xs w-auto"
            >
              <option value="ALL" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">All Categories</option>
              <option value="Sub Junior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Sub Junior</option>
              <option value="Junior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Junior</option>
              <option value="Senior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Senior</option>
              <option value="Super Senior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Super Senior</option>
              <option value="General" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">General</option>
            </select>

            {/* 3. Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="hk-select py-2 text-xs w-auto"
            >
              <option value="ALL" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">All Types</option>
              <option value="Single Item" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Single Item</option>
              <option value="Group Item" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Group Item</option>
            </select>

            {/* 4. Scheduled Date Filter */}
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="hk-select py-2 text-xs w-auto"
            >
              <option value="ALL" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">All Dates</option>
              {availableDates.map((d) => (
                <option key={d} value={d} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">
                  📅 {d}
                </option>
              ))}
            </select>

            {/* 5. Status Filter (Upcoming, Live, Completed) */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="hk-select py-2 text-xs w-auto"
            >
              <option value="ALL" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">All Statuses</option>
              <option value="Upcoming" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Upcoming</option>
              <option value="Live" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Live / Active</option>
              <option value="Completed" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Completed</option>
            </select>

            {/* Clear All Filters Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-bold transition-all"
                title="Clear all active filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Toolbar & Active Filter Summary */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/8 pt-2.5 text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Showing <strong className="text-slate-900 dark:text-white font-mono">{filteredProgrammes.length}</strong> of <span className="font-mono">{programmes.length}</span> programmes</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] text-[10px] font-bold">
                {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 px-3 py-1 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors"
            >
              <FileSpreadsheet className="w-3 h-3" /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Data View ── */}
      {loading ? (
        <div className="luxury-glass p-12 rounded-[28px] text-center text-slate-500 font-mono text-xs">
          Loading programmes catalogue...
        </div>
      ) : filteredProgrammes.length === 0 ? (
        /* Empty State */
        <div className="luxury-glass p-12 rounded-[28px] text-center space-y-3 border border-[#9E741D]/25">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
            <FilterX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">No programmes match the selected filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your stage, category, date, or status filters to see available event score sheets.
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] text-xs px-5 py-2 font-bold inline-flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block luxury-glass rounded-[28px] border border-[#9E741D]/25 dark:border-white/10 overflow-hidden shadow-luxury">
            <div className="w-full overflow-x-auto whitespace-nowrap [webkit-overflow-scrolling:touch]">
              <table className="hk-table">
                <thead>
                  <tr>
                    <th>Programme Name</th>
                    <th>Category</th>
                    <th>Stage Venue</th>
                    <th>Status</th>
                    <th>Item Type</th>
                    <th>Group Capacity</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                  {filteredProgrammes.map((p) => {
                    const hasResults = Boolean(p.results && p.results.length > 0);
                    return (
                      <tr key={p.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 dark:text-white font-serif text-sm leading-snug">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.date} · {p.startTime} - {p.endTime}</div>
                        </td>
                        <td className="py-4 px-3"><CategoryBadge category={p.category} /></td>
                        <td className="py-4 px-3"><StageBadge stage={p.stage} /></td>
                        <td className="py-4 px-3"><StatusBadge hasResults={hasResults} isActive={p.isActive} /></td>
                        <td className="py-4 px-3"><TypeBadge isGroup={p.isGroup} /></td>
                        <td className="py-4 px-3">
                          <GroupRegBlock
                            mavadda={p.groupCount?.MAVADDA ?? p.mavaddaCount ?? 0}
                            mahabba={p.groupCount?.MAHABBA ?? p.mahabbaCount ?? 0}
                            limit={p.participantLimit}
                          />
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setScoreCardProg(p);
                                setScoreCardGroupFilter('ALL');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-[#C8A86B]/15 dark:border-[#C8A86B]/40 dark:text-[#C8A86B] text-xs font-bold hover:bg-[#9E741D] hover:text-white transition-all shadow-sm"
                              title="View Delegates & Export Score Card"
                            >
                              <Users className="w-4 h-4" />
                              <span>Score Card ({p.registrations?.length ?? 0})</span>
                            </button>
                            <button
                              onClick={() => handleOpenModal(p)}
                              className="w-11 h-11 flex items-center justify-center rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="Edit Programme"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="w-11 h-11 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 transition-colors"
                              title="Delete Programme"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARD STACK */}
          <div className="md:hidden space-y-3">
            {filteredProgrammes.map((p) => {
              const hasResults = Boolean(p.results && p.results.length > 0);
              return (
                <div
                  key={p.id}
                  className="luxury-glass p-4 rounded-[20px] border border-[#9E741D]/25 dark:border-white/10 space-y-3"
                >
                  {/* Card title row */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base font-serif leading-snug flex-1">{p.name}</h3>
                  </div>

                  {/* Badge row */}
                  <div className="flex flex-wrap gap-2">
                    <CategoryBadge category={p.category} />
                    <StageBadge stage={p.stage} />
                    <StatusBadge hasResults={hasResults} isActive={p.isActive} />
                    <TypeBadge isGroup={p.isGroup} />
                  </div>

                  {/* Stats row */}
                  <div className="border-t border-slate-200 dark:border-white/8 pt-3">
                    <GroupRegBlock
                      mavadda={p.groupCount?.MAVADDA ?? p.mavaddaCount ?? 0}
                      mahabba={p.groupCount?.MAHABBA ?? p.mahabbaCount ?? 0}
                      limit={p.participantLimit}
                    />
                  </div>

                  {/* Date row */}
                  {p.date && (
                    <div className="text-[10px] text-slate-500 font-mono">{p.date} · {p.startTime}</div>
                  )}

                  {/* Actions Grid */}
                  <div className="pt-2 mt-2 border-t border-black/5 dark:border-white/5 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setScoreCardProg(p);
                        setScoreCardGroupFilter('ALL');
                      }}
                      className="col-span-2 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#F5E6C4] text-[#7A5600] border border-[#E5C578] dark:bg-[#C8A86B]/15 dark:border-[#C8A86B]/40 dark:text-[#C8A86B] text-sm font-bold shadow-sm"
                    >
                      <Users className="w-4 h-4" />
                      <span>Score Card ({p.registrations?.length ?? 0})</span>
                    </button>
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-medium text-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── SIMPLIFIED SCORE CARD & CHEST NUMBER MODAL ── */}
      {scoreCardProg && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="luxury-glass p-6 rounded-[32px] border border-[#9E741D]/30 max-w-2xl w-full space-y-5 shadow-2xl my-8">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#9E741D] dark:text-[#C8A86B] uppercase tracking-widest">
                  OFFICIAL JUDGE SCORE SHEET &amp; CHEST NUMBER LIST
                </span>
                <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                  {scoreCardProg.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Category: {scoreCardProg.category} • Stage: {scoreCardProg.stage} • Date: {scoreCardProg.date || 'Fest Day'} ({scoreCardProg.startTime || 'Scheduled'})
                </p>
              </div>
              <button onClick={() => setScoreCardProg(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Score Card Print Config Options */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-[#9E741D] dark:text-[#C8A86B]" />
                <span>Score Sheet Print Options</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Number of Judges</label>
                  <select
                    value={judgeCount}
                    onChange={(e) => setJudgeCount(Number(e.target.value))}
                    className="hk-select text-xs py-1.5 w-full"
                  >
                    <option value={1} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">1 Judge</option>
                    <option value={2} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">2 Judges</option>
                    <option value={3} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">3 Judges (Standard)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">House Group</label>
                  <select
                    value={scoreCardGroupFilter}
                    onChange={(e) => setScoreCardGroupFilter(e.target.value)}
                    className="hk-select text-xs py-1.5 w-full"
                  >
                    <option value="ALL" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">All Groups</option>
                    <option value="MAVADDA" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Mavadda Only</option>
                    <option value="MAHABBA" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Mahabba Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Page Orientation</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="hk-select text-xs py-1.5 w-full"
                  >
                    <option value="landscape" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">A4 Landscape (Recommended)</option>
                    <option value="portrait" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">A4 Portrait</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRemarks}
                      onChange={(e) => setIncludeRemarks(e.target.checked)}
                      className="rounded text-[#9E741D] focus:ring-[#9E741D]"
                    />
                    <span>Include Remarks</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SIMPLIFIED CHEST NUMBER LIST VIEW (Chest Number Only) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Registered Participants (Chest Numbers Sorted Numerically)</span>
                <span className="text-slate-500 font-mono">
                  {(scoreCardProg.registrations || [])
                    .map((r) => r.participant)
                    .filter(Boolean)
                    .filter((p) => scoreCardGroupFilter === 'ALL' || p.group === scoreCardGroupFilter).length} Delegates
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 max-h-64 overflow-y-auto bg-black/5 dark:bg-white/5">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {(scoreCardProg.registrations || [])
                    .map((r) => r.participant)
                    .filter(Boolean)
                    .filter((p) => scoreCardGroupFilter === 'ALL' || p.group === scoreCardGroupFilter)
                    .sort((a, b) => (parseInt(a.chestNumber.replace(/\D/g, '')) || 0) - (parseInt(b.chestNumber.replace(/\D/g, '')) || 0))
                    .map((p) => (
                      <div
                        key={p.chestNumber}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center shadow-xs"
                      >
                        <span className="font-mono text-sm font-black text-[#9E741D] dark:text-[#C8A86B]">
                          {p.chestNumber}
                        </span>
                        <span className={`text-[8.5px] font-extrabold tracking-wider uppercase mt-0.5 ${p.group === 'MAVADDA' ? 'text-[#9E741D]' : 'text-emerald-600'}`}>
                          {p.group}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => setScoreCardProg(null)}
                className="px-5 py-2.5 bg-black/5 dark:bg-white/10 text-slate-700 dark:text-white font-bold rounded-xl text-xs hover:bg-black/10 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownloadScoreCard}
                className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-xs px-6 py-2.5 flex items-center space-x-2 shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>Download Judge Score Sheet (PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass p-6 rounded-[32px] border border-[#9E741D]/30 max-w-md w-full space-y-4 shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                {editingItem ? 'Edit Programme' : 'Add New Programme'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
                <span className="font-bold">Error:</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">

              <div>
                <label className="hk-label">Programme Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Qira'at, Arabic Speech, Group Song"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="hk-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hk-label">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="hk-select">
                    <option value="Sub Junior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Sub Junior (Classes 3, 4)</option>
                    <option value="Junior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Junior (Classes 5, 6)</option>
                    <option value="Senior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Senior (Classes 7, 8)</option>
                    <option value="Super Senior" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">Super Senior (Classes 9-12)</option>
                    <option value="General" className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">General (Open Category)</option>
                  </select>
                </div>
                <div>
                  <label className="hk-label">Stage Venue</label>
                  <select value={stage} onChange={(e) => setStage(e.target.value)} className="hk-select">
                    {FIXED_STAGES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#FAF8F3] text-slate-900 dark:bg-slate-900 dark:text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="hk-label">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="hk-input" />
                </div>
                <div>
                  <label className="hk-label">Start Time</label>
                  <input type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="09:00 AM" className="hk-input" />
                </div>
                <div>
                  <label className="hk-label">End Time</label>
                  <input type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="11:00 AM" className="hk-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hk-label">Max Limit per Gender (Male/Female)</label>
                  <input
                    type="number"
                    min={0}
                    value={participantLimit}
                    onChange={(e) => setParticipantLimit(parseInt(e.target.value) || 0)}
                    className="hk-input"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-800 dark:text-slate-200 font-medium">
                    <input
                      type="checkbox"
                      checked={isGroup}
                      onChange={(e) => setIsGroup(e.target.checked)}
                      className="rounded text-[#9E741D] focus:ring-[#9E741D]"
                    />
                    <span>Is Group Item?</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-black/5 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-black/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold px-6 py-2 shadow-md"
                >
                  Save Programme
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass p-6 rounded-[28px] border border-rose-500/30 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">Delete Programme?</h3>
            <p className="text-[11px] text-slate-500">This will permanently remove the programme and all associated data. This action cannot be undone.</p>
            <div className="grid grid-cols-2 gap-[#18181B] pt-1">
              <button onClick={() => setConfirmDeleteId(null)} className="h-10 bg-black/5 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="h-10 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BULK UPLOAD MODAL */}
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass p-6 rounded-[32px] border border-[#C8A86B]/30 max-w-5xl w-full space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-serif text-white">
                Bulk Add Programmes via PDF
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
                <FileSpreadsheet className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-slate-300 text-sm mb-4">Upload a PDF containing programme lists to extract rows.</p>
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
                        <th className="p-2 font-semibold min-w-[200px]">Extracted Text / Name</th>
                        <th className="p-2 font-semibold">Category</th>
                        <th className="p-2 font-semibold">Stage</th>
                        <th className="p-2 font-semibold">Date</th>
                        <th className="p-2 font-semibold">Times</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bulkUploadRows.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5">
                          <td className="p-2">
                            <button onClick={() => handleDeleteBulkRow(row.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
                          </td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={row.name} 
                              onChange={(e) => handleUpdateBulkRow(row.id, 'name', e.target.value)}
                              className="bg-transparent border border-white/20 rounded px-2 py-1 w-full text-white"
                            />
                            <div className="text-[9px] text-slate-500 truncate mt-1" title={row.rawLine}>Raw: {row.rawLine}</div>
                          </td>
                          <td className="p-2">
                            <select value={row.category} onChange={(e) => handleUpdateBulkRow(row.id, 'category', e.target.value)} className="bg-slate-900 border border-white/20 rounded px-2 py-1 text-white">
                              <option value="General">General</option>
                              <option value="Sub Junior">Sub Junior</option>
                              <option value="Junior">Junior</option>
                              <option value="Senior">Senior</option>
                              <option value="Super Senior">Super Senior</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.stage} onChange={(e) => handleUpdateBulkRow(row.id, 'stage', e.target.value)} className="bg-transparent border border-white/20 rounded px-2 py-1 w-24 text-white" />
                          </td>
                          <td className="p-2">
                            <input type="date" value={row.date} onChange={(e) => handleUpdateBulkRow(row.id, 'date', e.target.value)} className="bg-transparent border border-white/20 rounded px-2 py-1 text-white" />
                          </td>
                          <td className="p-2 flex gap-1">
                            <input type="text" value={row.startTime} onChange={(e) => handleUpdateBulkRow(row.id, 'startTime', e.target.value)} className="bg-transparent border border-white/20 rounded px-2 py-1 w-20 text-white" />
                            <input type="text" value={row.endTime} onChange={(e) => handleUpdateBulkRow(row.id, 'endTime', e.target.value)} className="bg-transparent border border-white/20 rounded px-2 py-1 w-20 text-white" />
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
