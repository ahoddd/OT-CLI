/**
 * In-app notification center — Firestore users/{uid}/notifications.
 * Notifications are created by Cloud Functions (e.g. forecast deleted, admin broadcast).
 * Client: list, mark read, move to trash, empty trash.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  getDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
  onSnapshot,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebaseConfig';

const NOTIFICATIONS_SUBCOLLECTION = 'notifications';

export type NotificationType =
  | 'forecast_deleted'
  | 'broadcast'
  | 'poll'
  | 'mission'
  | 'drop'
  | 'partner'
  | 'system'
  | 'general';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Deep link or screen path */
  data?: Record<string, string>;
  read: boolean;
  deletedAt: number | null;
  createdAt: number;
  fromUserId?: string;
  fromPartnerId?: string;
  /** Optional reason (e.g. for forecast_deleted) */
  reason?: string;
}

function toNotification(docId: string, data: Record<string, unknown>): AppNotification {
  const ts = data.createdAt as Timestamp | undefined;
  const deletedTs = data.deletedAt as Timestamp | undefined;
  return {
    id: docId,
    type: (data.type as NotificationType) ?? 'general',
    title: (data.title as string) ?? '',
    body: (data.body as string) ?? '',
    data: data.data as Record<string, string> | undefined,
    read: data.read === true,
    deletedAt: deletedTs ? deletedTs.toMillis() : (data.deletedAt as number) ?? null,
    createdAt: ts?.toMillis?.() ?? (data.createdAt as number) ?? 0,
    fromUserId: data.fromUserId as string | undefined,
    fromPartnerId: data.fromPartnerId as string | undefined,
    reason: data.reason as string | undefined,
  };
}

function notificationsRef(uid: string) {
  return collection(db, 'users', uid, NOTIFICATIONS_SUBCOLLECTION);
}

/** List inbox (exclude trashed), newest first. */
export async function listInbox(uid: string, max = 80): Promise<AppNotification[]> {
  const q = query(
    notificationsRef(uid),
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toNotification(d.id, d.data() as Record<string, unknown>));
}

/** List trashed (deletedAt != null). */
export async function listTrash(uid: string, max = 80): Promise<AppNotification[]> {
  const q = query(
    notificationsRef(uid),
    where('deletedAt', '!=', null),
    orderBy('deletedAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toNotification(d.id, d.data() as Record<string, unknown>));
}

/** Subscribe to inbox (real-time). */
export function subscribeInbox(
  uid: string,
  onUpdate: (items: AppNotification[]) => void,
  max = 80
): Unsubscribe {
  const q = query(
    notificationsRef(uid),
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc'),
    limit(max)
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => toNotification(d.id, d.data() as Record<string, unknown>));
    onUpdate(items);
  });
}

/** Mark one notification as read. */
export async function markRead(uid: string, notificationId: string): Promise<void> {
  const ref = doc(db, 'users', uid, NOTIFICATIONS_SUBCOLLECTION, notificationId);
  await updateDoc(ref, { read: true });
}

/** Move one notification to trash (set deletedAt). */
export async function moveToTrash(uid: string, notificationId: string): Promise<void> {
  const ref = doc(db, 'users', uid, NOTIFICATIONS_SUBCOLLECTION, notificationId);
  await updateDoc(ref, { deletedAt: serverTimestamp(), read: true });
}

/** Empty trash: permanently delete all docs where deletedAt != null. */
export async function emptyTrash(uid: string): Promise<number> {
  const q = query(
    notificationsRef(uid),
    where('deletedAt', '!=', null),
    limit(200)
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

/** Restore one from trash (set deletedAt = null). */
export async function restoreFromTrash(uid: string, notificationId: string): Promise<void> {
  const ref = doc(db, 'users', uid, NOTIFICATIONS_SUBCOLLECTION, notificationId);
  await updateDoc(ref, { deletedAt: null });
}

/** Unread count (inbox only). For badge. */
export async function getUnreadCount(uid: string): Promise<number> {
  const q = query(
    notificationsRef(uid),
    where('deletedAt', '==', null),
    where('read', '==', false),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.size;
}

/** Admin: send in-app notification to one or many users (via Cloud Function). */
export async function sendNotificationAdmin(params: {
  targetUserIds: string[];
  title: string;
  body: string;
  type?: NotificationType;
  data?: Record<string, string>;
  alsoPush?: boolean;
}): Promise<{ success: boolean; message?: string; count?: number }> {
  const functions = getFunctions(undefined, 'us-central1');
  const call = httpsCallable<
    { targetUserIds: string[]; title: string; body: string; type?: string; data?: Record<string, string>; alsoPush?: boolean },
    { success: boolean; message?: string; count?: number }
  >(functions, 'createUserNotifications');
  const res = await call({
    targetUserIds: params.targetUserIds,
    title: params.title,
    body: params.body,
    type: params.type ?? 'general',
    data: params.data,
    alsoPush: params.alsoPush ?? false,
  });
  return {
    success: res.data.success,
    message: res.data.message,
    count: res.data.count,
  };
}
