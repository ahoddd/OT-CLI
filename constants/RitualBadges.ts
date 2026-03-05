/**
 * Ritual collectible badges — 40 badges across 4 tiers.
 * Earned via Daily Orb Ritual (RITUAL_RANDOM); display on Profile.
 */

export type RitualBadgeTier = 'COMMON' | 'RARE' | 'LEGENDARY' | 'APEX';

export type RitualBadgeEarnMethod = 'RITUAL_RANDOM' | 'MILESTONE';

export interface RitualBadgeDef {
  id: string;
  tier: RitualBadgeTier;
  name: string;
  description: string;
  iconAsset: string;
  earnMethod: RitualBadgeEarnMethod;
}

const C = 'COMMON';
const R = 'RARE';
const L = 'LEGENDARY';
const A = 'APEX';

export const RITUAL_BADGE_REGISTRY: RitualBadgeDef[] = [
  { id: 'badge.common.first_tap', tier: C, name: 'First Tap', description: 'You tapped the orb for the first time.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.daily_regular', tier: C, name: 'Daily Regular', description: 'Claim the daily ritual regularly.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.local_scout', tier: C, name: 'Local Scout', description: 'Exploring your local grid.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.pocket_saver', tier: C, name: 'Pocket Saver', description: 'Savvy with OT Points.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.quick_claimer', tier: C, name: 'Quick Claimer', description: 'Early bird ritual claim.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.weekday_winner', tier: C, name: 'Weekday Winner', description: 'Ritual done on a weekday.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.weekend_warmup', tier: C, name: 'Weekend Warmup', description: 'Weekend ritual starter.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.map_walker', tier: C, name: 'Map Walker', description: 'You know the map.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.deal_dabbler', tier: C, name: 'Deal Dabbler', description: 'Dabbling in deals.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.menu_maven', tier: C, name: 'Menu Maven', description: 'You love partner menus.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.pulse_peeker', tier: C, name: 'Pulse Peeker', description: 'You check the Pulse.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.friendly_finder', tier: C, name: 'Friendly Finder', description: 'Finding friends on OrbTap.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.city_hopper', tier: C, name: 'City Hopper', description: 'Hopping between spots.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.streak_starter', tier: C, name: 'Streak Starter', description: 'Starting a streak.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.common.orb_glow', tier: C, name: 'Orb Glow', description: 'The orb glows for you.', iconAsset: 'badge_common', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.streak_runner', tier: R, name: 'Streak Runner', description: 'Keeping the streak alive.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.drop_sniper', tier: R, name: 'Drop Sniper', description: 'You snag the drops.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.proof_pioneer', tier: R, name: 'Proof Pioneer', description: 'Pioneering verified proof.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.tonight_tastemaker', tier: R, name: 'Tonight Tastemaker', description: 'You shape tonight.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.hidden_gem', tier: R, name: 'Hidden Gem', description: 'You found a hidden gem.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.local_legend_in_training', tier: R, name: 'Legend in Training', description: 'On your way to legend.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.map_master', tier: R, name: 'Map Master', description: 'Master of the map.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.perk_collector', tier: R, name: 'Perk Collector', description: 'Collecting perks.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.partner_favorite', tier: R, name: 'Partner Favorite', description: 'A partner favorite.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.rare.gold_ticket', tier: R, name: 'Gold Ticket', description: 'Golden access.', iconAsset: 'badge_rare', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.city_champion', tier: L, name: 'City Champion', description: 'Champion of the city.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.proof_elite', tier: L, name: 'Proof Master', description: 'Master of verified proof.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.nightglass_icon', tier: L, name: 'Nightglass Icon', description: 'An icon after dark.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.drop_royalty', tier: L, name: 'Drop Royalty', description: 'Royalty of drops.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.viral_receipt', tier: L, name: 'Viral Receipt', description: 'Your receipt went viral.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.orbkeeper', tier: L, name: 'Orbkeeper', description: 'Keeper of the orb.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.five_star_force', tier: L, name: 'Five-Star Force', description: 'Five-star impact.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.fomo_finisher', tier: L, name: 'FOMO Finisher', description: 'You finish what matters.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.rare_signal', tier: L, name: 'Rare Signal', description: 'Sending rare signals.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.legendary.the_ledger', tier: L, name: 'The Ledger', description: 'You are the ledger.', iconAsset: 'badge_legendary', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.apex.mythic_orb', tier: A, name: 'Apex Orb', description: 'The apex orb chose you.', iconAsset: 'badge_apex', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.apex.city_os', tier: A, name: 'City OS', description: 'Operating system of the city.', iconAsset: 'badge_apex', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.apex.founders_circle', tier: A, name: "Founder's Circle", description: 'Among the founders.', iconAsset: 'badge_apex', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.apex.proof_moat', tier: A, name: 'Proof Moat', description: 'Unbreakable proof.', iconAsset: 'badge_apex', earnMethod: 'RITUAL_RANDOM' },
  { id: 'badge.apex.orbtap_one', tier: A, name: 'OrbTap One', description: 'One of the first.', iconAsset: 'badge_apex', earnMethod: 'RITUAL_RANDOM' },
];

export type RitualBadgeId = (typeof RITUAL_BADGE_REGISTRY)[number]['id'];

const RITUAL_BADGE_MAP = new Map(RITUAL_BADGE_REGISTRY.map((b) => [b.id, b]));

export function getRitualBadge(id: string): RitualBadgeDef | undefined {
  return RITUAL_BADGE_MAP.get(id);
}

export function getRitualBadgesByTier(tier: RitualBadgeTier): RitualBadgeDef[] {
  return RITUAL_BADGE_REGISTRY.filter((b) => b.tier === tier);
}

export const RITUAL_TIER_COLORS: Record<RitualBadgeTier, string> = {
  COMMON: '#94a3b8',
  RARE: '#60a5fa',
  LEGENDARY: '#fbbf24',
  APEX: '#ef4444',
};
