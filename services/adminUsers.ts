/**
 * Admin-only: list users, remove user, set all users discoverable.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

function getF() {
  return getFunctions(auth.app, 'us-central1');
}

export interface AdminUserRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  username: string | null;
  discoverable: boolean;
  suspended: boolean;
  createdAt: number | null;
}

export type ListUsersResult =
  | { success: true; users: AdminUserRow[] }
  | { success: false; message: string };

export async function listUsersForAdmin(limit?: number): Promise<ListUsersResult> {
  try {
    const fn = httpsCallable<{ limit?: number }, { success: boolean; users?: AdminUserRow[]; message?: string }>(getF(), 'listUsersForAdmin');
    const res = await fn({ limit });
    const data = res.data;
    if (data?.success && Array.isArray(data.users)) return { success: true, users: data.users };
    return { success: false, message: (data?.message as string) ?? 'Failed to load' };
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message: msg };
  }
}

export async function removeUserByAdmin(uid: string): Promise<{ success: boolean; message?: string }> {
  try {
    const fn = httpsCallable<{ uid: string }, { success: boolean; message?: string }>(getF(), 'removeUserByAdmin');
    const res = await fn({ uid });
    const data = res.data;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Remove failed' };
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message: msg };
  }
}

export type SetAllDiscoverableResult =
  | { success: true; count: number }
  | { success: false; message: string };

export async function setAllUsersDiscoverable(): Promise<SetAllDiscoverableResult> {
  try {
    const fn = httpsCallable<unknown, { success: boolean; count?: number; message?: string }>(getF(), 'setAllUsersDiscoverable');
    const res = await fn({});
    const data = res.data;
    if (data?.success && typeof data.count === 'number') return { success: true, count: data.count };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message: msg };
  }
}

export async function suspendUserByAdmin(uid: string): Promise<{ success: boolean; message?: string }> {
  try {
    const fn = httpsCallable<{ uid: string }, { success: boolean; message?: string }>(getF(), 'suspendUserByAdmin');
    const res = await fn({ uid });
    const data = res.data;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Suspend failed' };
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message: msg };
  }
}

export async function unsuspendUserByAdmin(uid: string): Promise<{ success: boolean; message?: string }> {
  try {
    const fn = httpsCallable<{ uid: string }, { success: boolean; message?: string }>(getF(), 'unsuspendUserByAdmin');
    const res = await fn({ uid });
    const data = res.data;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Unsuspend failed' };
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message: msg };
  }
}
