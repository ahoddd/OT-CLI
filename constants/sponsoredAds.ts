/**
 * Sponsored Ads — premium ad spots for sponsors.
 * Placements: orb (below featured), daily_ritual_reward (watch ad for +1 orb tap).
 * Admin controls: carousel timing, 1–3 slots, CTAs, image or video (≤1 min).
 */

export type SponsoredAdPlacement = 'orb_carousel' | 'daily_ritual_reward';

export type SponsoredAdType = 'image' | 'video';

export interface SponsoredAdCta {
  label: string;
  url: string;
}

export interface SponsoredAdDoc {
  id: string;
  placement: SponsoredAdPlacement;
  type: SponsoredAdType;
  mediaUrl: string;
  videoDurationSeconds?: number;
  ctas: SponsoredAdCta[];
  order: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  /** Optional sponsor name for admin display */
  sponsorName?: string;
  /** Optional schedule: only show when now >= startAt (ms). Omit = no start limit. */
  startAt?: number | null;
  /** Optional schedule: only show when now <= endAt (ms). Omit = no end limit. */
  endAt?: number | null;
}

export interface SponsoredAdsConfig {
  /** Seconds between carousel slides (default 60) */
  carouselTransitionSeconds: number;
  /** Max ads in orb carousel (1–3) */
  maxCarouselSlots: number;
  /** Whether to show "watch ad for +1 tap" in daily ritual */
  dailyRitualRewardAdEnabled: boolean;
  /** Ad id to play for the reward (must be placement daily_ritual_reward, type video, 30–60s) */
  dailyRitualRewardAdId: string | null;
}

export const DEFAULT_SPONSORED_ADS_CONFIG: SponsoredAdsConfig = {
  carouselTransitionSeconds: 60,
  maxCarouselSlots: 3,
  dailyRitualRewardAdEnabled: false,
  dailyRitualRewardAdId: null,
};

export const PLACEMENT_LABELS: Record<SponsoredAdPlacement, string> = {
  orb_carousel: 'Orb page (below featured)',
  daily_ritual_reward: 'Daily ritual (+1 tap reward)',
};

export const MIN_CAROUSEL_SLOTS = 1;
export const MAX_CAROUSEL_SLOTS = 3;
export const MIN_CAROUSEL_TRANSITION_SEC = 30;
export const MAX_CAROUSEL_TRANSITION_SEC = 120;
export const REWARD_VIDEO_MIN_SEC = 30;
export const REWARD_VIDEO_MAX_SEC = 60;
