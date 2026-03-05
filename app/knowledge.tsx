/**
 * OrbTap Knowledge — "What's Inside OrbTap" conversion page.
 * Strategic: converts visitors to members. Shows the North Star loop.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useFlags } from '../components/FlagContext';
import { COLORS } from '../constants/Colors';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { useI18n } from '../context/I18nContext';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '', duration = 1200 }: { target: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    startRef.current = null;
    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return <Text>{display.toLocaleString()}{suffix}</Text>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NORTH_STAR_STEPS = [
  { icon: 'compass' as const, label: 'Discover', color: '#60a5fa' },
  { icon: 'location' as const, label: 'Commit', color: '#34d399' },
  { icon: 'qr-code' as const, label: 'Scan', color: '#fbbf24' },
  { icon: 'trophy' as const, label: 'Earn', color: '#f59e0b' },
  { icon: 'gift' as const, label: 'Flex', color: '#a78bfa' },
  { icon: 'share-social' as const, label: 'Share', color: '#f472b6' },
];

const TOP_FEATURES = [
  {
    icon: 'ticket' as const,
    title: 'OrbPass™',
    hook: 'Monthly perks at every partner venue. One tap to unlock.',
    locked: true,
  },
  {
    icon: 'receipt' as const,
    title: 'Stamp Cards™',
    hook: 'Real loyalty cards for your favourite spots. Earn, collect, redeem.',
    locked: false,
  },
  {
    icon: 'trending-up' as const,
    title: 'Prediction Markets™',
    hook: 'Forecast venue buzz. Earn OT when you\'re right.',
    locked: true,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function KnowledgeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();

  useEffect(() => {
    if (!flags.isKnowledgeEnabled) router.back();
  }, [flags.isKnowledgeEnabled, router]);
  if (!flags.isKnowledgeEnabled) return null;

  const handleJoinFree = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/auth/signup');
  };

  const handleSeePro = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/premium');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>What&apos;s Inside OrbTap</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Hero Hook */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[themeGold + '22', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={[styles.heroLine, { color: colors.text }]}>
            Scan real venues.
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(160).duration(400)} style={[styles.heroLine, { color: themeGold }]}>
            Earn real points.
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(240).duration(400)} style={[styles.heroLine, { color: colors.text }]}>
            Live real experiences.
          </Animated.Text>
        </Animated.View>

        {/* Live Proof Strip */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statRow}>
          {[
            { target: 12400, suffix: '+', label: 'explorers' },
            { target: 850, suffix: '+', label: 'partners' },
            { target: 48000, suffix: '+', label: 'perks earned' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCell, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statValue, { color: themeGold }]}>
                <AnimatedCounter target={stat.target} suffix={stat.suffix} duration={1200 + i * 200} />
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* North Star Loop */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>THE LOOP</Text>
          <View style={styles.loopGrid}>
            {NORTH_STAR_STEPS.map((step, i) => (
              <Animated.View
                key={step.label}
                entering={FadeInDown.delay(300 + i * 60).duration(350)}
                style={[styles.loopCell, { backgroundColor: colors.surface }]}
              >
                <View style={[styles.loopIcon, { backgroundColor: step.color + '22' }]}>
                  <Ionicons name={step.icon} size={22} color={step.color} />
                </View>
                <Text style={[styles.loopLabel, { color: colors.text }]}>{step.label}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Top 3 Features */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MEMBERS ONLY</Text>
          {TOP_FEATURES.map((feat, i) => (
            <Animated.View
              key={feat.title}
              entering={FadeInDown.delay(400 + i * 80).duration(400)}
              style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: themeGold + '22' }]}>
                <Ionicons name={feat.icon} size={22} color={themeGold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{feat.title}</Text>
                <Text style={[styles.featureHook, { color: colors.textSecondary }]}>{feat.hook}</Text>
              </View>
              {feat.locked && (
                <View style={[styles.lockBadge, { backgroundColor: colors.border }]}>
                  <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
                  <Text style={[styles.lockText, { color: colors.textSecondary }]}>Members</Text>
                </View>
              )}
            </Animated.View>
          ))}
        </Animated.View>

        {/* Tier Teaser */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={[styles.tierTeaser, { backgroundColor: colors.surface, borderColor: themeGold + '44' }]}>
          <LinearGradient
            colors={[themeGold + '11', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <Text style={[styles.tierLine, { color: colors.textSecondary }]}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Free</Text> unlocks the map.
          </Text>
          <Text style={[styles.tierLine, { color: colors.textSecondary }]}>
            <Text style={{ color: themeGold, fontWeight: '700' }}>Premium</Text> unlocks the city.
          </Text>
          <Text style={[styles.tierLine, { color: colors.textSecondary }]}>
            <Text style={{ color: '#a78bfa', fontWeight: '700' }}>Pro</Text> unlocks the leaderboard.
          </Text>
        </Animated.View>

        {/* Social Proof Quote */}
        <Animated.View entering={FadeInDown.delay(560).duration(400)} style={[styles.quoteCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.quoteText, { color: colors.text }]}>
            &quot;I&apos;ve saved $340 in 60 days and haven&apos;t paid a cent.&quot;
          </Text>
          <View style={styles.quoteAuthor}>
            <View style={[styles.quoteAvatar, { backgroundColor: themeGold + '44' }]}>
              <Text style={{ color: themeGold, fontWeight: '700', fontSize: 13 }}>JS</Text>
            </View>
            <Text style={[styles.quoteAuthorName, { color: colors.textSecondary }]}>Jamie S. · Denver, CO</Text>
          </View>
        </Animated.View>

        {/* CTAs */}
        <Animated.View entering={FadeInDown.delay(620).duration(400)} style={styles.ctaGroup}>
          <TouchableOpacity
            style={[styles.ctaPrimary, { backgroundColor: themeGold }]}
            onPress={handleJoinFree}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaPrimaryText}>Join free →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaSecondary, { borderColor: colors.border }]}
            onPress={handleSeePro}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaSecondaryText, { color: colors.textSecondary }]}>See what Pro unlocks</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  heroCard: { margin: 20, borderRadius: 24, padding: 28, overflow: 'hidden', gap: 4 },
  heroLine: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 28 },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginHorizontal: 20, marginBottom: 12 },
  loopGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, gap: 10, marginBottom: 28, justifyContent: 'space-between' },
  loopCell: { width: (SCREEN_W - 40 - 20) / 3, alignItems: 'center', paddingVertical: 14, borderRadius: 16, gap: 6 },
  loopIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  loopLabel: { fontSize: 12, fontWeight: '600' },
  featureCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, padding: 16, borderRadius: 16, borderWidth: 1, gap: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  featureHook: { fontSize: 13, lineHeight: 18 },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  lockText: { fontSize: 11, fontWeight: '600' },
  tierTeaser: { margin: 20, padding: 24, borderRadius: 20, borderWidth: 1.5, overflow: 'hidden', gap: 8, marginBottom: 12 },
  tierLine: { fontSize: 17, lineHeight: 26 },
  quoteCard: { marginHorizontal: 20, marginBottom: 24, padding: 20, borderRadius: 16 },
  quoteText: { fontSize: 16, fontStyle: 'italic', lineHeight: 24, marginBottom: 12 },
  quoteAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quoteAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quoteAuthorName: { fontSize: 13 },
  ctaGroup: { marginHorizontal: 20, gap: 10, marginBottom: 20 },
  ctaPrimary: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  ctaPrimaryText: { fontSize: 17, fontWeight: '800', color: '#000' },
  ctaSecondary: { paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1.5 },
  ctaSecondaryText: { fontSize: 15, fontWeight: '600' },
});
