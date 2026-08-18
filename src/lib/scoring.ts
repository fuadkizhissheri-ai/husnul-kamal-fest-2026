export interface ProgrammePointsConfig {
  first: number;
  second: number;
  third: number;
  gradeA: number;
  gradeB: number;
  participation: number;
}

export interface PointsSettings {
  single: ProgrammePointsConfig;
  group: ProgrammePointsConfig;
  general: ProgrammePointsConfig;
}

export const DEFAULT_POINTS_SETTINGS: PointsSettings = {
  single: {
    first: 10,
    second: 7,
    third: 5,
    gradeA: 5,
    gradeB: 3,
    participation: 1,
  },
  group: {
    first: 15,
    second: 10,
    third: 7,
    gradeA: 7,
    gradeB: 5,
    participation: 2,
  },
  general: {
    first: 20,
    second: 15,
    third: 10,
    gradeA: 10,
    gradeB: 7,
    participation: 3,
  },
};

/**
 * Centralized function to calculate auto-suggested points for a given programme and position
 */
export function calculateAutoPoints(
  programme: { isGroup?: boolean; category?: string },
  position: string,
  settings: PointsSettings = DEFAULT_POINTS_SETTINGS
): number {
  if (!position) return 0;

  const normPos = position.trim().toLowerCase();
  const isGeneral = (programme?.category || '').trim().toLowerCase() === 'general';
  const isGroup = Boolean(programme?.isGroup);

  let config: ProgrammePointsConfig = settings.single;
  if (isGeneral) {
    config = settings.general;
  } else if (isGroup) {
    config = settings.group;
  }

  if (normPos.includes('1st') || normPos.includes('first') || normPos === '1') {
    return config.first;
  }
  if (normPos.includes('2nd') || normPos.includes('second') || normPos === '2') {
    return config.second;
  }
  if (normPos.includes('3rd') || normPos.includes('third') || normPos === '3') {
    return config.third;
  }
  if (normPos.includes('grade a') || normPos === 'a') {
    return config.gradeA;
  }
  if (normPos.includes('grade b') || normPos === 'b') {
    return config.gradeB;
  }
  if (normPos.includes('participation')) {
    return config.participation;
  }

  return 0;
}

/**
 * Standardized sorting logic for results:
 * 1. Programme Name (alphabetically)
 * 2. Position rank (1st Place, 2nd Place, 3rd Place, Grade A, Grade B, Participation)
 */
export function sortResults(results: any[]) {
  const positionRank: Record<string, number> = {
    '1st Place': 1,
    '2nd Place': 2,
    '3rd Place': 3,
    'Grade A': 4,
    'Grade B': 5,
    'Participation': 6
  };

  return [...results].sort((a, b) => {
    // 1. Primary sort: Programme Name
    const progA = a.programme?.name || '';
    const progB = b.programme?.name || '';
    
    if (progA !== progB) {
      return progA.localeCompare(progB);
    }

    // 2. Secondary sort: Gender (Male first)
    const genderA = a.participant?.gender === 'Male' ? 1 : a.participant?.gender === 'Female' ? 2 : 3;
    const genderB = b.participant?.gender === 'Male' ? 1 : b.participant?.gender === 'Female' ? 2 : 3;

    if (genderA !== genderB) {
      return genderA - genderB;
    }

    // 3. Tertiary sort: Position rank
    const rankA = positionRank[a.position] || 99;
    const rankB = positionRank[b.position] || 99;

    return rankA - rankB;
  });
}
