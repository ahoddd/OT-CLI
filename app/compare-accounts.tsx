/**
 * Free vs Premium — Comparison page that drives upgrades.
 * Premium section has a subtle pulsing gradient glow; layout outdoes typical comparison tables.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { usePreferences } from '../hooks/usePreferences';
import { COLORS } from '../constants/Colors';
import { PremiumBadge } from '../components/PremiumBadge';
import * as Haptics from 'expo-haptics';

const COMPARISON_ROWS_USER = [
  { id: 'stats', label: 'Basic stats & OT Points', free: true, premium: true },
  { id: 'missions', label: 'Missions & streaks', free: true, premium: true },
  { id: 'wallet', label: 'Wallet & power-ups', free: true, premium: true },
  { id: 'trends', label: '30-day trends', free: false, premium: true },
  { id: 'city', label: 'Compare to city', free: false, premium: true },
  { id: 'export', label: 'Export reports', free: false, premium: true },
  { id: 'badge', label: 'Premium badge', free: false, premium: true },
  { id: 'drops', label: 'Early drop access', free: false, premium: true },
  { id: 'follows', label: 'Follows & circles', free: 'Limited', premium: 'Unlimited' },
] as const;

const COMPARISON_ROWS_PARTNER = [
  { id: 'basic', label: 'Basic dashboard', free: true, premium: true },
  { id: 'perks', label: 'Active perks', free: 'Limited', premium: 'More' },
  { id: 'funnel', label: 'Conversion funnel', free: false, premium: true },
  { id: 'traffic', label: 'Traffic insights', free: false, premium: true },
  { id: 'csv', label: 'Export to CSV', free: false, premium: true },
  { id: 'badge', label: 'Partner Pro badge', free: false, premium: true },
  { id: 'featured', label: 'Featured placement', free: false, premium: true },
] as const;

const GLOW_BORDER_WIDTH = 3;
const PULSE_DURATION = 2200;

function PremiumGlowBorder({ children }: { children: React.ReactNode }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress]);

  const animatedStyle1 = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.45, 0.95, 0.45]);
    return { opacity };
  });
  const animatedStyle2 = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.95, 0.45, 0.95]);
    return { opacity };
  });

  const gradient1 = [
    COLORS.gold[0],
    COLORS.neonBlue[0],
    '#a78bfa',
    '#ec4899',
    COLORS.gold[1],
    COLORS.gold[0],
  ];
  const gradient2 = ['#06b6d4', '#ec4899', COLORS.gold[0], '#8b5cf6', '#06b6d4'];

  return (
    <View style={glowStyles.outer}>
      <Animated.View style={[glowStyles.glowWrap, animatedStyle1]}>
        <LinearGradient
          colors={gradient1}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[glowStyles.glowWrap, animatedStyle2]}>
        <LinearGradient
          colors={gradient2}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={glowStyles.inner}>{children}</View>
    </View>
  );
}

const glowStyles = StyleSheet.create({
  outer: {
    position: 'relative',
    borderRadius: 20,
    padding: GLOW_BORDER_WIDTH,
  },
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },
  inner: {
    borderRadius: 20 - GLOW_BORDER_WIDTH,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});

function ComparisonCell({
  value,
  isPremiumCol,
}: {
  value: boolean | string;
  isPremiumCol: boolean;
}) {
  const { colors } = useTheme();
  if (value === true) {
    return (
      <View style={cellStyles.checkWrap}>
        <Ionicons
          name="checkmark-circle"
          size={22}
          color={isPremiumCol ? COLORS.gold[0] : colors.textSecondary}
        />
      </View>
    );
  }
  if (value === false) {
    return (
      <View style={cellStyles.checkWrap}>
        <Ionicons name="close-circle-outline" size={22} color={colors.textSecondary} />
      </View>
    );
  }
  return (
    <Text style={[cellStyles.limitText, { color: colors.textSecondary }]} numberOfLines={1}>
      {value}
    </Text>
  );
}

const cellStyles = StyleSheet.create({
  checkWrap: { alignItems: 'center', justifyContent: 'center', minWidth: 28 },
  limitText: { fontSize: 12, fontWeight: '600' },
});

export default function CompareAccountsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { prefs, setPremiumMember } = usePreferences();
  const isPremium = prefs.premiumMember ?? false;
  const isPartner = prefs.partnerMode ?? false;
  const rows = isPartner ? COMPARISON_ROWS_PARTNER : COMPARISON_ROWS_USER;

  const handleUpgrade = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPremiumMember(true);
    router.replace('/premium' as any);
  };

  const isNarrow = width < 380;
  const planColWidth = isNarrow ? 72 : 88;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Compare plans</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          See what’s included in Free and what unlocks with Premium.
        </Text>

        {/* Table header */}
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.planColFeature}>
            <Text style={[styles.planLabel, { color: colors.textSecondary }]}>Feature</Text>
          </View>
          <View style={[styles.planCol, { width: planColWidth, alignItems: 'center' }]}>
            <Text style={[styles.planLabel, { color: colors.textSecondary }]}>Free</Text>
          </View>
          <View style={[styles.planColPremium, { width: planColWidth, alignItems: 'center' }]}>
            <PremiumGlowBorder>
              <View style={[styles.premiumHeaderInner, { backgroundColor: colors.surface }]}>
                <PremiumBadge variant="compact" size={18} />
                <Text style={[styles.premiumLabel, { color: colors.text }]}>Premium</Text>
              </View>
            </PremiumGlowBorder>
          </View>
        </View>

        {/* Rows */}
        {rows.map((row, index) => {
          const freeVal = row.free;
          const premVal = row.premium;
          const isLast = index === rows.length - 1;
          return (
            <View
              key={row.id}
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                isLast && styles.rowLast,
              ]}
            >
              <View style={styles.cellLabel}>
                <Text style={[styles.labelText, { color: colors.text }]} numberOfLines={2}>
                  {row.label}
                </Text>
              </View>
              <View style={[styles.cell, { width: planColWidth }]}>
                <ComparisonCell value={freeVal} isPremiumCol={false} />
              </View>
              <View style={[styles.cell, { width: planColWidth }]}>
                <ComparisonCell value={premVal} isPremiumCol={true} />
              </View>
            </View>
          );
        })}

        {/* Premium CTA card with same glow */}
        <View style={styles.ctaSection}>
          <PremiumGlowBorder>
            <View style={[styles.ctaCard, { backgroundColor: colors.surface }]}>
              <LinearGradient
                colors={[COLORS.gold[0] + '18', COLORS.gold[1] + '08']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.ctaTitle, { color: colors.text }]}>
                {isPremium ? "You're already Premium" : 'Get everything in Premium'}
              </Text>
              <Text style={[styles.ctaSub, { color: colors.textSecondary }]}>
                {isPremium
                  ? 'You have full access. Make the most of it.'
                  : 'Join and get the badge, 30-day trends, early drops, and more.'}
              </Text>
              {!isPremium && (
                <TouchableOpacity
                  style={styles.ctaBtn}
                  onPress={handleUpgrade}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[COLORS.gold[0], COLORS.gold[1]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.ctaBtnText}>Upgrade to Premium</Text>
                  <Ionicons name="diamond" size={18} color="#000" />
                </TouchableOpacity>
              )}
              {isPremium && (
                <TouchableOpacity
                  style={[styles.doneBtn, { borderColor: colors.border }]}
                  onPress={() => router.back()}
                >
                  <Text style={[styles.doneBtnText, { color: colors.text }]}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </PremiumGlowBorder>
        </View>

        <Text style={[styles.finePrint, { color: colors.textSecondary }]}>
          Cancel anytime. You're in control.
        </Text>
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  headerRight: { width: 36 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 4,
  },
  planColFeature: { flex: 1, paddingRight: 8 },
  planCol: { paddingRight: 4 },
  planColPremium: { paddingLeft: 4, paddingRight: 0 },
  planLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  premiumHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  premiumLabel: { fontSize: 13, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLast: { borderBottomWidth: 0 },
  cellLabel: { flex: 1, paddingRight: 8 },
  cell: { alignItems: 'center', justifyContent: 'center' },
  labelText: { fontSize: 14, fontWeight: '500' },
  ctaSection: { marginTop: 28, marginBottom: 16 },
  ctaCard: {
    borderRadius: 18,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  ctaTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  ctaSub: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  doneBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700' },
  finePrint: { fontSize: 12, textAlign: 'center' },
});
