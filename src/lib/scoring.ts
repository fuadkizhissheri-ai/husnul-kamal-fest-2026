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

export interface TalentStudent {
  id: string;
  fullName: string;
  chestNumber: string;
  registrationId?: string;
  group: string; // MAVADDA / MAHABBA
  category: string; // Sub Junior, Junior, Senior, Super Senior
  gender?: string;
  madrasa: string;
  photoUrl?: string | null;
  totalPoints: number;
  singlePoints: number;
  firstPlaceCount: number;
  secondPlaceCount: number;
  thirdPlaceCount: number;
  gradeACount: number;
  gradeBCount: number;
  wonProgrammes: Array<{
    name: string;
    position: string;
    points: number;
    category?: string;
  }>;
}

export interface CategoryTalentResult {
  category: string;
  topStudent: TalentStudent | null;
  leaderboard: TalentStudent[];
}

export interface MadrasaSingleTalentResult {
  madrasa: string;
  topStudent: TalentStudent | null;
  leaderboard: TalentStudent[];
}

export const STANDARD_CATEGORIES = ['Sub Junior', 'Junior', 'Senior', 'Super Senior'];

export function normalizeCategory(cat?: string): string {
  if (!cat) return '';
  const c = cat.trim().toLowerCase().replace(/[-_]/g, ' ');
  if (c.includes('sub') && c.includes('junior')) return 'Sub Junior';
  if (c.includes('super') && c.includes('senior')) return 'Super Senior';
  if (c.includes('junior')) return 'Junior';
  if (c.includes('senior')) return 'Senior';
  if (c.includes('general')) return 'General';
  return cat.trim();
}

export function compareTalentStudents(a: TalentStudent, b: TalentStudent): number {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
  if (b.firstPlaceCount !== a.firstPlaceCount) return b.firstPlaceCount - a.firstPlaceCount;
  if (b.secondPlaceCount !== a.secondPlaceCount) return b.secondPlaceCount - a.secondPlaceCount;
  if (b.thirdPlaceCount !== a.thirdPlaceCount) return b.thirdPlaceCount - a.thirdPlaceCount;
  if (b.gradeACount !== a.gradeACount) return b.gradeACount - a.gradeACount;
  if (b.gradeBCount !== a.gradeBCount) return b.gradeBCount - a.gradeBCount;
  return a.fullName.localeCompare(b.fullName);
}

/**
 * Calculates Category Champions and Individual Leaderboards across all categories.
 * Excludes Group programmes (isGroup) and General programmes.
 */
export function calculateCategoryTalents(results: any[]): CategoryTalentResult[] {
  const studentMap: Record<string, TalentStudent> = {};

  (results || []).forEach((r) => {
    if (r.programme?.isGroup) return;
    const progCategory = normalizeCategory(r.programme?.category);
    if (progCategory === 'General') return;

    const p = r.participant;
    if (!p) return;

    const pCat = normalizeCategory(p.category) || progCategory || 'Sub Junior';

    if (!studentMap[p.id]) {
      studentMap[p.id] = {
        id: p.id,
        fullName: p.fullName || 'Unknown Participant',
        chestNumber: p.chestNumber || '-',
        registrationId: p.registrationId,
        group: p.group || 'MAVADDA',
        category: pCat,
        gender: p.gender,
        madrasa: p.madrasa || 'Mifthahul Uloom Central',
        photoUrl: p.photoUrl,
        totalPoints: 0,
        singlePoints: 0,
        firstPlaceCount: 0,
        secondPlaceCount: 0,
        thirdPlaceCount: 0,
        gradeACount: 0,
        gradeBCount: 0,
        wonProgrammes: [],
      };
    }

    const st = studentMap[p.id];
    const points = Number(r.points) || 0;
    st.totalPoints += points;
    st.singlePoints += points;

    const normPos = (r.position || '').trim().toLowerCase();
    if (normPos.includes('1st') || normPos.includes('first') || normPos === '1') {
      st.firstPlaceCount += 1;
    } else if (normPos.includes('2nd') || normPos.includes('second') || normPos === '2') {
      st.secondPlaceCount += 1;
    } else if (normPos.includes('3rd') || normPos.includes('third') || normPos === '3') {
      st.thirdPlaceCount += 1;
    } else if (normPos.includes('grade a') || normPos === 'a') {
      st.gradeACount += 1;
    } else if (normPos.includes('grade b') || normPos === 'b') {
      st.gradeBCount += 1;
    }

    st.wonProgrammes.push({
      name: r.programme?.name || 'Programme',
      position: r.position || '-',
      points,
      category: progCategory,
    });
  });

  const studentsList = Object.values(studentMap);

  return STANDARD_CATEGORIES.map((cat) => {
    const catStudents = studentsList.filter((st) => st.category === cat);
    catStudents.sort(compareTalentStudents);

    return {
      category: cat,
      topStudent: catStudents.length > 0 ? catStudents[0] : null,
      leaderboard: catStudents,
    };
  });
}

/**
 * Calculates Madrasa Single Talent Champions per institution.
 */
export function calculateMadrasaTalents(results: any[]): MadrasaSingleTalentResult[] {
  const studentMap: Record<string, TalentStudent> = {};

  (results || []).forEach((r) => {
    if (r.programme?.isGroup) return;
    const progCategory = normalizeCategory(r.programme?.category);
    if (progCategory === 'General') return;

    const p = r.participant;
    if (!p) return;

    const pCat = normalizeCategory(p.category) || progCategory;

    if (!studentMap[p.id]) {
      studentMap[p.id] = {
        id: p.id,
        fullName: p.fullName || 'Unknown Participant',
        chestNumber: p.chestNumber || '-',
        registrationId: p.registrationId,
        group: p.group || 'MAVADDA',
        category: pCat,
        gender: p.gender,
        madrasa: p.madrasa || 'Mifthahul Uloom Central',
        photoUrl: p.photoUrl,
        totalPoints: 0,
        singlePoints: 0,
        firstPlaceCount: 0,
        secondPlaceCount: 0,
        thirdPlaceCount: 0,
        gradeACount: 0,
        gradeBCount: 0,
        wonProgrammes: [],
      };
    }

    const st = studentMap[p.id];
    const points = Number(r.points) || 0;
    st.totalPoints += points;
    st.singlePoints += points;

    const normPos = (r.position || '').trim().toLowerCase();
    if (normPos.includes('1st') || normPos.includes('first') || normPos === '1') {
      st.firstPlaceCount += 1;
    } else if (normPos.includes('2nd') || normPos.includes('second') || normPos === '2') {
      st.secondPlaceCount += 1;
    } else if (normPos.includes('3rd') || normPos.includes('third') || normPos === '3') {
      st.thirdPlaceCount += 1;
    } else if (normPos.includes('grade a') || normPos === 'a') {
      st.gradeACount += 1;
    } else if (normPos.includes('grade b') || normPos === 'b') {
      st.gradeBCount += 1;
    }

    st.wonProgrammes.push({
      name: r.programme?.name || 'Programme',
      position: r.position || '-',
      points,
      category: progCategory,
    });
  });

  const madrasaGroups: Record<string, TalentStudent[]> = {};
  Object.values(studentMap).forEach((st) => {
    const mName = st.madrasa || 'Mifthahul Uloom Central';
    if (!madrasaGroups[mName]) madrasaGroups[mName] = [];
    madrasaGroups[mName].push(st);
  });

  const resultsArr: MadrasaSingleTalentResult[] = [];
  Object.entries(madrasaGroups).forEach(([mName, students]) => {
    students.sort(compareTalentStudents);
    resultsArr.push({
      madrasa: mName,
      topStudent: students.length > 0 ? students[0] : null,
      leaderboard: students,
    });
  });

  resultsArr.sort((a, b) => {
    const ptsA = a.topStudent?.totalPoints || 0;
    const ptsB = b.topStudent?.totalPoints || 0;
    return ptsB - ptsA;
  });

  return resultsArr;
}

