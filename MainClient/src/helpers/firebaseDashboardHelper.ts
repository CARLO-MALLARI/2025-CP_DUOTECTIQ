import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface CropSummary {
  crop: string;          // "Tomato" | "Bell Pepper"
  type: string;          // "small" | "medium"
  color: string;         // "green" | "red"
  status: string;        // "good" | "damaged"
  amount: number;
}

/** Raw Firestore document */
interface CropDoc {
  userId: string;
  date: string;   
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
}


export const fetchDashboardData = async (
  from: string,
  to: string,
  sortBy: 'All' | 'Tomato' | 'Bell Pepper'
): Promise<DashboardData> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const col = collection(db, 'crops');
  const q = query(
    col,
    where('userId', '==', user.uid),
    where('date', '>=', from),
    where('date', '<=', to),
    orderBy('date', 'asc')
  );

  const snap = await getDocs(q);
  const docs: CropDoc[] = snap.docs.map(d => d.data() as CropDoc);

  const agg: DashboardData = {
    totalPieces: 0,
    byCrop: { Tomato: 0, 'Bell Pepper': 0 },
    byCategory: {
      green: { total: 0, Tomato: 0, 'Bell Pepper': 0, small: 0, medium: 0, large: 0 },
      red: { total: 0, Tomato: 0, 'Bell Pepper': 0, small: 0, medium: 0, large: 0 },
      damaged: { total: 0, Tomato: 0, 'Bell Pepper': 0 },
    },
  };

  for (const doc of docs) {
    for (const rec of doc.records) {
      const amount = rec.amount ?? 0;
      const crop = rec.crop?.toLowerCase();
      const color = rec.color?.toLowerCase();
      const type = rec.type?.toLowerCase();
      const status = rec.status?.toLowerCase();

      if (sortBy !== 'All' && crop !== sortBy.toLowerCase()) continue;

      // total per crop
      agg.totalPieces += amount;
      if (crop === 'tomato') agg.byCrop.Tomato += amount;
      if (crop === 'bell pepper') agg.byCrop['Bell Pepper'] += amount;

      // damaged
      if (status === 'damaged') {
        agg.byCategory.damaged.total += amount;
        if (crop === 'tomato') agg.byCategory.damaged.Tomato += amount;
        if (crop === 'bell pepper') agg.byCategory.damaged['Bell Pepper'] += amount;
        continue;
      }

      // skip if color invalid
      if (color !== 'green' && color !== 'red') continue;

      const cat = color as 'green' | 'red';

      // totals per color
      agg.byCategory[cat].total += amount;
      if (crop === 'tomato') agg.byCategory[cat].Tomato += amount;
      if (crop === 'bell pepper') agg.byCategory[cat]['Bell Pepper'] += amount;

      // size-specific
      if (['small', 'medium', 'large'].includes(type)) {
        agg.byCategory[cat][type as 'small' | 'medium' | 'large'] += amount;
      }
    }
  }

  return agg;
};