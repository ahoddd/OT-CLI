/**
 * OrbPulse Commerce Feed — fetches from Firestore, falls back to mock.
 * Respects user contentMode: moderated users don't see bypassed posts.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MOCK_ORB_POSTS, type OrbPost, type FeedMode } from '../constants/OrbFeed';
import type { ContentMode } from '../context/PreferencesContext';
import { useDemoDataEnabled } from './useDemoDataEnabled';
import { getOrbPosts } from '../services/orbPosts';

const NOW = Date.now();
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TONIGHT_END = NOW + SIX_HOURS_MS;

export interface UseOrbFeedResult {
  posts: OrbPost[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useOrbFeed(
  mode: FeedMode,
  contentMode: ContentMode = 'moderated',
  followingPartnerIds?: Set<string> | string[]
): UseOrbFeedResult {
  const { demoDataEnabled } = useDemoDataEnabled();
  const [firestorePosts, setFirestorePosts] = useState<OrbPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const posts = await getOrbPosts(100);
    setFirestorePosts(posts);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const posts = useMemo(() => {
    const source = demoDataEnabled && firestorePosts.length === 0 ? MOCK_ORB_POSTS : firestorePosts;
    let list = source.filter((p) => p.trust.moderationStatus === 'PUBLISHED');
    if (contentMode === 'moderated') {
      list = list.filter((p) => p.trust.moderatedBy !== 'bypass');
    }
    switch (mode) {
      case 'tonight':
        list = list.filter(
          (p) =>
            p.scarcity?.expiresAt != null && p.scarcity.expiresAt <= TONIGHT_END && p.scarcity.expiresAt > NOW
        );
        list.sort((a, b) => (a.scarcity?.expiresAt ?? 0) - (b.scarcity?.expiresAt ?? 0));
        break;
      case 'drops':
        list = list.filter((p) => p.type === 'DROP');
        list.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
        break;
      case 'new':
        list = list.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt)).slice(0, 20);
        break;
      case 'services':
        list = list.filter((p) => p.tags.some((t) => t === 'services') || p.type === 'SERVICE_SLOT');
        break;
      case 'following': {
        const followSet = followingPartnerIds instanceof Set ? followingPartnerIds : new Set(followingPartnerIds ?? []);
        list = followSet.size > 0 ? list.filter((p) => followSet.has(p.partnerId)) : [];
        list.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
        break;
      }
      case 'deals':
        list = list.filter((p) => p.tags.includes('deals') || p.cta.kind === 'CLAIM' || (p.cta.priceCents != null && p.cta.priceCents < 1000));
        list.sort((a, b) => (b.stats?.ctaClicks ?? 0) - (a.stats?.ctaClicks ?? 0));
        break;
      case 'polls':
        // Polls mode handled in Feed screen via usePolls
        list = [];
        break;
      case 'nearby':
      default:
        list = list.sort((a, b) => (b.ranking?.score ?? 0) - (a.ranking?.score ?? 0) || (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
        break;
    }
    return list;
  }, [mode, contentMode, demoDataEnabled, firestorePosts, followingPartnerIds]);

  const refresh = useCallback(async () => {
    await loadPosts();
  }, [loadPosts]);

  return { posts, loading, refresh };
}
