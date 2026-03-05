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
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { usePremiumPricing } from '../hooks/usePremiumPricing';
import { useI18n } from '../context/I18nContext';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/Colors';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { formatPrice, yearlySavingsPercent } from '../constants/PremiumPricing';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';

type PlanCell = boolean | string;

interface CompSection {
  title: string;
  rows: Array<{ id: string; label: string; free: PlanCell; premium: PlanCell; pro: PlanCell }>;
}

const USER_SECTIONS: CompSection[] = [
  {
    title: 'DISCOVERY & NAVIGATION',
    rows: [
      { id: 'map', label: 'Live discovery map', free: true, premium: true, pro: true },
      { id: 'tonight', label: 'Tonight curated picks', free: true, premium: true, pro: true },
      { id: 'orbswipe', label: 'OrbSwipe (swipe to plan)', free: true, premium: true, pro: true },
      { id: 'pulse', label: 'OrbPulse live feed', free: 'Limited', premium: 'Full + early', pro: 'Full + earliest' },
      { id: 'follows', label: 'Partner follows', free: '3 max', premium: 'Unlimited', pro: 'Unlimited' },
      { id: 'filters', label: 'Advanced filters', free: 'Basic', premium: 'All filters', pro: 'All filters' },
    ],
  },
  {
    title: 'EARNING & REWARDS',
    rows: [
      { id: 'earn', label: 'Earn OT Points (scan QR)', free: true, premium: true, pro: true },
      { id: 'missions', label: 'Daily missions (up to 3)', free: true, premium: true, pro: true },
      { id: 'streak', label: 'Streak rewards', free: true, premium: true, pro: true },
      { id: 'ritual', label: 'Daily ritual orb tap', free: true, premium: true, pro: true },
      { id: 'redeem', label: 'Redeem perks at partners', free: true, premium: true, pro: true },
      { id: 'stamps', label: 'Stamp cards & loyalty', free: true, premium: true, pro: true },
      { id: 'orbpass', label: 'OrbPass monthly perks', free: false, premium: true, pro: true },
      { id: 'drops', label: 'Drop access', free: 'Standard', premium: 'Early', pro: 'Earliest' },
      { id: 'powerups', label: 'Power-ups (shields, rerolls)', free: false, premium: true, pro: true },
      { id: 'multiplier', label: 'XP & OT multipliers', free: false, premium: '1.1×', pro: '1.2×' },
    ],
  },
  {
    title: 'SOCIAL & COMMUNITY',
    rows: [
      { id: 'spheres', label: 'Spheres (groups)', free: '2 max', premium: '10 max', pro: 'Unlimited' },
      { id: 'reviews', label: 'Verified reviews', free: true, premium: true, pro: true },
      { id: 'proof', label: 'Proof Cards', free: true, premium: true, pro: true },
      { id: 'orbvote', label: 'OrbVote (earn from polls)', free: true, premium: true, pro: true },
      { id: 'signal', label: 'OrbSignal forecasts', free: '2/day', premium: '10/day', pro: 'Unlimited' },
      { id: 'dealmatch', label: 'OrbBounty (deal match)', free: true, premium: true, pro: true },
      { id: 'invite', label: 'Invite friends (earn 50 OT)', free: true, premium: true, pro: true },
    ],
  },
  {
    title: 'GAMIFICATION & STATUS',
    rows: [
      { id: 'xp', label: 'XP & levels (Scout → Orb Master)', free: true, premium: true, pro: true },
      { id: 'badges', label: 'Badges & achievements', free: true, premium: true, pro: true },
      { id: 'leaderboard', label: 'Leaderboard', free: 'View only', premium: 'Full + city', pro: 'Full + city' },
      { id: 'badge', label: 'Profile badge', free: false, premium: 'Premium ✦', pro: 'Pro ★' },
      { id: 'featured', label: 'Featured in Pulse', free: false, premium: true, pro: 'Priority' },
    ],
  },
  {
    title: 'STATS & INSIGHTS',
    rows: [
      { id: 'stats7', label: '7-day personal stats', free: true, premium: true, pro: true },
      { id: 'stats30', label: '30-day stats & trends', free: false, premium: true, pro: true },
      { id: 'city', label: 'City rank comparison', free: false, premium: true, pro: true },
      { id: 'export', label: 'Export reports (CSV)', free: false, premium: true, pro: true },
    ],
  },
  {
    title: 'SUPPORT & ACCESS',
    rows: [
      { id: 'support', label: 'Support channel', free: 'Email', premium: 'Priority', pro: 'Dedicated' },
      { id: 'features', label: 'Early access to features', free: false, premium: false, pro: true },
      { id: 'routes', label: 'Saved routes & smart alerts', free: false, premium: true, pro: true },
    ],
  },
];

const PARTNER_SECTIONS: CompSection[] = [
  {
    title: 'LISTING & VISIBILITY',
    rows: [
      { id: 'basic', label: 'Map listing & profile', free: true, premium: true, pro: true },
      { id: 'badge', label: 'Partner badge', free: 'Verified', premium: 'Premium ✦', pro: 'Pro ★' },
      { id: 'featured', label: 'Featured placement', free: false, premium: true, pro: 'Priority' },
      { id: 'carousel', label: 'Sponsored carousel slots', free: false, premium: false, pro: true },
      { id: 'placement', label: 'Priority in search & Nearby', free: false, premium: false, pro: true },
    ],
  },
  {
    title: 'OFFERS & ENGAGEMENT',
    rows: [
      { id: 'perks', label: 'Active perks', free: '3 max', premium: 'Up to 10', pro: 'Unlimited' },
      { id: 'stamps', label: 'Stamp card programs', free: true, premium: true, pro: true },
      { id: 'drops', label: 'Drops & flash offers', free: false, premium: true, pro: true },
      { id: 'polls', label: 'OrbVote polls', free: true, premium: true, pro: true },
      { id: 'posts', label: 'Commerce Feed posts', free: true, premium: true, pro: true },
      { id: 'menu', label: 'Menu & Tonight Picks', free: true, premium: true, pro: true },
      { id: 'sphereinvite', label: 'Invite Sphere groups', free: false, premium: true, pro: true },
    ],
  },
  {
    title: 'ANALYTICS & DATA',
    rows: [
      { id: 'analytics7', label: '7-day analytics', free: true, premium: true, pro: true },
      { id: 'analytics30', label: '30-day analytics & trends', free: false, premium: true, pro: true },
      { id: 'funnel', label: 'Conversion funnel', free: false, premium: true, pro: true },
      { id: 'csv', label: 'Export to CSV', free: false, premium: true, pro: true },
      { id: 'retention', label: 'Repeat redeemer tracking', free: false, premium: true, pro: true },
    ],
  },
  {
    title: 'OPERATIONS & HIRING',
    rows: [
      { id: 'orbops', label: 'OrbOps work orders', free: true, premium: true, pro: true },
      { id: 'opportunities', label: 'OrbOpportunities (jobs)', free: true, premium: true, pro: true },
      { id: 'qr', label: 'QR code per perk', free: 'Standard', premium: 'Custom', pro: 'Custom' },
    ],
  },
  {
    title: 'SUPPORT & GROWTH',
    rows: [
      { id: 'support', label: 'Support channel', free: 'Email', premium: 'Priority', pro: 'Dedicated' },
      { id: 'dedicated', label: 'Dedicated success contact', free: false, premium: false, pro: true },
      { id: 'campaigns', label: 'Custom campaign support', free: false, premium: false, pro: true },
      { id: 'newfeatures', label: 'Early access to features', free: false, premium: false, pro: true },
    ],
  },
];

const GLOW_BORDER_WIDTH = 3;
const PULSE_DURATION = 2200;

function PremiumGlowBorder({ children }: { children: React.ReactNode }) {
  const themeGold = COLORS.gold?.[0] ?? '#fbbf24';
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
    themeGold,
    COLORS.neonBlue[0],
    '#a78bfa',
    '#ec4899',
    COLORS.gold[1],
    themeGold,
  ];
  const gradient2 = ['#06b6d4', '#ec4899', themeGold, '#8b5cf6', '#06b6d4'];

  return (
    <View style={glowStyles.outer}>
      <Animated.View style={[glowStyles.glowWrap, animatedStyle1]}>
        <LinearGradient
          colors={gradient1 as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[glowStyles.glowWrap, animatedStyle2]}>
        <LinearGradient
          colors={gradient2 as [string, string, ...string[]]}
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
  tier,
}: {
  value: PlanCell;
  tier: 'free' | 'premium' | 'pro';
}) {
  const { colors } = useTheme();
  const accentColor = tier === 'pro' ? PARTNER_TIER_COLORS.platinum : tier === 'premium' ? PARTNER_TIER_COLORS.gold : colors.textSecondary;
  if (value === true) {
    return (
      <View style={cellStyles.checkWrap}>
        <Ionicons name="checkmark-circle" size={20} color={accentColor} />
      </View>
    );
  }
  if (value === false) {
    return (
      <View style={cellStyles.checkWrap}>
        <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
      </View>
    );
  }
  return (
    <Text style={[cellStyles.limitText, { color: tier !== 'free' ? accentColor : colors.textSecondary }]} numberOfLines={2}>
      {value}
    </Text>
  );
}

const cellStyles = StyleSheet.create({
  checkWrap: { alignItems: 'center', justifyContent: 'center', minWidth: 28 },
  limitText: { fontSize: 12, fontWeight: '600' },
});

export default function CompareAccountsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { balance } = useWallet();
  const { prefs, setPremiumMember } = usePreferences();
  const { config: pricing } = usePremiumPricing();
  const { isPremium, isPro, isPartner } = useEffectiveTier();
  const sections = isPartner ? PARTNER_SECTIONS : USER_SECTIONS;
  const premiumMonthly = isPartner ? pricing.partnerMonthlyDollars : pricing.userMonthlyDollars;
  const premiumYearly = isPartner ? pricing.partnerYearlyDollars : pricing.userYearlyDollars;
  const proMonthly = isPartner ? pricing.partnerProMonthlyDollars : pricing.userProMonthlyDollars;
  const proYearly = isPartner ? pricing.partnerProYearlyDollars : pricing.userProYearlyDollars;
  const premiumSavePercent = yearlySavingsPercent(premiumMonthly, premiumYearly);
  const proSavePercent = yearlySavingsPercent(proMonthly, proYearly);

  const handleUpgrade = () => {
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPremiumMember(true);
    router.replace('/premium' as any);
  };

  const isNarrow = width < 380;
  const planColWidth = isNarrow ? 56 : 68;
  const premiumColWidth = isNarrow ? 72 : 88;
  const proColWidth = isNarrow ? 72 : 88;

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
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {isPartner ? 'More tier, more visibility and ROI' : 'Unlock your full OrbTap experience'}
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {isPartner
              ? 'Free gets you on the map. Premium adds 30-day analytics, conversion funnel, CSV export, 10 perks, and featured placement. Pro adds unlimited perks, Pro badge, sponsored carousel, priority placement, and a dedicated success contact — so you stand out and drive more foot traffic.'
              : 'Free gives you the map, missions, earning, and community. Premium unlocks OrbPass perks at every partner, 30-day trends, unlimited follows, early drops, power-ups, and your Premium badge. Pro gives you the earliest access to everything, the platinum Pro badge, XP multipliers, and dedicated support.'}
          </Text>
        </View>

        {!isPartner && (
          <View style={[styles.quickValueRow, { borderColor: colors.border }]}>
            <View style={styles.quickValueItem}>
              <Ionicons name="ticket" size={20} color={PARTNER_TIER_COLORS.gold} />
              <Text style={[styles.quickValueTitle, { color: colors.text }]}>OrbPass</Text>
              <Text style={[styles.quickValueSub, { color: colors.textSecondary }]}>Monthly perks{'\n'}at every partner</Text>
              <View style={[styles.quickValuePill, { backgroundColor: PARTNER_TIER_COLORS.gold + '18' }]}>
                <Text style={[styles.quickValuePillText, { color: PARTNER_TIER_COLORS.gold }]}>PREMIUM+</Text>
              </View>
            </View>
            <View style={[styles.quickValueItem, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Ionicons name="flash" size={20} color={PARTNER_TIER_COLORS.platinum} />
              <Text style={[styles.quickValueTitle, { color: colors.text }]}>First Access</Text>
              <Text style={[styles.quickValueSub, { color: colors.textSecondary }]}>Drops, features,{'\n'}and exclusives</Text>
              <View style={[styles.quickValuePill, { backgroundColor: PARTNER_TIER_COLORS.platinum + '18' }]}>
                <Text style={[styles.quickValuePillText, { color: PARTNER_TIER_COLORS.platinum }]}>PRO</Text>
              </View>
            </View>
            <View style={[styles.quickValueItem, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Ionicons name="diamond" size={20} color={COLORS.neonBlue[0]} />
              <Text style={[styles.quickValueTitle, { color: colors.text }]}>Status</Text>
              <Text style={[styles.quickValueSub, { color: colors.textSecondary }]}>Badges, rank,{'\n'}& multipliers</Text>
              <View style={[styles.quickValuePill, { backgroundColor: COLORS.neonBlue[0] + '18' }]}>
                <Text style={[styles.quickValuePillText, { color: COLORS.neonBlue[0] }]}>PAID</Text>
              </View>
            </View>
          </View>
        )}
        {!user && (
          <TouchableOpacity onPress={() => router.push('/auth/login' as any)} style={[styles.signInRow, { borderColor: colors.border }]}>
            <Ionicons name="log-in-outline" size={18} color={colors.primary} />
            <Text style={[styles.signInRowText, { color: colors.primary }]}>Sign in to compare your account</Text>
          </TouchableOpacity>
        )}
        {user && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/wallet' as any)} style={[styles.walletLink, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.neonBlue?.[0] ?? '#60a5fa'} />
            <Text style={[styles.walletLinkText, { color: colors.text }]}>Your OT Points: {balance.toLocaleString()} — View Vault</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Sticky plan header */}
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.planColFeature}>
            <Text style={[styles.planLabel, { color: colors.textSecondary }]}>Feature</Text>
          </View>
          <View style={[styles.planCol, { width: planColWidth, alignItems: 'center' }]}>
            <Text style={[styles.planLabel, { color: colors.textSecondary }]}>Free</Text>
            <Text style={[styles.priceLabel, { color: colors.textSecondary, fontSize: 10 }]}>$0</Text>
          </View>
          <View style={[styles.planColPremium, { width: premiumColWidth, minWidth: premiumColWidth, alignItems: 'center' }]}>
            <PremiumGlowBorder>
              <View style={[styles.premiumHeaderInner, { backgroundColor: colors.surface, borderColor: PARTNER_TIER_COLORS.gold }]}>
                <View style={[styles.tierDot, { backgroundColor: PARTNER_TIER_COLORS.gold }]} />
                <Text style={[styles.premiumLabel, { color: colors.text }]} numberOfLines={1}>Premium</Text>
                <Text style={[styles.priceLabel, { color: PARTNER_TIER_COLORS.gold }]} numberOfLines={1}>{formatPrice(premiumMonthly, 'month')}</Text>
              </View>
            </PremiumGlowBorder>
          </View>
          <View style={[styles.planColPro, { width: proColWidth, minWidth: proColWidth, alignItems: 'center' }]}>
            <View style={[styles.proHeaderInner, { backgroundColor: PARTNER_TIER_COLORS.platinum + '18', borderColor: PARTNER_TIER_COLORS.platinum, borderWidth: 2 }]}>
              <View style={[styles.tierDot, { backgroundColor: PARTNER_TIER_COLORS.platinum }]} />
              <Text style={[styles.premiumLabel, { color: colors.text }]} numberOfLines={1}>Pro</Text>
              <Text style={[styles.priceLabel, { color: PARTNER_TIER_COLORS.platinum }]} numberOfLines={1}>{formatPrice(proMonthly, 'month')}</Text>
            </View>
          </View>
        </View>

        {/* Sectioned rows */}
        {sections.map((section) => (
          <View key={section.title}>
            <View style={[styles.sectionHeader, { backgroundColor: colors.surface + '80' }]}>
              <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>{section.title}</Text>
            </View>
            {section.rows.map((row, index) => {
              const isLast = index === section.rows.length - 1;
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
                    <ComparisonCell value={row.free} tier="free" />
                  </View>
                  <View style={[styles.cell, { width: premiumColWidth }]}>
                    <ComparisonCell value={row.premium} tier="premium" />
                  </View>
                  <View style={[styles.cell, { width: proColWidth }]}>
                    <ComparisonCell value={row.pro} tier="pro" />
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {!isPremium && (
          <View style={styles.tierSummaryWrap}>
            <View style={[styles.tierSummaryCard, { backgroundColor: colors.surface, borderColor: PARTNER_TIER_COLORS.gold + '40' }]}>
              <LinearGradient colors={[PARTNER_TIER_COLORS.gold + '10', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.tierSummaryHeader}>
                <View style={[styles.tierDot, { backgroundColor: PARTNER_TIER_COLORS.gold }]} />
                <Text style={[styles.tierSummaryName, { color: PARTNER_TIER_COLORS.gold }]}>Premium</Text>
                <Text style={[styles.tierSummaryPrice, { color: colors.textSecondary }]}>{formatPrice(premiumMonthly, 'month')}</Text>
              </View>
              {(isPartner
                ? [
                    'Up to 10 active perks',
                    '30-day analytics & conversion funnel',
                    'CSV export & featured placement',
                    'Premium (Gold) badge',
                    'Drops & flash offers',
                  ]
                : [
                    'OrbPass monthly perks at every partner',
                    '30-day stats, city rank & export',
                    'Unlimited follows & 10 Spheres',
                    'Early drop access & power-ups',
                    'Premium badge & featured eligibility',
                  ]
              ).map((txt, i) => (
                <View key={i} style={styles.tierSummaryItem}>
                  <Ionicons name="checkmark" size={14} color={PARTNER_TIER_COLORS.gold} />
                  <Text style={[styles.tierSummaryItemText, { color: colors.text }]}>{txt}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.tierSummaryCard, { backgroundColor: colors.surface, borderColor: PARTNER_TIER_COLORS.platinum + '40' }]}>
              <LinearGradient colors={[PARTNER_TIER_COLORS.platinum + '10', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.tierSummaryHeader}>
                <View style={[styles.tierDot, { backgroundColor: PARTNER_TIER_COLORS.platinum }]} />
                <Text style={[styles.tierSummaryName, { color: PARTNER_TIER_COLORS.platinum }]}>Pro</Text>
                <Text style={[styles.tierSummaryPrice, { color: colors.textSecondary }]}>{formatPrice(proMonthly, 'month')}</Text>
              </View>
              {(isPartner
                ? [
                    'Everything in Premium included',
                    'Unlimited perks & sponsored carousel',
                    'Priority in search & discovery',
                    'Pro (Platinum) badge & campaign support',
                    'Dedicated success contact',
                  ]
                : [
                    'Everything in Premium included',
                    'Earliest drop access before everyone',
                    'Pro badge — platinum verification',
                    '1.2× XP/OT multiplier & unlimited Spheres',
                    'Dedicated support & early feature access',
                  ]
              ).map((txt, i) => (
                <View key={i} style={styles.tierSummaryItem}>
                  <Ionicons name="checkmark" size={14} color={PARTNER_TIER_COLORS.platinum} />
                  <Text style={[styles.tierSummaryItemText, { color: colors.text }]}>{txt}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CTA card */}
        <View style={styles.ctaSection}>
          <PremiumGlowBorder>
            <View style={[styles.ctaCard, { backgroundColor: colors.surface }]}>
              <LinearGradient
                colors={[PARTNER_TIER_COLORS.gold + '18', PARTNER_TIER_COLORS.platinum + '12']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.ctaTitle, { color: colors.text }]}>
                {user && isPremium ? "You're upgraded" : 'Choose your plan'}
              </Text>
              <Text style={[styles.ctaSub, { color: colors.textSecondary }]}>
                {user && isPremium
                  ? 'You have full access. Make the most of it.'
                  : isPartner
                    ? `Premium: 10 perks, 30-day analytics, funnel, export. Pro: unlimited perks, carousel slots, priority placement, dedicated contact. Save ${premiumSavePercent}% with yearly (Premium) or ${proSavePercent}% (Pro).`
                    : `Premium: OrbPass at every partner, 30-day stats, early drops, unlimited follows, and your Premium badge. Pro: earliest drops, platinum badge, XP multipliers, and dedicated support. Save ${premiumSavePercent}% (Premium) or ${proSavePercent}% (Pro) with yearly.`}
              </Text>
              {!isPremium && user && (
                <>
                  <TouchableOpacity
                    style={styles.ctaBtn}
                    onPress={handleUpgrade}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[PARTNER_TIER_COLORS.gold, '#b8860b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.ctaBtnText}>Upgrade to Premium</Text>
                    <Ionicons name="diamond" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.proLinkBtn, { borderColor: PARTNER_TIER_COLORS.platinum }]}
                    onPress={() => router.push('/premium?tier=pro' as any)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.proLinkBtnText, { color: PARTNER_TIER_COLORS.platinum }]}>See Pro benefits</Text>
                    <Ionicons name="star" size={18} color={PARTNER_TIER_COLORS.platinum} />
                  </TouchableOpacity>
                </>
              )}
              {!user && (
                <TouchableOpacity
                  style={styles.ctaBtn}
                  onPress={() => router.push('/auth/signup' as any)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[COLORS.neonBlue[0], '#818cf8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.ctaBtnText}>Get started — it's free</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" />
                </TouchableOpacity>
              )}
              {user && isPremium && (
                <>
                  {!isPro && (
                    <TouchableOpacity
                      style={[styles.proLinkBtn, { borderColor: PARTNER_TIER_COLORS.platinum }]}
                      onPress={() => router.push('/premium?tier=pro' as any)}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.proLinkBtnText, { color: PARTNER_TIER_COLORS.platinum }]}>See Pro benefits</Text>
                      <Ionicons name="star" size={18} color={PARTNER_TIER_COLORS.platinum} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.doneBtn, { borderColor: colors.border }]}
                    onPress={() => router.back()}
                  >
                    <Text style={[styles.doneBtnText, { color: colors.text }]}>Done</Text>
                  </TouchableOpacity>
                </>
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
  scrollContent: { padding: 20, paddingBottom: 120 },
  heroCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8, lineHeight: 22 },
  heroSub: { fontSize: 14, lineHeight: 21 },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  signInRowText: { fontSize: 14, fontWeight: '600' },
  walletLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  walletLinkText: { fontSize: 14, fontWeight: '700', flex: 1 },
  quickValueRow: {
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickValueItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 4,
  },
  quickValueTitle: { fontSize: 12, fontWeight: '800' },
  quickValueSub: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  quickValuePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  quickValuePillText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 8,
    borderRadius: 6,
  },
  sectionHeaderText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 4,
  },
  planColFeature: { flex: 1, paddingRight: 6 },
  planCol: { paddingRight: 2 },
  planColPremium: { paddingLeft: 2, paddingRight: 2 },
  planColPro: { paddingLeft: 2, paddingRight: 0 },
  planLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  premiumHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
  },
  proHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  premiumLabel: { fontSize: 11, fontWeight: '800', flexShrink: 0 },
  priceLabel: { fontSize: 10, fontWeight: '600', flexShrink: 0 },
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
  tierSummaryWrap: { gap: 12, marginTop: 24 },
  tierSummaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tierSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  tierSummaryName: { fontSize: 15, fontWeight: '800' },
  tierSummaryPrice: { fontSize: 12, fontWeight: '600' },
  tierSummaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tierSummaryItemText: { fontSize: 13, fontWeight: '600', flex: 1 },
  ctaSection: { marginTop: 20, marginBottom: 16 },
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
  proLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    marginTop: 10,
  },
  proLinkBtnText: { fontSize: 15, fontWeight: '800' },
  doneBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700' },
  finePrint: { fontSize: 12, textAlign: 'center' },
});
