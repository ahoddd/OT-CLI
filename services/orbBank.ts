/**
 * OrbBank™ — Firestore CRUD for goal jars.
 * IAP / RevenueCat purchase handling will go in functions/src/orbBank.ts.
 */

import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

export interface OrbBankJar {
  id: string;
  uid: string;
  label: string;
  emoji: string;
  targetOT: number;
  currentOT: number;
  autoSavePercent: number;
  partnerCategoryTags: string[];
  createdAt: string;
  isActive: boolean;
}

export async function getUserJars(uid: string): Promise<OrbBankJar[]> {
  const q = query(collection(db, 'orbBankJars'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as OrbBankJar));
}

export async function createJar(
  uid: string,
  jar: Omit<OrbBankJar, 'id' | 'createdAt' | 'currentOT'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'orbBankJars'), {
    ...jar,
    uid,
    currentOT: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateJar(jarId: string, updates: Partial<OrbBankJar>): Promise<void> {
  const ref = doc(db, 'orbBankJars', jarId);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteJar(jarId: string): Promise<void> {
  await deleteDoc(doc(db, 'orbBankJars', jarId));
}

export async function topUpJar(jarId: string, otAmount: number): Promise<void> {
  const ref = doc(db, 'orbBankJars', jarId);
  const snap = await getDoc(ref);
  const current = (snap.data()?.currentOT ?? 0) as number;
  await updateDoc(ref, {
    currentOT: current + otAmount,
    updatedAt: serverTimestamp(),
  });
}

export async function setActiveJar(uid: string, jarId: string): Promise<void> {
  const jars = await getUserJars(uid);
  const batch = await import('firebase/firestore').then(m => m.writeBatch(db));
  for (const jar of jars) {
    batch.update(doc(db, 'orbBankJars', jar.id), { isActive: jar.id === jarId });
  }
  await batch.commit();
}
