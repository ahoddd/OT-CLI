/**
 * Admin: create invite link with role. When user signs up with that link, they get the role.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

export type InviteRole = 'user' | 'partner' | 'admin';

export type CreateInviteLinkResult =
  | { success: true; code: string; url: string }
  | { success: false; message: string };

export async function createInviteLink(role: InviteRole): Promise<CreateInviteLinkResult> {
  try {
    const f = getFunctions(auth.app, 'us-central1');
    const fn = httpsCallable<{ role: string }, { success: boolean; code?: string; url?: string; message?: string }>(
      f,
      'createInviteLink'
    );
    const res = await fn({ role });
    const data = res.data;
    if (data?.success && data?.code && data?.url) {
      return { success: true, code: data.code, url: data.url };
    }
    return { success: false, message: (data?.message as string) ?? 'Failed to create link' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

export type SetRoleFromInviteResult =
  | { success: true; role: string }
  | { success: false; message: string };

export async function setRoleFromInvite(inviteCode: string): Promise<SetRoleFromInviteResult> {
  try {
    const f = getFunctions(auth.app, 'us-central1');
    const fn = httpsCallable<
      { inviteCode: string },
      { success: boolean; role?: string; message?: string }
    >(f, 'setRoleFromInvite');
    const res = await fn({ inviteCode: inviteCode.trim().toUpperCase() });
    const data = res.data;
    if (data?.success) {
      return { success: true, role: (data?.role as string) ?? 'user' };
    }
    return { success: false, message: (data?.message as string) ?? 'Invalid invite code' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}
