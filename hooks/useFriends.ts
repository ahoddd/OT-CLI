/**
 * Friends and friend requests via Firestore. See docs/BUILD/SOCIAL_AND_SAFETY_DESIGN.md.
 * Collections: users/{uid}, users/{uid}/friends, users/{uid}/friendRequestsSent/Received.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';

const MAX_FRIENDS = 500;

export interface UserProfile {
  uid: string;
  displayName: string | null;
  username: string | null;
  discoverable: boolean;
}

export interface FriendRequest {
  fromUid: string;
  fromDisplayName: string | null;
  fromUsername: string | null;
  createdAt: number;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<string[]>([]);
  const [requestsReceived, setRequestsReceived] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setRequestsReceived([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const friendsRef = collection(db, 'users', user.uid, 'friends');
      const friendsSnap = await getDocs(friendsRef);
      const uids = friendsSnap.docs.map((d) => d.id);
      setFriends(uids);

      const receivedRef = collection(db, 'users', user.uid, 'friendRequestsReceived');
      const receivedSnap = await getDocs(receivedRef);
      const requests: FriendRequest[] = [];
      for (const d of receivedSnap.docs) {
        const data = d.data();
        const fromUid = d.id;
        const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt ?? 0;
        let fromDisplayName: string | null = null;
        let fromUsername: string | null = null;
        try {
          const fromDoc = await getDoc(doc(db, 'users', fromUid));
          const fromData = fromDoc.data();
          fromDisplayName = fromData?.displayName ?? null;
          fromUsername = fromData?.username ?? null;
        } catch {}
        requests.push({ fromUid, fromDisplayName, fromUsername, createdAt });
      }
      requests.sort((a, b) => b.createdAt - a.createdAt);
      setRequestsReceived(requests);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load friends');
      setFriends([]);
      setRequestsReceived([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const sendRequest = useCallback(
    async (targetUid: string): Promise<{ ok: boolean; message?: string }> => {
      if (!user || targetUid === user.uid) return { ok: false, message: 'Invalid user' };
      if (friends.includes(targetUid)) return { ok: false, message: 'Already friends' };
      if (friends.length >= MAX_FRIENDS) return { ok: false, message: 'Friend limit reached' };
      setError(null);
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'friendRequestsSent', targetUid), { createdAt: serverTimestamp() });
        batch.set(doc(db, 'users', targetUid, 'friendRequestsReceived', user.uid), {
          createdAt: serverTimestamp(),
          fromDisplayName: user.displayName ?? user.email?.split('@')[0] ?? null,
          fromUsername: (user as any).username ?? null,
        });
        await batch.commit();
        return { ok: true };
      } catch (e: any) {
        return { ok: false, message: e?.message ?? 'Failed to send request' };
      }
    },
    [user, friends]
  );

  const acceptRequest = useCallback(
    async (fromUid: string): Promise<{ ok: boolean; message?: string }> => {
      if (!user) return { ok: false, message: 'Not signed in' };
      if (friends.length >= MAX_FRIENDS) return { ok: false, message: 'Friend limit reached' };
      setError(null);
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'friends', fromUid), { createdAt: serverTimestamp() });
        batch.set(doc(db, 'users', fromUid, 'friends', user.uid), { createdAt: serverTimestamp() });
        batch.delete(doc(db, 'users', user.uid, 'friendRequestsReceived', fromUid));
        batch.delete(doc(db, 'users', fromUid, 'friendRequestsSent', user.uid));
        await batch.commit();
        setFriends((prev) => (prev.includes(fromUid) ? prev : [...prev, fromUid]));
        setRequestsReceived((prev) => prev.filter((r) => r.fromUid !== fromUid));
        return { ok: true };
      } catch (e: any) {
        return { ok: false, message: e?.message ?? 'Failed to accept' };
      }
    },
    [user, friends.length]
  );

  const declineRequest = useCallback(
    async (fromUid: string): Promise<void> => {
      if (!user) return;
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', user.uid, 'friendRequestsReceived', fromUid));
        batch.delete(doc(db, 'users', fromUid, 'friendRequestsSent', user.uid));
        await batch.commit();
        setRequestsReceived((prev) => prev.filter((r) => r.fromUid !== fromUid));
      } catch {}
    },
    [user]
  );

  const setMyProfile = useCallback(
    async (data: { username?: string; displayName?: string; discoverable?: boolean }): Promise<void> => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const existing = snap.data() ?? {};
      await setDoc(ref, {
        ...existing,
        ...(data.username !== undefined && { username: data.username }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.discoverable !== undefined && { discoverable: data.discoverable }),
        updatedAt: serverTimestamp(),
      });
    },
    [user]
  );

  return {
    friends,
    requestsReceived,
    loading,
    error,
    loadFriends,
    sendRequest,
    acceptRequest,
    declineRequest,
    setMyProfile,
  };
}
