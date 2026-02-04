/**
 * OrbArena™ — Competition hub hook.
 * Contests, entries, submit, vote (idempotent), eligibility, trust placeholder, integrity stats.
 * Uses WalletContext verifiedActions for eligibility; MVP storage in AsyncStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Contest,
  type ArenaEntry,
  type ArenaVote,
  type TrustProfile,
  type ArenaCategory,
  getMockWeeklyContest,
  ARENA_ENTRIES_KEY,
  ARENA_VOTES_KEY,
  ARENA_TRUST_KEY,
} from '../constants/Arena';
import { useFlags } from '../components/FlagContext';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../context/AuthContext';

const USER_ID = 'local_user'; // MVP: replace with auth.uid when wired

export interface IntegrityStats {
  totalVotes: number;
  quarantinedCount: number;
  lowTrustCount: number;
  cleanVotesPercent: number;
}

export interface UseArenaResult {
  contest: Contest | null;
  entries: ArenaEntry[];
  loading: boolean;
  canSubmit: boolean;
  canVote: boolean;
  trustScore: number;
  submitEntry: (params: {
    contestId: string;
    verifiedActionId: string;
    category: ArenaCategory;
    caption: string;
    partnerId: string;
  }) => Promise<ArenaEntry | null>;
  vote: (params: { contestId: string; entryId: string; clientNonce: string }) => Promise<boolean>;
  getVoteForEntry: (contestId: string, entryId: string) => ArenaVote | null;
  getIntegrityStats: (contestId: string) => IntegrityStats;
  refresh: () => Promise<void>;
}

function getTrustScoreSync(verifiedCount: number): number {
  return verifiedCount >= 1 ? 100 : 0;
}

export function useArena(): UseArenaResult {
  const { flags } = useFlags();
  const { verifiedActions } = useWallet();
  const { user } = useAuth();
  const uid = user?.uid ?? USER_ID;

  const [contest, setContest] = useState<Contest | null>(null);
  const [entries, setEntries] = useState<ArenaEntry[]>([]);
  const [votes, setVotes] = useState<ArenaVote[]>([]);
  const [loading, setLoading] = useState(true);

  const canSubmit = Boolean(
    flags.isOrbArenaSubmitEnabled &&
      verifiedActions.length >= 1 &&
      contest &&
      (contest.status === 'LIVE' || contest.status === 'VOTING')
  );
  const canVote = Boolean(
    flags.isOrbArenaVoteEnabled &&
      verifiedActions.length >= 1 &&
      contest &&
      contest.status === 'VOTING'
  );
  const trustScore = getTrustScoreSync(verifiedActions.length);

  const loadEntries = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ARENA_ENTRIES_KEY);
      const list: ArenaEntry[] = raw ? JSON.parse(raw) : [];
      setEntries(Array.isArray(list) ? list.filter((e) => e.status === 'ACTIVE') : []);
    } catch {
      setEntries([]);
    }
  }, []);

  const loadVotes = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ARENA_VOTES_KEY);
      const list: ArenaVote[] = raw ? JSON.parse(raw) : [];
      setVotes(Array.isArray(list) ? list : []);
    } catch {
      setVotes([]);
    }
  }, []);

  useEffect(() => {
    if (!flags.isOrbArenaEnabled) {
      setContest(null);
      setEntries([]);
      setVotes([]);
      setLoading(false);
      return;
    }
    setContest(getMockWeeklyContest());
    (async () => {
      await loadEntries();
      await loadVotes();
      setLoading(false);
    })();
  }, [flags.isOrbArenaEnabled, loadEntries, loadVotes]);

  const refresh = useCallback(async () => {
    setContest(getMockWeeklyContest());
    await loadEntries();
    await loadVotes();
  }, [loadEntries, loadVotes]);

  const submitEntry = useCallback(
    async (params: {
      contestId: string;
      verifiedActionId: string;
      category: ArenaCategory;
      caption: string;
      partnerId: string;
    }): Promise<ArenaEntry | null> => {
      const validAction = verifiedActions.some((a) => a.id === params.verifiedActionId);
      if (!validAction) return null;
      const existing = entries.filter(
        (e) => e.contestId === params.contestId && e.uid === uid && e.category === params.category
      );
      if (existing.length >= 1) return null;
      const entry: ArenaEntry = {
        id: `entry_${Date.now()}`,
        contestId: params.contestId,
        uid,
        category: params.category,
        verifiedActionId: params.verifiedActionId,
        partnerId: params.partnerId,
        caption: params.caption,
        mediaRefs: [],
        createdAt: Date.now(),
        status: 'ACTIVE',
      };
      const next = [entry, ...entries];
      setEntries(next);
      try {
        await AsyncStorage.setItem(ARENA_ENTRIES_KEY, JSON.stringify(next));
      } catch {}
      return entry;
    },
    [entries, uid, verifiedActions]
  );

  const vote = useCallback(
    async (params: { contestId: string; entryId: string; clientNonce: string }): Promise<boolean> => {
      const existing = votes.find(
        (v) =>
          v.contestId === params.contestId &&
          v.voterUid === uid &&
          (v.entryId === params.entryId || v.clientNonce === params.clientNonce)
      );
      if (existing) return existing.entryId === params.entryId;
      const weight = flags.isOrbArenaVoteWeightingEnabled ? trustScore / 100 : 1;
      const voteRecord: ArenaVote = {
        id: `vote_${Date.now()}`,
        contestId: params.contestId,
        entryId: params.entryId,
        voterUid: uid,
        voterTrustScoreSnapshot: trustScore,
        weightApplied: weight,
        createdAt: Date.now(),
        status: 'COUNTED',
        clientNonce: params.clientNonce,
      };
      const next = [voteRecord, ...votes];
      setVotes(next);
      try {
        await AsyncStorage.setItem(ARENA_VOTES_KEY, JSON.stringify(next));
      } catch {}
      return true;
    },
    [votes, uid, trustScore, flags.isOrbArenaVoteWeightingEnabled]
  );

  const getVoteForEntry = useCallback(
    (contestId: string, entryId: string): ArenaVote | null => {
      return votes.find((v) => v.contestId === contestId && v.voterUid === uid && v.entryId === entryId) ?? null;
    },
    [votes, uid]
  );

  const getIntegrityStats = useCallback(
    (contestId: string): IntegrityStats => {
      const contestVotes = votes.filter((v) => v.contestId === contestId && v.status === 'COUNTED');
      const quarantined = votes.filter((v) => v.contestId === contestId && v.status === 'QUARANTINED');
      const lowTrust = contestVotes.filter((v) => v.voterTrustScoreSnapshot < 50).length;
      const total = contestVotes.length + quarantined.length;
      const clean = total > 0 ? Math.round((contestVotes.length / total) * 100) : 100;
      return {
        totalVotes: contestVotes.length,
        quarantinedCount: quarantined.length,
        lowTrustCount: lowTrust,
        cleanVotesPercent: clean,
      };
    },
    [votes]
  );

  return {
    contest,
    entries,
    loading,
    canSubmit,
    canVote,
    trustScore,
    submitEntry,
    vote,
    getVoteForEntry,
    getIntegrityStats,
    refresh,
  };
}
