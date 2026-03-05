/**
 * How OrbTap Works — Visually immersive core loop showcase.
 * Holographic step cards, animated borders, ambient glow, haptic feedback.
 * Converts visitors into believers.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OrbTapLogoMark } from '../components/OrbTapLogoMark';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { useWebTitle } from '../hooks/useWebTitle';
import { useI18n } from '../context/I18nContext';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
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

const { width: SCREEN_W } = Dimensions.get('window');

const CORE_LOOP_STEPS = [
  {
    step: 1,
    icon: 'map' as const,
    title: 'Discover',
    headline: 'Find what\u2019s near you',
    body: 'Open the map and see partner venues glowing around you. Restaurants, cafes, shops \u2014 each with real perks waiting for you.',
    accent: '#22C55E',
  },
  {
    step: 2,
    icon: 'qr-code' as const,
    title: 'Scan',
    headline: 'Check in when you visit',
    body: 'Scan the partner\u2019s QR in one tap. Your visit is verified on the spot \u2014 no receipts, no delays. Instant.',
    accent: COLORS.neonBlue[0],
  },
  {
    step: 3,
    icon: 'wallet' as const,
    title: 'Earn',
    headline: 'OT Points hit your wallet',
    body: 'Every verified visit earns OT Points. Complete missions, build streaks, and collect badges for bonus rewards.',
    accent: '#FBBF24',
  },
  {
    step: 4,
    icon: 'gift' as const,
    title: 'Redeem',
    headline: 'Use points for real perks',
    body: 'Discounts, free items, VIP experiences \u2014 redeem at any partner. Premium members get OrbPass for monthly bonus perks.',
    accent: '#A78BFA',
  },
  {
    step: 5,
    icon: 'share-social' as const,
    title: 'Share & Compete',
    headline: 'Prove it and climb the ranks',
    body: 'Get a Proof Card for every visit. Share with friends, top the leaderboard, earn badges. Invite friends \u2014 you both earn 50 OT.',
    accent: '#EC4899',
  },
];

const DAILY_HOOKS = [
  { icon: 'flame' as const, title: 'Daily Ritual', sub: 'Tap the orb 3\u00D7 to shatter it. Earn OT Points + streak bonuses.', accent: '#EF4444' },
  { icon: 'flag' as const, title: 'Missions', sub: 'Up to 3 daily missions at partner spots. 75 OT per mission.', accent: '#FBBF24' },
  { icon: 'trophy' as const, title: 'Leaderboard', sub: 'Compete weekly and all-time. Prove you\u2019re the top explorer.', accent: '#A78BFA' },
  { icon: 'people' as const, title: 'Spheres', sub: 'Invite-only groups. Pool points, compete as a squad.', accent: '#8B5CF6' },
];

const DIFFERENTIATORS = [
  { icon: 'shield-checkmark' as const, label: 'Verified visits only', sub: 'No fake check-ins. Real people, real places.', accent: '#22C55E' },
  { icon: 'star' as const, label: 'Orb Score\u2122 reviews', sub: 'Only verified visitors can review.', accent: COLORS.gold[0] },
  { icon: 'flash' as const, label: 'Instant rewards', sub: 'Points hit your wallet the second you scan.', accent: COLORS.neonBlue[0] },
  { icon: 'lock-closed' as const, label: 'No data selling', sub: 'Your data stays yours. Period.', accent: '#A78BFA' },
];

const SOCIAL_PROOF = [
  { value: '12,400+', label: 'Explorers' },
  { value: '850+', label: 'Venues' },
  { value: '48K+', label: 'Redeemed' },
  { value: '99.2%', label: 'Verified' },
];

function GlowStepCard({
  step,
  index,
  colors,
  isDark,
}: {
  step: typeof CORE_LOOP_STEPS[0];
  index: number;
  colors: any;
  isDark: boolean;
}) {
  const borderGlow = useSharedValue(0);
  useEffect(() => {
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200 }),
        withTiming(0, { duration: 2200 })
      ),
      -1,
      true
    );
  }, []);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderGlow.value,
      [0, 1],
      [colors.border, step.accent + '55']
    ),
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 70).duration(350).springify()}
      style={stepStyles.outer}
    >
      <Animated.View style={[stepStyles.card, { backgroundColor: colors.surface }, borderStyle]}>
        <LinearGradient
          colors={[step.accent + '18', step.accent + '06', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[stepStyles.numWrap, { backgroundColor: step.accent + '22' }]}>
          <LinearGradient
            colors={[step.accent + 'cc', step.accent]}
            style={stepStyles.numGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={stepStyles.numText}>{step.step}</Text>
          </LinearGradient>
        </View>
        <View style={stepStyles.content}>
          <View style={stepStyles.titleRow}>
            <Ionicons name={step.icon} size={16} color={step.accent} />
            <Text style={[stepStyles.title, { color: step.accent }]}>{step.title}</Text>
          </View>
          <Text style={[stepStyles.headline, { color: colors.text }]}>{step.headline}</Text>
          <Text style={[stepStyles.body, { color: colors.textSecondary }]}>{step.body}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const stepStyles = StyleSheet.create({
  outer: { marginBottom: 10 },
  card: { flexDirection: 'row', borderRadius: 16, borderWidth: 1.5, padding: 14, overflow: 'hidden' },
  numWrap: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden', marginRight: 12 },
  numGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  content: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  headline: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  body: { fontSize: 12, lineHeight: 17 },
});

export default function LearnScreen() {
  const { t } = useI18n();
  useWebTitle('How OrbTap Works');
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0f0f14', '#050508', '#000'] : [colors.background, colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glowOrb, { backgroundColor: COLORS.neonBlue[0], opacity: isDark ? 0.1 : 0.05 }]} />
      <View style={[styles.glowOrbAlt, { backgroundColor: themeGold, opacity: isDark ? 0.06 : 0.03 }]} />

      <SafeAreaView style={[styles.safe, Platform.OS === 'web' && styles.safeWeb]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>How OrbTap Works</Text>
          <OrbTapLogoMark variant="hero" width={56} height={48} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.heroWrap}>
            <Text style={[styles.heroLabel, { color: themeGold }]}>THE LOOP</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Discover. Scan. Earn. Redeem.
            </Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              Every visit to a local spot earns you real rewards. Here's how.
            </Text>
          </Animated.View>

          {/* Core loop steps */}
          {CORE_LOOP_STEPS.map((s, i) => (
            <GlowStepCard key={s.step} step={s} index={i} colors={colors} isDark={isDark} />
          ))}

          {/* Social proof grid */}
          <Animated.View entering={FadeInDown.delay(450).duration(400)} style={[styles.socialGrid, { borderColor: colors.border }]}>
            {SOCIAL_PROOF.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.socialCell,
                  i % 2 === 0 && { borderRightWidth: 1, borderRightColor: colors.border },
                  i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.socialValue, { color: themeGold }]}>{item.value}</Text>
                <Text style={[styles.socialLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Daily engagement section */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionEmoji}>🔥</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Something to do every day</Text>
            </View>
            {DAILY_HOOKS.map((hook, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.delay(520 + i * 50).duration(300)}
                style={[styles.hookRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.hookIconWrap, { backgroundColor: hook.accent + '18' }]}>
                  <Ionicons name={hook.icon} size={20} color={hook.accent} />
                </View>
                <View style={styles.hookText}>
                  <Text style={[styles.hookTitle, { color: colors.text }]}>{hook.title}</Text>
                  <Text style={[styles.hookSub, { color: colors.textSecondary }]}>{hook.sub}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Differentiators */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionEmoji}>⚡</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>What makes OrbTap different</Text>
            </View>
            <View style={styles.diffGrid}>
              {DIFFERENTIATORS.map((d, i) => (
                <View key={i} style={[styles.diffCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.diffIconWrap, { backgroundColor: d.accent + '18' }]}>
                    <Ionicons name={d.icon} size={20} color={d.accent} />
                  </View>
                  <Text style={[styles.diffLabel, { color: colors.text }]}>{d.label}</Text>
                  <Text style={[styles.diffSub, { color: colors.textSecondary }]}>{d.sub}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Business teaser */}
          <Animated.View entering={FadeInDown.delay(650).duration(400)}>
            <View style={[styles.businessCard, { borderColor: themeGold + '40' }]}>
              <LinearGradient
                colors={[themeGold + '14', themeGold + '04', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={[styles.businessIconWrap, { backgroundColor: themeGold + '20' }]}>
                <Ionicons name="business" size={24} color={themeGold} />
              </View>
              <Text style={[styles.businessTitle, { color: colors.text }]}>Are you a business?</Text>
              <Text style={[styles.businessSub, { color: colors.textSecondary }]}>
                Get in front of verified local customers. List your venue, post perks, run drops, and track results. Start free.
              </Text>
              <TouchableOpacity
                style={[styles.businessBtn, { backgroundColor: themeGold }]}
                onPress={() => { safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/partner-apply' as any); }}
              >
                <Text style={styles.businessBtnText}>Partner with OrbTap</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* See all features link */}
          <TouchableOpacity
            style={[styles.featureLink, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/features' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="apps" size={18} color={COLORS.neonBlue[0]} />
            <Text style={[styles.featureLinkText, { color: colors.text }]}>See all 50+ features</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* CTA footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => { safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.push('/auth/signup'); }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.neonBlue[0], '#818cf8']}
              style={styles.primaryBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryBtnText}>Get started — it's free</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.ctaHint, { color: colors.textSecondary }]}>
            No credit card · Join in 30 seconds · Free forever
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={[styles.loginLink, { color: colors.textSecondary }]}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, width: '100%' } : {}) },
  safe: { flex: 1 },
  safeWeb: Platform.OS === 'web' ? { maxWidth: 560, alignSelf: 'center' as const, width: '100%' } : {},
  glowOrb: {
    position: 'absolute',
    top: -SCREEN_W * 0.4,
    left: -SCREEN_W * 0.2,
    width: SCREEN_W * 1.2,
    height: SCREEN_W * 1.2,
    borderRadius: SCREEN_W * 0.6,
  },
  glowOrbAlt: {
    position: 'absolute',
    bottom: -SCREEN_W * 0.3,
    right: -SCREEN_W * 0.3,
    width: SCREEN_W * 1.1,
    height: SCREEN_W * 1.1,
    borderRadius: SCREEN_W * 0.55,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: '800', flex: 1, marginLeft: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 16 },
  heroWrap: { alignItems: 'center', marginBottom: 18, paddingTop: 4 },
  heroLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, marginBottom: 6 },
  heroSub: { fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 8 },
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 14, borderWidth: 1, marginTop: 10, marginBottom: 22, overflow: 'hidden' },
  socialCell: { width: '50%', alignItems: 'center', paddingVertical: 14 },
  socialValue: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  socialLabel: { fontSize: 11, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 6 },
  sectionEmoji: { fontSize: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  hookRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  hookIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  hookText: { flex: 1, minWidth: 0 },
  hookTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  hookSub: { fontSize: 12, lineHeight: 17 },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  diffCard: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 14 },
  diffIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  diffLabel: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  diffSub: { fontSize: 11, lineHeight: 16 },
  businessCard: { borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 16, overflow: 'hidden' },
  businessIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  businessTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  businessSub: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  businessBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  businessBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  featureLink: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  featureLinkText: { fontSize: 14, fontWeight: '700', flex: 1 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  primaryBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', shadowColor: COLORS.neonBlue[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  primaryBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 20 },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  ctaHint: { fontSize: 11, textAlign: 'center' },
  loginLink: { fontSize: 13, fontWeight: '600', paddingVertical: 6 },
});
