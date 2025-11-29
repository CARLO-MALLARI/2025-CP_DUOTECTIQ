import { doc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CropSummary {
  crop: string;   // "Tomato" | "Bell Pepper"
  type: string;   // "small" | "medium" | "large"
  color: string;  // "green" | "red"
  status: string; // "good" | "damaged"
  amount: number;
}

export const uploadSummaryToFirestore = async (
  userId: string,
  summaryData: any, // raw detection counter data
  timestamp: string
) => {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const docId = `${userId}_${dateStr}`;
    const docRef = doc(db, 'crops', docId);

    const records: CropSummary[] = [];

    const crops = ['Tomato', 'Bell Pepper'];
    const colors = ['green', 'red'];
    const sizes = ['small', 'medium', 'large'];

    for (const crop of crops) {
      for (const color of colors) {
        for (const size of sizes) {
          const amount = summaryData[crop]?.[size]?.[color] ?? 0;
          if (amount > 0) {
            records.push({
              crop,
              type: size,
              color,
              status: 'good',
              amount,
            });
          }
        }
      }

      // Include damaged
      const damagedAmount = summaryData[crop]?.total?.damaged ?? 0;
      if (damagedAmount > 0) {
        records.push({
          crop,
          type: 'n/a',
          color: 'n/a',
          status: 'damaged',
          amount: damagedAmount,
        });
      }
    }

    await setDoc(
      docRef,
      {
        userId,
        date: dateStr,
        lastUpdated: timestamp,
        records: arrayUnion(...records),
      },
      { merge: true }
    );
    
    console.log('✅ Summary uploaded to Firestore:', records);

    console.log('✅ Uploaded summary with sizes to Firestore');
  } catch (error: any) {
    console.error('❌ Firestore upload error:', error.message || error);
    throw error;
  }
};
