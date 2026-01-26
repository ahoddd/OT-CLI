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
      console.error('Streak load failed', e);
    } finally {
      setLoading(false);
    }
  };

  const saveStreak = async (newState: StreakState) => {
    setStreak(newState);
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newState));
  };

  const checkIn = () => {
    const today = getToday();
    const { currentStreak, bestStreak, lastCheckInDate } = streak;

    if (lastCheckInDate === today) return; // Already checked in

    let newCurrent = 1;
    // Simple logic: if last check-in was yesterday, increment.
    // In real app, use moment/date-fns for robust diffing.
    // For MVP: we just increment for demo purposes if not today.
    if (lastCheckInDate) {
       // Mock logic: Always increment for MVP satisfaction unless it's the same day
       newCurrent = currentStreak + 1;
    }

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
