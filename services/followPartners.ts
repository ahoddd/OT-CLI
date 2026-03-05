/**
 * Follow/unfollow partners for OrbFeed "Following" mode.
 * Stored in users/{uid}/followsPartners/{partnerId}
 */

import { doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function followPartner(userId: string, partnerId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'followsPartners', partnerId);
  await setDoc(ref, { partnerId, createdAt: serverTimestamp() });
}

export async function unfollowPartner(userId: string, partnerId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'followsPartners', partnerId);
  await deleteDoc(ref);
}

export async function getFollowingPartnerIds(userId: string): Promise<string[]> {
  const col = collection(db, 'users', userId, 'followsPartners');
  const snap = await getDocs(col);
  return snap.docs.map((d) => d.id);
}
