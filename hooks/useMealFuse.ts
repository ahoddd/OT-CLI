/**
 * Fuse My Meal — scoring engine + plan generation.
 * Deterministic ranking: votes → time relevance → distance → verified → popularity.
 */

import { useMemo } from 'react';
import type { MealProposal, MealPlan, MealPlanStep, MealSphereVote } from '../constants/MealProposals';
import { getMealTimeRelevance, estimateTotalCents } from '../constants/MealProposals';

export interface MealFuseOption {
  id: string;
  kind: 'BEST_PICK' | 'BEST_VALUE' | 'BEST_TONIGHT';
  label: string;
  subLabel: string;
  proposal: MealProposal;
  score: number;
}

function scoreProposal(
  p: MealProposal,
  hour: number,
  votes: number,
  lockedProposalId?: string,
): number {
  if (lockedProposalId === p.id) return 10000;
  let score = 0;
  score += getMealTimeRelevance(p.mealType, hour) * 30;
  score += p.partnerVerified ? 15 : 0;
  score += Math.min(p.analytics.trayAdds * 2, 20);
  score += Math.min(p.analytics.opens, 10);
  score += votes * 25;
  if (p.availability.expiresAt) {
    const hoursLeft = (p.availability.expiresAt - Date.now()) / (60 * 60 * 1000);
    if (hoursLeft > 0 && hoursLeft < 6) score += 10;
  }
  return score;
}

export function useMealFuse(
  trayProposals: MealProposal[],
  sphereVotes: MealSphereVote[],
  lockedProposalId?: string,
): MealFuseOption[] {
  return useMemo(() => {
    if (trayProposals.length === 0) return [];

    const hour = new Date().getHours();
    const scored = trayProposals
      .filter((p) => p.status === 'PUBLISHED' && (!p.availability.expiresAt || p.availability.expiresAt > Date.now()))
      .map((p) => {
        const votes = sphereVotes.filter((v) => v.proposalId === p.id).length;
        return { proposal: p, score: scoreProposal(p, hour, votes, lockedProposalId) };
      })
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return [];

    const options: MealFuseOption[] = [];

    options.push({
      id: `mfuse_best_${scored[0].proposal.id}`,
      kind: 'BEST_PICK',
      label: 'Best Pick',
      subLabel: `${scored[0].proposal.partnerName ?? 'Partner'} · ${scored[0].proposal.title}`,
      proposal: scored[0].proposal,
      score: scored[0].score,
    });

    const byValue = [...scored].sort((a, b) => {
      const costA = estimateTotalCents(a.proposal, a.proposal.partySize.minPeople);
      const costB = estimateTotalCents(b.proposal, b.proposal.partySize.minPeople);
      return costA - costB;
    });
    if (byValue[0] && byValue[0].proposal.id !== scored[0].proposal.id) {
      const cheapest = byValue[0];
      options.push({
        id: `mfuse_value_${cheapest.proposal.id}`,
        kind: 'BEST_VALUE',
        label: 'Best Value',
        subLabel: `${cheapest.proposal.partnerName ?? 'Partner'} · Most affordable`,
        proposal: cheapest.proposal,
        score: cheapest.score,
      });
    }

    const tonightCandidate = scored.find(
      (s) => s.proposal.id !== scored[0]?.proposal.id && s.proposal.id !== byValue[0]?.proposal.id,
    );
    if (tonightCandidate) {
      options.push({
        id: `mfuse_tonight_${tonightCandidate.proposal.id}`,
        kind: 'BEST_TONIGHT',
        label: 'Best Tonight',
        subLabel: `${tonightCandidate.proposal.partnerName ?? 'Partner'} · Closest + trending`,
        proposal: tonightCandidate.proposal,
        score: tonightCandidate.score,
      });
    }

    return options.slice(0, 3);
  }, [trayProposals, sphereVotes, lockedProposalId]);
}

export function buildMealPlan(
  proposal: MealProposal,
  uid: string,
  scope: 'SOLO' | 'SPHERE',
  partySize: number,
  trayProposalIds: string[],
  sphereId?: string,
): Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'> {
  const steps: MealPlanStep[] = [
    { type: 'NAVIGATE_TO_PARTNER', label: `Navigate to ${proposal.partnerName ?? 'partner'}`, completed: false },
  ];

  if (proposal.cta.dropId) {
    steps.push({ type: 'DROP_RESERVE', label: 'Reserve linked Drop', completed: false, refId: proposal.cta.dropId });
  }

  steps.push({ type: 'QR_REDEEM', label: 'Check in via QR', completed: false });
  steps.push({ type: 'VERIFIED_REVIEW', label: 'Leave a verified review', completed: false });

  return {
    createdByUid: uid,
    scope,
    sphereId,
    proposalIds: trayProposalIds,
    selectedProposalId: proposal.id,
    partnerId: proposal.partnerId,
    scheduledFor: 'NOW',
    partySizeChosen: partySize,
    budgetCents: estimateTotalCents(proposal, partySize),
    steps,
    status: 'ACTIVE',
  };
}
