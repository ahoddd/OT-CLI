/**
 * Orb Signal forecasts (user votes) — Firestore persistence.
 * Users create forecasts; admin deletes via Cloud Function (which notifies owner).
 */

import {
  collection,
  doc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebaseConfig';

const COLLECTION = 'orbsignalForecasts';

export interface OrbSignalForecast {
  id: string;
  userId: string;
  marketId: string;
  outcomeIndex: number;
  outcomeLabel: string;
  amount: number;
  marketQuestion?: string;
  createdAt: number;
}

function toForecast(docId: string, data: Record<string, unknown>): OrbSignalForecast {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id: docId,
    userId: (data.userId as string) ?? '',
    marketId: (data.marketId as string) ?? '',
    outcomeIndex: (data.outcomeIndex as number) ?? 0,
    outcomeLabel: (data.outcomeLabel as string) ?? 'Yes',
    amount: (data.amount as number) ?? 0,
    marketQuestion: data.marketQuestion as string | undefined,
    createdAt: ts?.toMillis?.() ?? (data.createdAt as number) ?? 0,
  };
}

/** Create a forecast (vote) for the current user. */
export async function createForecast(
  userId: string,
  marketId: string,
  outcomeIndex: number,
  outcomeLabel: string,
  amount: number,
  marketQuestion?: string
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    marketId,
    outcomeIndex,
    outcomeLabel,
    amount,
    marketQuestion: marketQuestion ?? null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** List forecasts for one user (for profile / my votes). */
export async function listForecastsByUser(userId: string, max = 100): Promise<OrbSignalForecast[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toForecast(d.id, d.data() as Record<string, unknown>));
}

/** List all forecasts (admin only) — via Cloud Function to bypass security rules. */
export async function listAllForecastsAdmin(): Promise<OrbSignalForecast[]> {
  const functions = getFunctions(undefined, 'us-central1');
  const call = httpsCallable<unknown, { success: boolean; forecasts?: OrbSignalForecast[]; message?: string }>(
    functions,
    'listOrbSignalForecasts'
  );
  const res = await call({});
  if (!res.data.success || !res.data.forecasts) return [];
  return res.data.forecasts;
}

/** Delete a forecast (admin only). Sends notification to owner with optional reason. */
export async function deleteForecastAdmin(
  forecastId: string,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  const functions = getFunctions(undefined, 'us-central1');
  const call = httpsCallable<{ forecastId: string; reason?: string }, { success: boolean; message?: string }>(
    functions,
    'deleteOrbSignalForecast'
  );
  const res = await call({ forecastId, reason });
  return { success: res.data.success, message: res.data.message };
}
