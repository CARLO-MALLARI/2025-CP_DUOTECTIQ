import { doc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CropSummary {
  crop: string;
  type: string;
  color: string;
  status: string;
  amount: number;
}

export const uploadSummaryToFirestore = async (
  userId: string,
  summary: CropSummary[],
  timestamp: string
) => {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const docId = `${userId}_${dateStr}`;
    const docRef = doc(db, 'crops', docId);

    // Always include userId in the update
    const updateData = {
      userId,                    // Critical: ensures ownership
      date: dateStr,
      lastUpdated: timestamp,
      records: arrayUnion(...summary),
    };

    // This works for BOTH create and update
    await setDoc(docRef, updateData, { merge: true });

    console.log('Uploaded detection summary to Firestore');
  } catch (error: any) {
    console.error('Firestore upload error:', error.message || error);
    throw error;
  }
};