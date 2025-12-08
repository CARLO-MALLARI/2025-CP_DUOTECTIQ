import {collection, query, where, orderBy, getDocs} from 'firebase/firestore';
import {auth, db} from '../lib/firebase';
import {format} from 'date-fns';

export interface HistoryRecord {
  id: string;
  crop: string;
  color: string;
  condition: string;
  size: string;
  basket?: string;
  time?: string;
  date: string;
}

interface CropDoc {
  userId: string;
  date: string;
  lastUpdated: string; // ISO string
  records: Array<{
    crop: string;
    color: string;
    status: string;
    type: string;
    amount: number;
    // optional fields you might add later
    basket?: string;
    time?: string;
  }>;
}

export const fetchHistory = async (
  isoDate: string, // "2025-11-03"
  sortBy: 'All' | 'Tomato' | 'BellPepper',
): Promise<HistoryRecord[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const col = collection(db, 'crops');

  // Use lastUpdated for ordering (ISO string)
  const q = query(
    col,
    where('userId', '==', user.uid),
    where('date', '==', isoDate),
    orderBy('lastUpdated', 'asc'), // ← this is what needs the index
  );

  const snap = await getDocs(q);
  const rows: HistoryRecord[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as CropDoc;

    for (const rec of data.records ?? []) {
      if (sortBy !== 'All' && rec.crop !== sortBy) continue;

      // Map crop names (your data uses "Bellpepper", not "Bell Pepper")
      const cropDisplay = rec.crop === 'Bellpepper' ? 'Bell Pepper' : rec.crop;

      // Map size: your `type` field contains the crop name → use it as size
      const sizeDisplay =
        rec.type === 'Bellpepper'
          ? 'Bell Pepper'
          : rec.type.charAt(0).toUpperCase() + rec.type.slice(1).toLowerCase();

      const recordTime = rec.time;
      const docTime = data.lastUpdated
        ? format(new Date(data.lastUpdated), 'hh:mm:ss a')
        : '—';

      rows.push({
        id: `${doc.id}-${rows.length}`,
        crop: cropDisplay,
        color: rec.color === 'green' ? 'Green' : 'Red',
        condition: rec.status === 'good' ? 'Not Damaged' : 'Damaged',
        size: sizeDisplay,
        basket: rec.basket ?? '',
        time: recordTime || docTime,
        date: data.date,
      });
    }
  }

  return rows;
};
