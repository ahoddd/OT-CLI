/**
 * Data deletion request submission — persists to Firestore.
 * Collection: dataDeletionRequests (for Apple/Google compliance).
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface DataDeletionRequestInput {
  email: string;
  userId?: string | null;
}

export async function submitDataDeletionRequest(input: DataDeletionRequestInput): Promise<{ success: boolean; id?: string; error?: string }> {
  const email = (input.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  try {
    const ref = await addDoc(collection(db, 'dataDeletionRequests'), {
      email,
      userId: input.userId || null,
      createdAt: serverTimestamp(),
      status: 'pending',
    });
    return { success: true, id: ref.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to submit. Please try again.' };
  }
}
