import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { Perk, TIER_COLORS } from '../constants/MockData';
import { HOLO_COLORS, SHINE_COLORS, getTierBorderWidth, getTierShineOpacity } from '../constants/PremiumStyles';
import { OTPointsBadge } from './OTPointsBadge';
import * as Haptics from 'expo-haptics';

export type PremiumPerkCardVariant = 'row' | 'compact' | 'hero';

interface PremiumPerkCardProps {
  perk: Perk;
  partnerName?: string;
  variant?: PremiumPerkCardVariant;
  onPress?: () => void;
}

/** Premium holographic perk card — tier-based effect (higher tier = stronger holo). */
export function PremiumPerkCard({ perk, partnerName, variant = 'row', onPress }: PremiumPerkCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  if (!perk) return null;
  const tier = perk.tier;
  const tierColor = TIER_COLORS[tier];
  const holoPadding = getTierBorderWidth(tier);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) onPress();
    else router.push(`/perk/${perk.id}` as any);
  };

  const content = (
    <>
      <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
      <LinearGradient
        colors={[...SHINE_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: getTierShineOpacity(tier) }]}
        pointerEvents="none"
      />
      <View style={[styles.topGlow, { backgroundColor: tierColor + '50' }]} />
      <View style={variant === 'hero' ? styles.heroBody : variant === 'compact' ? styles.compactBody : styles.body}>
        {variant === 'compact' ? (
          <>
            <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={1}>{perk.title}</Text>
            <OTPointsBadge amount={perk.cost} size={14} label="pts" compact textColor={tierColor} />
          </>
        ) : (
          <>
            {variant !== 'compact' && (
              <View style={[styles.tierPill, { backgroundColor: tierColor + '28', borderColor: tierColor }]}>
                <Text style={[styles.tierLabel, { color: tierColor }]}>{perk.tier.toUpperCase()}</Text>
              </View>
            )}
            <Text style={[variant === 'hero' ? styles.heroTitle : styles.title, { color: colors.text }]} numberOfLines={variant === 'compact' ? 1 : 2}>
              {perk.title}
            </Text>
            {partnerName && (
              <Text style={[styles.partnerLine, { color: colors.textSecondary }]} numberOfLines={1}>at {partnerName}</Text>
            )}
            <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={variant === 'hero' ? 3 : 2}>{perk.description}</Text>
            <View style={[styles.metaRow, { borderColor: tierColor + '44', backgroundColor: tierColor + '14' }]}>
              <OTPointsBadge amount={perk.cost} size={variant === 'hero' ? 18 : 14} label="pts" compact textColor={tierColor} />
              <Text style={[styles.cooldown, { color: colors.textSecondary }]}>{perk.cooldown}</Text>
            </View>
            {variant === 'row' && (
              <View style={styles.ctaRow}>
                <Text style={[styles.ctaText, { color: tierColor }]}>Tap to redeem</Text>
                <Ionicons name="chevron-forward" size={16} color={tierColor} />
              </View>
            )}
          </>
        )}
      </View>
    </>
  );

  return (
    <TouchableOpacity style={[styles.outer, variant === 'hero' && styles.outerHero]} onPress={handlePress} activeOpacity={0.92}>
      <LinearGradient
        colors={[...HOLO_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.borderGradient, variant === 'hero' && styles.borderGradientHero, { padding: holoPadding }]}
      >
        <View style={[styles.cardInner, { backgroundColor: isDark ? '#0d0d12' : '#14141a' }, variant === 'hero' && styles.cardInnerHero]}>
          {content}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, borderRadius: 14, minHeight: 0 },
  outerHero: { borderRadius: 20 },
  borderGradient: {
    borderRadius: 14,
  },
  borderGradientHero: { borderRadius: 20 },
  cardInner: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 100,
  },
  cardInnerHero: { borderRadius: 18, minHeight: 180 },
  tierBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.8,
  },
  body: { padding: 14, paddingTop: 12 },
  heroBody: { padding: 22, paddingTop: 20 },
  compactBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  compactTitle: { fontSize: 14, fontWeight: '800', flex: 1, marginRight: 10 },
  tierPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  tierLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: 0.2 },
  heroTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  partnerLine: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  desc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cooldown: { fontSize: 11, fontWeight: '600' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  ctaText: { fontSize: 12, fontWeight: '800' },
});
