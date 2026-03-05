import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';

const OT_COINS_IMAGE = require('../assets/images/ot-coins-pile.png');

export interface OTPointsBadgeProps {
  /** Points amount to show next to the icon (optional) */
  amount?: number | string;
  /** Size of the orb icon in px */
  size?: number;
  /** Show "OT" or "PTS" label below/next to amount */
  label?: 'ot' | 'pts' | 'none';
  /** Compact: icon + amount inline; default false = icon then amount below or beside */
  compact?: boolean;
  style?: ViewStyle;
  textColor?: string;
}

/** Reusable OT Points visual: mini orb icon + optional amount. Use next to balance/earned pts everywhere. */
export function OTPointsBadge({
  amount,
  size = 20,
  label = 'pts',
  compact = true,
  style,
  textColor = '#fff',
}: OTPointsBadgeProps) {
  const displayAmount = amount !== undefined ? (typeof amount === 'number' ? amount.toLocaleString() : String(amount)) : null;

  return (
    <View style={[styles.wrap, compact && styles.row, style]}>
      <View style={[styles.coinWrap, { width: size, height: size }]}>
        <Image
          source={OT_COINS_IMAGE}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
      {displayAmount !== null && (
        <View style={styles.amountWrap}>
          <Text style={[styles.amount, { color: textColor }]} numberOfLines={1}>{displayAmount}</Text>
          {label !== 'none' && (
            <Text style={[styles.unit, { color: textColor }]}>{label === 'ot' ? 'OT' : 'PTS'}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'column', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coinWrap: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  amountWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  amount: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, opacity: 0.9 },
});
