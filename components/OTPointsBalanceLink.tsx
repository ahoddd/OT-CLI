/**
 * OT Points balance that navigates to Wallet when tapped.
 * Use wherever user balance is shown so they can quickly open the vault.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { OTPointsBadge } from './OTPointsBadge';
import type { OTPointsBadgeProps } from './OTPointsBadge';

export type OTPointsBalanceLinkProps = OTPointsBadgeProps & {
  /** When false, renders OTPointsBadge only (no touch). Default true. */
  pressable?: boolean;
};

export function OTPointsBalanceLink({
  amount,
  size = 20,
  label = 'pts',
  compact = true,
  style,
  textColor,
  pressable = true,
}: OTPointsBalanceLinkProps) {
  const router = useRouter();
  const badge = (
    <OTPointsBadge
      amount={amount}
      size={size}
      label={label}
      compact={compact}
      style={style}
      textColor={textColor}
    />
  );
  if (!pressable) return badge;
  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/wallet' as any)}
      activeOpacity={0.8}
      accessibilityLabel="Your OT Points. Tap to open Wallet."
      accessibilityRole="button"
    >
      {badge}
    </TouchableOpacity>
  );
}
