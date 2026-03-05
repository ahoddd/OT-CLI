/**
 * Support request submission — persists to Firestore.
 * Collection: supportRequests
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface SupportRequestInput {
  message: string;
  userId?: string | null;
  email?: string | null;
  displayName?: string | null;
}

export async function submitSupportRequest(input: SupportRequestInput): Promise<{ success: boolean; id?: string; error?: string }> {
  const msg = (input.message || '').trim();
  if (!msg || msg.length < 10) {
    return { success: false, error: 'Please describe your issue in at least 10 characters.' };
  }
  try {
    const ref = await addDoc(collection(db, 'supportRequests'), {
      message: msg,
      userId: input.userId || null,
      email: input.email || null,
      displayName: input.displayName || null,
      createdAt: serverTimestamp(),
      status: 'new',
    });
    return { success: true, id: ref.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to send. Please try again.' };
  }
}
