/**
 * Post-signup onboarding: path → phone (verify) → theme → config-driven slides → done.
 * Immersive visuals, haptic feedback, gradient effects for both members and partners.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  useColorScheme,
  Image,
  TextInput,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/Colors';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import { UserBadge } from '../../components/GamificationUI';
import { OrbTapLogoMark } from '../../components/OrbTapLogoMark';
import { FirstValueOverlay } from '../../components/FirstValueOverlay';
import { usePreferences } from '../../hooks/usePreferences';
import { useAuth } from '../../context/AuthContext';
import { usePartners } from '../../context/PartnersContext';
import { useUserLocation } from '../../context/UserLocationContext';
import { distanceToPartner, formatDistanceMi } from '../../utils/location';
import { userInviteUrl, USER_INVITE_MESSAGE } from '../../constants/AppLinks';
import { ONBOARDING_INVITE_HINT } from '../../constants/ViralCopy';
import { Ionicons } from '@expo/vector-icons';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { userInviteSharePayload } from '../../utils/shareToSocial';
import { useOnboardingConfig } from '../../hooks/useOnboardingConfig';
import { useWebTitle } from '../../hooks/useWebTitle';
import { useI18n } from '../../context/I18nContext';
import type { SupportedLocale } from '../../utils/i18n';
import { logOnboardingComplete } from '../../services/analytics';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import {
  createRecaptchaVerifier,
  requestPhoneVerification,
  requestPhoneVerificationNative,
  confirmPhoneCode,
  verifyPhoneCodeNative,
  normalizePhoneForE164,
  type ConfirmationResult,
} from '../../services/phoneVerification';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');
const RECAPTCHA_CONTAINER_ID = 'onboarding-recaptcha-container';

type OnboardingStep = 'language' | 'path' | 'phone' | 'theme' | 'slides' | 'done';

const MEMBER_HIGHLIGHTS = [
  { icon: 'map' as const, key: 'discoverVenues' as const, accent: '#22C55E' },
  { icon: 'qr-code' as const, key: 'scanEarn' as const, accent: COLORS.neonBlue[0] },
  { icon: 'gift' as const, key: 'realPerks' as const, accent: COLORS.gold[0] },
  { icon: 'trophy' as const, key: 'compete' as const, accent: '#A78BFA' },
];

const PARTNER_HIGHLIGHTS = [
  { icon: 'location' as const, key: 'getOnMap' as const, accent: '#22C55E' },
  { icon: 'pricetags' as const, key: 'postPerks' as const, accent: COLORS.neonBlue[0] },
  { icon: 'analytics' as const, key: 'trackROI' as const, accent: COLORS.gold[0] },
  { icon: 'people' as const, key: 'growTraffic' as const, accent: '#A78BFA' },
];

const FIRST_VALUE_SHOWN_KEY = 'ORBTAP_FIRST_VALUE_SHOWN';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, setLanguage, localeDisplayNames, supportedLocales } = useI18n();
  useWebTitle('Get started');
  const systemDark = useColorScheme() === 'dark';
  const { prefs, setThemePreference, setPartnerMode, setOnboardingComplete } = usePreferences();
  const { memberSlides, partnerSlides } = useOnboardingConfig();
  const { partners } = usePartners();
  const { userLocation } = useUserLocation();

  const [step, setStep] = useState<OnboardingStep>('language');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(prefs.themePreference === 'system' ? 'system' : prefs.themePreference);
  const [isPartner, setIsPartner] = useState(prefs.partnerMode);
  const [slideIndex, setSlideIndex] = useState(0);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const [showFirstValueOverlay, setShowFirstValueOverlay] = useState(false);

  const nearestPartner = useMemo(() => {
    if (!userLocation || partners.length === 0) return null;
    const withDist = partners.map((p) => {
      const mi = distanceToPartner(userLocation.latitude, userLocation.longitude, p);
      return { partner: p, mi: mi ?? 999 };
    });
    withDist.sort((a, b) => a.mi - b.mi);
    const first = withDist[0];
    if (!first || first.mi >= 999) return null;
    return { name: first.partner.name, distanceLabel: formatDistanceMi(first.mi) };
  }, [userLocation, partners]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneConfirmationResult, setPhoneConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneVerificationId, setPhoneVerificationId] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const recaptchaVerifierRef = useRef<ReturnType<typeof createRecaptchaVerifier> | null>(null);

  const slides = isPartner ? partnerSlides : memberSlides;
  const currentSlide = slides[slideIndex];
  const progress = slides.length > 0 ? (slideIndex + 1) / slides.length : 0;

  const ambientGlow = useSharedValue(0);
  useEffect(() => {
    ambientGlow.value = withRepeat(
      withSequence(withTiming(1, { duration: 3000 }), withTiming(0, { duration: 3000 })),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.08 + ambientGlow.value * 0.06,
  }));

  useEffect(() => {
    if (step === 'slides' && slides.length === 0) setStep('done');
  }, [step, slides.length]);

  useEffect(() => {
    if (step !== 'phone' || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const div = document.createElement('div');
    div.id = RECAPTCHA_CONTAINER_ID;
    div.style.display = 'none';
    document.body.appendChild(div);
    return () => {
      recaptchaVerifierRef.current?.clear?.();
      recaptchaVerifierRef.current = null;
      const el = document.getElementById(RECAPTCHA_CONTAINER_ID);
      if (el?.parentNode) el.parentNode.removeChild(el);
    };
  }, [step]);

  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withTiming(progress * (width - 56), { duration: 300 });
  }, [progress, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const handleLanguageSelect = async (code: SupportedLocale) => {
    safeHaptics.selectionAsync();
    await setLanguage(code);
    setStep('path');
  };

  const handlePathNext = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPartnerMode(isPartner);
    setStep('phone');
  };

  const handlePhoneNext = () => {
    setPhoneError('');
    setStep('theme');
  };

  const handlePhoneSkip = () => {
    safeHaptics.selectionAsync();
    setPhoneError('');
    setStep('theme');
  };

  const handleSendCode = async () => {
    if (!user) return;
    setPhoneError('');
    setPhoneLoading(true);
    try {
      const normalized = normalizePhoneForE164(phoneNumber);
      if (Platform.OS === 'web') {
        const verifier = createRecaptchaVerifier(RECAPTCHA_CONTAINER_ID);
        recaptchaVerifierRef.current = verifier;
        if (!verifier) {
          setPhoneError(t('onboarding.verificationNotAvailable'));
          setPhoneLoading(false);
          return;
        }
        const result = await requestPhoneVerification(user, normalized, verifier);
        if (result.success) {
          safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPhoneConfirmationResult(result.confirmationResult);
        } else {
          setPhoneError(result.message);
        }
      } else {
        const result = await requestPhoneVerificationNative(normalized);
        if (result.success) {
          safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPhoneVerificationId(result.verificationId);
        } else {
          setPhoneError(result.message);
        }
      }
    } catch (e: any) {
      setPhoneError(e?.message ?? t('onboarding.couldNotSendCode'));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const isNativeFlow = !!phoneVerificationId;
    if (!phoneConfirmationResult && !phoneVerificationId) return;
    setPhoneError('');
    setPhoneLoading(true);
    try {
      const result = isNativeFlow
        ? await verifyPhoneCodeNative(phoneVerificationId!, phoneCode)
        : await confirmPhoneCode(phoneConfirmationResult!, phoneCode);
      if (result.success) {
        safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handlePhoneNext();
      } else {
        safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPhoneError(result.message);
      }
    } catch (e: any) {
      setPhoneError(e?.message ?? t('onboarding.verificationFailed'));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleThemeNext = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemePreference(selectedTheme);
    setStep('slides');
    setSlideIndex(0);
  };

  const handleSlideNext = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      setStep('done');
    }
  };

  const handleSkipSlides = () => {
    safeHaptics.selectionAsync();
    setStep('done');
  };

  const handleEnterGrid = async () => {
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    logOnboardingComplete({ is_partner: isPartner });
    setOnboardingComplete(true);
    if (user?.uid) {
      setDoc(doc(db, 'users', user.uid), { onboardingComplete: true }, { merge: true }).catch(() => {});
    }
    if (!isPartner) {
      AsyncStorage.setItem('ORBTAP_SHOW_FIRST_ORB_PROMPT', '1').catch(() => {});
    }
    const alreadyShown = await AsyncStorage.getItem(FIRST_VALUE_SHOWN_KEY);
    if (!isPartner && alreadyShown !== '1') {
      setShowFirstValueOverlay(true);
      return;
    }
    router.replace('/(tabs)');
  };

  const handleFirstValueDismiss = () => {
    setShowFirstValueOverlay(false);
    AsyncStorage.setItem(FIRST_VALUE_SHOWN_KEY, '1').catch(() => {});
    router.replace('/(tabs)');
  };

  const isDark = selectedTheme === 'system' ? systemDark : selectedTheme === 'dark';
  const bgColors: [string, string, ...string[]] = isDark ? ['#0a0a0f', '#111', '#0a0a0f'] : ['#f2f2f7', '#fff', '#f2f2f7'];
  const textPrimary = isDark ? '#fff' : '#000';
  const textSecondary = isDark ? '#888' : '#666';
  const borderColor = isDark ? '#333' : '#e5e5ea';
  const surfaceColor = isDark ? '#1a1a1e' : '#fff';

  const highlights = isPartner ? PARTNER_HIGHLIGHTS : MEMBER_HIGHLIGHTS;

  return (
    <View style={styles.container}>
      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.ambientGlow, { backgroundColor: COLORS.neonBlue[0] }, glowStyle]} />

      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        {/* ─── LANGUAGE STEP (first) ─── */}
        {step === 'language' && (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.step}>
            <View style={[styles.slideIconWrap, { backgroundColor: COLORS.neonBlue[0] + '20' }]}>
              <Ionicons name="language" size={40} color={COLORS.neonBlue[0]} />
            </View>
            <Text style={[styles.stepTitle, { color: textPrimary }]}>{t('onboarding.languageTitle')}</Text>
            <Text style={[styles.stepSub, { color: textSecondary, marginBottom: 24 }]}>{t('onboarding.languageSubtitle')}</Text>
            <View style={{ width: '100%', maxWidth: 320 }}>
              {supportedLocales.map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.languageOption, { borderColor, backgroundColor: surfaceColor }]}
                  onPress={() => handleLanguageSelect(code)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.languageOptionText, { color: textPrimary }]}>{localeDisplayNames[code]}</Text>
                  <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ─── PATH STEP ─── */}
        {step === 'path' && (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.step}>
            <Text style={[styles.welcome, { color: textSecondary }]}>{t('onboarding.welcome')}</Text>
            <Text style={[styles.brand, { color: textPrimary }]}>ORBTAP</Text>
            <View style={styles.logoWrap}>
              <OrbTapLogoMark variant="hero" />
            </View>
            <Text style={[styles.stepTitle, { color: textPrimary }]}>{t('onboarding.choosePath')}</Text>
            <Text style={[styles.stepSub, { color: textSecondary }]}>{t('onboarding.choosePathSub')}</Text>

            {/* Member card */}
            <TouchableOpacity
              style={[styles.roleCard, { borderColor: !isPartner ? COLORS.neonBlue[0] : borderColor, backgroundColor: !isPartner ? COLORS.neonBlue[0] + '08' : 'transparent' }]}
              onPress={() => { setIsPartner(false); safeHaptics.selectionAsync(); }}
              activeOpacity={0.85}
            >
              {!isPartner && (
                <LinearGradient
                  colors={[COLORS.neonBlue[0] + '12', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[styles.roleIconWrap, { backgroundColor: (!isPartner ? COLORS.neonBlue[0] : textSecondary) + '18' }]}>
                <Ionicons name="person" size={28} color={!isPartner ? COLORS.neonBlue[0] : textSecondary} />
              </View>
              <View style={styles.roleTextWrap}>
                <Text style={[styles.roleTitle, { color: textPrimary }]}>{t('onboarding.member')}</Text>
                <Text style={[styles.roleSub, { color: textSecondary }]}>{t('onboarding.memberSub')}</Text>
              </View>
              {!isPartner && <Ionicons name="checkmark-circle" size={22} color={COLORS.neonBlue[0]} />}
            </TouchableOpacity>

            {/* Partner card */}
            <TouchableOpacity
              style={[styles.roleCard, { borderColor: isPartner ? COLORS.success : borderColor, backgroundColor: isPartner ? COLORS.success + '08' : 'transparent' }]}
              onPress={() => { setIsPartner(true); safeHaptics.selectionAsync(); }}
              activeOpacity={0.85}
            >
              {isPartner && (
                <LinearGradient
                  colors={[COLORS.success + '12', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[styles.roleIconWrap, { backgroundColor: (isPartner ? COLORS.success : textSecondary) + '18' }]}>
                <Ionicons name="business" size={28} color={isPartner ? COLORS.success : textSecondary} />
              </View>
              <View style={styles.roleTextWrap}>
                <Text style={[styles.roleTitle, { color: textPrimary }]}>{t('onboarding.partner')}</Text>
                <Text style={[styles.roleSub, { color: textSecondary }]}>{t('onboarding.partnerSub')}</Text>
              </View>
              {isPartner && <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />}
            </TouchableOpacity>

            {/* Quick highlights */}
            <View style={styles.highlightRow}>
              {highlights.map((h, i) => (
                <Animated.View key={i} entering={FadeInUp.delay(300 + i * 80).duration(300)} style={styles.highlightItem}>
                  <Ionicons name={h.icon} size={18} color={h.accent} />
                  <Text style={[styles.highlightLabel, { color: textSecondary }]}>{t('onboarding.' + h.key)}</Text>
                </Animated.View>
              ))}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={handlePathNext} activeOpacity={0.9}>
              <LinearGradient
                colors={isPartner ? [COLORS.success, '#16a34a'] : [COLORS.neonBlue[0], '#818cf8']}
                style={styles.nextBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextBtnText}>{t('onboarding.continue')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ─── PHONE STEP ─── */}
        {step === 'phone' && (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.step}>
              <View style={[styles.slideIconWrap, { backgroundColor: COLORS.neonBlue[0] + '20' }]}>
                <Ionicons name="call" size={40} color={COLORS.neonBlue[0]} />
              </View>
              <Text style={[styles.stepTitle, { color: textPrimary }]}>{t('onboarding.verifyPhone')}</Text>
              <Text style={[styles.stepSub, { color: textSecondary, marginBottom: 20 }]}>
                {t('onboarding.verifyPhoneSub')}
              </Text>
              {!phoneConfirmationResult && !phoneVerificationId ? (
                <TextInput
                  style={[styles.phoneInput, { backgroundColor: surfaceColor, color: textPrimary, borderColor }]}
                  placeholder="+1 555 123 4567"
                  placeholderTextColor={textSecondary}
                  value={phoneNumber}
                  onChangeText={(t) => { setPhoneNumber(t); setPhoneError(''); }}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  editable={!phoneLoading}
                />
              ) : (
                <>
                  <Text style={[styles.phoneSentLabel, { color: textSecondary }]}>{t('onboarding.codeSent', { phone: phoneNumber || 'your number' })}</Text>
                  <TextInput
                    style={[styles.phoneInput, { backgroundColor: surfaceColor, color: textPrimary, borderColor }]}
                    placeholder={t('onboarding.sixDigitCode')}
                    placeholderTextColor={textSecondary}
                    value={phoneCode}
                    onChangeText={(t) => { setPhoneCode(t.replace(/\D/g, '').slice(0, 6)); setPhoneError(''); }}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    maxLength={6}
                    editable={!phoneLoading}
                  />
                </>
              )}
              {phoneError ? <Text style={[styles.phoneError, { color: '#f87171' }]}>{phoneError}</Text> : null}
              <View style={styles.phoneActions}>
                <TouchableOpacity onPress={handlePhoneSkip} disabled={phoneLoading} style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
                  <Text style={[styles.skipText, { color: textSecondary }]}>{t('onboarding.addLater')}</Text>
                </TouchableOpacity>
                {!phoneConfirmationResult && !phoneVerificationId ? (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: textPrimary, opacity: phoneLoading ? 0.7 : 1 }]}
                    onPress={() => { Keyboard.dismiss(); handleSendCode(); }}
                    disabled={phoneLoading || !phoneNumber.trim()}
                  >
                    {phoneLoading ? <ActivityIndicator color={isDark ? '#000' : '#fff'} size="small" /> : <Text style={[styles.btnText, { color: isDark ? '#000' : '#fff' }]}>{t('onboarding.sendCode')}</Text>}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: textPrimary, opacity: phoneLoading ? 0.7 : 1 }]}
                    onPress={() => { Keyboard.dismiss(); handleVerifyCode(); }}
                    disabled={phoneLoading || phoneCode.length < 4}
                  >
                    {phoneLoading ? <ActivityIndicator color={isDark ? '#000' : '#fff'} size="small" /> : <Text style={[styles.btnText, { color: isDark ? '#000' : '#fff' }]}>{t('onboarding.verify')}</Text>}
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        )}

        {/* ─── THEME STEP ─── */}
        {step === 'theme' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.step}>
            <View style={[styles.slideIconWrap, { backgroundColor: '#A78BFA20' }]}>
              <Ionicons name="color-palette" size={40} color="#A78BFA" />
            </View>
            <Text style={[styles.stepTitle, { color: textPrimary }]}>{t('onboarding.chooseLook')}</Text>
            <Text style={[styles.stepSub, { color: textSecondary, marginBottom: 24 }]}>{t('onboarding.chooseLookSub')}</Text>
            <View style={styles.themeRow}>
              {(['light', 'dark', 'system'] as const).map((themeKey) => {
                const active = selectedTheme === themeKey;
                const tColor = themeKey === 'light' ? '#F59E0B' : themeKey === 'dark' ? '#818CF8' : COLORS.neonBlue[0];
                return (
                  <TouchableOpacity
                    key={themeKey}
                    style={[
                      styles.themeBtn,
                      { borderColor: active ? tColor : borderColor },
                      active && { backgroundColor: tColor + '12' },
                    ]}
                    onPress={() => { setSelectedTheme(themeKey); safeHaptics.selectionAsync(); }}
                  >
                    <View style={[styles.themeIconWrap, { backgroundColor: tColor + '18' }]}>
                      <Ionicons
                        name={themeKey === 'light' ? 'sunny' : themeKey === 'dark' ? 'moon' : 'phone-portrait'}
                        size={24}
                        color={active ? tColor : textSecondary}
                      />
                    </View>
                    <Text style={[styles.themeLabel, { color: active ? textPrimary : textSecondary }]}>
                      {t('settings.' + themeKey)}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={16} color={tColor} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={handleThemeNext} activeOpacity={0.9}>
              <LinearGradient
                colors={[COLORS.neonBlue[0], '#818cf8']}
                style={styles.nextBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextBtnText}>{t('onboarding.continue')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ─── SLIDES STEP ─── */}
        {step === 'slides' && currentSlide && (
          <Animated.View key={currentSlide.id} entering={FadeIn.duration(400)} style={styles.step}>
            {currentSlide.imageUrl ? (
              <View style={[styles.slideImageWrap, { backgroundColor: surfaceColor }]}>
                <Image source={{ uri: currentSlide.imageUrl }} style={styles.slideImage} resizeMode="contain" />
              </View>
            ) : (
              <View style={[styles.slideIconWrap, { backgroundColor: COLORS.neonBlue[0] + '20' }]}>
                <Ionicons name={currentSlide.icon as any} size={48} color={COLORS.neonBlue[0]} />
              </View>
            )}
            <Text style={[styles.slideTitle, { color: textPrimary }]}>{currentSlide.title}</Text>
            <Text style={[styles.slideSub, { color: textSecondary }]}>{currentSlide.subtitle}</Text>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? '#333' : '#e0e0e5' }]}>
              <Animated.View style={[styles.progressFill, { backgroundColor: COLORS.neonBlue[0] }, progressBarStyle]} />
            </View>
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === slideIndex ? COLORS.neonBlue[0] : isDark ? '#333' : '#ccc' },
                    i === slideIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.slideActions}>
              <TouchableOpacity onPress={handleSkipSlides}>
                <Text style={[styles.skipText, { color: textSecondary }]}>{slideIndex === 0 ? t('onboarding.skipIntro') : t('onboarding.skip')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleSlideNext} activeOpacity={0.9}>
                <LinearGradient
                  colors={[COLORS.neonBlue[0], '#818cf8']}
                  style={styles.nextBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextBtnText}>
                    {slideIndex < slides.length - 1 ? t('onboarding.next') : t('onboarding.almostThere')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ─── DONE STEP ─── */}
        {step === 'done' && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.step}>
            <View style={styles.badgeWrapper}>
              <UserBadge level={1} size={140} />
            </View>
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <Text style={[styles.rank, { color: COLORS.neonBlue[0] }]}>{t('onboarding.rankScout')}</Text>
            </Animated.View>

            {/* 50 OT signup bonus — count-up */}
            {!isPartner && (
              <Animated.View entering={FadeInDown.delay(280).duration(400)} style={signupBonusStyles.card}>
                <View style={signupBonusStyles.row}>
                  <Ionicons name="ellipse" size={18} color={COLORS.gold[0]} />
                  <Text style={[signupBonusStyles.amount, { color: COLORS.gold[0] }]}>+50</Text>
                  <Text style={[signupBonusStyles.label, { color: textPrimary }]}>{t('onboarding.signupBonus')}</Text>
                </View>
                <Text style={[signupBonusStyles.sub, { color: textSecondary }]}>{t('onboarding.signupBonusSub')}</Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(350).duration(400)}>
              <Text style={[styles.desc, { color: textSecondary }]}>
                {isPartner ? t('onboarding.donePartner') : t('onboarding.doneMember')}
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <Text style={[styles.viralHint, { color: textSecondary }]}>
                {ONBOARDING_INVITE_HINT}
              </Text>
            </Animated.View>
            {user?.uid && (
              <Animated.View entering={FadeInDown.delay(600).duration(400)} style={{ width: '100%' }}>
                <TouchableOpacity
                  style={[styles.inviteBtnFull, { borderColor: COLORS.gold[0] }]}
                  onPress={() => {
                    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    const url = userInviteUrl(user.uid);
                    setSharePayload(userInviteSharePayload(url, prefs.shareMessage || USER_INVITE_MESSAGE));
                    setShareSheetVisible(true);
                  }}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[COLORS.gold[0] + '30', COLORS.gold[0] + '12']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Ionicons name="share-social" size={22} color={COLORS.gold[0]} />
                  <Text style={[styles.inviteBtnText, { color: COLORS.gold[0] }]}>{t('onboarding.inviteNowCta')}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            <Animated.View entering={FadeInDown.delay(700).duration(400)} style={{ width: '100%' }}>
              <TouchableOpacity style={styles.enterBtn} onPress={handleEnterGrid} activeOpacity={0.9}>
                <LinearGradient
                  colors={isPartner ? [COLORS.success, '#16a34a'] : [COLORS.neonBlue[0], '#818cf8']}
                  style={styles.enterBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.enterBtnText}>
                    {isPartner ? t('onboarding.enterDashboard') : t('onboarding.enterGrid')}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}
      </SafeAreaView>
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label={t('onboarding.inviteFriends')}
        />
      )}
      <FirstValueOverlay
        visible={showFirstValueOverlay}
        onDismiss={handleFirstValueDismiss}
        isPartner={isPartner}
        partnerName={nearestPartner?.name ?? null}
        distanceLabel={nearestPartner?.distanceLabel ?? null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: {
    position: 'absolute',
    top: -width * 0.4,
    left: -width * 0.2,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
  },
  content: { flex: 1, paddingHorizontal: 28, paddingBottom: 24 },
  step: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcome: { fontSize: 12, letterSpacing: 3, fontWeight: '700', marginBottom: 4 },
  brand: { fontSize: 38, fontWeight: '900', letterSpacing: -1, marginBottom: 16 },
  logoWrap: { marginBottom: 24 },
  stepTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  stepSub: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },

  roleCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    gap: 12,
    overflow: 'hidden',
  },
  roleIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  roleTextWrap: { flex: 1, minWidth: 0 },
  roleTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  roleSub: { fontSize: 12, lineHeight: 17 },

  highlightRow: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 20 },
  highlightItem: { alignItems: 'center', gap: 4, flex: 1 },
  highlightLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  nextBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', shadowColor: COLORS.neonBlue[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  nextBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, paddingHorizontal: 24 },
  nextBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },

  themeRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  themeBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  themeIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { fontSize: 12, fontWeight: '700' },

  phoneInput: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
  },
  phoneSentLabel: { fontSize: 13, marginBottom: 8 },
  phoneError: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
  phoneActions: { flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 8 },

  slideImageWrap: {
    width: Math.min(width - 56, 280),
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  slideImage: { width: '100%', height: '100%' },
  slideIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  languageOptionText: { fontSize: 16, fontWeight: '600' },
  slideTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  slideSub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  progressTrack: { height: 4, width: width - 56, borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  slideActions: { flexDirection: 'row', alignItems: 'center', gap: 24 },

  skipText: { fontSize: 15, fontWeight: '600' },
  btn: { paddingVertical: 16, paddingHorizontal: 36, borderRadius: 16, alignItems: 'center', minWidth: 140 },
  btnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  badgeWrapper: { marginBottom: 20, shadowColor: COLORS.neonBlue[0], shadowOpacity: 0.5, shadowRadius: 32, shadowOffset: { width: 0, height: 0 } },
  rank: { fontSize: 18, fontWeight: '900', letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  desc: { textAlign: 'center', lineHeight: 22, fontSize: 14, maxWidth: '90%', marginBottom: 4 },
  viralHint: { textAlign: 'center', fontSize: 12, marginTop: 4, marginBottom: 12, maxWidth: '85%' },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  inviteBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  inviteBtnText: { fontSize: 15, fontWeight: '800' },
  enterBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', shadowColor: COLORS.neonBlue[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  enterBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, paddingHorizontal: 24 },
  enterBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
});

const signupBonusStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.gold[0] + '15',
    borderWidth: 1,
    borderColor: COLORS.gold[0] + '50',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  label: { fontSize: 14, fontWeight: '700', alignSelf: 'flex-end', marginBottom: 4 },
  sub: { fontSize: 11, marginTop: 4, fontWeight: '600' },
});
