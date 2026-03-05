import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PartnerTier } from '../constants/PartnerTiers';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';

/** Default when no tier: legacy gold. When tier is set, uses partner tier color (silver/gold/platinum). */
const DEFAULT_BADGE_COLOR = '#FFD700';

export const VerifiedBadge = ({ size = 16, tier }: { size?: number; tier?: PartnerTier }) => {
  const color = tier ? PARTNER_TIER_COLORS[tier] : DEFAULT_BADGE_COLOR;
  return (
    <View style={{ marginLeft: 4 }}>
      <Ionicons name="shield-checkmark" size={size} color={color} />
    </View>
  );
};
