import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useEffectiveTier } from './useEffectiveTier';
import type { GlobalAnnouncement } from '../services/globalAnnouncements';

const DISMISSED_IDS_KEY = 'ORBTAP_GLOBAL_ANNOUNCEMENT_DISMISSED_IDS';
const MAX_DISMISSED = 50;

async function getDismissedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function addDismissedId(id: string): Promise<void> {
  const ids = await getDismissedIds();
  const next = [id, ...ids].slice(0, MAX_DISMISSED);
  await AsyncStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify(next));
}

export function useGlobalAnnouncement() {
  const { user } = useAuth();
  const { isPartner } = useEffectiveTier();
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const fetchLatest = useCallback(async () => {
    if (!user) {
      setAnnouncement(null);
      setLoading(false);
      return;
    }
    try {
      const ref = collection(db, 'globalAnnouncements');
      const q = query(
        ref,
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      const doc = snap.docs[0];
      if (!doc) {
        setAnnouncement(null);
        setLoading(false);
        return;
      }
      const data = doc.data();
      const target = (data.targetAudience as 'all' | 'members' | 'partners' | 'specific') || 'all';
      const taggedUserIds = Array.isArray(data.taggedUserIds) ? data.taggedUserIds as string[] : [];
      const forMember = target === 'all' || target === 'members';
      const forPartner = target === 'all' || target === 'partners';
      const forSpecific = target === 'specific' && user?.uid && taggedUserIds.includes(user.uid);
      const applies = forSpecific || (isPartner && forPartner) || (!isPartner && forMember);
      if (!applies) {
        setAnnouncement(null);
        setLoading(false);
        return;
      }
      const dismissedIds = await getDismissedIds();
      if (dismissedIds.includes(doc.id)) {
        setAnnouncement(null);
        setLoading(false);
        return;
      }
      const ts = data.createdAt as Timestamp;
      setAnnouncement({
        id: doc.id,
        title: data.title ?? '',
        body: data.body ?? '',
        targetAudience: target,
        displayType: data.displayType === 'banner' ? 'banner' : 'bulletin',
        imageUrl: data.imageUrl ?? null,
        taggedPartnerIds: Array.isArray(data.taggedPartnerIds) ? data.taggedPartnerIds : null,
        taggedUserIds: Array.isArray(data.taggedUserIds) ? data.taggedUserIds : null,
        createdAt: ts ? { seconds: ts.seconds, nanoseconds: ts.nanoseconds } : { seconds: 0, nanoseconds: 0 },
        createdBy: data.createdBy ?? '',
        active: data.active ?? true,
      });
    } catch (e) {
      if (__DEV__) console.warn('Global announcement fetch failed', e);
      setAnnouncement(null);
    } finally {
      setLoading(false);
    }
  }, [user, isPartner]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  // Refetch when app comes to foreground so "show on next login/open" works when user reopens the app
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        fetchLatest();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [fetchLatest]);

  const dismiss = useCallback(async () => {
    if (!announcement) return;
    await addDismissedId(announcement.id);
    setDismissed(true);
    setAnnouncement(null);
  }, [announcement]);

  const visible = !!announcement && !dismissed;
  return { announcement, loading, visible, dismiss, refresh: fetchLatest };
}
