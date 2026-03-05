/**
 * Hook for follow/unfollow partners in OrbFeed Following mode.
 * Returns the set of followed partner IDs and follow/unfollow actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { followPartner, unfollowPartner, getFollowingPartnerIds } from '../services/followPartners';

export interface UseFollowingResult {
  following: Set<string>;
  isLoading: boolean;
  follow: (partnerId: string) => Promise<void>;
  unfollow: (partnerId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFollowing(): UseFollowingResult {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.uid) {
      setFollowing(new Set());
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const ids = await getFollowingPartnerIds(user.uid);
      setFollowing(new Set(ids));
    } catch {
      setFollowing(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const follow = useCallback(
    async (partnerId: string) => {
      if (!user?.uid) return;
      try {
        await followPartner(user.uid, partnerId);
        setFollowing((prev) => new Set([...prev, partnerId]));
      } catch (e) {
        if (__DEV__) console.warn('Follow failed:', e);
      }
    },
    [user?.uid]
  );

  const unfollow = useCallback(
    async (partnerId: string) => {
      if (!user?.uid) return;
      try {
        await unfollowPartner(user.uid, partnerId);
        setFollowing((prev) => {
          const next = new Set(prev);
          next.delete(partnerId);
          return next;
        });
      } catch (e) {
        if (__DEV__) console.warn('Unfollow failed:', e);
      }
    },
    [user?.uid]
  );

  return { following, isLoading, follow, unfollow, refresh: load };
}
