export interface StageInfo {
  id: string;
  label: string;
  badgeClass: string;
  textClass: string;
  hexColor: string;
}

export const FIXED_STAGES: StageInfo[] = [
  {
    id: 'Aura',
    label: 'Aura',
    badgeClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/40',
    textClass: 'text-purple-700 dark:text-purple-400',
    hexColor: '#A855F7',
  },
  {
    id: 'Legacy',
    label: 'Legacy',
    badgeClass: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/40',
    textClass: 'text-blue-700 dark:text-blue-400',
    hexColor: '#3B82F6',
  },
  {
    id: 'Lumina',
    label: 'Lumina',
    badgeClass: 'bg-[#9E741D]/20 text-[#7A5600] dark:text-[#C8A86B] border border-[#9E741D]/40',
    textClass: 'text-[#9E741D] dark:text-[#C8A86B]',
    hexColor: '#9E741D',
  },
  {
    id: 'Zenith',
    label: 'Zenith',
    badgeClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-500/40',
    textClass: 'text-emerald-800 dark:text-emerald-400',
    hexColor: '#10B981',
  },
];

export function getStageInfo(stageName: string): StageInfo {
  if (!stageName) return FIXED_STAGES[2]; // Default Lumina

  const normalized = stageName.trim().toLowerCase();

  // Robust Stage Mapping for Stage 1..4 & names
  if (normalized.includes('aura') || normalized.includes('stage 1') || normalized.includes('bukhari') || normalized === '1') {
    return FIXED_STAGES[0]; // Aura
  }
  if (normalized.includes('legacy') || normalized.includes('stage 2') || normalized.includes('shafi') || normalized === '2') {
    return FIXED_STAGES[1]; // Legacy
  }
  if (normalized.includes('lumina') || normalized.includes('stage 3') || normalized.includes('malik') || normalized.includes('ghazali') || normalized === '3') {
    return FIXED_STAGES[2]; // Lumina
  }
  if (normalized.includes('zenith') || normalized.includes('stage 4') || normalized.includes('ahmad') || normalized === '4') {
    return FIXED_STAGES[3]; // Zenith
  }

  const matched = FIXED_STAGES.find((s) => s.id.toLowerCase() === normalized);
  return matched || {
    id: stageName,
    label: stageName,
    badgeClass: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/40',
    textClass: 'text-slate-700 dark:text-slate-300',
    hexColor: '#64748B',
  };
}

export function checkDoubleBooking(
  schedules: Array<{ id: string; stage: string; date: string; startTime: string }>,
  stage: string,
  date: string,
  startTime: string,
  excludeId?: string
): boolean {
  const normStage = (stage || '').trim().toLowerCase();
  const normDate = (date || '').trim();
  const normTime = (startTime || '').trim().toLowerCase();

  return schedules.some((s) => {
    if (excludeId && s.id === excludeId) return false;
    const sStage = (s.stage || '').trim().toLowerCase();
    const sDate = (s.date || '').trim();
    const sTime = (s.startTime || '').trim().toLowerCase();

    return sStage === normStage && sDate === normDate && sTime === normTime;
  });
}
