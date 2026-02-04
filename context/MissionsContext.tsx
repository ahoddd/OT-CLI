import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MISSIONS, MOCK_PARTNERS, type Mission } from '../constants/MockData';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface DailyMission {
  id: string;
  missionId: string;
  title: string;
  description: string;
  mealSlot: MealSlot;
  rewardPoints: number;
  partnerId?: string;
  completed: boolean;
  completedAt?: number;
}

export type GenerateOption = 'all' | 'lunch_dinner' | 'dinner';

const MISSIONS_STORAGE_KEY = 'ORBTAP_DAILY_MISSIONS_V1';
const MISSIONS_DATE_KEY = 'ORBTAP_DAILY_MISSIONS_DATE';
const TOTAL_COMPLETED_KEY = 'ORBTAP_MISSIONS_TOTAL_COMPLETED_V1';

/** Map mission type / pool to meal slots for generation */
const BREAKFAST_MISSION_IDS = ['m1', 'm5'];
const LUNCH_MISSION_IDS = ['m4', 'm3'];
const DINNER_MISSION_IDS = ['m7', 'm2'];

function getMissionById(id: string): Mission | undefined {
  return MOCK_MISSIONS.find((m) => m.id === id);
}

function buildDailyMission(mission: Mission, mealSlot: MealSlot, index: number): DailyMission {
  return {
    id: `dm_${Date.now()}_${index}`,
    missionId: mission.id,
    title: mission.title,
    description: mission.description,
    mealSlot,
    rewardPoints: mission.rewardPoints,
    partnerId: mission.partnerId,
    completed: false,
  };
}

function getMissionsForOption(option: GenerateOption): DailyMission[] {
  const out: DailyMission[] = [];
  let i = 0;
  if (option === 'all') {
    const b = getMissionById(BREAKFAST_MISSION_IDS[0]);
    const l = getMissionById(LUNCH_MISSION_IDS[0]);
    const d = getMissionById(DINNER_MISSION_IDS[0]);
    if (b) out.push(buildDailyMission(b, 'breakfast', i++));
    if (l) out.push(buildDailyMission(l, 'lunch', i++));
    if (d) out.push(buildDailyMission(d, 'dinner', i++));
  } else if (option === 'lunch_dinner') {
    const l = getMissionById(LUNCH_MISSION_IDS[0]);
    const d = getMissionById(DINNER_MISSION_IDS[0]);
    if (l) out.push(buildDailyMission(l, 'lunch', i++));
    if (d) out.push(buildDailyMission(d, 'dinner', i++));
  } else {
    const d = getMissionById(DINNER_MISSION_IDS[0]);
    if (d) out.push(buildDailyMission(d, 'dinner', i++));
  }
  return out;
}

function isSameDay(ts: number): boolean {
  const d = new Date(ts);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

interface MissionsContextType {
  todayMissions: DailyMission[];
  generateMissions: (option: GenerateOption) => void;
  completeMission: (id: string) => void;
  totalRewardPoints: number;
  completedRewardPoints: number;
  totalMissionsCompletedCount: number;
  loading: boolean;
}

const MissionsContext = createContext<MissionsContextType | undefined>(undefined);

export function MissionsProvider({ children }: { children: React.ReactNode }) {
  const [todayMissions, setTodayMissions] = useState<DailyMission[]>([]);
  const [totalMissionsCompletedCount, setTotalMissionsCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [raw, dateRaw, totalRaw] = await Promise.all([
          AsyncStorage.getItem(MISSIONS_STORAGE_KEY),
          AsyncStorage.getItem(MISSIONS_DATE_KEY),
          AsyncStorage.getItem(TOTAL_COMPLETED_KEY),
        ]);
        const savedDate = dateRaw ? parseInt(dateRaw, 10) : 0;
        if (raw && isSameDay(savedDate)) {
          const parsed = JSON.parse(raw) as DailyMission[];
          setTodayMissions(Array.isArray(parsed) ? parsed : []);
        }
        if (totalRaw) setTotalMissionsCompletedCount(parseInt(totalRaw, 10) || 0);
      } catch (e) {
        console.warn('Missions load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (missions: DailyMission[]) => {
    try {
      await AsyncStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missions));
      await AsyncStorage.setItem(MISSIONS_DATE_KEY, String(Date.now()));
    } catch (e) {
      console.warn('Missions persist error:', e);
    }
  }, []);

  const generateMissions = useCallback(
    (option: GenerateOption) => {
      const next = getMissionsForOption(option);
      setTodayMissions(next);
      persist(next);
    },
    [persist]
  );

  const completeMission = useCallback(
    (id: string) => {
      setTodayMissions((prev) => {
        const next = prev.map((m) =>
          m.id === id ? { ...m, completed: true, completedAt: Date.now() } : m
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const totalRewardPoints = todayMissions.reduce((s, m) => s + m.rewardPoints, 0);
  const completedRewardPoints = todayMissions
    .filter((m) => m.completed)
    .reduce((s, m) => s + m.rewardPoints, 0);

  return (
    <MissionsContext.Provider
      value={{
        todayMissions,
        generateMissions,
        completeMission,
        totalRewardPoints,
        completedRewardPoints,
        totalMissionsCompletedCount,
        loading,
      }}
    >
      {children}
    </MissionsContext.Provider>
  );
}

export function useMissions() {
  const ctx = useContext(MissionsContext);
  if (!ctx) throw new Error('useMissions must be used within MissionsProvider');
  return ctx;
}
