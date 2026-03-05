/**
 * OrbProof Streaks — Verified Win Day streak from verified actions.
 * Awards capped daily/weekly bonuses via ledger.
 */

import { useMemo, useEffect, useCallback } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { LEDGER_REASON, DEFAULT_ORBINOMICS_POLICY } from '../constants/OrbinomicsPolicy';

const STREAK_BONUS_DAILY_CAP = 10;
const STREAK_BONUS_WEEKLY_CAP = 25;

export interface OrbProofStreakState {
  currentStreakDays: number;
  bestStreakDays: number;
  lastVerifiedDay: string | null;
  verifiedWinDays: string[];
}

function toDayKey(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().split('T')[0];
}

function getConsecutiveDaysBack(dayKeys: string[], fromDay: string): number {
  const set = new Set(dayKeys);
  let count = 0;
  const [y, m, d] = fromDay.split('-').map(Number);
  let date = new Date(y, m - 1, d);
  while (true) {
    const key = date.toISOString().split('T')[0];
    if (!set.has(key)) break;
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

export function useOrbProofStreak(): {
  streak: OrbProofStreakState;
  tryAwardStreakBonuses: () => void;
} {
  const { verifiedActions, history, addTransaction } = useWalletContext();

  const streak = useMemo((): OrbProofStreakState => {
    const dayKeys = [...new Set(verifiedActions.map((a) => toDayKey(a.createdAt)))].sort();
    const today = toDayKey(Date.now());
    const lastDay = dayKeys[dayKeys.length - 1] ?? null;
    const currentStreakDays = lastDay ? getConsecutiveDaysBack(dayKeys, lastDay) : 0;
    let bestStreakDays = 0;
    for (const day of dayKeys) {
      const run = getConsecutiveDaysBack(dayKeys, day);
      if (run > bestStreakDays) bestStreakDays = run;
    }
    return {
      currentStreakDays,
      bestStreakDays,
      lastVerifiedDay: lastDay,
      verifiedWinDays: dayKeys,
    };
  }, [verifiedActions]);

  const tryAwardStreakBonuses = useCallback(() => {
    const today = toDayKey(Date.now());
    if (!streak.verifiedWinDays.includes(today)) return;

    const todayStreakEarn = history
      .filter(
        (t) =>
          t.type === 'earn' &&
          (t.reason === LEDGER_REASON.EMIT_STREAK_DAILY_BONUS || t.reason === LEDGER_REASON.EMIT_STREAK_WEEKLY_BONUS) &&
          toDayKey(t.createdAt) === today
      )
      .reduce((s, t) => s + t.amount, 0);
    const dailyAlready = history.some(
      (t) => t.type === 'earn' && t.reason === LEDGER_REASON.EMIT_STREAK_DAILY_BONUS && toDayKey(t.createdAt) === today
    );
    const weeklyAlready = history.some(
      (t) =>
        t.type === 'earn' &&
        t.reason === LEDGER_REASON.EMIT_STREAK_WEEKLY_BONUS &&
        new Date(t.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (!dailyAlready && todayStreakEarn < STREAK_BONUS_DAILY_CAP) {
      const amount = Math.min(5, STREAK_BONUS_DAILY_CAP - todayStreakEarn);
      if (amount > 0) {
        addTransaction({
          type: 'earn',
          amount,
          reason: LEDGER_REASON.EMIT_STREAK_DAILY_BONUS,
        });
      }
    }

    if (streak.currentStreakDays >= 7 && !weeklyAlready) {
      const weekEarn = history
        .filter(
          (t) =>
            t.type === 'earn' &&
            t.reason === LEDGER_REASON.EMIT_STREAK_WEEKLY_BONUS &&
            new Date(t.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        )
        .reduce((s, t) => s + t.amount, 0);
      if (weekEarn < STREAK_BONUS_WEEKLY_CAP) {
        const amount = Math.min(25, STREAK_BONUS_WEEKLY_CAP - weekEarn);
        if (amount > 0) {
          addTransaction({
            type: 'earn',
            amount,
            reason: LEDGER_REASON.EMIT_STREAK_WEEKLY_BONUS,
          });
        }
      }
    }
  }, [streak.currentStreakDays, streak.lastVerifiedDay, streak.verifiedWinDays.length, history.length, history, addTransaction]);

  useEffect(() => {
    tryAwardStreakBonuses();
  }, [tryAwardStreakBonuses]);

  return { streak, tryAwardStreakBonuses };
}
