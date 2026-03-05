/**
 * OrbBounty™ — Data hook: feed, my bounties, partner inbox, and actions.
 */

import { useState, useCallback, useEffect } from 'react';
import * as api from '../services/orbBounty';
import type { BountyDoc, BidDoc } from '../constants/orbBounty';

type TabKey = 'feed' | 'mine' | 'inbox';

export function useOrbBounty() {
  const [feed, setFeed] = useState<BountyDoc[]>([]);
  const [myBounties, setMyBounties] = useState<BountyDoc[]>([]);
  const [inbox, setInbox] = useState<BountyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async (opts?: { cityId?: string; category?: 'food' | 'retail' | 'services'; highLikelihood?: boolean }) => {
    const res = await api.bountyFeed({ limit: 30, ...opts });
    if (res.success) {
      setFeed(res.bounties ?? []);
      setError(null);
    } else {
      setError(res.message ?? 'Failed to load feed');
    }
  }, []);

  const loadMyBounties = useCallback(async () => {
    const res = await api.bountyListMine(50);
    if (res.success) {
      setMyBounties(res.bounties ?? []);
      setError(null);
    } else {
      setError(res.message ?? 'Failed to load your bounties');
    }
  }, []);

  const loadInbox = useCallback(async () => {
    const res = await api.bountyFeed({ limit: 50 });
    if (res.success) {
      setInbox(res.bounties ?? []);
      setError(null);
    } else {
      setError(res.message ?? 'Failed to load inbox');
    }
  }, []);

  const refresh = useCallback(async (tab: TabKey) => {
    setLoading(true);
    setError(null);
    if (tab === 'feed') await loadFeed();
    else if (tab === 'mine') await loadMyBounties();
    else await loadInbox();
    setLoading(false);
  }, [loadFeed, loadMyBounties, loadInbox]);

  // No initial load here — the bounty index screen calls refresh(tab) on mount and when tab changes
  return {
    feed,
    myBounties,
    inbox,
    loading,
    error,
    refresh,
    loadFeed,
    loadMyBounties,
    loadInbox,
  };
}

export function useBountyDetail(bountyId: string | null) {
  const [bounty, setBounty] = useState<BountyDoc | null>(null);
  const [bids, setBids] = useState<BidDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!bountyId) return;
    setLoading(true);
    const res = await api.bountyGet(bountyId);
    if (res.success) {
      setBounty(res.bounty);
      setBids(res.bids);
      setError(null);
    } else {
      setError(res.message);
      setBounty(null);
      setBids([]);
    }
    setLoading(false);
  }, [bountyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { bounty, bids, loading, error, refresh: load };
}
