import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { Partner, Perk, TIER_COLORS } from '../constants/MockData';
import { HOLO_COLORS, SHINE_COLORS, getTierBorderWidth, getTierShineOpacity } from '../constants/PremiumStyles';

export type PerkSlotType = 'featured' | 'sponsored' | null;

interface PremiumPerkTileProps {
  partner: Partner;
  primaryPerk: Perk | null;
  onPress: () => void;
  /** Top grid slots: featured (1) or sponsored (2). Shows badge; stronger premium effect. */
  slotType?: PerkSlotType;
}

/** Premium holographic perk tile — tier-based effect (higher tier = stronger holo). Featured/Sponsored get badges. */
export function PremiumPerkTile({ partner, primaryPerk, onPress, slotType = null }: PremiumPerkTileProps) {
  const { colors, isDark } = useTheme();
  const tierColor = TIER_COLORS[partner.tier];
  const address = partner.location?.address ?? '';
  const borderWidth = getTierBorderWidth(partner.tier);
  const shineOpacity = getTierShineOpacity(partner.tier);

  return (
    <TouchableOpacity style={styles.outer} onPress={onPress} activeOpacity={0.95}>
      <LinearGradient
        colors={[...HOLO_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.borderGradient, { padding: borderWidth }]}
      >
        <View style={[styles.cardInner, { backgroundColor: isDark ? '#0d0d12' : '#14141a' }]}>
          <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
          <LinearGradient
            colors={[...SHINE_COLORS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { opacity: shineOpacity }]}
            pointerEvents="none"
          />
          <View style={[styles.topGlow, { backgroundColor: tierColor + '40' }]} />
          {slotType === 'featured' && (
            <View style={[styles.slotBadge, { backgroundColor: '#8b5cf6' }]}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={styles.slotBadgeText}>FEATURED</Text>
            </View>
          )}
          {slotType === 'sponsored' && (
            <View style={[styles.slotBadge, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="megaphone" size={10} color="#000" />
              <Text style={[styles.slotBadgeText, { color: '#000' }]}>SPONSORED</Text>
            </View>
          )}
          <View style={styles.content}>
            <View style={styles.dotRow}>
              <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
            </View>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{partner.name}</Text>
            <Text style={[styles.cat, { color: colors.textSecondary }]}>{partner.category}</Text>
            <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>{address}</Text>
            <Text style={[styles.hours, { color: colors.textSecondary }]} numberOfLines={1}>{partner.hours}</Text>
            {primaryPerk && (
              <View style={[styles.perkChip, { borderColor: tierColor + '66', backgroundColor: tierColor + '18' }]}>
                <Text style={[styles.perkTitle, { color: tierColor }]} numberOfLines={1}>{primaryPerk.title}</Text>
                <Text style={[styles.perkCost, { color: tierColor }]}>{primaryPerk.cost} pts</Text>
              </View>
            )}
            <View style={styles.tapRow}>
              <Ionicons name="open-outline" size={11} color={colors.textSecondary} />
              <Text style={[styles.tapText, { color: colors.textSecondary }]}>Tap for details</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, borderRadius: 16 },
  borderGradient: {
    borderRadius: 16,
  },
  slotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 1,
  },
  slotBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardInner: {
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 160,
  },
  tierBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.8,
  },
  content: { padding: 12, paddingTop: 10 },
  dotRow: { marginBottom: 6 },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 14, fontWeight: '800', marginBottom: 2, letterSpacing: 0.2 },
  cat: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  address: { fontSize: 9, marginBottom: 2 },
  hours: { fontSize: 9, marginBottom: 6 },
  perkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  perkTitle: { fontSize: 10, fontWeight: '700', flex: 1 },
  perkCost: { fontSize: 9, fontWeight: '800' },
  tapRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tapText: { fontSize: 10, fontWeight: '600' },
});
