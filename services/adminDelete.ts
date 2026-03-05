/**
 * Admin: delete post, perk, partner (admin-only callables).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

async function callDelete(
  name: string,
  params: Record<string, string>
): Promise<{ success: boolean; message?: string }> {
  try {
    const f = getFunctions(auth.app, 'us-central1');
    const fn = httpsCallable<Record<string, string>, { success: boolean; message?: string }>(f, name);
    const res = await fn(params);
    const data = res.data;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Delete failed' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

export async function deletePost(postId: string): Promise<{ success: boolean; message?: string }> {
  return callDelete('deletePost', { postId });
}

export async function deletePerk(perkId: string): Promise<{ success: boolean; message?: string }> {
  return callDelete('deletePerk', { perkId });
}

export async function deletePartner(partnerId: string): Promise<{ success: boolean; message?: string }> {
  return callDelete('deletePartner', { partnerId });
}
