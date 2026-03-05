/**
 * Stamp Cards™ — user hook: my stamp states, reward locker, earn stamp.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { getStampUserState, getStampProgram, getActiveStampProgramForPartner, earnStamp as apiEarnStamp } from '../services/stampCardsApi';
import type { StampProgram, StampCardState, StampActiveReward } from '../constants/StampCards';
import {
  ALL_DEMO_STAMP_CARDS,
  isOrbTapUniverseStamp,
} from '../constants/DemoStampCard';

export interface StampCardWithProgram {
  state: StampCardState & { id: string };
  program: (StampProgram & { id: string }) | null;
}

export interface RewardLockerItem {
  stateId: string;
  programId: string;
  partnerId: string;
  reward: StampActiveReward;
  program: (StampProgram & { id: string }) | null;
}

export function useStampCards(enabled: boolean) {
  const [states, setStates] = useState<(StampCardState & { id: string })[]>([]);
  const [programs, setPrograms] = useState<Record<string, StampProgram & { id: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setStates([]);
      setPrograms({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getStampUserState();
      if (!result.success || !('states' in result)) {
        setStates([]);
        setPrograms({});
        return;
      }
      const stateList = result.states;
      setStates(stateList);
      const programIds = [...new Set(stateList.map((s) => s.programId))];
      const programMap: Record<string, StampProgram & { id: string }> = {};
      await Promise.all(
        programIds.map(async (programId) => {
          const res = await getStampProgram(programId);
          if (res.success && res.program) programMap[programId] = res.program;
        })
      );
      setPrograms(programMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stamp cards');
      setStates([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const cardsWithPrograms: StampCardWithProgram[] = useMemo(() => {
    const list = states.map((state) => ({
      state,
      program: state.programId ? programs[state.programId] ?? null : null,
    }));
    const hasOrbTapUniverse = list.some((c) => isOrbTapUniverseStamp(c.state.partnerId, c.state.programId));
    if (enabled && !hasOrbTapUniverse) {
      list.push(...ALL_DEMO_STAMP_CARDS);
    }
    return list;
  }, [states, programs, enabled]);

  const rewardLocker: RewardLockerItem[] = useMemo(
    () =>
      states
        .filter((s) => s.activeReward && (s.activeReward as StampActiveReward).status === 'EARNED')
        .map((s) => ({
          stateId: s.id,
          programId: s.programId,
          partnerId: s.partnerId,
          reward: s.activeReward as StampActiveReward,
          program: programs[s.programId] ?? null,
        })),
    [states, programs]
  );

  const earnStamp = useCallback(
    async (partnerId: string, programId: string, tokenId?: string) => {
      const result = await apiEarnStamp({ partnerId, programId, tokenId });
      if (result.success) await load();
      return result;
    },
    [load]
  );

  const activeCardCount = cardsWithPrograms.filter((c) => c.program?.status === 'ACTIVE').length;
  const rewardReadyCount = rewardLocker.length;

  return {
    states,
    programs,
    cardsWithPrograms,
    rewardLocker,
    loading,
    error,
    refetch: load,
    earnStamp,
    activeCardCount,
    rewardReadyCount,
  };
}

/** Lightweight hook: program + state for a single partner (e.g. OrbSheet). Returns { program, state, loading }. */
export function useStampStateForPartner(
  partnerId: string | undefined | null,
  enabled: boolean
): {
  program: (StampProgram & { id: string }) | null;
  state: (StampCardState & { id: string }) | null;
  loading: boolean;
} {
  const [program, setProgram] = useState<(StampProgram & { id: string }) | null>(null);
  const [state, setState] = useState<(StampCardState & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !partnerId) {
      setProgram(null);
      setState(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const progRes = await getActiveStampProgramForPartner(partnerId);
      if (cancelled) return;
      if (!progRes.success || !progRes.program) {
        setProgram(null);
        setState(null);
        setLoading(false);
        return;
      }
      setProgram(progRes.program);
      const stateRes = await getStampUserState(progRes.program.id);
      if (cancelled) return;
      if (stateRes.success && 'state' in stateRes && stateRes.state) {
        setState(stateRes.state);
      } else {
        const syntheticId = `${partnerId}_${progRes.program.id}`;
        setState({ id: syntheticId, uid: '', programId: progRes.program.id, partnerId, stampCount: 0, lastStampAt: null, completedCount: 0, activeReward: null, updatedAt: Date.now() });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [enabled, partnerId]);

  return { program, state, loading };
}

/** Whether the current user can leave a verified review for this partner (has completed/redeemed a stamp card). */
export function useCanLeaveVerifiedReview(partnerId: string | null, enabled: boolean): boolean {
  const [eligible, setEligible] = useState(false);
  useEffect(() => {
    if (!enabled || !partnerId) {
      setEligible(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const progRes = await import('../services/stampCardsApi').then((m) => m.getActiveStampProgramForPartner(partnerId));
      if (cancelled || !progRes.success || !progRes.program) {
        if (!cancelled) setEligible(false);
        return;
      }
      const stateRes = await import('../services/stampCardsApi').then((m) => m.getStampUserState(progRes.program.id));
      if (cancelled) return;
      if (stateRes.success && 'state' in stateRes && stateRes.state) {
        const st = stateRes.state as { completedCount?: number; activeReward?: { status?: string } };
        const ok = (st.completedCount ?? 0) >= 1 || (st.activeReward?.status === 'REDEEMED');
        setEligible(ok);
      } else {
        setEligible(false);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, partnerId]);
  return eligible;
}
