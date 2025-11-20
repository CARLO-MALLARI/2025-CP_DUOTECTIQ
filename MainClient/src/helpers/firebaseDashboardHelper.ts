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
      small: number;
      medium: number;
    };
    red: {
      total: number;
      small: number;
      medium: number;
    };
    damaged: {
      total: number;
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

  // Build query: docs where date >= from && date <= to
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

  // ---- Aggregation -------------------------------------------------
  const agg: DashboardData = {
    totalPieces: 0,
    byCrop: { Tomato: 0, 'Bell Pepper': 0 },
    byCategory: {
      green: { total: 0, small: 0, medium: 0 },
      red: { total: 0, small: 0, medium: 0 },
      damaged: { total: 0 },
    },
  };

  for (const doc of docs) {
    for (const rec of doc.records) {
      // ---- Filter by sortBy (crop) ---------------------------------
      if (sortBy !== 'All' && rec.crop !== sortBy) continue;

      agg.totalPieces += rec.amount;
      agg.byCrop[rec.crop as keyof typeof agg.byCrop] += rec.amount;

      if (rec.status === 'damaged') {
        agg.byCategory.damaged.total += rec.amount;
        continue;
      }

      const colorKey = rec.color as 'green' | 'red';
      const sizeKey = rec.type as 'small' | 'medium';

      agg.byCategory[colorKey].total += rec.amount;
      if (sizeKey === 'small') agg.byCategory[colorKey].small += rec.amount;
      if (sizeKey === 'medium') agg.byCategory[colorKey].medium += rec.amount;
    }
  }

  return agg;
};