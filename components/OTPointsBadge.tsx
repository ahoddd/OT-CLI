import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/Colors';

interface OTPointsBadgeProps {
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
      <View style={[styles.orbWrap, { width: size, height: size }]}>
        <LinearGradient
          colors={[COLORS.gold[0], '#d97706']}
          style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.core, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]} />
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
  orbWrap: { justifyContent: 'center', alignItems: 'center' },
  orb: { position: 'absolute', top: 0, left: 0 },
  core: { backgroundColor: 'rgba(255,255,255,0.9)' },
  amountWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  amount: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, opacity: 0.9 },
});
