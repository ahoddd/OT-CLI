/**
 * Meal Proposals — CRUD + state management.
 * AsyncStorage for MVP; when demo data is on, merges MOCK_MEAL_PROPOSALS.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  MealProposal,
  MealProposalStatus,
  MealPlan,
  MealPlanStatus,
  MealSphereVote,
} from '../constants/MealProposals';
import {
  MOCK_MEAL_PROPOSALS,
  validateMealProposal,
} from '../constants/MealProposals';
import { getMealTierLimits } from '../constants/MealProposalTierConfig';
import type { PartnerTier } from '../constants/PartnerTiers';
import { useDemoDataEnabled } from './useDemoDataEnabled';
import { logger } from '../utils/logger';

const PROPOSALS_KEY = 'ORBTAP_MEAL_PROPOSALS_V1';
const PLANS_KEY = 'ORBTAP_MEAL_PLANS_V1';
const VOTES_KEY = 'ORBTAP_MEAL_SPHERE_VOTES_V1';

export function useMealProposals(partnerId?: string) {
  const { demoDataEnabled } = useDemoDataEnabled();
  const [proposals, setProposals] = useState<MealProposal[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [sphereVotes, setSphereVotes] = useState<MealSphereVote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [demoDataEnabled]);

  const loadAll = useCallback(async () => {
    try {
      const [propData, planData, voteData] = await Promise.all([
        AsyncStorage.getItem(PROPOSALS_KEY),
        AsyncStorage.getItem(PLANS_KEY),
        AsyncStorage.getItem(VOTES_KEY),
      ]);
      const stored: MealProposal[] = propData ? JSON.parse(propData) : [];
      let merged: MealProposal[];
      if (demoDataEnabled) {
        merged = [...MOCK_MEAL_PROPOSALS, ...stored.filter((s) => !MOCK_MEAL_PROPOSALS.some((m) => m.id === s.id))];
      } else if (stored.length > 0) {
        merged = stored;
      } else {
        // No stored proposals: show demo meals so OrbSwipe Meals (e.g. from spheres) always has cards to test
        merged = MOCK_MEAL_PROPOSALS;
      }
      setProposals(merged);
      setPlans(planData ? JSON.parse(planData) : []);
      setSphereVotes(voteData ? JSON.parse(voteData) : []);
    } catch (e) {
      logger.error('Meal proposals load error:', e);
      setProposals(demoDataEnabled ? MOCK_MEAL_PROPOSALS : []);
    } finally {
      setLoading(false);
    }
  }, [demoDataEnabled]);

  const persistProposals = useCallback(async (next: MealProposal[]) => {
    const toStore = next.filter((p) => !MOCK_MEAL_PROPOSALS.some((m) => m.id === p.id));
    await AsyncStorage.setItem(PROPOSALS_KEY, JSON.stringify(toStore));
  }, []);

  const persistPlans = useCallback(async (next: MealPlan[]) => {
    await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(next));
  }, []);

  const persistVotes = useCallback(async (next: MealSphereVote[]) => {
    await AsyncStorage.setItem(VOTES_KEY, JSON.stringify(next));
  }, []);

  const getPublished = useCallback(
    () => proposals.filter((p) => p.status === 'PUBLISHED' && (!p.availability.expiresAt || p.availability.expiresAt > Date.now())),
    [proposals],
  );

  const getPartnerProposals = useCallback(
    (pid: string) => proposals.filter((p) => p.partnerId === pid),
    [proposals],
  );

  const createProposal = useCallback(
    async (draft: Omit<MealProposal, 'id' | 'analytics' | 'createdAt' | 'updatedAt'>, partnerTier: PartnerTier): Promise<{ success: boolean; errors?: { field: string; message: string }[]; proposal?: MealProposal }> => {
      const errors = validateMealProposal(draft as Partial<MealProposal>);
      if (errors.length > 0) return { success: false, errors };

      const limits = getMealTierLimits(partnerTier);
      const activeCount = proposals.filter((p) => p.partnerId === draft.partnerId && (p.status === 'PUBLISHED' || p.status === 'DRAFT')).length;
      if (activeCount >= limits.maxActiveProposals) {
        return { success: false, errors: [{ field: 'limit', message: `Max ${limits.maxActiveProposals} active proposals for your tier` }] };
      }

      if (draft.photos.length > limits.maxPhotos) {
        return { success: false, errors: [{ field: 'photos', message: `Max ${limits.maxPhotos} photos for your tier` }] };
      }

      if (!limits.schedulingEnabled && draft.availability.startAt) {
        return { success: false, errors: [{ field: 'availability', message: 'Scheduling requires Premium or Pro tier' }] };
      }

      if (!limits.targetingEnabled && draft.targeting.radiusMiles) {
        return { success: false, errors: [{ field: 'targeting', message: 'Targeting requires Premium or Pro tier' }] };
      }

      const now = Date.now();
      const proposal: MealProposal = {
        ...draft,
        id: `mp_${now}_${Math.random().toString(36).slice(2, 8)}`,
        analytics: { impressions: 0, opens: 0, trayAdds: 0, fuseSelects: 0, navigations: 0, reservations: 0, verifiedRedemptions: 0 },
        createdAt: now,
        updatedAt: now,
        publishedAt: draft.status === 'PUBLISHED' ? now : undefined,
      } as MealProposal;

      const next = [proposal, ...proposals];
      setProposals(next);
      await persistProposals(next);
      return { success: true, proposal };
    },
    [proposals, persistProposals],
  );

  const updateStatus = useCallback(
    async (proposalId: string, status: MealProposalStatus) => {
      const next = proposals.map((p) =>
        p.id === proposalId
          ? { ...p, status, updatedAt: Date.now(), publishedAt: status === 'PUBLISHED' && !p.publishedAt ? Date.now() : p.publishedAt }
          : p,
      );
      setProposals(next);
      await persistProposals(next);
    },
    [proposals, persistProposals],
  );

  const createPlan = useCallback(
    async (plan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MealPlan> => {
      const now = Date.now();
      const fullPlan: MealPlan = {
        ...plan,
        id: `mplan_${now}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now,
      };
      const next = [fullPlan, ...plans];
      setPlans(next);
      await persistPlans(next);
      return fullPlan;
    },
    [plans, persistPlans],
  );

  const updatePlanStatus = useCallback(
    async (planId: string, status: MealPlanStatus, extras?: Partial<MealPlan>) => {
      const next = plans.map((p) =>
        p.id === planId ? { ...p, ...extras, status, updatedAt: Date.now() } : p,
      );
      setPlans(next);
      await persistPlans(next);
    },
    [plans, persistPlans],
  );

  const addSphereVote = useCallback(
    async (proposalId: string, memberId: string) => {
      const existing = sphereVotes.find((v) => v.proposalId === proposalId && v.memberId === memberId);
      if (existing) return;
      const vote: MealSphereVote = { proposalId, memberId, createdAt: Date.now() };
      const next = [...sphereVotes, vote];
      setSphereVotes(next);
      await persistVotes(next);
    },
    [sphereVotes, persistVotes],
  );

  const getVotesForProposal = useCallback(
    (proposalId: string) => sphereVotes.filter((v) => v.proposalId === proposalId).length,
    [sphereVotes],
  );

  return {
    proposals,
    plans,
    sphereVotes,
    loading,
    getPublished,
    getPartnerProposals,
    createProposal,
    updateStatus,
    createPlan,
    updatePlanStatus,
    addSphereVote,
    getVotesForProposal,
  };
}
