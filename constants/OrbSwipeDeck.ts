/**
 * OrbSwipe deck — card types and sponsored insertion config.
 */

import type { Drop } from './Drops';
import type { DailyMission } from '../context/MissionsContext';
import type { PartnerTier } from './PartnerTiers';
import type { MealProposal } from './MealProposals';

export type OrbSwipeCardType = 'DROP_CARD' | 'MISSION_CARD' | 'PARTNER_CARD' | 'SPONSORED_CARD' | 'MEAL_PROPOSAL_CARD';

export interface OrbSwipeCardBase {
  id: string;
  type: OrbSwipeCardType;
  partnerId: string;
  partnerName: string;
  verified: boolean;
  tier: PartnerTier;
  distanceLabel: string;
  whyLabel: string;
  valueSummary: string;
  ctaHint: string;
  /** Hero image URL for premium card display. */
  imageUrl?: string;
  /** Longer description for card body. */
  description?: string;
  /** OT cost to reserve (drops). 0 = free reserve. */
  reserveCostOt?: number;
  /** User-facing label for earn potential, e.g. "Earn 150 OT" or "Visit to earn OT". */
  earnOtLabel?: string;
}

export interface OrbSwipeDropCard extends OrbSwipeCardBase {
  type: 'DROP_CARD';
  dropId: string;
  drop: Drop;
  scarcity?: string;
}

export interface OrbSwipeMissionCard extends OrbSwipeCardBase {
  type: 'MISSION_CARD';
  missionId: string;
  mission: DailyMission;
}

export interface OrbSwipeSponsoredCard extends OrbSwipeCardBase {
  type: 'SPONSORED_CARD';
  dropId?: string;
  drop?: Drop;
}

export interface OrbSwipeMealProposalCard extends OrbSwipeCardBase {
  type: 'MEAL_PROPOSAL_CARD';
  proposalId: string;
  proposal: MealProposal;
  mealTypeBadge: string;
  priceLabel: string;
  partySizeLabel: string;
  menuHighlights: string[];
  endsAt?: number;
}

export interface OrbSwipePartnerCard extends OrbSwipeCardBase {
  type: 'PARTNER_CARD';
}

export type OrbSwipeCard = OrbSwipeDropCard | OrbSwipeMissionCard | OrbSwipePartnerCard | OrbSwipeSponsoredCard | OrbSwipeMealProposalCard;

/** Sponsored insertion: after N swipes, insert 1; max 1 per 6 cards; max per session. */
export const ORBSWIPE_SPONSORED_CONFIG = {
  swipesBetweenSponsored: 10,
  maxSponsoredPerSession: 3,
  minOrganicBetweenSponsored: 5,
} as const;

export const ORBSWIPE_DECK_SESSION_CAP = 30;

export const ORBSWIPE_WHY_LABELS: Record<string, string> = {
  nearby: 'Nearby',
  trending: 'Trending',
  limited: 'Limited',
  sponsored: 'Sponsored',
  open_now: 'Open now',
  ends_soon: 'Ends soon',
  great_value: 'Great value',
};
