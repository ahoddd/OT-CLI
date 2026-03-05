/**
 * OrbFeed posts — Firestore persistence.
 * Collection: posts
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { OrbPost, OrbPostType, CtaKind, ModerationStatus } from '../constants/OrbFeed';
import type { Drop } from '../constants/Drops';
import type { DropCategory } from '../constants/Drops';
import type { PartnerTier } from '../constants/PartnerTiers';

export interface CreateOrbPostInput {
  partnerId: string;
  partnerName: string;
  partnerVerified: boolean;
  type: OrbPostType;
  title: string;
  body: string;
  mediaRefs: string[];
  tags?: string[];
  ctaKind: CtaKind;
  ctaTargetRef?: string;
  scarcity?: { quantityRemaining?: number; expiresAt?: number };
  moderatedBy: 'system' | 'bypass';
  /** When 'DRAFT', relaxed validation and moderationStatus = DRAFT. */
  status?: 'DRAFT' | 'PUBLISHED';
  scheduledAt?: number;
}

function docToOrbPost(id: string, data: any): OrbPost {
  const ctaKind = (data.ctaKind || 'NAVIGATE') as CtaKind;
  return {
    id,
    partnerId: data.partnerId || '',
    partnerName: data.partnerName || 'Partner',
    partnerVerified: !!data.partnerVerified,
    cityId: data.cityId || 'default',
    type: (data.type || 'ANNOUNCEMENT') as OrbPostType,
    title: data.title || '',
    body: data.body || '',
    mediaRefs: data.mediaRefs || [],
    tags: data.tags || [],
    cta: {
      kind: ctaKind,
      targetRef: data.ctaTargetRef || `partner_${data.partnerId}`,
      currency: 'USD',
    },
    scarcity: data.scarcity || undefined,
    trust: {
      partnerVerifiedRequired: true,
      moderationStatus: (data.moderationStatus || 'PUBLISHED') as ModerationStatus,
      moderatedBy: data.moderatedBy || 'system',
    },
    stats: {
      impressions: 0,
      opens: 0,
      saves: 0,
      ctaClicks: 0,
      claims: 0,
      redemptionsVerified: 0,
    },
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt || Date.now(),
    publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toMillis() : data.publishedAt,
  };
}

const DROP_CATEGORIES: DropCategory[] = ['coffee', 'food', 'fitness', 'events', 'explore', 'social'];

/** Map a published DROP OrbPost to the Drop shape used by OrbSwipe deck. */
export function orbPostToDrop(post: OrbPost): Drop {
  const startAt = post.publishedAt ?? post.createdAt;
  const HOUR_MS = 60 * 60 * 1000;
  const endAt = post.scarcity?.expiresAt ?? startAt + 24 * HOUR_MS;
  const qty = post.scarcity?.quantityRemaining ?? 99;
  let category: DropCategory = 'food';
  if (post.tags?.length) {
    const found = DROP_CATEGORIES.find((c) => post.tags!.includes(c));
    if (found) category = found;
  }
  return {
    id: post.id,
    partnerId: post.partnerId,
    partnerName: post.partnerName,
    title: post.title,
    description: post.body,
    category,
    tier: (post.partnerVerified ? 'gold' : 'silver') as PartnerTier,
    imageUrl: post.mediaRefs?.[0],
    startAt,
    endAt,
    qtyTotal: qty,
    qtyRemaining: qty,
    reserveFeePoints: 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export async function createOrbPost(input: CreateOrbPostInput): Promise<{ success: boolean; id?: string; error?: string }> {
  const isDraft = input.status === 'DRAFT';
  const title = (input.title || '').trim();
  const body = (input.body || '').trim();
  if (!input.partnerId) {
    return { success: false, error: 'Partner ID is required.' };
  }
  if (!isDraft) {
    if (!title || title.length < 6 || title.length > 60) {
      return { success: false, error: 'Title must be 6–60 characters.' };
    }
    if (!body || body.length < 20 || body.length > 400) {
      return { success: false, error: 'Body must be 20–400 characters.' };
    }
  }

  try {
    const now = Date.now();
    const ref = await addDoc(collection(db, 'posts'), {
      partnerId: input.partnerId,
      partnerName: (input.partnerName || '').trim() || 'Partner',
      partnerVerified: !!input.partnerVerified,
      cityId: 'default',
      type: input.type || 'ANNOUNCEMENT',
      title: title || '(Draft)',
      body: body || '',
      mediaRefs: input.mediaRefs || [],
      tags: input.tags || [],
      ctaKind: input.ctaKind || 'NAVIGATE',
      ctaTargetRef: input.ctaTargetRef || `partner_${input.partnerId}`,
      scarcity: input.scarcity || null,
      moderationStatus: isDraft ? 'DRAFT' : 'PUBLISHED',
      moderatedBy: input.moderatedBy || 'system',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: isDraft ? null : serverTimestamp(),
      scheduledAt: input.scheduledAt || null,
    });
    return { success: true, id: ref.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to create post.' };
  }
}

export async function getOrbPosts(limitCount: number = 100): Promise<OrbPost[]> {
  try {
    const q = query(
      collection(db, 'posts'),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const posts = snap.docs
      .map((d) => docToOrbPost(d.id, d.data()))
      .filter((p) => p.trust.moderationStatus === 'PUBLISHED');
    return posts;
  } catch {
    return [];
  }
}

/** List posts for a partner (includes drafts). */
export async function getOrbPostsForPartner(partnerId: string, limitCount: number = 50): Promise<OrbPost[]> {
  if (!partnerId?.trim()) return [];
  try {
    const q = query(
      collection(db, 'posts'),
      where('partnerId', '==', partnerId.trim()),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToOrbPost(d.id, d.data()));
  } catch {
    return [];
  }
}

/** Admin: list all posts (any status) for moderation/delete. */
export async function getOrbPostsForAdmin(limitCount: number = 100): Promise<OrbPost[]> {
  try {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToOrbPost(d.id, d.data()));
  } catch {
    return [];
  }
}

export async function getOrbPostById(postId: string): Promise<OrbPost | null> {
  if (!postId?.trim()) return null;
  try {
    const snap = await getDoc(doc(db, 'posts', postId.trim()));
    if (!snap.exists()) return null;
    const p = docToOrbPost(snap.id, snap.data());
    return p.trust.moderationStatus === 'PUBLISHED' ? p : null;
  } catch {
    return null;
  }
}
