/**
 * OrbVote polls — fetches from Firestore, falls back to MOCK_POLLS when empty
 * only if demo data is on and admin has "Show demo polls" on. Single demo toggle controls all mock surfaces.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_POLLS, type Poll } from '../constants/Polls';
import { getShowDemoPolls } from './useShowDemoPolls';
import { useDemoDataEnabled } from './useDemoDataEnabled';
import * as pollsService from '../services/polls';

export function usePolls() {
  const { user } = useAuth();
  const { demoDataEnabled } = useDemoDataEnabled();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedMap, setVotedMap] = useState<Record<string, number | null>>({});

  const [fromFirestore, setFromFirestore] = useState(false);

  const loadPolls = useCallback(async () => {
    setLoading(true);
    const firestorePolls = await pollsService.getPolls();
    if (firestorePolls.length > 0) {
      setPolls(firestorePolls);
      setFromFirestore(true);
    } else {
      const showDemoPolls = await getShowDemoPolls();
      const showDemo = demoDataEnabled && showDemoPolls;
      setPolls(showDemo ? MOCK_POLLS : []);
      setFromFirestore(false);
    }
    setLoading(false);
  }, [demoDataEnabled]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  useEffect(() => {
    if (!user?.uid) return;
    const loadVoted = async () => {
      const map: Record<string, number | null> = {};
      for (const p of polls) {
        const idx = await pollsService.getUserVoteOption(p.id, user.uid);
        map[p.id] = idx;
      }
      setVotedMap(map);
    };
    loadVoted();
  }, [user?.uid, polls.length]);

  const submitVote = useCallback(
    async (pollId: string, optionIndex: number): Promise<{ success: boolean; error?: string }> => {
      if (!user?.uid) return { success: false, error: 'Sign in to vote.' };
      const result = await pollsService.submitVote(pollId, optionIndex, user.uid);
      if (result.success) {
        setVotedMap((prev) => ({ ...prev, [pollId]: optionIndex }));
        setPolls((prev) =>
          prev.map((p) => {
            if (p.id !== pollId) return p;
            const newOptions = p.options.map((o, i) =>
              i === optionIndex ? { ...o, votes: o.votes + 1 } : o
            );
            return {
              ...p,
              options: newOptions,
              totalVotes: p.totalVotes + 1,
            };
          })
        );
      }
      return result;
    },
    [user?.uid]
  );

  const hasVoted = useCallback(
    (pollId: string) => votedMap[pollId] != null,
    [votedMap]
  );

  const getVotedOption = useCallback(
    (pollId: string) => votedMap[pollId] ?? null,
    [votedMap]
  );

  return {
    polls,
    loading,
    refresh: loadPolls,
    submitVote,
    hasVoted,
    getVotedOption,
    /** True when polls were loaded from Firestore (vote persistence works). False when using MOCK fallback. */
    fromFirestore,
  };
}
