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
  | 'missions_5'
  | 'missions_10'
  | 'missions_25'
  | 'missions_50'
  | 'missions_100'
  | 'reviews_1'
  | 'reviews_10'
  | 'reviews_25'
  | 'reviews_100'
  | 'reviews_250'
  | 'reviews_1000'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'streak_100'
  | 'first_scan'
  | 'scans_5'
  | 'scans_25'
  | 'scans_100'
  | 'partners_5'
  | 'partners_25'
  | 'sphere_creator'
  | 'early_partner'
  | 'verified_explorer'
  | 'first_mission'
  | 'first_review'
  | 'orb_tapper_10'
  | 'orb_tapper_100'
  | 'drop_catcher'
  | 'vote_caster'
  | (string & {}); // allow custom admin-created badge ids

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  /** Unique copy for "How it was earned" modal — specific, proud, non-repetitive */
  howItWasEarned: string;
  /** Ionicons name for display */
  icon: string;
  /** Accent color hex */
  color: string;
  /** Order in list (lower = earlier) */
  order: number;
  /** For founding: cap count. For others: requirement value (e.g. 10 reviews). */
  requirementValue?: number;
  /** e.g. 'founding' | 'missions' | 'reviews' | 'streak' | 'one_time' | 'partner' | 'scans' */
  category: 'founding' | 'missions' | 'reviews' | 'streak' | 'one_time' | 'partner' | 'scans';
}

export const BADGES: BadgeDef[] = [
  { id: 'founding_500', name: 'Founding Member', description: 'One of the first 500 to join OrbTap.', howItWasEarned: 'You joined OrbTap when we were just getting started — one of the first 500 members. Your early trust helped build the community.', icon: 'diamond', color: '#8B5CF6', order: 0, requirementValue: 500, category: 'founding' },
  { id: 'founding_2k', name: 'Pioneer', description: 'One of the first 2,000 members.', howItWasEarned: 'You were among the first 2,000 to join. Pioneers like you shaped how OrbTap works for everyone who followed.', icon: 'rocket', color: '#06B6D4', order: 1, requirementValue: 2000, category: 'founding' },
  { id: 'founding_10k', name: 'Early Adopter', description: 'One of the first 10,000 members.', howItWasEarned: 'You got in early — one of the first 10,000 members. Early adopters get the best perks and set the tone for the grid.', icon: 'flash', color: '#F59E0B', order: 2, requirementValue: 10000, category: 'founding' },
  { id: 'founding_100k', name: 'Legend', description: 'One of the first 100,000 members.', howItWasEarned: 'You joined before we hit 100,000 members. Legends are the backbone of OrbTap and are recognized everywhere on the app.', icon: 'trophy', color: '#EAB308', order: 3, requirementValue: 100000, category: 'founding' },
  { id: 'missions_1', name: 'First Step', description: 'Complete your first mission.', howItWasEarned: 'You completed your very first OrbTap mission. That first step sends real foot traffic to partners and earns you OT Points.', icon: 'flag', color: '#22C55E', order: 10, requirementValue: 1, category: 'missions' },
  { id: 'missions_5', name: 'Mission Starter', description: 'Complete 5 missions.', howItWasEarned: 'You finished 5 missions. You\'re building a habit of exploring local spots and supporting partners.', icon: 'walk', color: '#3B82F6', order: 11, requirementValue: 5, category: 'missions' },
  { id: 'missions_10', name: 'Mission Runner', description: 'Complete 10 missions.', howItWasEarned: 'Ten missions done. You\'re a reliable mission runner — partners and the community count on explorers like you.', icon: 'navigate', color: '#3B82F6', order: 12, requirementValue: 10, category: 'missions' },
  { id: 'missions_25', name: 'Mission Pro', description: 'Complete 25 missions.', howItWasEarned: 'You hit 25 missions. That\'s serious commitment to the grid and real value for local businesses.', icon: 'trail-sign', color: '#8B5CF6', order: 13, requirementValue: 25, category: 'missions' },
  { id: 'missions_50', name: 'Mission Master', description: 'Complete 50 missions.', howItWasEarned: 'Fifty missions completed. You\'re a mission master — your activity drives real visits and rewards.', icon: 'ribbon', color: '#8B5CF6', order: 14, requirementValue: 50, category: 'missions' },
  { id: 'missions_100', name: 'Orb Champion', description: 'Complete 100 missions.', howItWasEarned: 'You completed 100 missions. Orb Champions are top contributors to the community and partner success.', icon: 'medal', color: '#EAB308', order: 15, requirementValue: 100, category: 'missions' },
  { id: 'reviews_1', name: 'First Review', description: 'Leave your first review.', howItWasEarned: 'You left your first review. Your voice helps others discover great spots and gives partners real feedback.', icon: 'chatbubble', color: '#06B6D4', order: 20, requirementValue: 1, category: 'reviews' },
  { id: 'reviews_10', name: 'Voice of the Grid', description: 'Leave 10 reviews.', howItWasEarned: 'Ten reviews in the books. You\'re becoming a trusted voice of the grid — your opinions guide the community.', icon: 'chatbubble-ellipses', color: '#06B6D4', order: 21, requirementValue: 10, category: 'reviews' },
  { id: 'reviews_25', name: 'Local Critic', description: 'Leave 25 reviews.', howItWasEarned: 'You\'ve written 25 reviews. You\'re a local critic whose take helps explorers and partners alike.', icon: 'thumbs-up', color: '#0EA5E9', order: 22, requirementValue: 25, category: 'reviews' },
  { id: 'reviews_100', name: 'Review Royalty', description: 'Leave 100 reviews.', howItWasEarned: 'One hundred reviews. You\'re review royalty — your contributions make the grid more useful for everyone.', icon: 'megaphone', color: '#F59E0B', order: 23, requirementValue: 100, category: 'reviews' },
  { id: 'reviews_250', name: 'Review Legend', description: 'Leave 250 reviews.', howItWasEarned: 'You hit 250 reviews. Review Legends are rare; your dedication shapes how people discover and choose partners.', icon: 'star', color: '#F59E0B', order: 24, requirementValue: 250, category: 'reviews' },
  { id: 'reviews_1000', name: 'Legendary Critic', description: 'Leave 1,000 reviews.', howItWasEarned: 'A thousand reviews. You\'re a Legendary Critic — one of the most influential voices on OrbTap.', icon: 'star', color: '#EAB308', order: 25, requirementValue: 1000, category: 'reviews' },
  { id: 'streak_3', name: 'Streak Starter', description: '3-day streak.', howItWasEarned: 'You kept your streak alive for 3 days. Consistency starts here — every day you tap in counts.', icon: 'flame', color: '#FB923C', order: 30, requirementValue: 3, category: 'streak' },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak.', howItWasEarned: 'A full week of daily engagement. Week Warriors show up every day and build habits that pay off.', icon: 'flame', color: '#F97316', order: 31, requirementValue: 7, category: 'streak' },
  { id: 'streak_14', name: 'Two-Week Fire', description: '14-day streak.', howItWasEarned: 'Two weeks straight. Your two-week fire proves you\'re in it for the long run.', icon: 'flame', color: '#EA580C', order: 32, requirementValue: 14, category: 'streak' },
  { id: 'streak_30', name: 'Monthly Maven', description: '30-day streak.', howItWasEarned: 'Thirty days in a row. Monthly Mavens are the most engaged members — your streak stands out on the leaderboard.', icon: 'flame', color: '#EF4444', order: 33, requirementValue: 30, category: 'streak' },
  { id: 'streak_100', name: 'Century Flame', description: '100-day streak.', howItWasEarned: 'One hundred days without breaking the chain. Century Flame is an elite streak few achieve.', icon: 'flame', color: '#EAB308', order: 34, requirementValue: 100, category: 'streak' },
  { id: 'first_scan', name: 'First Scan', description: 'Redeem your first perk at a partner.', howItWasEarned: 'You scanned and redeemed your first perk at a partner. That\'s the moment OT Points turn into real-world value.', icon: 'qr-code', color: '#22C55E', order: 40, category: 'one_time' },
  { id: 'scans_5', name: 'Regular Visitor', description: '5 verified check-ins.', howItWasEarned: 'You have 5 verified check-ins. You\'re building a real presence at partner locations.', icon: 'location', color: '#22C55E', order: 41, requirementValue: 5, category: 'scans' },
  { id: 'scans_25', name: 'Frequent Flyer', description: '25 verified check-ins.', howItWasEarned: 'Twenty-five verified visits. You\'re a frequent flyer — the kind of customer partners love to see.', icon: 'airplane', color: '#16A34A', order: 42, requirementValue: 25, category: 'scans' },
  { id: 'scans_100', name: 'Check-in Champion', description: '100 verified check-ins.', howItWasEarned: 'One hundred verified check-ins. Check-in Champions drive serious foot traffic and earn serious rewards.', icon: 'trophy', color: '#15803D', order: 43, requirementValue: 100, category: 'scans' },
  { id: 'partners_5', name: 'Explorer', description: 'Visit 5 different partners.', howItWasEarned: 'You\'ve visited 5 different partner venues. Explorers spread the love and discover the best the grid has to offer.', icon: 'business', color: '#0EA5E9', order: 44, requirementValue: 5, category: 'partner' },
  { id: 'partners_25', name: 'Local Legend', description: 'Visit 25 different partners.', howItWasEarned: 'Twenty-five different partners. You\'re a Local Legend — you know the scene and support it everywhere.', icon: 'map', color: '#0284C7', order: 45, requirementValue: 25, category: 'partner' },
  { id: 'sphere_creator', name: 'Sphere Creator', description: 'Create your first sphere.', howItWasEarned: 'You created your first sphere. Sphere Creators bring people together to pool points and share experiences.', icon: 'people', color: '#8B5CF6', order: 46, category: 'one_time' },
  { id: 'verified_explorer', name: 'Verified Explorer', description: 'Verified account.', howItWasEarned: 'Your account is verified. Verified Explorers get more trust, more perks, and stand out on profiles and leaderboards.', icon: 'shield-checkmark', color: '#3B82F6', order: 47, category: 'one_time' },
  { id: 'first_mission', name: 'First Mission', description: 'Complete your first mission.', howItWasEarned: 'You completed your first mission. Missions are how OrbTap sends real traffic to partners — you just did that.', icon: 'flag', color: '#22C55E', order: 48, category: 'one_time' },
  { id: 'first_review', name: 'First Review', description: 'Leave your first review.', howItWasEarned: 'You left your first review. That feedback helps other explorers and gives partners a chance to shine.', icon: 'chatbubble', color: '#06B6D4', order: 49, category: 'one_time' },
  { id: 'orb_tapper_10', name: 'Orb Tapper', description: 'Tap the orb 10 times.', howItWasEarned: 'You tapped the orb 10 times. Orb Tappers engage with the app daily — that habit leads to more rewards.', icon: 'finger-print', color: '#60A5FA', order: 50, requirementValue: 10, category: 'one_time' },
  { id: 'orb_tapper_100', name: 'Orb Addict', description: 'Tap the orb 100 times.', howItWasEarned: 'One hundred orb taps. You\'re an Orb Addict — the kind of super-engaged user who never misses a day.', icon: 'infinite', color: '#8B5CF6', order: 51, requirementValue: 100, category: 'one_time' },
  { id: 'drop_catcher', name: 'Drop Catcher', description: 'Claim or reserve a limited drop.', howItWasEarned: 'You claimed or reserved a limited drop. Drop Catchers are quick to act and get exclusive rewards.', icon: 'gift', color: '#EC4899', order: 52, category: 'one_time' },
  { id: 'vote_caster', name: 'Vote Caster', description: 'Vote in an OrbVote poll.', howItWasEarned: 'You voted in an OrbVote poll. Your vote shapes what partners and the community do next.', icon: 'checkbox', color: '#6366F1', order: 53, category: 'one_time' },
  { id: 'early_partner', name: 'Early Partner', description: 'One of the first 200 partner venues.', howItWasEarned: 'Your venue was among the first 200 to join OrbTap. Early Partners helped prove the model and get the best placement.', icon: 'storefront', color: '#F59E0B', order: 60, requirementValue: 200, category: 'partner' },
];

const BADGE_MAP = new Map<string, BadgeDef>(BADGES.map(b => [b.id, b]));

export function getBadge(id: string): BadgeDef | undefined {
  return BADGE_MAP.get(id);
}

export function getBadgesByCategory(category: BadgeDef['category']): BadgeDef[] {
  return BADGES.filter(b => b.category === category).sort((a, b) => a.order - b.order);
}

export const FOUNDING_CAPS = [500, 2000, 10000, 100000] as const;
export const FOUNDING_BADGE_IDS: BadgeId[] = ['founding_500', 'founding_2k', 'founding_10k', 'founding_100k'];
