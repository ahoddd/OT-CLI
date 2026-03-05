/**
 * OrbTap — What's inside. Persuasion-first, sectioned layout.
 * Covers all features for members AND businesses.
 * Social proof, urgency, FOMO, exclusivity, max-conversion CTAs.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWebTitle } from '../hooks/useWebTitle';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OrbTapLogoImage } from '../components/AppLogos';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { useI18n } from '../context/I18nContext';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type TabId = 'members' | 'businesses';

/* ─────────── SECTION TYPES ─────────── */

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  accent: string;
  tag?: string;
}

interface Section {
  heading: string;
  emoji: string;
  features: Feature[];
}

/* ─────────── MEMBER SECTIONS ─────────── */

const MEMBER_SECTIONS: Section[] = [
  {
    heading: 'Discover & Explore',
    emoji: '🗺️',
    features: [
      {
        icon: 'map',
        title: 'Live discovery map',
        sub: 'Restaurants, cafes, shops — all glowing on a real-time map. Tap any orb to see perks, verified ratings, and hours. Never wonder "what to do" again.',
        accent: '#22C55E',
      },
      {
        icon: 'moon',
        title: 'Tonight — your night, curated',
        sub: 'One tap gives you 1–3 perfect picks for tonight based on what\'s hot, trending drops, and verified buzz. Stop scrolling. Start going.',
        accent: '#8B5CF6',
        tag: 'NEW',
      },
      {
        icon: 'swap-horizontal',
        title: 'OrbSwipe — build your plan',
        sub: 'Swipe through partner cards like a deck. Right-swipe to save, build your night out in seconds. Tinder for local spots.',
        accent: '#EC4899',
        tag: 'NEW',
      },
      {
        icon: 'pulse',
        title: 'OrbPulse — live momentum',
        sub: 'See where verified visits are happening right now. No fake hype — only real check-ins, real buzz, real people walking in.',
        accent: '#F97316',
      },
    ],
  },
  {
    heading: 'Earn & Redeem',
    emoji: '💰',
    features: [
      {
        icon: 'qr-code',
        title: 'Scan once, earn instantly',
        sub: 'Visit a partner, scan the QR. OT Points land in your wallet immediately. One tap, verified on the spot. No receipts, no delays.',
        accent: COLORS.neonBlue[0],
      },
      {
        icon: 'gift',
        title: 'Redeem for real perks',
        sub: 'Discounts, free items, VIP access — spend OT Points at any partner. The more you explore, the more you unlock.',
        accent: COLORS.gold[0],
      },
      {
        icon: 'flash',
        title: 'Drops — limited, urgent, real',
        sub: 'Limited-time, limited-quantity offers from partners. Reserve before they\'re gone. First come, first served. FOMO is real.',
        accent: '#EF4444',
        tag: 'HOT',
      },
      {
        icon: 'flame',
        title: 'Daily missions & streaks',
        sub: 'Up to 3 daily missions at breakfast, lunch, and dinner. Build your streak every day. Bonus OT for consistency. Don\'t break the chain.',
        accent: '#F97316',
      },
      {
        icon: 'card',
        title: 'Stamp cards & loyalty',
        sub: 'Collect stamps at your favorite spots. Complete a card, unlock a reward. Digital loyalty that actually works.',
        accent: '#14B8A6',
        tag: 'NEW',
      },
    ],
  },
  {
    heading: 'Compete & Level Up',
    emoji: '🏆',
    features: [
      {
        icon: 'trophy',
        title: '7 levels — Scout to Orb Master',
        sub: 'Earn XP from every action. Climb from Scout through Mapper, Orbiter, Voyager, Apex, Legend, to Orb Master. Each level unlocks new perks.',
        accent: COLORS.gold[0],
      },
      {
        icon: 'podium',
        title: 'Leaderboards & rankings',
        sub: 'Weekly and all-time leaderboards. See where you rank in your city. Compete with friends. Prove you\'re the top explorer.',
        accent: '#A78BFA',
      },
      {
        icon: 'ribbon',
        title: '40+ badges & achievements',
        sub: 'Founding badges, streak badges, review badges, mission badges. Collect them all. Flex on your profile. Some are limited-edition.',
        accent: '#EC4899',
      },
      {
        icon: 'document-text',
        title: 'Proof Cards — shareable receipts',
        sub: 'Every verified visit generates a shareable Proof Card. Post it, share it, flex it. Verified proof you were there.',
        accent: COLORS.neonBlue[0],
        tag: 'NEW',
      },
    ],
  },
  {
    heading: 'Social & Community',
    emoji: '👥',
    features: [
      {
        icon: 'people',
        title: 'Spheres — your crew, your rules',
        sub: 'Create invite-only groups. Pool OT Points, share experiences, compete together as a squad. Couples, families, friend groups.',
        accent: '#8B5CF6',
      },
      {
        icon: 'megaphone',
        title: 'OrbSignal — predict & earn rep',
        sub: 'Cast forecasts on local trends. Build your reputation as an oracle. Vote with OT Points on what\'s next. Be first to call it.',
        accent: '#22D3EE',
        tag: 'NEW',
      },
      {
        icon: 'chatbubbles',
        title: 'OrbVote — your voice earns',
        sub: 'Vote on partner polls and community decisions. Every vote earns OT Points. Your opinion literally pays.',
        accent: '#10B981',
      },
      {
        icon: 'shield-checkmark',
        title: 'Orb Score™ — verified reviews',
        sub: 'Only verified visitors can review. No fake ratings. Trust built into every score. The only review system that actually means something.',
        accent: '#A78BFA',
      },
    ],
  },
  {
    heading: 'Premium & Pro',
    emoji: '✨',
    features: [
      {
        icon: 'diamond',
        title: 'OrbPass — monthly member perks',
        sub: 'Exclusive perks at partner venues every month. One-tap redeem. Premium-only drops and early access. Your golden ticket to the city.',
        accent: COLORS.gold[0],
        tag: 'PREMIUM',
      },
      {
        icon: 'rocket',
        title: 'Pro — earliest access to everything',
        sub: 'Platinum badge. Earliest drop access. Dedicated support. 30-day stats. Unlimited follows and Spheres. The ultimate explorer tier.',
        accent: '#C084FC',
        tag: 'PRO',
      },
      {
        icon: 'speedometer',
        title: 'Multipliers & power-ups',
        sub: 'Streak Shields, 24h XP Multipliers, Mission Rerolls. Stack the odds in your favor. Premium members earn faster.',
        accent: '#F59E0B',
      },
    ],
  },
];

/* ─────────── BUSINESS SECTIONS ─────────── */

const BUSINESS_SECTIONS: Section[] = [
  {
    heading: 'Get Discovered',
    emoji: '📍',
    features: [
      {
        icon: 'location',
        title: 'Your venue on the map — instantly',
        sub: 'Thousands of explorers see your glowing orb on a live map. Verified visits prove real foot traffic. Be where people are already looking.',
        accent: COLORS.success,
      },
      {
        icon: 'star',
        title: 'Featured & sponsored placement',
        sub: 'Premium partners get priority on the map, top carousel slots, and first-position in search. Maximum eyes on your venue.',
        accent: COLORS.gold[0],
        tag: 'PRO',
      },
      {
        icon: 'search',
        title: 'Priority in search & discovery',
        sub: 'Higher tiers rank first in "Nearby" and category filters. When explorers search, your venue appears first. Every click is a potential visit.',
        accent: COLORS.neonBlue[0],
      },
      {
        icon: 'pulse',
        title: 'Trend in OrbPulse',
        sub: 'When your venue gets verified visits, you trend in the live Pulse feed. Organic visibility that snowballs — real people driving more real people.',
        accent: '#F97316',
      },
    ],
  },
  {
    heading: 'Engage & Convert',
    emoji: '🎯',
    features: [
      {
        icon: 'pricetags',
        title: 'Create perks that bring people in',
        sub: 'Discounts, freebies, VIP access — list offers that explorers can redeem with OT Points. Every perk is a reason to visit.',
        accent: COLORS.neonBlue[0],
      },
      {
        icon: 'layers',
        title: 'Stamp cards & loyalty programs',
        sub: 'Digital stamp cards that keep customers coming back. Design your program in the Stamp Studio. Track completions and reward loyalty.',
        accent: '#14B8A6',
        tag: 'NEW',
      },
      {
        icon: 'flash',
        title: 'Drops — limited-time urgency',
        sub: 'Create limited-quantity, time-windowed offers. Drops create FOMO and drive immediate foot traffic. Fill slow hours instantly.',
        accent: '#EC4899',
        tag: 'HOT',
      },
      {
        icon: 'chatbubbles',
        title: 'Polls & OrbVote',
        sub: 'Ask your customers what they want. Run polls, get real feedback, and make data-driven menu and offer decisions.',
        accent: '#10B981',
      },
      {
        icon: 'newspaper',
        title: 'Commerce Feed & posts',
        sub: 'Post updates, announcements, and offers directly into the explorer feed. Stay top of mind between visits.',
        accent: '#8B5CF6',
        tag: 'NEW',
      },
    ],
  },
  {
    heading: 'Build Trust',
    emoji: '🛡️',
    features: [
      {
        icon: 'shield-checkmark',
        title: 'Verified-only reviews',
        sub: 'Only customers who actually visited can review your venue. No fake ratings. No competitor sabotage. Real trust, earned honestly.',
        accent: '#A78BFA',
      },
      {
        icon: 'analytics',
        title: 'Orb Score™ — your true reputation',
        sub: 'A trust score built from verified visits, honest reviews, and real engagement. Show the world your actual quality. Numbers don\'t lie.',
        accent: COLORS.neonBlue[0],
      },
    ],
  },
  {
    heading: 'Measure & Grow',
    emoji: '📊',
    features: [
      {
        icon: 'bar-chart',
        title: 'Full analytics dashboard',
        sub: 'Profile views, follows, visits, redemptions. 7-day and 30-day trends. Conversion funnels. Know exactly what\'s working.',
        accent: COLORS.neonBlue[0],
      },
      {
        icon: 'trending-up',
        title: 'Conversion funnel tracking',
        sub: 'View → Tap → Redeem. See where customers drop off and optimize your perks for maximum conversion.',
        accent: '#22C55E',
        tag: 'PREMIUM',
      },
      {
        icon: 'download',
        title: 'Export reports to CSV',
        sub: 'Download visits, redemptions, and revenue data. Bring it into your own systems. Full control over your data.',
        accent: '#64748B',
        tag: 'PREMIUM',
      },
    ],
  },
  {
    heading: 'Operations & Hiring',
    emoji: '⚙️',
    features: [
      {
        icon: 'construct',
        title: 'OrbOps — work orders & services',
        sub: 'Need catering, cleaning, or contractors? Post work orders. Get bids, proof of completion, and rate the work. Operations made simple.',
        accent: COLORS.success,
      },
      {
        icon: 'briefcase',
        title: 'OrbOpportunities — post jobs',
        sub: 'Post positions and review applicants directly in the app. Reach local talent who already know and visit your venue.',
        accent: '#F59E0B',
        tag: 'NEW',
      },
    ],
  },
  {
    heading: 'Start Free, Scale Up',
    emoji: '🚀',
    features: [
      {
        icon: 'rocket',
        title: 'Free tier — no risk to start',
        sub: 'Map listing, up to 3 perks, 7-day analytics, verified badge. Everything you need to start reaching explorers today. Zero cost.',
        accent: COLORS.success,
      },
      {
        icon: 'diamond',
        title: 'Premium — serious growth tools',
        sub: '10 perks, 30-day analytics, conversion funnels, drops, featured slots, CSV export. The toolkit for growth-focused venues.',
        accent: COLORS.gold[0],
        tag: 'PREMIUM',
      },
      {
        icon: 'planet',
        title: 'Pro — maximum visibility',
        sub: 'Unlimited perks. Priority in all search. Sponsored carousels. Dedicated support. Custom campaigns. You\'re the top of the map.',
        accent: '#C084FC',
        tag: 'PRO',
      },
    ],
  },
];

/* ─────────── SOCIAL PROOF STATS ─────────── */

const MEMBER_STATS = [
  { value: '50+', label: 'Features' },
  { value: '40+', label: 'Badges' },
  { value: '7', label: 'Levels' },
  { value: '100%', label: 'Free' },
];

const BUSINESS_STATS = [
  { value: '0', label: 'Cost to start' },
  { value: '30-day', label: 'Analytics' },
  { value: '100%', label: 'Verified' },
  { value: '3 min', label: 'Setup' },
];

/* ─────────── TAG PILL ─────────── */

function TagPill({ label }: { label: string }) {
  const bg =
    label === 'NEW'
      ? '#22C55E'
      : label === 'HOT'
        ? '#EF4444'
        : label === 'PREMIUM'
          ? COLORS.gold[0]
          : label === 'PRO'
            ? '#C084FC'
            : COLORS.neonBlue[0];

  return (
    <View style={[tagStyles.pill, { backgroundColor: bg + '22' }]}>
      <Text style={[tagStyles.pillText, { color: bg }]}>{label}</Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});

/* ─────────── STATS BAR ─────────── */

function StatsBar({
  stats,
  colors,
}: {
  stats: typeof MEMBER_STATS;
  colors: { text: string; textSecondary: string; surface: string; border: string };
}) {
  return (
    <Animated.View entering={FadeIn.delay(100).duration(500)} style={statsStyles.wrap}>
      {stats.map((s, i) => (
        <View key={i} style={statsStyles.item}>
          <Text style={[statsStyles.value, { color: colors.text }]}>{s.value}</Text>
          <Text style={[statsStyles.label, { color: colors.textSecondary }]}>{s.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

const statsStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: 4,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  item: { flex: 1, alignItems: 'center' },
  value: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  label: { fontSize: 10, marginTop: 1, fontWeight: '500' },
});

/* ─────────── SECTION HEADER ─────────── */

function SectionHeader({
  heading,
  emoji,
  index,
  colors,
}: {
  heading: string;
  emoji: string;
  index: number;
  colors: { text: string };
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(350)}
      style={sectionStyles.wrap}
    >
      <Text style={sectionStyles.emoji}>{emoji}</Text>
      <Text style={[sectionStyles.heading, { color: colors.text }]}>{heading}</Text>
    </Animated.View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  emoji: { fontSize: 18 },
  heading: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
});

/* ─────────── HOLOGRAPHIC CARD ─────────── */

function HolographicCard({
  item,
  index,
  colors,
}: {
  item: Feature;
  index: number;
  colors: { text: string; textSecondary: string; surface: string; border: string };
}) {
  const borderGlow = useSharedValue(0);
  useEffect(() => {
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      true
    );
  }, []);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderGlow.value,
      [0, 1],
      [colors.border, item.accent + '66']
    ),
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(350).springify()}
      style={styles.cardOuter}
    >
      <Animated.View style={[styles.card, { backgroundColor: colors.surface }, borderStyle]}>
        <LinearGradient
          colors={[item.accent + '22', item.accent + '08', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.iconWrap, { backgroundColor: item.accent + '28' }]}>
          <LinearGradient
            colors={[item.accent + 'cc', item.accent]}
            style={styles.iconWrapInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={item.icon} size={24} color="#fff" />
          </LinearGradient>
        </View>
        <View style={styles.cardText}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            {item.tag ? <TagPill label={item.tag} /> : null}
          </View>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{item.sub}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/* ─────────── COMPARISON ROW (for tier section) ─────────── */

function ComparisonBanner({
  tab,
  colors,
  onPress,
}: {
  tab: TabId;
  colors: { text: string; textSecondary: string; surface: string; border: string };
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)}>
      <TouchableOpacity
        style={[compStyles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[COLORS.gold[0] + '18', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name="git-compare" size={20} color={COLORS.gold[0]} />
        <View style={compStyles.bannerText}>
          <Text style={[compStyles.bannerTitle, { color: colors.text }]}>
            {tab === 'members' ? 'Compare Free vs Premium vs Pro' : 'See all partner tiers'}
          </Text>
          <Text style={[compStyles.bannerSub, { color: colors.textSecondary }]}>
            {tab === 'members' ? 'Unlock more at every level' : 'Find the right plan for your venue'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const compStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 10,
    gap: 12,
    overflow: 'hidden',
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '800' },
  bannerSub: { fontSize: 12, marginTop: 2 },
});

/* ─────────── MAIN SCREEN ─────────── */

export default function FeaturesScreen() {
  const { t } = useI18n();
useWebTitle('Features');
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const [tab, setTab] = useState<TabId>('members');
  const sections = tab === 'members' ? MEMBER_SECTIONS : BUSINESS_SECTIONS;
  const stats = tab === 'members' ? MEMBER_STATS : BUSINESS_STATS;

  let cardIndex = 0;

  return (
    <View style={[styles.container, styles.containerWeb, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          isDark
            ? ['#0f0f14', '#050508', '#000']
            : [colors.background, colors.surface, colors.background]
        }
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glowOrb, { backgroundColor: COLORS.neonBlue[0], opacity: isDark ? 0.12 : 0.06 }]} />
      <View style={[styles.glowOrbAlt, { backgroundColor: themeGold, opacity: isDark ? 0.06 : 0.04 }]} />

      <SafeAreaView style={[styles.safe, Platform.OS === 'web' && styles.safeWeb]} edges={['top']}>
        {/* Compact header with inline title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, Platform.OS === 'web' && styles.backBtnWeb]} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>What's inside OrbTap</Text>
          <OrbTapLogoImage width={56} height={42} />
        </View>

        {/* Tabs — right below header */}
        <View style={styles.tabWrap}>
          <TouchableOpacity
            style={[styles.tab, tab === 'members' && styles.tabActive, Platform.OS === 'web' && styles.tabWeb]}
            onPress={() => { setTab('members'); safeHaptics.selectionAsync(); }}
            activeOpacity={0.85}
          >
            {tab === 'members' ? (
              <LinearGradient
                colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            ) : null}
            <Ionicons name="person" size={16} color={tab === 'members' ? '#000' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: tab === 'members' ? '#000' : colors.textSecondary }]}>
              For Members
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'businesses' && styles.tabActive, Platform.OS === 'web' && styles.tabWeb]}
            onPress={() => { setTab('businesses'); safeHaptics.selectionAsync(); }}
            activeOpacity={0.85}
          >
            {tab === 'businesses' ? (
              <LinearGradient
                colors={[COLORS.success, '#22c55e']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            ) : null}
            <Ionicons name="business" size={16} color={tab === 'businesses' ? '#000' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: tab === 'businesses' ? '#000' : colors.textSecondary }]}>
              For Businesses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable — hero tagline, stats, and all sections */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, Platform.OS === 'web' && styles.scrollContentWeb]}
          showsVerticalScrollIndicator={false}
        >
          {/* Compact hero tagline inside scroll */}
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {tab === 'members'
              ? 'Real rewards at real places. Explore, earn, compete — all for free.'
              : 'Verified foot traffic. Loyal customers. Real analytics. Start free.'}
          </Text>

          {/* Stats bar inside scroll */}
          <StatsBar stats={stats} colors={colors} />
          {sections.map((section, si) => {
            const sectionCards = section.features.map((feat, fi) => {
              const ci = cardIndex++;
              return <HolographicCard key={`${tab}-${si}-${fi}`} item={feat} index={ci} colors={colors} />;
            });

            return (
              <View key={`${tab}-section-${si}`}>
                <SectionHeader heading={section.heading} emoji={section.emoji} index={si} colors={colors} />
                {sectionCards}
              </View>
            );
          })}

          {/* Compare plans banner */}
          <ComparisonBanner
            tab={tab}
            colors={colors}
            onPress={() => router.push('/compare-accounts')}
          />

          {/* Social proof closer */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={closerStyles.wrap}>
            <LinearGradient
              colors={isDark ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'] : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.01)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
            />
            <Ionicons
              name={tab === 'members' ? 'sparkles' : 'trending-up'}
              size={28}
              color={tab === 'members' ? COLORS.gold[0] : COLORS.success}
            />
            <Text style={[closerStyles.title, { color: colors.text }]}>
              {tab === 'members'
                ? 'Join the explorers who stopped wasting weekends.'
                : 'Join the partners who stopped guessing.'}
            </Text>
            <Text style={[closerStyles.sub, { color: colors.textSecondary }]}>
              {tab === 'members'
                ? 'Every visit earns. Every action counts. Your city is waiting.'
                : 'Verified visits. Real analytics. Customers who come back.'}
            </Text>
          </Animated.View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* CTA footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, tab === 'businesses' && { shadowColor: COLORS.success }, Platform.OS === 'web' && styles.btnWeb]}
            onPress={() => { safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.push(tab === 'businesses' ? '/partner-apply' : '/auth/signup'); }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={tab === 'businesses' ? [COLORS.success, '#22c55e'] : [COLORS.neonBlue[0], '#818cf8']}
              style={styles.primaryBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryBtnText}>
                {tab === 'members' ? 'Get started — it\'s free' : 'Apply as a partner'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.ctaHint, { color: colors.textSecondary }]}>
            {tab === 'members'
              ? 'No credit card needed. Takes 30 seconds.'
              : 'Free tier available. Apply in under 3 minutes.'}
          </Text>
          <TouchableOpacity
            style={[styles.secondaryBtn, Platform.OS === 'web' && styles.btnWeb]}
            onPress={() => router.push(tab === 'businesses' ? '/auth/login' : '/auth/login')}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ─────────── CLOSER STYLES ─────────── */

const closerStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  title: { fontSize: 17, fontWeight: '900', textAlign: 'center', lineHeight: 24, letterSpacing: -0.2 },
  sub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

/* ─────────── MAIN STYLES ─────────── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerWeb: Platform.OS === 'web' ? { minHeight: '100vh' as any, width: '100%' } : {},
  safe: { flex: 1 },
  safeWeb: Platform.OS === 'web' ? { maxWidth: 560, alignSelf: 'center' as const, width: '100%' } : {},
  backBtnWeb: Platform.OS === 'web' ? { cursor: 'pointer' as any } : {},
  tabWeb: Platform.OS === 'web' ? { cursor: 'pointer' as any } : {},
  btnWeb: Platform.OS === 'web' ? { cursor: 'pointer' as any } : {},
  glowOrb: {
    position: 'absolute',
    top: -width * 0.4,
    left: -width * 0.2,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
  },
  glowOrbAlt: {
    position: 'absolute',
    bottom: -width * 0.3,
    right: -width * 0.3,
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: '800', flex: 1, marginLeft: 8 },
  heroSub: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 14,
    lineHeight: 20,
  },
  tabWrap: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  tabActive: {
    borderColor: 'transparent',
    shadowColor: COLORS.neonBlue[0],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: { fontSize: 14, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  scrollContentWeb: Platform.OS === 'web' ? {} : {},
  cardOuter: { marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  iconWrapInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardTitle: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2, flexShrink: 1 },
  cardSub: { fontSize: 12, lineHeight: 17 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.neonBlue[0],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  ctaHint: { fontSize: 12, textAlign: 'center' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 10 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600' },
});
