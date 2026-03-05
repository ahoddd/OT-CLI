/**
 * OrbTap landing — single screen, no scroll. Video background + hero + 3 links + CTAs.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Redirect, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { usePreferences } from '../hooks/usePreferences';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { OrbTapLogoMark } from '../components/OrbTapLogoMark';
import { SPACE, RADIUS, TYPE, HERO_STAGGER_MS } from '../constants/DesignTokens';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { LandingVideoBackground } from '../components/LandingVideoBackground';
import type { LandingVideoBackgroundRef } from '../components/LandingVideoBackground';
import { useWebTitle } from '../hooks/useWebTitle';
import { WebLandingPage } from '../components/WebLandingPage';
import { LandingCard, PrimaryButton, SecondaryButton } from '../components/preauth';
import { PREAUTH } from '../constants/PreAuthTheme';
import { useI18n } from '../context/I18nContext';

const LANDING_SOCIAL_STATS_KEYS = [
  { value: '12,400+', labelKey: 'home.explorers' as const },
  { value: '850+', labelKey: 'home.partners' as const },
  { value: '48K+', labelKey: 'home.perks' as const },
];

export default function Index() {
  useWebTitle('Home');
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();
  const { isPartner } = useEffectiveTier();
  const preferencesContext = usePreferences();
  const profile = useCurrentUserProfile();
  const router = useRouter();
  const videoBgRef = useRef<LandingVideoBackgroundRef>(null);

  // Sync local prefs when Firestore says onboarding was already completed (e.g. returning user on new device)
  useEffect(() => {
    if (!user || !preferencesContext) return;
    if (profile.onboardingComplete && !preferencesContext.prefs.onboardingComplete) {
      preferencesContext.setOnboardingComplete(true);
    }
  }, [user, profile.onboardingComplete, preferencesContext?.prefs.onboardingComplete, preferencesContext]);

  // Backfill Firestore when local prefs say complete but profile doesn't yet (e.g. existing user, other device later)
  useEffect(() => {
    if (!user?.uid || !preferencesContext?.prefs.onboardingComplete || profile.onboardingComplete || profile.loading) return;
    setDoc(doc(db, 'users', user.uid), { onboardingComplete: true }, { merge: true }).catch(() => {});
  }, [user?.uid, preferencesContext?.prefs.onboardingComplete, profile.onboardingComplete, profile.loading]);

  useFocusEffect(
    useCallback(() => {
      videoBgRef.current?.play();
    }, [])
  );

  if (Platform.OS === 'web') {
    return <WebLandingPage />;
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <OrbTapLogoMark variant="hero" width={120} height={103} />
        <Text style={styles.loadingText}>{t('home.loading')}</Text>
      </View>
    );
  }
  if (user) {
    const prefsReady = preferencesContext && !preferencesContext.loading;
    const onboardingDone =
      preferencesContext?.prefs.onboardingComplete === true || profile.onboardingComplete === true;
    // Wait for prefs; if local says not complete, also wait for profile so returning users don't see onboarding briefly
    if (prefsReady && (!preferencesContext.prefs.onboardingComplete ? !profile.loading : true)) {
      if (!onboardingDone) {
        return <Redirect href="/auth/onboarding" />;
      }
      return <Redirect href={isPartner ? '/(tabs)/partner-orb' : '/(tabs)/orb'} />;
    }
    return (
      <View style={styles.loadingWrap}>
        <OrbTapLogoMark variant="hero" width={120} height={103} />
        <Text style={styles.loadingText}>{t('home.loading')}</Text>
      </View>
    );
  }

  const goSignup = () => router.push('/auth/signup');
  const goLogin = () => router.push('/auth/login');
  const goFeatures = () => router.push('/features');
  const goLearn = () => router.push('/learn');
  const goPartnerApply = () => router.push('/partner-apply' as any);

  return (
    <View style={styles.container}>
      <LandingVideoBackground ref={videoBgRef} />
      <View style={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        {/* Hero — coordinated entrance (HERO_STAGGER_MS). */}
        <Animated.View entering={FadeInDown.duration(550)} style={styles.hero}>
          <OrbTapLogoMark variant="hero" width={92} height={79} />
          <Text style={styles.tagline}>OrbTap</Text>
          <Text style={styles.heroHeadline}>{t('home.heroHeadline')}</Text>
          <Text style={styles.heroSub}>
            {t('home.heroSub')}
          </Text>
          <View style={styles.trustRow}>
            <View style={styles.trustLine}>
              <Ionicons name="shield-checkmark" size={12} color={PREAUTH.primary} />
              <Text style={styles.trustText}>{t('home.freeNoCard')}</Text>
            </View>
            <Animated.View entering={FadeIn.delay(HERO_STAGGER_MS * 2).duration(350)} style={styles.socialStrip}>
            {LANDING_SOCIAL_STATS_KEYS.map((s, i) => (
              <View key={i} style={[styles.socialItem, i < LANDING_SOCIAL_STATS_KEYS.length - 1 && styles.socialItemBorder]}>
                <Text style={styles.socialValue}>{s.value}</Text>
                <Text style={styles.socialLabel}>{t(s.labelKey)}</Text>
              </View>
            ))}
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(HERO_STAGGER_MS).duration(400)} style={styles.cardsWrap}>
          <LandingCard title={t('home.takeALookInside')} subtitle={t('home.takeALookSub')} icon="eye-outline" onPress={goFeatures} />
          <LandingCard title={t('home.howItWorks')} subtitle={t('home.howItWorksSub')} icon="bulb-outline" onPress={goLearn} />
          <LandingCard title={t('home.forBusinesses')} subtitle={t('home.forBusinessesSub')} icon="business" onPress={goPartnerApply} />
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={FadeInUp.delay(HERO_STAGGER_MS * 4).duration(400)} style={styles.ctaBlock}>
          <PrimaryButton onPress={goSignup} label={t('home.getStarted')} iconRight="arrow-forward" />
          <SecondaryButton onPress={goLogin} label={t('home.iHaveAccount')} />
          <Text style={styles.footerTeaser}>{t('home.footerTeaser')}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PREAUTH.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh', width: '100%' } : {}),
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACE.lg,
    zIndex: 1,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: PREAUTH.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.base,
  },
  loadingText: { color: PREAUTH.textSecondary, fontSize: TYPE.body, fontWeight: '600' },

  hero: { alignItems: 'center', marginBottom: SPACE.md },
  tagline: { color: PREAUTH.textMuted, fontSize: TYPE.caption, fontWeight: '700', letterSpacing: 2, marginTop: SPACE.xs },
  heroHeadline: {
    color: PREAUTH.text,
    fontSize: TYPE.subheading,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: SPACE.xs,
    lineHeight: 26,
  },
  heroSub: {
    color: PREAUTH.textSecondary,
    fontSize: TYPE.label,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: SPACE.xs,
    paddingHorizontal: 6,
    maxWidth: 280,
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop: SPACE.sm, gap: SPACE.md },
  trustLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  trustText: { color: PREAUTH.primary, fontSize: TYPE.caption, fontWeight: '600' },
  socialStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    backgroundColor: PREAUTH.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    gap: SPACE.xs,
  },
  socialItem: { alignItems: 'center', paddingHorizontal: 6 },
  socialItemBorder: { borderRightWidth: 1, borderRightColor: PREAUTH.surfaceBorder },
  socialValue: { color: PREAUTH.primary, fontSize: TYPE.caption, fontWeight: '800' },
  socialLabel: { color: PREAUTH.textMuted, fontSize: TYPE.caption, fontWeight: '600', marginTop: 1 },

  cardsWrap: { gap: 6, marginBottom: SPACE.md },
  spacer: { flex: 1, minHeight: 6 },

  ctaBlock: { gap: SPACE.sm, paddingBottom: SPACE.xs },
  footerTeaser: { color: PREAUTH.textMuted, fontSize: TYPE.caption, fontWeight: '600', letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },
});
