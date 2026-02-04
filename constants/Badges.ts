/**
 * OrbTap achievement badges — status symbols that drive engagement, foot traffic, and FOMO.
 * Founding tiers create urgency; mission/review/streak badges reward behavior and show off on profile.
 */

export type BadgeId =
  | 'founding_500'
  | 'founding_2k'
  | 'founding_10k'
  | 'founding_100k'
  | 'missions_1'
  | 'missions_10'
  | 'missions_50'
  | 'missions_100'
  | 'reviews_10'
  | 'reviews_100'
  | 'reviews_1000'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'first_scan'
  | 'sphere_creator'
  | 'early_partner'
  | 'verified_explorer';

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  /** Ionicons name for display */
  icon: string;
  /** Accent color hex */
  color: string;
  /** Order in list (lower = earlier) */
  order: number;
  /** For founding: cap count. For others: requirement value (e.g. 10 reviews). */
  requirementValue?: number;
  /** e.g. 'founding' | 'missions' | 'reviews' | 'streak' | 'one_time' */
  category: 'founding' | 'missions' | 'reviews' | 'streak' | 'one_time' | 'partner';
}

export const BADGES: BadgeDef[] = [
  { id: 'founding_500', name: 'Founding Member', description: 'One of the first 500 to join OrbTap.', icon: 'diamond', color: '#8B5CF6', order: 0, requirementValue: 500, category: 'founding' },
  { id: 'founding_2k', name: 'Pioneer', description: 'One of the first 2,000 members.', icon: 'rocket', color: '#06B6D4', order: 1, requirementValue: 2000, category: 'founding' },
  { id: 'founding_10k', name: 'Early Adopter', description: 'One of the first 10,000 members.', icon: 'flash', color: '#F59E0B', order: 2, requirementValue: 10000, category: 'founding' },
  { id: 'founding_100k', name: 'Legend', description: 'One of the first 100,000 members.', icon: 'trophy', color: '#EAB308', order: 3, requirementValue: 100000, category: 'founding' },
  { id: 'missions_1', name: 'First Step', description: 'Complete your first mission.', icon: 'flag', color: '#22C55E', order: 10, requirementValue: 1, category: 'missions' },
  { id: 'missions_10', name: 'Mission Runner', description: 'Complete 10 missions.', icon: 'navigate', color: '#3B82F6', order: 11, requirementValue: 10, category: 'missions' },
  { id: 'missions_50', name: 'Mission Master', description: 'Complete 50 missions.', icon: 'ribbon', color: '#8B5CF6', order: 12, requirementValue: 50, category: 'missions' },
  { id: 'missions_100', name: 'Orb Champion', description: 'Complete 100 missions.', icon: 'medal', color: '#EAB308', order: 13, requirementValue: 100, category: 'missions' },
  { id: 'reviews_10', name: 'Voice of the Grid', description: 'Leave 10 reviews.', icon: 'chatbubble-ellipses', color: '#06B6D4', order: 20, requirementValue: 10, category: 'reviews' },
  { id: 'reviews_100', name: 'Review Royalty', description: 'Leave 100 reviews.', icon: 'megaphone', color: '#F59E0B', order: 21, requirementValue: 100, category: 'reviews' },
  { id: 'reviews_1000', name: 'Legendary Critic', description: 'Leave 1,000 reviews.', icon: 'star', color: '#EAB308', order: 22, requirementValue: 1000, category: 'reviews' },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak.', icon: 'flame', color: '#F97316', order: 30, requirementValue: 7, category: 'streak' },
  { id: 'streak_30', name: 'Monthly Maven', description: '30-day streak.', icon: 'flame', color: '#EF4444', order: 31, requirementValue: 30, category: 'streak' },
  { id: 'streak_100', name: 'Century Flame', description: '100-day streak.', icon: 'flame', color: '#EAB308', order: 32, requirementValue: 100, category: 'streak' },
  { id: 'first_scan', name: 'First Scan', description: 'Redeem your first perk at a partner.', icon: 'qr-code', color: '#22C55E', order: 40, category: 'one_time' },
  { id: 'sphere_creator', name: 'Sphere Creator', description: 'Create your first sphere.', icon: 'people', color: '#8B5CF6', order: 41, category: 'one_time' },
  { id: 'verified_explorer', name: 'Verified Explorer', description: 'Verified account.', icon: 'shield-checkmark', color: '#3B82F6', order: 42, category: 'one_time' },
  { id: 'early_partner', name: 'Early Partner', description: 'One of the first 200 partner venues.', icon: 'storefront', color: '#F59E0B', order: 50, requirementValue: 200, category: 'partner' },
];

const BADGE_MAP = new Map<BadgeId, BadgeDef>(BADGES.map(b => [b.id, b]));

export function getBadge(id: BadgeId): BadgeDef | undefined {
  return BADGE_MAP.get(id);
}

export function getBadgesByCategory(category: BadgeDef['category']): BadgeDef[] {
  return BADGES.filter(b => b.category === category).sort((a, b) => a.order - b.order);
}

export const FOUNDING_CAPS = [500, 2000, 10000, 100000] as const;
export const FOUNDING_BADGE_IDS: BadgeId[] = ['founding_500', 'founding_2k', 'founding_10k', 'founding_100k'];
