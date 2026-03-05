/**
 * OrbTap Plans — Unified tier hub.
 * Sub-tabs: Free | Premium | Pro.
 * Context-aware for members vs partners. Conversion-optimized.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../hooks/usePreferences';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { useTheme } from '../hooks/useTheme';
import { useWallet } from '../hooks/useWallet';
import { usePremiumPricing } from '../hooks/usePremiumPricing';
import { useTierBenefits } from '../hooks/useTierBenefits';
import { formatPrice, yearlySavingsPercent } from '../constants/PremiumPricing';
import { COLORS } from '../constants/Colors';
import { PARTNER_TIER_COLORS, PLATINUM_GRADIENT } from '../constants/PartnerTiers';
import { PremiumBadge } from '../components/PremiumBadge';
import { PartnerProBadge } from '../components/PartnerProBadge';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { BILLING_PORTAL_URL } from '../constants/AppLinks';
import * as Linking from 'expo-linking';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app as firebaseApp } from '../firebaseConfig';
import { showErrorAlert } from '../utils/alert';
import { logPremiumView } from '../services/analytics';
import { getGlobalStats, formatStatCount } from '../services/globalStats';
import { useI18n } from '../context/I18nContext';

const { width: SCREEN_W } = Dimensions.get('window');
const PLAT = PARTNER_TIER_COLORS.platinum;
const GOLD = PARTNER_TIER_COLORS.gold;
const TAB_BAR_CLEARANCE = Platform.OS === 'ios' ? 100 : 80;

const STRIPE_PRICE_IDS = {
  user: {
    premium: { monthly: process.env.EXPO_PUBLIC_STRIPE_PRICE_USER_PREMIUM_MONTHLY ?? 'price_user_premium_monthly', yearly: process.env.EXPO_PUBLIC_STRIPE_PRICE_USER_PREMIUM_YEARLY ?? 'price_user_premium_yearly' },
    pro: { monthly: process.env.EXPO_PUBLIC_STRIPE_PRICE_USER_PRO_MONTHLY ?? 'price_user_pro_monthly', yearly: process.env.EXPO_PUBLIC_STRIPE_PRICE_USER_PRO_YEARLY ?? 'price_user_pro_yearly' },
  },
  partner: {
    premium: { monthly: process.env.EXPO_PUBLIC_STRIPE_PRICE_PARTNER_PREMIUM_MONTHLY ?? 'price_partner_premium_monthly', yearly: process.env.EXPO_PUBLIC_STRIPE_PRICE_PARTNER_PREMIUM_YEARLY ?? 'price_partner_premium_yearly' },
    pro: { monthly: process.env.EXPO_PUBLIC_STRIPE_PRICE_PARTNER_PRO_MONTHLY ?? 'price_partner_pro_monthly', yearly: process.env.EXPO_PUBLIC_STRIPE_PRICE_PARTNER_PRO_YEARLY ?? 'price_partner_pro_yearly' },
  },
};

type TierTab = 'free' | 'premium' | 'pro';

/* ─────────── BENEFIT DEFINITIONS ─────────── */

interface BenefitItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  tag?: string;
}

const FREE_USER_BENEFITS: BenefitItem[] = [
  { icon: 'map', title: 'Live discovery map', sub: 'All partner venues on a real-time map with orb pins, ratings, and hours.' },
  { icon: 'qr-code', title: 'Earn OT Points', sub: 'Scan QR codes at partner venues to earn OT Points instantly.' },
  { icon: 'flame', title: 'Daily missions & streaks', sub: 'Up to 3 daily missions. Build streaks for bonus OT Points.' },
  { icon: 'trophy', title: 'XP, levels & badges', sub: '7 levels from Scout to Orb Master. 40+ badges to collect.' },
  { icon: 'gift', title: 'Redeem perks', sub: 'Spend OT Points on discounts, free items, and VIP access at partners.' },
  { icon: 'people', title: 'Spheres (up to 2)', sub: 'Join invite-only groups. Pool points and compete as a squad.' },
  { icon: 'shield-checkmark', title: 'Verified reviews', sub: 'Leave Orb Score reviews. Only verified visitors can rate.' },
  { icon: 'document-text', title: 'Proof Cards', sub: 'Shareable cards for every verified visit. Flex your history.' },
  { icon: 'podium', title: 'Leaderboard (view only)', sub: 'See weekly and all-time rankings in your city.' },
  { icon: 'chatbubbles', title: 'OrbVote', sub: 'Vote on partner polls and earn OT Points for every vote.' },
  { icon: 'pulse', title: 'OrbPulse (limited)', sub: 'See where verified visits are happening right now.' },
  { icon: 'stats-chart', title: '7-day personal stats', sub: 'Track your visits, points earned, and activity for the past week.' },
  { icon: 'compass', title: 'Tonight curated picks', sub: 'See what\'s happening tonight — curated by the community.' },
  { icon: 'swap-horizontal', title: 'OrbSwipe', sub: 'Swipe through venues to plan your night. Discover new favorites.' },
  { icon: 'megaphone', title: 'OrbSignal (2/day)', sub: 'Get limited daily forecasts for venue buzz and activity.' },
  { icon: 'receipt', title: 'Stamp cards', sub: 'Earn loyalty stamps at participating partners.' },
];

const FREE_PARTNER_BENEFITS: BenefitItem[] = [
  { icon: 'location', title: 'Map listing', sub: 'Your venue appears on the discovery map. Explorers see your orb.' },
  { icon: 'pricetags', title: 'Up to 3 active perks', sub: 'List your best offers — happy hour, lunch deal, etc.' },
  { icon: 'stats-chart', title: '7-day analytics', sub: 'Profile views, follows, and engagement for the past week.' },
  { icon: 'shield-checkmark', title: 'Verified badge', sub: 'Customers see a verified checkmark on your listing.' },
  { icon: 'construct', title: 'OrbOps work orders', sub: 'Receive catering, cleaning, and service requests.' },
  { icon: 'newspaper', title: 'Commerce Feed', sub: 'Post updates and offers into the explorer feed.' },
  { icon: 'chatbubbles', title: 'OrbVote polls', sub: 'Run polls to get real feedback from customers.' },
  { icon: 'briefcase', title: 'OrbOpportunities', sub: 'Post jobs and review applicants in the app.' },
];

const PREMIUM_USER_EXTRAS: BenefitItem[] = [
  { icon: 'ticket', title: 'OrbPass', sub: 'Exclusive monthly perks at every partner venue. One-tap redeem.', tag: 'STAR' },
  { icon: 'stats-chart', title: '30-day stats & trends', sub: 'See your momentum over time with extended analytics.' },
  { icon: 'podium', title: 'City rank comparison', sub: 'See how you stack up against other explorers in your city.' },
  { icon: 'download', title: 'Export reports', sub: 'Download your stats and activity history as CSV.' },
  { icon: 'flash', title: 'Early drop access', sub: 'Reserve limited drops before Free members. First in line.' },
  { icon: 'heart', title: 'Unlimited partner follows', sub: 'Save as many partners as you want. No limits.' },
  { icon: 'people', title: 'Up to 10 Spheres', sub: 'Join or create more invite-only groups with friends.' },
  { icon: 'megaphone', title: 'OrbSignal (10/day)', sub: 'More daily forecasts and venue predictions.' },
  { icon: 'rocket', title: 'Power-ups', sub: 'Shields to protect your streak, mission re-rolls, and bonus multipliers.' },
  { icon: 'shield-checkmark', title: 'Premium badge', sub: 'Verified gold badge on your profile, leaderboard, and proofs.' },
  { icon: 'headset', title: 'Priority support', sub: 'Faster response when you need help.' },
  { icon: 'star', title: 'Featured eligibility', sub: 'Chance to be highlighted in Pulse and discovery feeds.' },
  { icon: 'navigate', title: 'Saved routes & alerts', sub: 'Save favorite routes and get smart alerts for new drops.' },
  { icon: 'options', title: 'Advanced filters', sub: 'Full filter access for map, Pulse, and OrbSwipe.' },
];

const PREMIUM_PARTNER_EXTRAS: BenefitItem[] = [
  { icon: 'pricetags', title: 'Up to 10 active perks', sub: 'Seasonal offers, daily specials, and member-only perks.' },
  { icon: 'trending-up', title: '30-day analytics & funnel', sub: 'See trends, week-over-week, and view → tap → redeem funnel.' },
  { icon: 'download', title: 'Export to CSV', sub: 'Use your data in spreadsheets or BI tools.' },
  { icon: 'flash', title: 'Drops & flash offers', sub: 'Limited-time deals that create urgency and drive foot traffic.' },
  { icon: 'star', title: 'Featured placement', sub: 'Get in front of more explorers with priority positioning.' },
  { icon: 'shield-checkmark', title: 'Premium badge', sub: 'Gold badge signals quality and boosts customer trust.' },
  { icon: 'headset', title: 'Priority support', sub: 'Faster response when you need help.' },
];

const PRO_USER_EXTRAS: BenefitItem[] = [
  { icon: 'flash', title: 'Earliest drop access', sub: 'Reserve drops before Premium and Free. The absolute first in line.', tag: 'EXCLUSIVE' },
  { icon: 'diamond', title: 'Pro badge', sub: 'Platinum badge — the highest verification tier on OrbTap.' },
  { icon: 'trending-up', title: '1.2× XP & OT multiplier', sub: 'Earn 20% more on every scan, mission, and streak.', tag: 'BOOST' },
  { icon: 'people', title: 'Unlimited Spheres', sub: 'Create and join as many groups as you want. No limits.' },
  { icon: 'megaphone', title: 'Unlimited OrbSignal', sub: 'Unlimited daily forecasts and real-time venue predictions.' },
  { icon: 'headset', title: 'Dedicated support', sub: 'Direct channel for questions and issues. A real person.' },
  { icon: 'rocket', title: 'Early access to features', sub: 'First to try new OrbTap product features before anyone.' },
  { icon: 'podium', title: 'Priority featured in Pulse', sub: 'Priority eligibility to be highlighted in Pulse and discovery feeds.' },
];

const PRO_PARTNER_EXTRAS: BenefitItem[] = [
  { icon: 'pricetags', title: 'Unlimited active perks', sub: 'No cap. Run as many offers, promos, and events as you want.', tag: 'UNLIMITED' },
  { icon: 'megaphone', title: 'Sponsored carousel slots', sub: 'Your venue in Pulse and high-traffic discovery spots.' },
  { icon: 'trending-up', title: 'Priority in search', sub: 'Shown above Premium and Free in "Nearby" and all filters.' },
  { icon: 'diamond', title: 'Pro badge', sub: 'Platinum badge — stands out on map, search, and profile.' },
  { icon: 'person', title: 'Dedicated success contact', sub: 'A real person for onboarding, strategy, and growth.' },
  { icon: 'analytics', title: 'Full analytics + export', sub: '30-day trends, conversion funnel, CSV export — the full toolkit.' },
  { icon: 'rocket', title: 'Early access to features', sub: 'First to use new drops, ads, and OrbTap tools.' },
  { icon: 'color-palette', title: 'Custom campaign support', sub: 'Featured in local promos when OrbTap runs campaigns.' },
];

/* ─────────── WHAT YOU'RE MISSING (for Free tab) ─────────── */

interface LockedFeature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tier: 'premium' | 'pro';
}

const LOCKED_USER_FEATURES: LockedFeature[] = [
  { icon: 'ticket', title: 'OrbPass monthly perks', tier: 'premium' },
  { icon: 'stats-chart', title: '30-day stats & trends', tier: 'premium' },
  { icon: 'flash', title: 'Early drop access', tier: 'premium' },
  { icon: 'heart', title: 'Unlimited partner follows', tier: 'premium' },
  { icon: 'rocket', title: 'Power-ups (shields, rerolls)', tier: 'premium' },
  { icon: 'shield-checkmark', title: 'Premium verified badge', tier: 'premium' },
  { icon: 'navigate', title: 'Saved routes & smart alerts', tier: 'premium' },
  { icon: 'diamond', title: 'Earliest drop access', tier: 'pro' },
  { icon: 'diamond', title: 'Pro badge & dedicated support', tier: 'pro' },
  { icon: 'trending-up', title: '1.2× XP & OT multiplier', tier: 'pro' },
  { icon: 'people', title: 'Unlimited Spheres', tier: 'pro' },
];

const LOCKED_PARTNER_FEATURES: LockedFeature[] = [
  { icon: 'pricetags', title: 'Up to 10 active perks', tier: 'premium' },
  { icon: 'trending-up', title: '30-day analytics & funnel', tier: 'premium' },
  { icon: 'flash', title: 'Drops & flash offers', tier: 'premium' },
  { icon: 'pricetags', title: 'Unlimited perks', tier: 'pro' },
  { icon: 'megaphone', title: 'Sponsored carousel slots', tier: 'pro' },
  { icon: 'trending-up', title: 'Priority in search', tier: 'pro' },
];

/* ─────────── INLINE COMPARISON ─────────── */

type CellVal = boolean | string;

interface CompRow {
  label: string;
  free: CellVal;
  premium: CellVal;
  pro: CellVal;
}

const COMPARE_USER: CompRow[] = [
  { label: 'Map & discovery', free: true, premium: true, pro: true },
  { label: 'Earn OT Points', free: true, premium: true, pro: true },
  { label: 'Missions & streaks', free: true, premium: true, pro: true },
  { label: 'OrbProof & reviews', free: true, premium: true, pro: true },
  { label: 'Spheres', free: '2 max', premium: '10 max', pro: 'Unlimited' },
  { label: 'OrbSignal', free: '2/day', premium: '10/day', pro: 'Unlimited' },
  { label: 'Pulse & drops', free: 'Limited', premium: 'Full + early', pro: 'Earliest' },
  { label: 'Partner follows', free: '3 max', premium: 'Unlimited', pro: 'Unlimited' },
  { label: 'OrbPass perks', free: false, premium: true, pro: true },
  { label: '30-day stats', free: false, premium: true, pro: true },
  { label: 'City rank', free: false, premium: true, pro: true },
  { label: 'Export reports', free: false, premium: true, pro: true },
  { label: 'Power-ups', free: false, premium: true, pro: true },
  { label: 'XP / OT multiplier', free: false, premium: '1.1×', pro: '1.2×' },
  { label: 'Badge on profile', free: false, premium: 'Premium', pro: 'Pro' },
  { label: 'Support level', free: 'Email', premium: 'Priority', pro: 'Dedicated' },
  { label: 'Early features', free: false, premium: false, pro: true },
];

const COMPARE_PARTNER: CompRow[] = [
  { label: 'Map listing', free: true, premium: true, pro: true },
  { label: 'Partner dashboard', free: true, premium: true, pro: true },
  { label: 'OrbVote polls', free: true, premium: true, pro: true },
  { label: 'Commerce Feed', free: true, premium: true, pro: true },
  { label: 'OrbOps & jobs', free: true, premium: true, pro: true },
  { label: 'Active perks', free: '3 max', premium: 'Up to 10', pro: 'Unlimited' },
  { label: '7-day analytics', free: true, premium: true, pro: true },
  { label: '30-day analytics', free: false, premium: true, pro: true },
  { label: 'Conversion funnel', free: false, premium: true, pro: true },
  { label: 'CSV export', free: false, premium: true, pro: true },
  { label: 'Drops & flash offers', free: false, premium: true, pro: true },
  { label: 'Featured placement', free: false, premium: true, pro: 'Priority' },
  { label: 'Sponsored carousel', free: false, premium: false, pro: true },
  { label: 'Search priority', free: false, premium: false, pro: true },
  { label: 'Partner badge', free: 'Verified', premium: 'Premium', pro: 'Pro' },
  { label: 'Support level', free: 'Email', premium: 'Priority', pro: 'Dedicated' },
];

/* ─────────── SOCIAL PROOF ─────────── */

const SOCIAL_STATS_DEFAULT = [
  { value: '12,400+', label: 'Members' },
  { value: '850+', label: 'Venues' },
  { value: '48K+', label: 'Redeemed' },
];

/* ─────────── TIER CONFIG ─────────── */

const TIER_META: Record<TierTab, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; tagline: string }> = {
  free: { label: 'Free', icon: 'person', color: COLORS.neonBlue[0], tagline: 'Everything you need to start exploring — yours today.' },
  premium: { label: 'Premium', icon: 'diamond', color: GOLD, tagline: 'The perks, insights, and access most members choose.' },
  pro: { label: 'Pro', icon: 'star', color: PLAT, tagline: 'For those who want every advantage. No limits.' },
};

/* ─────────── COMPONENTS ─────────── */

function TierTabBar({
  selected,
  onSelect,
  currentTier,
  pricing,
  colors,
}: {
  selected: TierTab;
  onSelect: (t: TierTab) => void;
  currentTier: TierTab;
  pricing: { free: string; premium: string; pro: string };
  colors: any;
}) {
  const tabs: TierTab[] = ['free', 'premium', 'pro'];
  return (
    <View style={tabBarStyles.outerWrap}>
      <Text style={[tabBarStyles.selectLabel, { color: colors.textSecondary }]}>SELECT A PLAN</Text>
      <View style={[tabBarStyles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {tabs.map((t) => {
          const meta = TIER_META[t];
          const active = selected === t;
          const isCurrent = currentTier === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                tabBarStyles.tab,
                active && { borderColor: meta.color },
                !active && { borderColor: 'transparent' },
                Platform.OS === 'web' && { cursor: 'pointer' as any },
              ]}
              onPress={() => { onSelect(t); safeHaptics.selectionAsync(); }}
              activeOpacity={0.85}
            >
              {active && (
                <LinearGradient
                  colors={[meta.color + '28', meta.color + '0A']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
              )}
              <View style={[tabBarStyles.iconCircle, { backgroundColor: active ? meta.color + '22' : colors.border + '60' }]}>
                <Ionicons name={meta.icon} size={18} color={active ? meta.color : colors.textSecondary} />
              </View>
              <Text style={[tabBarStyles.tabLabel, { color: active ? colors.text : colors.textSecondary }]}>
                {meta.label}
              </Text>
              {t === 'premium' && (
                <View style={[tabBarStyles.popularPill, { backgroundColor: meta.color + '30' }]}>
                  <Text style={[tabBarStyles.popularPillText, { color: meta.color }]}>Most Popular</Text>
                </View>
              )}
              <Text style={[tabBarStyles.tabPrice, { color: active ? meta.color : colors.textSecondary + '90' }]}>
                {t === 'free' ? '$0' : pricing[t]}
              </Text>
              {isCurrent && (
                <View style={[tabBarStyles.currentPill, { backgroundColor: meta.color + '20' }]}>
                  <Text style={[tabBarStyles.currentPillText, { color: meta.color }]}>CURRENT</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  outerWrap: { marginHorizontal: 20, marginBottom: 20 },
  selectLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  wrap: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4, gap: 4 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 14, fontWeight: '800' },
  tabPrice: { fontSize: 11, fontWeight: '700' },
  currentPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  currentPillText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  popularPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  popularPillText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },
});

function BenefitCard({
  item,
  index,
  accentColor,
  colors,
  isPaid,
}: {
  item: BenefitItem;
  index: number;
  accentColor: string;
  colors: any;
  isPaid?: boolean;
}) {
  const hasTag = !!item.tag;
  const inner = (
    <View style={[benefitStyles.card, { backgroundColor: colors.surface, borderColor: hasTag && isPaid ? accentColor + '40' : colors.border }]}>
      <LinearGradient
        colors={[accentColor + '14', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[benefitStyles.iconWrap, { backgroundColor: accentColor + '18' }]}>
        <Ionicons name={item.icon} size={20} color={accentColor} />
      </View>
      <View style={benefitStyles.textWrap}>
        <View style={benefitStyles.titleRow}>
          <Text style={[benefitStyles.title, { color: colors.text }]}>{item.title}</Text>
          {item.tag && (
            <View style={[benefitStyles.tag, { backgroundColor: accentColor + '20' }]}>
              <Text style={[benefitStyles.tagText, { color: accentColor }]}>{item.tag}</Text>
            </View>
          )}
        </View>
        <Text style={[benefitStyles.sub, { color: colors.textSecondary }]}>{item.sub}</Text>
      </View>
    </View>
  );

  if (hasTag && isPaid) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(300).springify()} style={benefitStyles.outer}>
        <PulseGlow color={accentColor} style={benefitStyles.glowOuter}>
          {inner}
        </PulseGlow>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(300).springify()}
      style={benefitStyles.outer}
    >
      {inner}
    </Animated.View>
  );
}

const benefitStyles = StyleSheet.create({
  outer: { marginBottom: 10 },
  glowOuter: { borderRadius: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  textWrap: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, gap: 8 },
  title: { fontSize: 14, fontWeight: '800', flexShrink: 1 },
  tag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  tagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  sub: { fontSize: 12, lineHeight: 18 },
});

function LockedRow({
  item,
  index,
  colors,
}: {
  item: LockedFeature;
  index: number;
  colors: any;
}) {
  const tierColor = item.tier === 'pro' ? PLAT : GOLD;
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(250)}
      style={[lockedStyles.row, { borderBottomColor: colors.border + '40' }]}
    >
      <Ionicons name="lock-closed" size={14} color={colors.textSecondary + '80'} />
      <Text style={[lockedStyles.text, { color: colors.textSecondary }]}>{item.title}</Text>
      <View style={[lockedStyles.pill, { backgroundColor: tierColor + '18' }]}>
        <Text style={[lockedStyles.pillText, { color: tierColor }]}>
          {item.tier === 'pro' ? 'PRO' : 'PREMIUM'}
        </Text>
      </View>
    </Animated.View>
  );
}

const lockedStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  text: { fontSize: 13, fontWeight: '600', flex: 1 },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

function ComparisonCell({ value, tier }: { value: CellVal; tier: TierTab }) {
  const { colors } = useTheme();
  const accent = tier === 'pro' ? PLAT : tier === 'premium' ? GOLD : colors.textSecondary;
  if (value === true) return <Ionicons name="checkmark-circle" size={18} color={accent} />;
  if (value === false) return <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary + '50'} />;
  return <Text style={{ fontSize: 11, fontWeight: '700', color: accent, textAlign: 'center' }}>{value}</Text>;
}

function PricingHero({
  tierTab,
  monthlyPrice,
  yearlyPrice,
  billingCycle,
  setBillingCycle,
  colors,
}: {
  tierTab: TierTab;
  monthlyPrice: number;
  yearlyPrice: number;
  billingCycle: 'monthly' | 'yearly';
  setBillingCycle: (c: 'monthly' | 'yearly') => void;
  colors: any;
}) {
  const savings = yearlySavingsPercent(monthlyPrice, yearlyPrice);
  const accent = TIER_META[tierTab].color;

  if (tierTab === 'free') {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={[pricingStyles.freeWrap, { borderColor: colors.border }]}>
        <Text style={[pricingStyles.freePrice, { color: colors.text }]}>$0</Text>
        <Text style={[pricingStyles.freePeriod, { color: colors.textSecondary }]}>forever</Text>
        <Text style={[pricingStyles.freeSub, { color: colors.textSecondary }]}>No credit card. No strings. Just explore.</Text>
      </Animated.View>
    );
  }

  return (
    <PulseGlow color={accent} style={pricingStyles.glowOuter}>
      <Animated.View entering={FadeIn.duration(400)} style={[pricingStyles.wrap, { borderColor: accent + '30' }]}>
        <LinearGradient
          colors={[accent + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={pricingStyles.toggleRow}>
          <TouchableOpacity
            style={[
              pricingStyles.toggle,
              billingCycle === 'monthly'
                ? { borderColor: accent, borderWidth: 2 }
                : { borderColor: 'transparent', borderWidth: 2 },
            ]}
            onPress={() => { setBillingCycle('monthly'); safeHaptics.selectionAsync(); }}
            activeOpacity={0.85}
          >
            {billingCycle === 'monthly' && (
              <LinearGradient
                colors={[accent + '25', accent + '08']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <View style={pricingStyles.toggleTitleRow}>
              {billingCycle === 'monthly' && <Ionicons name="checkmark-circle" size={16} color={accent} />}
              <Text style={[pricingStyles.toggleLabel, { color: billingCycle === 'monthly' ? colors.text : colors.textSecondary }]}>Monthly</Text>
            </View>
            <Text style={[pricingStyles.togglePrice, { color: billingCycle === 'monthly' ? colors.text : colors.textSecondary }]}>
              {formatPrice(monthlyPrice, 'month')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              pricingStyles.toggle,
              billingCycle === 'yearly'
                ? { borderColor: accent, borderWidth: 2 }
                : { borderColor: 'transparent', borderWidth: 2 },
            ]}
            onPress={() => { setBillingCycle('yearly'); safeHaptics.selectionAsync(); }}
            activeOpacity={0.85}
          >
            {billingCycle === 'yearly' && (
              <LinearGradient
                colors={[accent + '25', accent + '08']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <View style={pricingStyles.toggleTitleRow}>
              {billingCycle === 'yearly' && <Ionicons name="checkmark-circle" size={16} color={accent} />}
              <Text style={[pricingStyles.toggleLabel, { color: billingCycle === 'yearly' ? colors.text : colors.textSecondary }]}>Yearly</Text>
              {savings > 0 && (
                <View style={[pricingStyles.savePill, { backgroundColor: accent }]}>
                  <Text style={pricingStyles.saveText}>SAVE {savings}%</Text>
                </View>
              )}
            </View>
            <Text style={[pricingStyles.togglePrice, { color: billingCycle === 'yearly' ? colors.text : colors.textSecondary }]}>
              {formatPrice(yearlyPrice, 'year')}
            </Text>
            {billingCycle !== 'yearly' && savings > 0 && (
              <Text style={[pricingStyles.toggleHint, { color: accent }]}>Best value</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </PulseGlow>
  );
}

const pricingStyles = StyleSheet.create({
  glowOuter: { marginHorizontal: 20, borderRadius: 16, marginBottom: 20 },
  freeWrap: { alignItems: 'center', padding: 20, marginHorizontal: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  freePrice: { fontSize: 36, fontWeight: '900' },
  freePeriod: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  freeSub: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  wrap: { borderRadius: 16, borderWidth: 1, padding: 6, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggle: { flex: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', overflow: 'hidden' },
  toggleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  togglePrice: { fontSize: 16, fontWeight: '900' },
  toggleHint: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  savePill: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 },
  saveText: { fontSize: 9, fontWeight: '800', color: '#000' },
});

/** Shimmer that sweeps left→right over the CTA button every 2.5s. */
function ShimmerCta({ children, style }: { children: React.ReactNode; style?: any }) {
  const shimX = useSharedValue(-SCREEN_W);
  useEffect(() => {
    shimX.value = withRepeat(withTiming(SCREEN_W + 60, { duration: 2500, easing: Easing.linear }), -1, false);
  }, []);
  const shimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimX.value }] }));
  return (
    <View style={[{ overflow: 'hidden', borderRadius: 16 }, style]}>
      {children}
      <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: 80 }, shimStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.18)', 'transparent']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
    </View>
  );
}

function PulseGlow({ color, children, style }: { color: string; children: React.ReactNode; style?: any }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);
  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: color,
    shadowOpacity: interpolate(pulse.value, [0, 1], [0.15, 0.55]),
    shadowRadius: interpolate(pulse.value, [0, 1], [4, 16]),
    shadowOffset: { width: 0, height: 0 },
    elevation: interpolate(pulse.value, [0, 1], [2, 8]),
  }));
  return <Animated.View style={[style, glowStyle]}>{children}</Animated.View>;
}

function IncludesCallout({
  previousTier,
  accentColor,
  colors,
}: {
  previousTier: string;
  accentColor: string;
  colors: any;
}) {
  return (
    <PulseGlow color={accentColor} style={includesStyles.outer}>
      <View style={[includesStyles.wrap, { borderColor: accentColor + '30', backgroundColor: accentColor + '08' }]}>
        <Ionicons name="layers" size={18} color={accentColor} />
        <Text style={[includesStyles.text, { color: colors.text }]}>
          Includes everything in {previousTier}
        </Text>
      </View>
    </PulseGlow>
  );
}

const includesStyles = StyleSheet.create({
  outer: { marginHorizontal: 20, marginBottom: 16, borderRadius: 12 },
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  text: { fontSize: 13, fontWeight: '700' },
});

function BadgePreview({ tierTab, colors }: { tierTab: TierTab; colors: any }) {
  if (tierTab === 'free') return null;
  const accent = TIER_META[tierTab].color;
  return (
    <PulseGlow color={accent} style={badgeStyles.glowOuter}>
    <View style={[badgeStyles.wrap, { backgroundColor: colors.surface, borderColor: accent + '30' }]}>
      <Text style={[badgeStyles.label, { color: colors.textSecondary }]}>YOUR NEW LOOK</Text>
      <View style={badgeStyles.row}>
        <Text style={[badgeStyles.name, { color: colors.text }]}>Your Name</Text>
        {tierTab === 'premium' ? <PremiumBadge variant="standard" size={18} /> : <PartnerProBadge size="small" />}
      </View>
      <Text style={[badgeStyles.sub, { color: colors.textSecondary }]}>
        {tierTab === 'premium'
          ? 'Other members see this badge on your profile, leaderboard, and proof cards.'
          : 'The platinum Pro badge — the highest tier on OrbTap. People notice.'}
      </Text>
    </View>
    </PulseGlow>
  );
}

const badgeStyles = StyleSheet.create({
  glowOuter: { marginHorizontal: 20, borderRadius: 16, marginBottom: 16 },
  wrap: { borderRadius: 16, borderWidth: 1, padding: 18 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 12, lineHeight: 18 },
});

function ROICallout({ tierTab, colors }: { tierTab: TierTab; colors: any }) {
  if (tierTab === 'free') return null;
  const accent = TIER_META[tierTab].color;
  return (
    <PulseGlow color={accent} style={roiStyles.glowOuter}>
      <View style={[roiStyles.wrap, { backgroundColor: accent + '0A', borderColor: accent + '25' }]}>
        <Ionicons name="calculator" size={20} color={accent} />
        <View style={roiStyles.textWrap}>
          <Text style={[roiStyles.title, { color: colors.text }]}>
            {tierTab === 'premium'
              ? 'Most members make it back on day one'
              : 'Pro members see measurable results'}
          </Text>
          <Text style={[roiStyles.sub, { color: colors.textSecondary }]}>
            {tierTab === 'premium'
              ? 'The average member redeems 3-5 perks monthly. One redemption covers the entire subscription.'
              : 'Priority placement, sponsored slots, and a dedicated contact — partners see measurably more foot traffic within the first month.'}
          </Text>
        </View>
      </View>
    </PulseGlow>
  );
}

const roiStyles = StyleSheet.create({
  glowOuter: { marginHorizontal: 20, borderRadius: 14, marginBottom: 16 },
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  sub: { fontSize: 12, lineHeight: 18 },
});

/* ─────────── MAIN SCREEN ─────────── */

export default function PremiumScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ tier?: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { balance } = useWallet();
  const { prefs, setPremiumMember, setPartnerMode } = usePreferences();
  const { isPremium, isPro, isPartner, tier: currentTier } = useEffectiveTier();
  const { config: pricing } = usePremiumPricing();
  const { config: tierBenefits } = useTierBenefits();

  const initialTab: TierTab = (params.tier as TierTab) || (isPro ? 'pro' : isPremium ? 'premium' : 'free');
  const [tierTab, setTierTab] = useState<TierTab>(initialTab);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [showComparison, setShowComparison] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [globalStats, setGlobalStats] = useState<{ userCount: number; partnerCount: number; totalRedemptions: number } | null>(null);

  useEffect(() => {
    getGlobalStats().then((s) => s && setGlobalStats(s));
  }, []);

  const socialStats = globalStats
    ? [
        { value: formatStatCount(globalStats.userCount) || '0', label: 'Members' },
        { value: formatStatCount(globalStats.partnerCount) || '0', label: 'Venues' },
        { value: formatStatCount(globalStats.totalRedemptions) || '0', label: 'Redeemed' },
      ]
    : SOCIAL_STATS_DEFAULT;

  useEffect(() => {
    logPremiumView({ tier: tierTab });
  }, [tierTab]);

  const accent = TIER_META[tierTab].color;

  const premiumMonthly = isPartner ? pricing.partnerMonthlyDollars : pricing.userMonthlyDollars;
  const premiumYearly = isPartner ? pricing.partnerYearlyDollars : pricing.userYearlyDollars;
  const proMonthly = isPartner ? pricing.partnerProMonthlyDollars : pricing.userProMonthlyDollars;
  const proYearly = isPartner ? pricing.partnerProYearlyDollars : pricing.userProYearlyDollars;

  const monthlyPrice = tierTab === 'premium' ? premiumMonthly : proMonthly;
  const yearlyPrice = tierTab === 'premium' ? premiumYearly : proYearly;
  const activePrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;
  const activePeriod = billingCycle === 'yearly' ? 'year' : 'month';

  const freeBenefits = isPartner ? FREE_PARTNER_BENEFITS : FREE_USER_BENEFITS;
  const premiumBenefits = isPartner ? PREMIUM_PARTNER_EXTRAS : PREMIUM_USER_EXTRAS;
  const proBenefits = isPartner ? PRO_PARTNER_EXTRAS : PRO_USER_EXTRAS;
  const lockedFeatures = isPartner ? LOCKED_PARTNER_FEATURES : LOCKED_USER_FEATURES;
  const compRows = isPartner ? COMPARE_PARTNER : COMPARE_USER;

  const currentBenefits = tierTab === 'free' ? freeBenefits : tierTab === 'premium' ? premiumBenefits : proBenefits;

  const alreadyHasTier = user && ((tierTab === 'premium' && isPremium) || (tierTab === 'pro' && isPro));

  const getPriceId = (): string => {
    const cycle = billingCycle as 'monthly' | 'yearly';
    const accountType = isPartner ? 'partner' : 'user';
    const tierKey = tierTab as 'premium' | 'pro';
    return STRIPE_PRICE_IDS[accountType][tierKey][cycle];
  };

  const handleUpgrade = async () => {
    if (purchasing) return;
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPurchasing(true);
    try {
      const fns = getFunctions(firebaseApp);
      const createSession = httpsCallable<
        { priceId: string; successUrl: string; cancelUrl: string },
        { sessionId: string; url: string }
      >(fns, 'createCheckoutSession');
      const result = await createSession({
        priceId: getPriceId(),
        successUrl: 'https://orbtap.com/premium?success=1',
        cancelUrl: 'https://orbtap.com/premium?cancel=1',
      });
      if (result.data.url) {
        await Linking.openURL(result.data.url);
      }
    } catch (err) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showErrorAlert('Checkout unavailable', 'Please try again or contact support@orbtap.com');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>OrbTap Plans</Text>
        <TouchableOpacity onPress={() => router.push('/compare-accounts' as any)} style={styles.compareBtn}>
          <Ionicons name="git-compare" size={20} color={accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: TAB_BAR_CLEARANCE }]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.heroWrap}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {alreadyHasTier
              ? `You're on ${TIER_META[tierTab].label}`
              : tierTab === 'free'
                ? 'You already get a lot. For free.'
                : tierTab === 'premium'
                  ? 'Most members choose this'
                  : 'Everything. No limits.'}
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {TIER_META[tierTab].tagline}
          </Text>
        </Animated.View>

        {/* Social proof */}
        <View style={[styles.socialStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {socialStats.map((s, i) => (
            <View key={i} style={[styles.socialItem, i < socialStats.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Text style={[styles.socialValue, { color: accent }]}>{s.value}</Text>
              <Text style={[styles.socialLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>
        {(tierTab === 'premium' || tierTab === 'pro') && (
          <Text style={[styles.riskReversal, { color: colors.textSecondary }]}>
            Join {globalStats ? formatStatCount(globalStats.userCount) : '2,400+'} Premium members · Cancel anytime
          </Text>
        )}

        {/* Tier tabs */}
        <TierTabBar
          selected={tierTab}
          onSelect={setTierTab}
          currentTier={currentTier}
          pricing={{ free: '$0', premium: formatPrice(premiumMonthly, 'month'), pro: formatPrice(proMonthly, 'month') }}
          colors={colors}
        />

        {/* Pricing */}
        <PricingHero
          tierTab={tierTab}
          monthlyPrice={monthlyPrice}
          yearlyPrice={yearlyPrice}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          colors={colors}
        />

        {/* "Includes" callout for Premium/Pro */}
        {tierTab === 'premium' && <IncludesCallout previousTier="Free" accentColor={GOLD} colors={colors} />}
        {tierTab === 'pro' && <IncludesCallout previousTier="Premium" accentColor={PLAT} colors={colors} />}

        {/* Benefits */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {tierTab === 'free'
            ? 'INCLUDED IN YOUR FREE ACCOUNT'
            : tierTab === 'premium'
              ? 'WHAT PREMIUM MEMBERS GET'
              : 'WHAT PRO MEMBERS GET'}
        </Text>
        <View style={styles.benefitsList}>
          {currentBenefits.map((b, i) => (
            <BenefitCard key={`${tierTab}-${i}`} item={b} index={i} accentColor={accent} colors={colors} isPaid={tierTab !== 'free'} />
          ))}
        </View>

        {/* Locked features (Free tab only) */}
        {tierTab === 'free' && !isPremium && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>
              AVAILABLE WITH AN UPGRADE
            </Text>
            <View style={styles.lockedList}>
              {lockedFeatures.map((f, i) => (
                <LockedRow key={i} item={f} index={i} colors={colors} />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.unlockBtn, { borderColor: GOLD + '50' }]}
              onPress={() => setTierTab('premium')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[GOLD + '15', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="diamond" size={18} color={GOLD} />
              <Text style={[styles.unlockBtnText, { color: GOLD }]}>See what members choose</Text>
              <Ionicons name="arrow-forward" size={16} color={GOLD} />
            </TouchableOpacity>
          </>
        )}

        {/* Badge preview */}
        <BadgePreview tierTab={tierTab} colors={colors} />

        {/* ROI callout */}
        <ROICallout tierTab={tierTab} colors={colors} />

        {/* Inline comparison toggle */}
        <TouchableOpacity
          style={[styles.compToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowComparison(!showComparison)}
          activeOpacity={0.85}
        >
          <Ionicons name="git-compare" size={18} color={accent} />
          <Text style={[styles.compToggleText, { color: colors.text }]}>
            {showComparison ? 'Hide comparison' : 'Compare Free vs Premium vs Pro'}
          </Text>
          <Ionicons name={showComparison ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Comparison table */}
        {showComparison && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.compWrap}>
            {/* Table header */}
            <View style={[styles.compHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.compHeaderFeature, { color: colors.textSecondary }]}>Feature</Text>
              <Text style={[styles.compHeaderPlan, { color: COLORS.neonBlue[0] }]}>Free</Text>
              <Text style={[styles.compHeaderPlan, { color: GOLD, fontWeight: '800' }]}>Prem</Text>
              <Text style={[styles.compHeaderPlan, { color: PLAT, fontWeight: '800' }]}>Pro</Text>
            </View>
            {compRows.map((row, i) => (
              <View key={i} style={[styles.compRow, { borderBottomColor: colors.border + '40' }, i === compRows.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={[styles.compFeature, { color: colors.text }]} numberOfLines={2}>{row.label}</Text>
                <View style={styles.compCell}><ComparisonCell value={row.free} tier="free" /></View>
                <View style={styles.compCell}><ComparisonCell value={row.premium} tier="premium" /></View>
                <View style={styles.compCell}><ComparisonCell value={row.pro} tier="pro" /></View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Wallet link */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/wallet' as any)}
          style={[styles.navLink, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="wallet" size={18} color={accent} />
          <Text style={[styles.navLinkText, { color: colors.text }]}>OT Points: {balance.toLocaleString()}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Pro upsell when viewing Premium */}
        {tierTab === 'premium' && !isPro && (
          <TouchableOpacity
            onPress={() => setTierTab('pro')}
            style={[styles.upsellBanner, { backgroundColor: colors.surface, borderColor: PLAT + '40' }]}
          >
            <LinearGradient
              colors={[PLAT + '12', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.upsellIcon, { backgroundColor: PLAT + '18' }]}>
              <Ionicons name="star" size={20} color={PLAT} />
            </View>
            <View style={styles.upsellText}>
              <Text style={[styles.upsellTitle, { color: colors.text }]}>Want even more? See Pro</Text>
              <Text style={[styles.upsellSub, { color: colors.textSecondary }]}>Earliest drops, Pro badge, dedicated support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={PLAT} />
          </TouchableOpacity>
        )}

        {/* CTA section — inside scroll so it's never behind the tab bar */}
        <View style={styles.ctaSection}>
          {alreadyHasTier ? (
            <>
              <TouchableOpacity
                style={[styles.manageBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={async () => {
                  try {
                    const fns = getFunctions(firebaseApp);
                    const portal = httpsCallable<{ returnUrl: string }, { url: string }>(fns, 'createBillingPortal');
                    const result = await portal({ returnUrl: 'https://orbtap.com/premium' });
                    if (result.data.url) await Linking.openURL(result.data.url);
                  } catch {
                    Linking.openURL(BILLING_PORTAL_URL);
                  }
                }}
              >
                <Ionicons name="card" size={18} color={accent} />
                <Text style={[styles.manageBtnText, { color: colors.text }]}>Manage subscription</Text>
                <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {isPremium && !isPro && (
                <TouchableOpacity
                  style={[styles.ctaSecondary, { borderColor: PLAT }]}
                  onPress={() => setTierTab('pro')}
                  activeOpacity={0.9}
                >
                  <Ionicons name="star" size={18} color={PLAT} />
                  <Text style={[styles.ctaSecondaryText, { color: PLAT }]}>Upgrade to Pro</Text>
                </TouchableOpacity>
              )}
            </>
          ) : tierTab === 'free' ? (
            <PulseGlow color={GOLD} style={styles.ctaGlowWrap}>
              <ShimmerCta>
                <TouchableOpacity
                  style={styles.ctaPrimary}
                  onPress={() => setTierTab('premium')}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[GOLD, '#b8860b']}
                    style={styles.ctaGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="diamond" size={18} color="#000" />
                    <Text style={styles.ctaPrimaryText}>See what you're missing</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ShimmerCta>
            </PulseGlow>
          ) : (
            <>
              <PulseGlow color={tierTab === 'pro' ? PLAT : GOLD} style={styles.ctaGlowWrap}>
                <ShimmerCta>
                  <TouchableOpacity style={[styles.ctaPrimary, purchasing && { opacity: 0.7 }]} onPress={handleUpgrade} disabled={purchasing} activeOpacity={0.9}>
                    <LinearGradient
                      colors={tierTab === 'pro' ? [PLAT, PLATINUM_GRADIENT.inner] : [GOLD, '#b8860b']}
                      style={styles.ctaGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {purchasing ? (
                        <>
                          <ActivityIndicator color={tierTab === 'pro' ? '#fff' : '#000'} size="small" />
                          <Text style={[styles.ctaPrimaryText, tierTab === 'pro' && { color: '#fff' }]}>Processing...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name={tierTab === 'pro' ? 'star' : 'diamond'} size={18} color={tierTab === 'pro' ? '#fff' : '#000'} />
                          <Text style={[styles.ctaPrimaryText, tierTab === 'pro' && { color: '#fff' }]}>
                            {tierTab === 'pro' ? 'Join Pro' : 'Start 7-day free trial'} — {tierTab === 'premium' ? 'then ' : ''}{formatPrice(activePrice, activePeriod)}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </ShimmerCta>
              </PulseGlow>
              {tierTab === 'premium' && (
                <View style={[styles.trialBadge, { backgroundColor: GOLD + '22', borderColor: GOLD + '55' }]}>
                  <Ionicons name="calendar-outline" size={14} color={GOLD} />
                  <Text style={[styles.trialBadgeText, { color: colors.text }]}>7-day free trial — cancel anytime</Text>
                </View>
              )}
              <Text style={[styles.finePrint, { color: colors.textSecondary }]}>
                {tierTab === 'premium'
                  ? 'After trial, you\'ll be charged. Cancel before it ends to avoid charges.'
                  : tierTab === 'pro'
                    ? 'Cancel anytime · No lock-in · Includes all Premium benefits'
                    : 'Cancel anytime · No lock-in · Instant access'}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─────────── STYLES ─────────── */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  compareBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  heroWrap: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3, marginBottom: 8 },
  heroSub: { fontSize: 15, lineHeight: 22 },

  socialStrip: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 14, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  socialItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  socialValue: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  socialLabel: { fontSize: 10, fontWeight: '600' },
  riskReversal: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  trialBadgeText: { fontSize: 13, fontWeight: '600' },

  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12, paddingHorizontal: 20 },
  benefitsList: { paddingHorizontal: 20, marginBottom: 16 },
  lockedList: { paddingHorizontal: 20, marginBottom: 16 },

  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  unlockBtnText: { fontSize: 14, fontWeight: '800' },

  compToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  compToggleText: { fontSize: 14, fontWeight: '700', flex: 1 },

  compWrap: { marginHorizontal: 20, marginBottom: 16 },
  compHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  compHeaderFeature: { flex: 1, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  compHeaderPlan: { width: 50, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  compRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  compFeature: { flex: 1, fontSize: 12, fontWeight: '500', paddingRight: 4 },
  compCell: { width: 50, alignItems: 'center', justifyContent: 'center' },

  navLink: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  navLinkText: { fontSize: 14, fontWeight: '700', flex: 1 },

  upsellBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  upsellIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  upsellText: { flex: 1, minWidth: 0 },
  upsellTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  upsellSub: { fontSize: 12, lineHeight: 17 },

  ctaSection: { marginHorizontal: 20, marginTop: 8, gap: 8 },
  ctaGlowWrap: { borderRadius: 16 },
  ctaPrimary: { borderRadius: 16, overflow: 'hidden' },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, paddingHorizontal: 20 },
  ctaPrimaryText: { fontSize: 16, fontWeight: '900', color: '#000' },
  ctaSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2 },
  ctaSecondaryText: { fontSize: 15, fontWeight: '800' },
  finePrint: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  manageBtnText: { fontSize: 14, fontWeight: '700' },
});
