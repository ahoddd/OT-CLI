/**
 * Search discoverable users (for People / Add friend). Server-authoritative; respects discoverable flag.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

export interface SearchUserResult {
  uid: string;
  displayName: string | null;
  username: string | null;
}

export type SearchDiscoverableUsersResult =
  | { success: true; users: SearchUserResult[] }
  | { success: false; message: string };

function getFunctionsRegion() {
  return getFunctions(auth.app, 'us-central1');
}

export async function searchDiscoverableUsers(params: {
  query: string;
  limit?: number;
}): Promise<SearchDiscoverableUsersResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      { query: string; limit?: number },
      { success: boolean; users?: SearchUserResult[]; message?: string }
    >(f, 'searchDiscoverableUsers');
    const res = await fn({
      query: params.query.trim().slice(0, 80),
      limit: params.limit ?? 30,
    });
    const data = res.data;
    if (data?.success && Array.isArray(data.users)) {
      return { success: true, users: data.users };
    }
    return { success: false, message: (data?.message as string) ?? 'Search failed' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}
