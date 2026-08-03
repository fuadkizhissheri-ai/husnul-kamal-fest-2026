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
