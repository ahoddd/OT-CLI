import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MISSION_TEMPLATES, type MissionTemplate } from '../constants/MockData';
import type { Partner } from '../constants/MockData';
import { useMissionsConfig } from '../hooks/useMissionsConfig';
import type { MissionsConfig } from '../constants/MissionsConfig';
import { usePartners } from './PartnersContext';
import type { MoodId } from '../constants/MissionsMoods';
import {
  MOOD_PRESETS,
  getMoodPreset,
  getStepsForIntensity,
  getTitleForMood,
  getDescForMood,
} from '../constants/MissionsMoods';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface DailyMissionStep {
  stepId: string;
  label: string;
  completed: boolean;
  partnerId?: string;
}

export interface DailyMission {
  id: string;
  missionId: string;
  title: string;
  description: string;
  mealSlot: MealSlot;
  rewardPoints: number;
  rewardSphereXp: number;
  partnerId?: string;
  /** Multi-step: when present, mission is complete only when all steps are done. */
  steps?: DailyMissionStep[];
  completed: boolean;
  completedAt?: number;
  /** Deadline timestamp (ms). Mission should be completed by this time. */
  deadlineAt: number;
}

export type GenerateOption = 'all' | 'lunch_dinner' | 'dinner';

const MISSIONS_STORAGE_KEY = 'ORBTAP_DAILY_MISSIONS_V2';
const MISSIONS_DATE_KEY = 'ORBTAP_DAILY_MISSIONS_DATE';
const TOTAL_COMPLETED_KEY = 'ORBTAP_MISSIONS_TOTAL_COMPLETED_V1';

function endOfToday(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function getDeadlineAt(config: MissionsConfig): number {
  if (config.deadlineEndOfDay) return endOfToday();
  return Date.now() + config.deadlineHoursFromNow * 60 * 60 * 1000;
}

const MAX_STEPS_PER_MISSION_DEFAULT = 1;

function buildDailyMissionFromTemplate(
  template: MissionTemplate,
  config: MissionsConfig,
  index: number,
  getPartner: (id: string) => Partner | undefined,
  overrides?: { title?: string; description?: string },
  maxSteps?: number
): DailyMission {
  const cap = Math.min(template.steps.length, maxSteps ?? config.maxStepsPerMission ?? MAX_STEPS_PER_MISSION_DEFAULT);
  const stepsToUse = template.steps.slice(0, Math.max(1, cap));
  const partnerIds = config.missionPartnerIds;
  const steps: DailyMissionStep[] = stepsToUse.map((s, i) => {
    const pid = partnerIds[i] ?? partnerIds[0];
    const partner = pid ? getPartner(pid) : undefined;
    const placeLabel = partner ? partner.name : (pid ? `Partner ${pid}` : 'Partner');
    let label = s.label;
    if (/first partner|second partner|third partner|first location|second location|partner/gi.test(s.label)) {
      label = s.label.replace(/first partner|second partner|third partner|first location|second location|partner/gi, placeLabel);
    } else if (s.label.includes('partner')) {
      label = placeLabel;
    }
    return {
      stepId: s.id,
      label,
      completed: false,
      partnerId: pid,
    };
  });
  return {
    id: `dm_${Date.now()}_${index}`,
    missionId: template.id,
    title: overrides?.title ?? template.title,
    description: overrides?.description ?? template.description,
    mealSlot: template.mealSlot ?? 'lunch',
    rewardPoints: config.rewardPointsPerMission,
    rewardSphereXp: config.rewardSphereXpPerMission,
    steps,
    completed: false,
    deadlineAt: getDeadlineAt(config),
  };
}

/** Find template by step count and optional meal slot. */
function findTemplateBySteps(stepsCount: number, mealSlot?: MealSlot): MissionTemplate {
  const match = MISSION_TEMPLATES.find((t) => t.steps.length === stepsCount && (!mealSlot || t.mealSlot === mealSlot));
  if (match) return match;
  const bySteps = MISSION_TEMPLATES.find((t) => t.steps.length === stepsCount);
  if (bySteps) return bySteps;
  return MISSION_TEMPLATES[Math.min(stepsCount - 1, MISSION_TEMPLATES.length - 1)];
}

function getMissionsForOption(
  option: GenerateOption,
  config: MissionsConfig,
  getPartner: (id: string) => Partner | undefined,
  moodId?: MoodId | null
): DailyMission[] {
  const out: DailyMission[] = [];
  let i = 0;
  const mood = moodId ? getMoodPreset(moodId) : null;
  const maxStepsPerMission = Math.min(3, Math.max(1, config.maxStepsPerMission ?? MAX_STEPS_PER_MISSION_DEFAULT));
  const stepCount = mood
    ? Math.min(getStepsForIntensity(mood.intensity), maxStepsPerMission)
    : maxStepsPerMission;

  const pickTemplate = (mealSlot: MealSlot): MissionTemplate => {
    return findTemplateBySteps(stepCount, mealSlot);
  };

  const overridesFor = (missionIndex: number) =>
    moodId
      ? { title: getTitleForMood(moodId, missionIndex), description: getDescForMood(moodId, missionIndex) }
      : undefined;

  if (option === 'all') {
    const maxMissions = Math.min(3, config.maxMissionsPerDay ?? 3);
    const breakfast = pickTemplate('breakfast');
    const lunch = pickTemplate('lunch');
    const dinner = pickTemplate('dinner');
    if (maxMissions >= 1) out.push(buildDailyMissionFromTemplate(breakfast, config, i, getPartner, overridesFor(i++), maxStepsPerMission));
    if (maxMissions >= 2) out.push(buildDailyMissionFromTemplate(lunch, config, i, getPartner, overridesFor(i++), maxStepsPerMission));
    if (maxMissions >= 3) out.push(buildDailyMissionFromTemplate(dinner, config, i, getPartner, overridesFor(i++), maxStepsPerMission));
  } else if (option === 'lunch_dinner') {
    const maxMissions = Math.min(2, config.maxMissionsPerDay ?? 3);
    const lunch = pickTemplate('lunch');
    const dinner = pickTemplate('dinner');
    if (maxMissions >= 1) out.push(buildDailyMissionFromTemplate(lunch, config, i, getPartner, overridesFor(i++), maxStepsPerMission));
    if (maxMissions >= 2) out.push(buildDailyMissionFromTemplate(dinner, config, i, getPartner, overridesFor(i++), maxStepsPerMission));
  } else {
    const dinner = pickTemplate('dinner');
    out.push(buildDailyMissionFromTemplate(dinner, config, i, getPartner, overridesFor(i++), maxStepsPerMission));
  }
  return out;
}

function isSameDay(ts: number): boolean {
  const d = new Date(ts);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export function isMissionFullyComplete(m: DailyMission): boolean {
  if (m.steps && m.steps.length > 0) {
    return m.steps.every((s) => s.completed);
  }
  return m.completed;
}

export function completedStepsCount(m: DailyMission): number {
  if (!m.steps) return m.completed ? 1 : 0;
  return m.steps.filter((s) => s.completed).length;
}

interface MissionsContextType {
  todayMissions: DailyMission[];
  selectedMood: MoodId | null;
  setSelectedMood: (mood: MoodId | null) => void;
  generateMissions: (option: GenerateOption, mood?: MoodId | null) => void;
  completeMission: (id: string) => void;
  completeStep: (missionId: string, stepIndex: number, onMissionFullyComplete?: () => void) => void;
  totalRewardPoints: number;
  completedRewardPoints: number;
  totalMissionsCompletedCount: number;
  dailyFullCompletionBonusPoints: number;
  loading: boolean;
}

const MissionsContext = createContext<MissionsContextType | undefined>(undefined);

const SELECTED_MOOD_KEY = 'ORBTAP_MISSIONS_SELECTED_MOOD';

export function MissionsProvider({ children }: { children: React.ReactNode }) {
  const { config: missionsConfig } = useMissionsConfig();
  const { getPartner } = usePartners();
  const [todayMissions, setTodayMissions] = useState<DailyMission[]>([]);
  const [totalMissionsCompletedCount, setTotalMissionsCompletedCount] = useState(0);
  const [selectedMood, setSelectedMoodState] = useState<MoodId | null>(null);
  const [loading, setLoading] = useState(true);

  const setSelectedMood = useCallback((mood: MoodId | null) => {
    setSelectedMoodState(mood);
    if (mood) AsyncStorage.setItem(SELECTED_MOOD_KEY, mood).catch(() => {});
    else AsyncStorage.removeItem(SELECTED_MOOD_KEY).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [raw, dateRaw, totalRaw, moodRaw] = await Promise.all([
          AsyncStorage.getItem(MISSIONS_STORAGE_KEY),
          AsyncStorage.getItem(MISSIONS_DATE_KEY),
          AsyncStorage.getItem(TOTAL_COMPLETED_KEY),
          AsyncStorage.getItem(SELECTED_MOOD_KEY),
        ]);
        const savedDate = dateRaw ? parseInt(dateRaw, 10) : 0;
        if (raw && isSameDay(savedDate)) {
          const parsed = JSON.parse(raw) as DailyMission[];
          setTodayMissions(Array.isArray(parsed) ? parsed : []);
        }
        if (totalRaw) setTotalMissionsCompletedCount(parseInt(totalRaw, 10) || 0);
        if (moodRaw && MOOD_PRESETS.some((p) => p.id === moodRaw)) setSelectedMoodState(moodRaw as MoodId);
      } catch (e) {
        if (__DEV__) console.warn('Missions load error:', e);
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
      if (__DEV__) console.warn('Missions persist error:', e);
    }
  }, []);

  const generateMissions = useCallback(
    (option: GenerateOption, mood?: MoodId | null) => {
      if (!missionsConfig.missionsEnabled) return;
      const moodToUse = mood !== undefined ? mood : selectedMood;
      const next = getMissionsForOption(option, missionsConfig, getPartner, moodToUse ?? undefined);
      setTodayMissions(next);
      persist(next);
    },
    [missionsConfig, persist, getPartner, selectedMood]
  );

  const completeStep = useCallback(
    (missionId: string, stepIndex: number, onMissionFullyComplete?: () => void) => {
      let didBecomeComplete = false;
      setTodayMissions((prev) => {
        const next = prev.map((m) => {
          if (m.id !== missionId || !m.steps || stepIndex < 0 || stepIndex >= m.steps.length) return m;
          const newSteps = m.steps.map((s, i) => (i === stepIndex ? { ...s, completed: true } : s));
          const allDone = newSteps.every((s) => s.completed);
          if (allDone && !m.completed) didBecomeComplete = true;
          return {
            ...m,
            steps: newSteps,
            completed: allDone,
            completedAt: allDone ? Date.now() : m.completedAt,
          };
        });
        persist(next);
        return next;
      });
      if (didBecomeComplete) {
        setTotalMissionsCompletedCount((c) => {
          const next = c + 1;
          AsyncStorage.setItem(TOTAL_COMPLETED_KEY, String(next));
          return next;
        });
        onMissionFullyComplete?.();
      }
    },
    [persist]
  );

  const completeMission = useCallback(
    (id: string) => {
      setTodayMissions((prev) => {
        const next = prev.map((m) => {
          if (m.id !== id) return m;
          if (m.steps && m.steps.length > 0) {
            const newSteps = m.steps.map((s) => ({ ...s, completed: true }));
            return { ...m, steps: newSteps, completed: true, completedAt: Date.now() };
          }
          return { ...m, completed: true, completedAt: Date.now() };
        });
        persist(next);
        return next;
      });
      setTotalMissionsCompletedCount((c) => {
        const next = c + 1;
        AsyncStorage.setItem(TOTAL_COMPLETED_KEY, String(next));
        return next;
      });
    },
    [persist]
  );

  const totalRewardPoints = todayMissions.reduce((s, m) => s + m.rewardPoints, 0);
  const completedRewardPoints = todayMissions
    .filter((m) => isMissionFullyComplete(m))
    .reduce((s, m) => s + m.rewardPoints, 0);

  return (
    <MissionsContext.Provider
      value={{
        todayMissions,
        selectedMood,
        setSelectedMood,
        generateMissions,
        completeMission,
        completeStep,
        totalRewardPoints,
        completedRewardPoints,
        totalMissionsCompletedCount,
        dailyFullCompletionBonusPoints: missionsConfig.dailyFullCompletionBonusPoints,
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
