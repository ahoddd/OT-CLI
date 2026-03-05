/**
 * FeatureLockOverlay — reusable tier-gate UI.
 * Two modes:
 *   compact={false} (default): semi-transparent overlay over locked content + lock icon + tier badge + CTA
 *   compact={true}: small inline "🔒 Premium" chip shown next to locked items
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { RADIUS, SPACE } from '../constants/DesignTokens';

const TIER_LABELS: Record<string, string> = {
  premium: 'Premium',
  pro: 'Pro',
  gold: 'Gold Partner',
  platinum: 'Platinum Partner',
};

const TIER_COLORS: Record<string, string> = {
  premium: COLORS.gold[0],
  pro: '#a855f7',
  gold: COLORS.gold[0],
  platinum: '#a855f7',
};

interface FeatureLockOverlayProps {
  featureName: string;
  requiredTier: 'premium' | 'pro' | 'gold' | 'platinum';
  onUpgrade: () => void;
  /** When true renders a small inline chip instead of a full overlay. */
  compact?: boolean;
}

export function FeatureLockOverlay({
  featureName,
  requiredTier,
  onUpgrade,
  compact = false,
}: FeatureLockOverlayProps) {
  const { colors } = useTheme();
  const tierColor = TIER_COLORS[requiredTier] ?? COLORS.neonBlue[0];
  const tierLabel = TIER_LABELS[requiredTier] ?? requiredTier;

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.chip, { backgroundColor: tierColor + '22', borderColor: tierColor + '55' }]}
        onPress={onUpgrade}
        activeOpacity={0.8}
        accessibilityLabel={`${featureName} requires ${tierLabel}`}
      >
        <Ionicons name="lock-closed" size={10} color={tierColor} />
        <Text style={[styles.chipText, { color: tierColor }]}>{tierLabel}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.lockIconWrap, { backgroundColor: tierColor + '22' }]}>
          <Ionicons name="lock-closed" size={28} color={tierColor} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{featureName}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Unlock with {tierLabel}
        </Text>
        <TouchableOpacity
          style={[styles.unlockBtn, { backgroundColor: tierColor }]}
          onPress={onUpgrade}
          activeOpacity={0.85}
        >
          <Text style={styles.unlockBtnText}>Upgrade to {tierLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Compact chip ─────────────────────────────────────────────────────────
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // ── Full overlay ──────────────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: RADIUS.md,
  },
  card: {
    alignItems: 'center',
    padding: SPACE.xl,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACE.sm,
    maxWidth: 280,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  lockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    textAlign: 'center',
  },
  unlockBtn: {
    marginTop: SPACE.xs,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xl,
    borderRadius: RADIUS.base,
  },
  unlockBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});
