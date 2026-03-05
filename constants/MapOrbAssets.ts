/**
 * Map pin orb images by partner tier (silver, gold, platinum).
 * Used by OrbTapMap and OrbTapMapFallback for partner markers.
 */
import type { PartnerTier } from './PartnerTiers';

export const ORB_TIER_IMAGES: Record<PartnerTier, number> = {
  silver: require('../assets/orb-silver-free-tier.png'),
  gold: require('../assets/orb-gold-premium-tier.png'),
  platinum: require('../assets/orb-platinum-pro-tier.png'),
};
