/**
 * OrbTap Web Landing — Conversion-optimized for downloads and signups.
 * Structure: Hero → How It Works → For Everyone → For Businesses → Social Proof → CTA → Footer.
 * Calm, confident copy. The app sells itself.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OrbTapLogoMark } from './OrbTapLogoMark';
import { PREAUTH } from '../constants/PreAuthTheme';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import { APP_STORE_URL, PLAY_STORE_URL, ORBTAP_APP_LINK, PRIVACY_POLICY_URL, TERMS_URL } from '../constants/AppLinks';
import { PrimaryButton } from './preauth';

function useWebMeta(title: string, description: string) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);
    else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [title, description]);
}

function useJsonLd() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const existing = document.getElementById('orbtap-jsonld');
    if (existing) return;
    const script = document.createElement('script');
    script.id = 'orbtap-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'OrbTap',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'iOS, Android',
      description: 'Discover local spots, earn points when you visit, and redeem real perks. Free on App Store and Google Play.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      ...(typeof APP_STORE_URL !== 'undefined' && APP_STORE_URL ? { downloadUrl: APP_STORE_URL } : {}),
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);
}

const HOW_IT_WORKS_STEPS = [
  { step: 1, icon: 'map' as const, title: 'Discover', sub: 'See partner venues near you on the map. Restaurants, cafes, shops, experiences.' },
  { step: 2, icon: 'qr-code' as const, title: 'Scan', sub: 'Check in at any partner with one tap. Your visit is verified instantly.' },
  { step: 3, icon: 'wallet' as const, title: 'Earn', sub: 'OT Points hit your vault immediately. Build streaks and complete missions for bonus points.' },
  { step: 4, icon: 'gift' as const, title: 'Redeem', sub: 'Use points for real perks — discounts, free items, exclusive access at partner spots.' },
];

const SOCIAL_STATS = [
  { value: '12,400+', label: 'Active explorers' },
  { value: '850+', label: 'Partner venues' },
  { value: '48,000+', label: 'Verified visits' },
];

const THREE_FEATURES = [
  {
    icon: 'shield-checkmark' as const,
    title: 'Verified Visits',
    sub: 'QR scan + geo + PIN. The only platform that proves you were actually there. Every visit generates a sharable Proof Card.',
    accent: '#22C55E',
  },
  {
    icon: 'wallet' as const,
    title: 'OT Points Economy',
    sub: 'Earn on every scan. Spend on real perks across every partner. Points earned at a café are redeemable at a gym.',
    accent: '#FBBF24',
  },
  {
    icon: 'people' as const,
    title: 'Partner Perks',
    sub: 'Discounts, free items, early access. Partners compete to offer the best deals to attract OrbTap explorers.',
    accent: '#7C3AED',
  },
];

export function WebLandingPage() {
  useWebMeta(
    'OrbTap — Get Paid to Show Up. Earn points at local spots.',
    'Discover local businesses, earn OT Points every time you visit, and redeem for real perks. The only app with verified foot-traffic rewards. Free on iOS and Android.'
  );
  useJsonLd();

  const openAppStore = () => Linking.openURL(APP_STORE_URL);
  const openPlayStore = () => Linking.openURL(PLAY_STORE_URL);
  const openPartnerApply = () => Linking.openURL(ORBTAP_APP_LINK.replace(/\/$/, '') + '/partner-apply');

  return (
    <View style={styles.page}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <OrbTapLogoMark variant="hero" width={64} height={55} />
          </View>
          <Text style={styles.brand}>OrbTap</Text>
          <Text style={styles.heroHeadline}>Get Paid to Show Up.</Text>
          <Text style={styles.heroSub}>
            Scan a QR at any partner venue. Earn OT Points instantly. Redeem for real perks at hundreds of local spots.
            The only app where every visit is verified — and rewarded.
          </Text>
          <Text style={styles.heroHint}>Free on the App Store and Google Play.</Text>
          <View style={styles.onlyOnRow}>
            <Ionicons name="shield-checkmark" size={14} color={PREAUTH.primary} />
            <Text style={styles.onlyOnText}>Only on OrbTap: Verified Visits · Proof Cards · OrbPilot™ · OrbScore™</Text>
          </View>
        </View>

        {/* Store buttons — primary CTA style */}
        <View style={styles.storeSection}>
          <TouchableOpacity style={styles.storeBtnPrimary} onPress={openAppStore} activeOpacity={0.9} accessibilityLabel="Download on the App Store" accessibilityRole="button">
            <Ionicons name="logo-apple" size={24} color="#000" />
            <Text style={styles.storeBtnPrimaryText}>App Store</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.storeBtnPrimary} onPress={openPlayStore} activeOpacity={0.9} accessibilityLabel="Get it on Google Play" accessibilityRole="button">
            <Ionicons name="logo-google-playstore" size={24} color="#000" />
            <Text style={styles.storeBtnPrimaryText}>Google Play</Text>
          </TouchableOpacity>
        </View>

        {/* Social proof strip */}
        <View style={styles.socialProofStrip}>
          {SOCIAL_STATS.map((s, i) => (
            <View key={i} style={[styles.socialProofItem, i < SOCIAL_STATS.length - 1 && styles.socialProofItemBorder]}>
              <Text style={styles.socialProofValue}>{s.value}</Text>
              <Text style={styles.socialProofLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* 3-Feature Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHY ORBTAP</Text>
          <Text style={styles.sectionTitle}>Three things no competitor has</Text>
          <View style={styles.featureGrid}>
            {THREE_FEATURES.map((f) => (
              <View key={f.title} style={[styles.featureCard, { borderColor: f.accent + '44' }]}>
                <View style={[styles.featureIcon, { backgroundColor: f.accent + '22' }]}>
                  <Ionicons name={f.icon} size={24} color={f.accent} />
                </View>
                <Text style={[styles.featureTitle, { color: f.accent }]}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works — single accent */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          <Text style={styles.sectionTitle}>Four steps to real rewards</Text>
          {HOW_IT_WORKS_STEPS.map((step) => (
            <View key={step.step} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <Text style={styles.stepNum}>{step.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Ionicons name={step.icon} size={16} color={PREAUTH.primary} />
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* For Everyone — glass card */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>FOR EVERYONE</Text>
            <Text style={styles.cardTitle}>See what\u2019s near you</Text>
            <Text style={styles.cardText}>
              Map of local spots. Check in, earn OT Points, redeem real perks. Build streaks, complete missions, climb the leaderboard.
            </Text>
            <View style={styles.bulletRow}>
              <Ionicons name="map" size={18} color={PREAUTH.primary} />
              <Text style={styles.bullet}>Discover partner venues nearby</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="gift" size={18} color={PREAUTH.primary} />
              <Text style={styles.bullet}>Earn points at every verified visit</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="qr-code" size={18} color={PREAUTH.primary} />
              <Text style={styles.bullet}>Redeem for real discounts and freebies</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="flame" size={18} color={PREAUTH.primary} />
              <Text style={styles.bullet}>Daily missions, streaks, and badges</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="shield-checkmark" size={18} color={PREAUTH.primary} />
              <Text style={styles.bullet}>Orb Score\u2122 — verified reviews only</Text>
            </View>
          </View>
        </View>

        {/* For Businesses — same glass card + PrimaryButton-style CTA */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>FOR BUSINESSES</Text>
            <Text style={styles.cardTitle}>Pay only when customers show up</Text>
            <Text style={styles.cardText}>
              OrbPilot™ is the first verified-visit autopilot for local businesses. Set a budget, choose your slow hours,
              and only pay when a real customer walks through your door and scans in.
            </Text>
            <View style={styles.bulletRow}>
              <Ionicons name="location" size={18} color={PREAUTH.primary} />
              <Text style={styles.bullet}>Show up on the map where people are looking</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="analytics" size={18} color={PREAUTH.primary} />
              <Text style={styles.bullet}>Analytics and insights on every visit</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="pricetags" size={18} color={PREAUTH.primary} />
              <Text style={styles.bullet}>Create perks and loyalty stamp cards</Text>
            </View>
            <Text style={styles.cardHint}>Start free \u2014 no risk. Apply in minutes.</Text>
            <PrimaryButton onPress={openPartnerApply} label="List your venue" icon="business" style={styles.partnerCta} />
          </View>
        </View>

        {/* What makes it different */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>ONLY ON ORBTAP</Text>
          <View style={styles.diffRow}>
            <View style={styles.diffItem}>
              <Ionicons name="shield-checkmark" size={20} color={PREAUTH.primary} />
              <Text style={styles.diffText}>Verified visits only</Text>
            </View>
            <View style={styles.diffItem}>
              <Ionicons name="flash" size={20} color={PREAUTH.primary} />
              <Text style={styles.diffText}>Instant rewards</Text>
            </View>
          </View>
          <View style={styles.diffRow}>
            <View style={styles.diffItem}>
              <Ionicons name="star" size={20} color={PREAUTH.primary} />
              <Text style={styles.diffText}>Verified reviews</Text>
            </View>
            <View style={styles.diffItem}>
              <Ionicons name="lock-closed" size={20} color={PREAUTH.primary} />
              <Text style={styles.diffText}>Your data stays yours</Text>
            </View>
          </View>
        </View>

        {/* Second CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaLine}>The app is free. See for yourself.</Text>
          <View style={styles.storeRow}>
            <TouchableOpacity style={styles.storeBtnPrimary} onPress={openAppStore} accessibilityLabel="Download on the App Store" accessibilityRole="button">
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={styles.storeBtnPrimaryText}>App Store</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.storeBtnPrimary} onPress={openPlayStore} accessibilityLabel="Get it on Google Play" accessibilityRole="button">
              <Ionicons name="logo-google-playstore" size={20} color="#000" />
              <Text style={styles.storeBtnPrimaryText}>Google Play</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>OrbTap</Text>
          <Text style={styles.footerTagline}>Your city. Real places. Real perks.</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} accessibilityLabel="Privacy Policy" accessibilityRole="link">
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>\u00B7</Text>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)} accessibilityLabel="Terms of Service" accessibilityRole="link">
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>\u00B7</Text>
            <TouchableOpacity onPress={() => Linking.openURL(ORBTAP_APP_LINK + '/support')} accessibilityLabel="Support" accessibilityRole="link">
              <Text style={styles.footerLink}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.bottomPad} />
      </ScrollView>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: PREAUTH.background, minHeight: '100vh', width: '100%' },
  scroll: { flex: 1 },
  scrollContent: { maxWidth: 520, alignSelf: 'center', width: '100%', paddingHorizontal: SPACE.xl, paddingTop: 48, paddingBottom: 24 },
  hero: { alignItems: 'center', marginBottom: 36 },
  logoWrap: { width: 88, height: 88, borderRadius: 22, backgroundColor: PREAUTH.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logo: { width: 64, height: 64 },
  brand: { color: PREAUTH.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  heroHeadline: { color: PREAUTH.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center', lineHeight: 36, marginBottom: 12 },
  heroSub: { color: PREAUTH.textSecondary, fontSize: 16, lineHeight: 26, textAlign: 'center', marginBottom: 16, paddingHorizontal: 8 },
  heroHint: { color: PREAUTH.textMuted, fontSize: 14, fontWeight: '600', textAlign: 'center', fontStyle: 'italic' },
  onlyOnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  onlyOnText: { color: PREAUTH.textMuted, fontSize: 12, fontWeight: '600' },
  storeSection: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 28, flexWrap: 'wrap' },
  storeBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: PREAUTH.radiusButton,
    backgroundColor: PREAUTH.primary,
    minWidth: 160,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  storeBtnPrimaryText: { color: '#000', fontSize: 16, fontWeight: '700' },
  socialProofStrip: {
    flexDirection: 'row',
    borderRadius: PREAUTH.radius,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    backgroundColor: PREAUTH.surface,
    marginBottom: 36,
    overflow: 'hidden',
  },
  socialProofItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  socialProofItemBorder: { borderRightWidth: 1, borderRightColor: PREAUTH.surfaceBorder },
  socialProofValue: { fontSize: 18, fontWeight: '800', marginBottom: 2, color: PREAUTH.primary },
  socialProofLabel: { fontSize: 11, fontWeight: '600', color: PREAUTH.textMuted },
  featureGrid: { gap: 12, marginTop: 12 },
  featureCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    backgroundColor: PREAUTH.surface,
    gap: 8,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  featureTitle: { fontSize: 16, fontWeight: '800' },
  featureSub: { fontSize: 14, color: PREAUTH.textSecondary, lineHeight: 21 },
  section: { marginBottom: 28 },
  sectionLabel: { color: PREAUTH.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  sectionTitle: { color: PREAUTH.text, fontSize: 20, fontWeight: '800', marginBottom: 18, letterSpacing: -0.3 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  stepIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: PREAUTH.primary + '22', alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 16, fontWeight: '900', color: PREAUTH.primary },
  stepContent: { flex: 1, minWidth: 0 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  stepTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3, color: PREAUTH.primary },
  stepSub: { color: PREAUTH.textSecondary, fontSize: 14, lineHeight: 21 },
  card: {
    padding: 24,
    borderRadius: PREAUTH.radius,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    backgroundColor: PREAUTH.surface,
  },
  cardTitle: { color: PREAUTH.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  cardText: { color: PREAUTH.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: 16 },
  cardHint: { color: PREAUTH.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 8 },
  partnerCta: { marginTop: 16 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bullet: { color: PREAUTH.textSecondary, fontSize: 14, fontWeight: '600', flex: 1 },
  diffRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  diffItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    backgroundColor: PREAUTH.surface,
  },
  diffText: { color: PREAUTH.textSecondary, fontSize: 12, fontWeight: '700', flex: 1 },
  ctaSection: { alignItems: 'center', marginTop: 16, marginBottom: 40 },
  ctaLine: { color: PREAUTH.textMuted, fontSize: 15, fontWeight: '600', marginBottom: 16 },
  storeRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  footer: { alignItems: 'center', paddingTop: 32, borderTopWidth: 1, borderTopColor: PREAUTH.surfaceBorder },
  footerBrand: { color: PREAUTH.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  footerTagline: { color: PREAUTH.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 16 },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLink: { color: PREAUTH.textMuted, fontSize: 13, fontWeight: '600', ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}) },
  footerDot: { color: PREAUTH.textMuted, fontSize: 13 },
  bottomPad: { height: 48 },
});
