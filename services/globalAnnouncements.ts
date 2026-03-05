import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, app } from '../firebaseConfig';

export type TargetAudience = 'all' | 'members' | 'partners' | 'specific';
export type DisplayType = 'banner' | 'bulletin';

export interface GlobalAnnouncement {
  id: string;
  title: string;
  body: string;
  targetAudience: TargetAudience;
  displayType?: DisplayType;
  imageUrl?: string | null;
  taggedPartnerIds?: string[] | null;
  taggedUserIds?: string[] | null;
  createdAt: { seconds: number; nanoseconds: number };
  createdBy: string;
  active: boolean;
}

export async function createGlobalAnnouncement(params: {
  title: string;
  body: string;
  targetAudience: TargetAudience;
  displayType?: DisplayType;
  imageUrl?: string;
  taggedPartnerIds?: string[];
  taggedUserIds?: string[];
}): Promise<{ success: boolean; id?: string; message?: string }> {
  const f = getFunctions(app, 'us-central1');
  const fn = httpsCallable<
    {
      title: string;
      body: string;
      targetAudience: TargetAudience;
      displayType?: DisplayType;
      imageUrl?: string;
      taggedPartnerIds?: string[];
      taggedUserIds?: string[];
    },
    { success: boolean; id?: string; message?: string }
  >(f, 'createGlobalAnnouncement');
  try {
    const result = await fn(params);
    return result.data as { success: boolean; id?: string; message?: string };
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Request failed';
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
    if (code === 'functions/not-found' || message.toLowerCase().includes('not found')) {
      return { success: false, message: 'Broadcast not available. Deploy Cloud Functions: firebase deploy --only functions' };
    }
    return { success: false, message: message || 'Failed to send broadcast.' };
  }
}

/** List past global announcements (for admin broadcast history). Last 90 days, max 100. */
export async function listGlobalAnnouncementsHistory(displayType?: DisplayType): Promise<GlobalAnnouncement[]> {
  const ninetyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const col = collection(db, 'globalAnnouncements');
  const q = query(
    col,
    where('createdAt', '>=', ninetyDaysAgo),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt as { seconds: number; nanoseconds: number } | undefined;
    const item: GlobalAnnouncement = {
      id: d.id,
      title: (data.title as string) ?? '',
      body: (data.body as string) ?? '',
      targetAudience: (data.targetAudience as GlobalAnnouncement['targetAudience']) ?? 'all',
      displayType: data.displayType === 'banner' ? 'banner' : 'bulletin',
      imageUrl: (data.imageUrl as string) ?? null,
      taggedPartnerIds: (data.taggedPartnerIds as string[] | null) ?? null,
      taggedUserIds: (data.taggedUserIds as string[] | null) ?? null,
      createdAt: createdAt ?? { seconds: 0, nanoseconds: 0 },
      createdBy: (data.createdBy as string) ?? '',
      active: data.active === true,
    };
    return item;
  }).filter((i) => !displayType || i.displayType === displayType);
}
