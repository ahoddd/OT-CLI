/**
 * OrbVote polls — Firestore persistence for polls and votes.
 * Collections: polls, pollVotes
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, app } from '../firebaseConfig';
import type { Poll } from '../constants/Polls';

function firestorePollToPoll(docId: string, data: any): Poll {
  const options = (data.options || []).map((o: { label: string }, i: number) => ({
    label: o.label || `Option ${i + 1}`,
    votes: (data.optionVotes && data.optionVotes[String(i)] != null) ? data.optionVotes[String(i)] : 0,
  }));
  const totalVotes = data.totalVotes ?? options.reduce((s: number, o: { votes: number }) => s + o.votes, 0);
  const createdAt = data.createdAt?.toMillis?.() ?? (typeof data.createdAt === 'number' ? data.createdAt : undefined);
  return {
    id: docId,
    question: data.question || '',
    options,
    totalVotes,
    partnerName: data.partnerName || 'OrbTap',
    partnerId: data.partnerId || undefined,
    type: data.type || 'standard',
    timeLeft: data.timeLeft || '7d',
    accentColor: data.accentColor || undefined,
    tagline: data.tagline || undefined,
    createdAt,
  };
}

export interface CreatePollInput {
  question: string;
  options: string[];
  partnerName?: string;
  partnerId?: string;
  type?: 'sponsored' | 'featured' | 'standard';
  accentColor?: string;
  tagline?: string;
}

export async function createPoll(input: CreatePollInput): Promise<{ success: boolean; id?: string; error?: string }> {
  const question = (input.question || '').trim();
  const opts = (input.options || []).map((o) => (o || '').trim()).filter(Boolean);
  if (!question || opts.length < 2 || opts.length > 4) {
    return { success: false, error: 'Question and 2–4 options are required.' };
  }
  try {
    const optionVotes: Record<string, number> = {};
    opts.forEach((_, i) => { optionVotes[String(i)] = 0; });
    const ref = await addDoc(collection(db, 'polls'), {
      question,
      options: opts.map((l) => ({ label: l })),
      optionVotes,
      totalVotes: 0,
      partnerName: (input.partnerName || '').trim() || 'OrbTap',
      partnerId: input.partnerId || null,
      type: input.type || 'standard',
      timeLeft: '7d',
      accentColor: (input.accentColor || '').trim() || null,
      tagline: (input.tagline || '').trim() || null,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to create poll.' };
  }
}

export async function getPolls(): Promise<Poll[]> {
  try {
    const q = query(
      collection(db, 'polls'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const polls = snap.docs.map((d) => firestorePollToPoll(d.id, d.data()));
    return polls;
  } catch (e: any) {
    // e.g. missing Firestore index on polls (createdAt desc), or permission/network
    if (__DEV__ && e?.message) console.warn('[getPolls]', e.message);
    return [];
  }
}

/** Get polls for a partner (for dashboard badges). */
export async function getPollsForPartner(partnerId: string): Promise<Poll[]> {
  try {
    const q = query(
      collection(db, 'polls'),
      where('partnerId', '==', partnerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => firestorePollToPoll(d.id, d.data()));
  } catch (e: any) {
    if (__DEV__ && e?.message) console.warn('[getPollsForPartner]', e.message);
    return [];
  }
}

export async function hasUserVoted(pollId: string, userId: string): Promise<boolean> {
  try {
    const ref = doc(db, 'pollVotes', `${pollId}_${userId}`);
    const snap = await getDoc(ref);
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getUserVoteOption(pollId: string, userId: string): Promise<number | null> {
  try {
    const ref = doc(db, 'pollVotes', `${pollId}_${userId}`);
    const snap = await getDoc(ref);
    const data = snap.data();
    return data?.optionIndex != null ? data.optionIndex : null;
  } catch {
    return null;
  }
}

export async function submitVote(
  pollId: string,
  optionIndex: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const voteId = `${pollId}_${userId}`;
  const voteRef = doc(db, 'pollVotes', voteId);
  const pollRef = doc(db, 'polls', pollId);

  try {
    await runTransaction(db, async (tx) => {
      const voteSnap = await tx.get(voteRef);
      if (voteSnap.exists()) {
        throw new Error('You have already voted on this poll.');
      }
      const pollSnap = await tx.get(pollRef);
      if (!pollSnap.exists()) {
        throw new Error('Poll not found.');
      }
      const data = pollSnap.data();
      const optCount = (data?.options || []).length;
      if (optionIndex < 0 || optionIndex >= optCount) {
        throw new Error('Invalid option.');
      }
      tx.set(voteRef, {
        pollId,
        userId,
        optionIndex,
        createdAt: serverTimestamp(),
      });
      tx.update(pollRef, {
        [`optionVotes.${optionIndex}`]: increment(1),
        totalVotes: increment(1),
      });
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to submit vote.' };
  }
}

const PARTNER_DELETE_POLL_WINDOW_MS = 8 * 60 * 60 * 1000; // 8 hours

/** True if the current user can delete this poll: admin anytime, or partner within 8h of creation. */
export function canDeletePoll(poll: Poll, userId: string | undefined, isAdmin: boolean): boolean {
  if (!userId) return false;
  if (isAdmin) return true;
  if (poll.partnerId !== userId) return false;
  if (poll.createdAt == null) return false;
  return Date.now() - poll.createdAt < PARTNER_DELETE_POLL_WINDOW_MS;
}

/**
 * Delete a poll. Allowed for admin anytime, or for the creating partner within 8 hours.
 * Uses a callable so rules stay deny; server enforces policy.
 */
export async function deletePoll(pollId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const f = getFunctions(app, 'us-central1');
    const fn = httpsCallable<{ pollId: string }, { success: boolean; message?: string }>(f, 'deletePoll');
    const result = await fn({ pollId });
    const data = result.data;
    if (data?.success) return { success: true };
    return { success: false, error: data?.message ?? 'Failed to delete poll.' };
  } catch (e: any) {
    return { success: false, error: e?.message ?? e?.data?.message ?? 'Failed to delete poll.' };
  }
}
