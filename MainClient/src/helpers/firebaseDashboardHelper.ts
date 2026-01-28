import {collection, query, where, getDocs, orderBy} from 'firebase/firestore';
import {auth, db} from '../lib/firebase';
import {parseISO} from 'date-fns';
import {getISOWeek} from 'date-fns';

export interface CropSummary {
  crop: string; // "Tomato" | "Bell Pepper"
  type: string; // "small" | "medium"
  color: string; // "green" | "red"
  status: string; // "good" | "damaged"
  amount: number;
}

export interface WeeklyCropStat {
  week: string; // e.g. "2026-W03"
  Tomato: number;
  'Bell Pepper': number;
}

/** Raw Firestore document */
interface CropDoc {
  userId: string;
  date: string; // "YYYY-MM-DD"
  records: CropSummary[];
}

/** Aggregated totals for UI */
export interface DashboardData {
  totalPieces: number;
  byCrop: {
    Tomato: number;
    'Bell Pepper': number;
  };
  byCategory: {
    green: {
      total: number;
      Tomato: number;
      'Bell Pepper': number;
      small: number;
      medium: number;
      large: number;
    };
    red: {
      total: number;
      Tomato: number;
      'Bell Pepper': number;
      small: number;
      medium: number;
      large: number;
    };
    damaged: {
      total: number;
      Tomato: number;
      'Bell Pepper': number;
    };
  };
  byWeek?: WeeklyCropStat[];
}

export const fetchDashboardData = async (
  from: string,
  to: string,
  sortBy: 'All' | 'Tomato' | 'Bell Pepper',
): Promise<DashboardData> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const byWeekMap: Record<string, WeeklyCropStat> = {};

  const col = collection(db, 'crops');
  const q = query(
    col,
    where('userId', '==', user.uid),
    where('date', '>=', from),
    where('date', '<=', to),
    orderBy('date', 'asc'),
  );

  const snap = await getDocs(q);

  const agg: DashboardData = {
    totalPieces: 0,
    byCrop: {Tomato: 0, 'Bell Pepper': 0},
    byCategory: {
      green: {
        total: 0,
        Tomato: 0,
        'Bell Pepper': 0,
        small: 0,
        medium: 0,
        large: 0,
      },
      red: {
        total: 0,
        Tomato: 0,
        'Bell Pepper': 0,
        small: 0,
        medium: 0,
        large: 0,
      },
      damaged: {total: 0, Tomato: 0, 'Bell Pepper': 0},
    },
  };

  for (const doc of snap.docs) {
    const data = doc.data() as CropDoc;

    // Parse date and compute ISO week
    const d = parseISO(data.date);
    const year = d.getFullYear();
    const week = getISOWeek(d);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;

    if (!byWeekMap[weekKey]) {
      byWeekMap[weekKey] = {week: weekKey, Tomato: 0, 'Bell Pepper': 0};
    }

    for (const rec of data.records) {
      const cropRaw = rec.crop?.trim().toLowerCase();
      const color = rec.color?.trim().toLowerCase();
      const type = rec.type?.trim().toLowerCase();
      const status = rec.status?.trim().toLowerCase();
      const amount = rec.amount ?? 0;

      // normalize crop
      const crop =
        cropRaw === 'tomato'
          ? 'tomato'
          : cropRaw === 'bell pepper' ||
            cropRaw === 'bellpepper' ||
            cropRaw === 'bell-pepper'
          ? 'bell pepper'
          : null;

      if (!crop) continue;

      // apply sort filter
      if (sortBy !== 'All') {
        if (sortBy === 'Tomato' && crop !== 'tomato') continue;
        if (sortBy === 'Bell Pepper' && crop !== 'bell pepper') continue;
      }

      // weekly totals
      if (crop === 'tomato') byWeekMap[weekKey].Tomato += amount;
      if (crop === 'bell pepper') byWeekMap[weekKey]['Bell Pepper'] += amount;

      // totals per crop
      agg.totalPieces += amount;
      if (crop === 'tomato') agg.byCrop.Tomato += amount;
      if (crop === 'bell pepper') agg.byCrop['Bell Pepper'] += amount;

      // damaged category
      if (status === 'damaged') {
        agg.byCategory.damaged.total += amount;
        if (crop === 'tomato') agg.byCategory.damaged.Tomato += amount;
        if (crop === 'bell pepper')
          agg.byCategory.damaged['Bell Pepper'] += amount;
        continue;
      }

      // skip unknown color
      if (color !== 'green' && color !== 'red') continue;

      const cat = color as 'green' | 'red';

      // category totals
      agg.byCategory[cat].total += amount;
      if (crop === 'tomato') agg.byCategory[cat].Tomato += amount;
      if (crop === 'bell pepper') agg.byCategory[cat]['Bell Pepper'] += amount;

      // size buckets
      if (['small', 'medium', 'large'].includes(type)) {
        agg.byCategory[cat][type as 'small' | 'medium' | 'large'] += amount;
      }
    }
  }

  agg.byWeek = Object.values(byWeekMap).sort((a, b) =>
    a.week.localeCompare(b.week),
  );

  return agg;
};
