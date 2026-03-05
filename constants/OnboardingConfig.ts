/**
 * Onboarding slides config. Defaults used by app; Admin Hub can override via useOnboardingConfig.
 * Each slide can have an optional image URL (demo screenshot) or fall back to icon.
 */

export type OnboardingAudience = 'member' | 'partner';

export interface OnboardingSlide {
  id: string;
  audience: OnboardingAudience;
  title: string;
  subtitle: string;
  /** Optional: URL to demo screenshot or feature image. If set, shown prominently. */
  imageUrl?: string;
  /** Ionicons name when imageUrl is not set */
  icon: string;
  order: number;
}

/** Default member onboarding slides — shortened for under 2 min: discover, scan, redeem, missions. */
export const DEFAULT_MEMBER_SLIDES: OnboardingSlide[] = [
  { id: 'm1', audience: 'member', title: 'Discover places near you', subtitle: 'Open the map and see partner venues around you. Restaurants, cafes, shops — each with real perks waiting for you.', icon: 'map', order: 1 },
  { id: 'm2', audience: 'member', title: 'Scan & earn OT Points', subtitle: 'Visit a partner, scan their QR code. Points hit your vault instantly. One tap. Verified on the spot.', icon: 'qr-code', order: 2 },
  { id: 'm3', audience: 'member', title: 'Redeem for real perks', subtitle: 'Discounts, free items, exclusive access — use your OT Points at any partner venue. The more you visit, the more you unlock.', icon: 'gift', order: 3 },
  { id: 'm4', audience: 'member', title: 'Daily missions & streaks', subtitle: 'Complete daily missions for bonus OT. Build your streak. Leaderboards, badges, Orb Score™ — status that matters.', icon: 'flame', order: 4 },
];

/** Default partner onboarding slides — shortened: foot traffic, perks, analytics. */
export const DEFAULT_PARTNER_SLIDES: OnboardingSlide[] = [
  { id: 'p1', audience: 'partner', title: 'Drive real foot traffic', subtitle: 'Show up on the map where thousands of local explorers are looking. Verified visits — real people walking through your door.', icon: 'map', order: 1 },
  { id: 'p2', audience: 'partner', title: 'Create perks & stamp cards', subtitle: 'List your best offers. Run loyalty stamp cards that keep customers coming back. All managed from your dashboard.', icon: 'pricetags', order: 2 },
  { id: 'p3', audience: 'partner', title: 'See what works — analytics', subtitle: 'Track visits, redemptions, and engagement. Know your best hours, top perks, and conversion rates. Export reports.', icon: 'analytics', order: 3 },
];

export const ONBOARDING_ICON_OPTIONS = [
  'map', 'qr-code', 'gift', 'star', 'bookmark', 'trophy', 'flash', 'wallet', 'people',
  'location', 'megaphone', 'document-text', 'bar-chart', 'sparkles', 'shield-checkmark',
  'pulse', 'business', 'card', 'newspaper', 'stats-chart', 'bulb', 'diamond',
] as const;

export type OnboardingIconName = (typeof ONBOARDING_ICON_OPTIONS)[number];
