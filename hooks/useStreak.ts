import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'ORBTAP_STREAK_V1';

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastCheckInDate: string | null;
}

export const useStreak = () => {
  const [streak, setStreak] = useState<StreakState>({
    currentStreak: 0,
    bestStreak: 0,
    lastCheckInDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const getToday = () => new Date().toISOString().split('T')[0];

  const loadStreak = async () => {
    try {
      const data = await AsyncStorage.getItem(STREAK_KEY);
      if (data) {
        setStreak(JSON.parse(data));
      }
    } catch (e) {
      if (__DEV__) console.error('Streak load failed', e);
    } finally {
      setLoading(false);
    }
  };

  const saveStreak = async (newState: StreakState) => {
    setStreak(newState);
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newState));
  };

  /** Returns YYYY-MM-DD for yesterday */
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const checkIn = () => {
    const today = getToday();
    const yesterday = getYesterday();
    const { currentStreak, bestStreak, lastCheckInDate } = streak;

    if (lastCheckInDate === today) return currentStreak; // Already checked in today

    let newCurrent = 1;
    if (lastCheckInDate === yesterday) {
      newCurrent = currentStreak + 1; // Consecutive day: extend streak
    }
    // If lastCheckInDate is older than yesterday, streak resets to 1

    const newBest = Math.max(newCurrent, bestStreak);

    saveStreak({
      currentStreak: newCurrent,
      bestStreak: newBest,
      lastCheckInDate: today,
    });

    return newCurrent;
  };

  const canCheckIn = streak.lastCheckInDate !== getToday();

  return { streak, loading, checkIn, canCheckIn };
};
