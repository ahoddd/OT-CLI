/**
 * OrbTap Premium — The upgrade that feels like your idea.
 * Confident, exciting, benefit-led. No pushiness; just obvious value.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreferences } from '../hooks/usePreferences';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { PremiumBadge } from '../components/PremiumBadge';
import * as Haptics from 'expo-haptics';

const BENEFITS_USER = [
  { icon: 'stats-chart' as const, title: '30-Day Trends', sub: 'See your momentum over time' },
  { icon: 'people' as const, title: 'Compare to City', sub: 'See how you stack up locally' },
  { icon: 'document-text' as const, title: 'Export Reports', sub: 'Download your stats anytime' },
  { icon: 'diamond' as const, title: 'Premium Badge', sub: 'Stand out with your verified status' },
  { icon: 'time' as const, title: 'Early Drop Access', sub: 'Reserve before everyone else' },
  { icon: 'infinite' as const, title: 'More Follows & Circles', sub: 'Connect without limits' },
];

const BENEFITS_PARTNER = [
  { icon: 'analytics' as const, title: 'Conversion Funnel', sub: 'View → Tap → Redeem' },
  { icon: 'trending-up' as const, title: 'Traffic Insights', sub: 'Weekly and monthly trends' },
  { icon: 'download' as const, title: 'Export to CSV', sub: 'Use your data anywhere' },
  { icon: 'diamond' as const, title: 'Partner Pro Badge', sub: 'Verified business status' },
  { icon: 'qr-code' as const, title: 'More Active Perks', sub: 'Run more offers at once' },
  { icon: 'megaphone' as const, title: 'Featured Placement', sub: 'Get in front of more users' },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { prefs, setPremiumMember } = usePreferences();
  const isPremium = prefs.premiumMember ?? false;
  const isPartner = prefs.partnerMode ?? false;

  const handleJoin = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPremiumMember(true);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>OrbTap Premium</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — confident, not salesy */}
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LinearGradient
            colors={[COLORS.gold[0] + '28', COLORS.gold[1] + '14']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroIconWrap}>
            <Ionicons name="diamond" size={40} color={COLORS.gold[0]} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {isPremium ? "You're in." : 'More of what you already love.'}
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {isPremium
              ? 'You have full access. Make the most of it.'
              : 'Better stats, early drop access, and a verified badge next to your name. No pressure — just more of what you already love.'}
          </Text>
        </View>

        {/* Benefits — always visible so premium members see what they have */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {isPartner ? 'PARTNER PRO BENEFITS' : 'WHAT YOU GET'}
        </Text>
        <View style={styles.benefitsGrid}>
          {(isPartner ? BENEFITS_PARTNER : BENEFITS_USER).map((b, i) => (
            <View
              key={i}
              style={[styles.benefitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.benefitIconWrap, { backgroundColor: COLORS.gold[0] + '20' }]}>
                <Ionicons name={b.icon} size={22} color={COLORS.gold[0]} />
              </View>
              <Text style={[styles.benefitTitle, { color: colors.text }]}>{b.title}</Text>
              <Text style={[styles.benefitSub, { color: colors.textSecondary }]}>{b.sub}</Text>
            </View>
          ))}
        </View>

        {/* Status badge — always visible */}
        <View style={[styles.badgeTease, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.badgeTeaseTitle, { color: colors.text }]}>Your new look</Text>
          <View style={styles.badgeTeaseRow}>
            <Text style={[styles.badgeTeaseName, { color: colors.text }]}>Your Name</Text>
            <PremiumBadge variant="standard" size={18} />
          </View>
          <Text style={[styles.badgeTeaseSub, { color: colors.textSecondary }]}>
            Premium members get a verified badge next to their name. Simple. Recognized.
          </Text>
        </View>

        {/* Compare plans — always visible so everyone (including premium) sees Free vs Premium */}
        <TouchableOpacity
          onPress={() => router.push('/compare-accounts' as any)}
          style={styles.compareLink}
        >
          <Text style={[styles.compareLinkText, { color: COLORS.gold[0] }]}>
            Compare Free vs Premium
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.gold[0]} />
        </TouchableOpacity>

        {!isPremium && (
          <>
            <TouchableOpacity
              style={styles.cta}
              onPress={handleJoin}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[COLORS.gold[0], COLORS.gold[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.ctaText}>Join Premium</Text>
              <Ionicons name="diamond" size={20} color="#000" />
            </TouchableOpacity>
            <Text style={[styles.finePrint, { color: colors.textSecondary }]}>
              Cancel anytime. You're in control — it's your call.
            </Text>
            <Text style={[styles.finePrint, { color: colors.textSecondary, marginTop: 8 }]}>
              When you're ready, join the members who already upgraded.
            </Text>
          </>
        )}

        {isPremium && (
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.doneBtnText, { color: colors.text }]}>Done</Text>
          </TouchableOpacity>
        )}

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
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 28,
    overflow: 'hidden',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  heroSub: { fontSize: 15, lineHeight: 22 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  benefitCard: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  benefitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  benefitTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  benefitSub: { fontSize: 12, lineHeight: 16 },
  badgeTease: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  badgeTeaseTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12 },
  badgeTeaseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  badgeTeaseName: { fontSize: 18, fontWeight: '700' },
  badgeTeaseSub: { fontSize: 13, lineHeight: 19 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#000' },
  finePrint: { fontSize: 12, textAlign: 'center' },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700' },
  compareLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  compareLinkText: { fontSize: 14, fontWeight: '700' },
});
