import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Dimensions, Keyboard } from 'react-native';
import { alert as showAlert } from '../../utils/alert';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { OrbTapLogoMark } from '../../components/OrbTapLogoMark';
import { useTheme } from '../../hooks/useTheme';
import { PREAUTH } from '../../constants/PreAuthTheme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { getRememberedEmail, setRememberedEmail, getBiometricCreds, saveBiometricCreds, isBiometricEnabled } from '../../services/authStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LandingVideoBackground } from '../../components/LandingVideoBackground';
import { PrimaryButton, PreAuthInput } from '../../components/preauth';
import { useWebTitle } from '../../hooks/useWebTitle';
import { useI18n } from '../../context/I18nContext';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { signInWithGoogle, signInWithApple, ensureSocialUserProfile, handleAppleRedirectResult, isGoogleSignInAvailable, isAppleSignInAvailable } from '../../services/socialAuth';
import { HERO_STAGGER_MS, SPACE, RADIUS, TYPE } from '../../constants/DesignTokens';

const BUBBLE_SHOWN_KEY = 'orbtap_login_bubble_shown';

const isExpoGo = Constants.appOwnership === 'expo';

const { width } = Dimensions.get('window');
const IDLE_BUBBLE_DELAY_MS = 4000;

export default function LoginScreen() {
  useWebTitle('Sign in');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [useBiometric, setUseBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasStoredCreds, setHasStoredCreds] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const hasShownBubbleRef = useRef(false);

  const handleSocialSignIn = useCallback(async (provider: 'google' | 'apple') => {
    setLoginError(null);
    setSocialLoading(provider);
    try {
      const result = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      if (!result.success) {
        if (result.message?.includes('Redirecting')) return;
        setLoginError(result.message);
        safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      await ensureSocialUserProfile(result.credential);
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/' as any);
    } catch (e: any) {
      setLoginError(e?.message ?? 'Sign-in failed. Try again.');
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSocialLoading(null);
    }
  }, [router]);

  useEffect(() => {
    (async () => {
      const remembered = await getRememberedEmail();
      if (remembered) setEmail(remembered);
      const enabled = await isBiometricEnabled();
      const creds = await getBiometricCreds();
      setHasStoredCreds(enabled && !!creds);
      if (isExpoGo) {
        setBiometricAvailable(false);
        return;
      }
      try {
        const LA = require('expo-local-authentication');
        const [hasHardware, isEnrolled] = await Promise.all([LA.hasHardwareAsync(), LA.isEnrolledAsync()]);
        setBiometricAvailable(hasHardware && isEnrolled);
      } catch {
        setBiometricAvailable(false);
      }
    })();
  }, []);

  // Web: complete Apple sign-in after redirect from Firebase handler (orbtap.firebaseapp.com/__/auth/handler)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    handleAppleRedirectResult().then((credential) => {
      if (cancelled || !credential) return;
      ensureSocialUserProfile(credential).then(() => {
        if (!cancelled) {
          safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/' as any);
        }
      }).catch(() => {});
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (hasShownBubbleRef.current) return;
    AsyncStorage.getItem(BUBBLE_SHOWN_KEY).then((shown) => {
      if (shown) return;
      const timerId = setTimeout(() => {
        hasShownBubbleRef.current = true;
        setShowBubble(true);
        AsyncStorage.setItem(BUBBLE_SHOWN_KEY, '1').catch(() => {});
      }, IDLE_BUBBLE_DELAY_MS);
      // Store cleanup ref
      (hasShownBubbleRef as any)._timer = timerId;
    });
    return () => {
      if ((hasShownBubbleRef as any)._timer) clearTimeout((hasShownBubbleRef as any)._timer);
    };
  }, []);

  const dismissBubble = useCallback(() => setShowBubble(false), []);

  const getOrbTapErrorMessage = (code: string, rawMessage?: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return t('auth.alertInvalidEmail');
      case 'auth/user-disabled':
        return "This OrbTap account has been deactivated. Contact support if you think this is a mistake.";
      case 'auth/user-not-found':
        return t('auth.alertNoAccount');
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return t('auth.alertWrongPassword');
      case 'auth/too-many-requests':
        return t('auth.alertTooManyAttempts');
      case 'auth/network-request-failed':
        return "Check your connection and try again. OrbTap needs the internet to sign you in.";
      case 'auth/invalid-api-key':
      case 'auth/configuration-not-found':
        return "OrbTap sign-in is misconfigured (API key). If you just changed your Firebase key, make sure the new key is in .env as EXPO_PUBLIC_FIREBASE_API_KEY and that the key has Identity Toolkit API enabled in Google Cloud Console.";
      default:
        if (rawMessage && /api.key|403|restrict|unauthorized/i.test(rawMessage)) {
          return "Sign-in failed: check that your Firebase API key in .env is correct and has Identity Toolkit API enabled in Google Cloud Console.";
        }
        return t('auth.alertTryAgain');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError(t('auth.alertEnterEmailPassword'));
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoginError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      if (rememberMe) await setRememberedEmail(email.trim());
      else await setRememberedEmail(null);
      if (useBiometric) await saveBiometricCreds(email.trim(), password);
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/' as any);
    } catch (error: any) {
      const code = error?.code ?? '';
      const message = getOrbTapErrorMessage(code, error?.message);
      setLoginError(message);
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showAlert(t('auth.alertOops'), 'Enter your email above, then tap Forgot password to receive a reset link.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showAlert('Check your email', 'We sent a password reset link to ' + email.trim());
    } catch (error: any) {
      const code = error?.code ?? '';
      if (code === 'auth/user-not-found') {
        showAlert(t('auth.alertCouldNotSignIn'), t('auth.alertNoAccount'));
      } else {
        showAlert('Could not send reset', error?.message ?? 'Try again later.');
      }
    }
  };

  const handleBiometricLogin = async () => {
    if (!hasStoredCreds || isExpoGo) return;
    setLoading(true);
    try {
      const LA = require('expo-local-authentication');
      const { success } = await LA.authenticateAsync({ promptMessage: t('auth.signIn') + ' — OrbTap' });
      if (!success) {
        setLoading(false);
        return;
      }
      const creds = await getBiometricCreds();
      if (!creds) {
        setLoading(false);
        return;
      }
      await signInWithEmailAndPassword(auth, creds.email, creds.password);
      router.replace('/' as any);
    } catch (error: any) {
      showAlert(t('auth.alertCouldNotSignIn'), t('auth.alertTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LandingVideoBackground />
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.replace('/' as any)} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.backBtnText}>{t('common.back')}</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : (Platform.OS === 'ios' ? 'padding' : 'height')} style={styles.content}>
        <View style={styles.glassCard}>
        <Animated.View entering={FadeInUp.duration(600)} style={styles.logoSection}>
          <OrbTapLogoMark variant="hero" width={160} height={138} />
          <Text style={[styles.tagline, { color: '#FFFFFF' }]}>{t('auth.tagline')}</Text>
          <View style={[styles.socialProof, { backgroundColor: PREAUTH.surface, borderColor: PREAUTH.surfaceBorder }]}>
            <View style={styles.greenDot} />
            <Text style={[styles.proofText, { color: 'rgba(255,255,255,0.9)' }]}>{t('auth.explorersJoinedToday')}</Text>
          </View>
        </Animated.View>

        {/* Social sign-in — primary path first (UX best practice) */}
        <View style={styles.socialRow}>
          {isGoogleSignInAvailable() && (
            <Animated.View entering={FadeInDown.delay(HERO_STAGGER_MS).duration(400)} style={styles.socialBtnWrap}>
              <TouchableOpacity
                style={[styles.socialBtn, styles.socialBtnGoogle]}
                onPress={() => { dismissBubble(); handleSocialSignIn('google'); }}
                disabled={!!socialLoading}
                accessibilityLabel={t('auth.signInWithGoogle')}
                accessibilityRole="button"
              >
                <Ionicons name="logo-google" size={20} color="#fff" />
                <Text style={styles.socialBtnText}>{socialLoading === 'google' ? '…' : t('auth.signInWithGoogle')}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          {isAppleSignInAvailable() && (
            <Animated.View entering={FadeInDown.delay(HERO_STAGGER_MS * 2).duration(400)} style={styles.socialBtnWrap}>
              <TouchableOpacity
                style={[styles.socialBtn, styles.socialBtnApple]}
                onPress={() => { dismissBubble(); handleSocialSignIn('apple'); }}
                disabled={!!socialLoading}
                accessibilityLabel={t('auth.signInWithApple')}
                accessibilityRole="button"
              >
                <Ionicons name="logo-apple" size={22} color="#fff" />
                <Text style={styles.socialBtnText}>{socialLoading === 'apple' ? '…' : t('auth.signInWithApple')}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
        {(isGoogleSignInAvailable() || isAppleSignInAvailable()) && (
          <Animated.View entering={FadeIn.delay(HERO_STAGGER_MS * 3).duration(300)} style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{t('auth.orContinueWithEmail')}</Text>
            <View style={styles.orLine} />
          </Animated.View>
        )}

        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <Animated.View entering={FadeIn.delay((isGoogleSignInAvailable() || isAppleSignInAvailable()) ? HERO_STAGGER_MS * 4 : 200).duration(400)} style={styles.form}>
          <PreAuthInput
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={(v) => { setEmail(v); if (loginError) setLoginError(null); }}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <PreAuthInput
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={(v) => { setPassword(v); if (loginError) setLoginError(null); }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          {loginError && (
            <Animated.View entering={FadeInDown.duration(250)} style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#ef4444" />
              <Text style={[styles.errorText, { color: '#ef4444' }]}>{loginError}</Text>
            </Animated.View>
          )}

          {showBubble && (
            <Animated.View entering={FadeInDown.duration(400)} exiting={FadeOut.duration(200)} style={styles.bubbleWrap}>
              <TouchableOpacity activeOpacity={1} onPress={dismissBubble} style={styles.bubbleTouch} accessibilityLabel="Dismiss tip" accessibilityRole="button">
                <View style={styles.bubble}>
                  <Text style={[styles.bubbleText, { color: colors.text }]}>{t('auth.tapInTip')}</Text>
                  <Text style={styles.bubbleEmoji}>👇</Text>
                  <View style={styles.bubbleArrow} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {hasStoredCreds && biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={() => { dismissBubble(); handleBiometricLogin(); }}
              disabled={loading}
              accessibilityLabel={Platform.OS === 'ios' ? 'Sign in with Face ID' : 'Sign in with Fingerprint'}
              accessibilityRole="button"
            >
              <Ionicons name={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print'} size={24} color={PREAUTH.primary} />
              <Text style={styles.biometricBtnText}>{t('auth.signInWithBiometric')}</Text>
            </TouchableOpacity>
          )}

          <PrimaryButton
            onPress={() => { Keyboard.dismiss(); dismissBubble(); handleLogin(); }}
            label={loading ? '…' : t('auth.signIn')}
            loading={loading}
            disabled={loading}
            accessibilityLabel="Sign in"
          />

          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => { dismissBubble(); handleForgotPassword(); }}
            accessibilityLabel="Forgot password"
            accessibilityRole="button"
          >
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moreOptionsToggle}
            onPress={() => setShowMoreOptions((v) => !v)}
            accessibilityLabel={showMoreOptions ? 'Hide options' : 'More options'}
            accessibilityRole="button"
          >
            <Ionicons name={showMoreOptions ? 'chevron-up' : 'chevron-down'} size={18} color={PREAUTH.textMuted} />
            <Text style={styles.moreOptionsText}>More options</Text>
          </TouchableOpacity>
          {showMoreOptions && (
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => { setRememberMe((r) => !r); }}
                activeOpacity={0.8}
                accessibilityLabel={rememberMe ? 'Remember me, checked' : 'Remember me, unchecked'}
                accessibilityRole="checkbox"
              >
                <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={20} color={rememberMe ? PREAUTH.primary : PREAUTH.textMuted} />
                <Text style={styles.checkLabel}>{t('auth.rememberMe')}</Text>
              </TouchableOpacity>
              {biometricAvailable && (
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => { setUseBiometric((b) => !b); }}
                  activeOpacity={0.8}
                  accessibilityLabel={useBiometric ? 'Use Face ID or Fingerprint, checked' : 'Use Face ID or Fingerprint, unchecked'}
                  accessibilityRole="checkbox"
                >
                  <Ionicons name={useBiometric ? 'checkbox' : 'square-outline'} size={20} color={useBiometric ? PREAUTH.primary : PREAUTH.textMuted} />
                  <Text style={styles.checkLabel}>{Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={Platform.OS === 'web' ? styles.linkTouchWeb : undefined}
            onPress={() => { dismissBubble(); router.push('/auth/signup'); }}
            accessibilityLabel="Claim your spot, sign up"
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>{t('auth.noAccount')} <Text style={styles.highlight}>{t('auth.claimYourSpot')}</Text></Text>
          </TouchableOpacity>
        </Animated.View>
        </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PREAUTH.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh', width: '100%' } : {}),
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  backBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    zIndex: 1,
    ...(Platform.OS === 'web' ? { maxWidth: 420, alignSelf: 'center' as const, width: '100%' } : {}),
  },
  glassCard: {
    backgroundColor: PREAUTH.surface,
    borderRadius: PREAUTH.radius,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    padding: 24,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          cursor: 'default',
        }
      : {}),
  },
  logoSection: { alignItems: 'center', marginBottom: 28 },
  tagline: { color: '#FFFFFF', letterSpacing: 3, fontSize: 10, marginTop: 16, fontWeight: 'bold' },
  socialProof: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PREAUTH.primary, marginRight: 6 },
  proofText: { fontSize: 10, fontWeight: 'bold' },

  socialRow: { flexDirection: 'column', gap: 12, marginBottom: 8 },
  socialBtnWrap: { width: '100%' },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: PREAUTH.minButtonHeight,
    borderRadius: PREAUTH.radiusButton,
    paddingHorizontal: 20,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  socialBtnGoogle: { backgroundColor: '#4285f4' },
  socialBtnApple: { backgroundColor: '#000' },
  socialBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: PREAUTH.surfaceBorder },
  orText: { color: PREAUTH.textMuted, fontSize: 12, fontWeight: '600' },

  form: { width: '100%', gap: 16 },
  inputWrapper: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  inputWrapperGlass: { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' },
  input: { padding: 18, color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  bubbleWrap: { alignItems: 'center', marginBottom: 6 },
  bubbleTouch: { alignSelf: 'center' },
  bubble: {
    backgroundColor: PREAUTH.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    alignItems: 'center',
    shadowColor: PREAUTH.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bubbleText: { color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  bubbleEmoji: { fontSize: 20, marginTop: 2 },
  bubbleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(30, 38, 58, 0.94)',
    marginTop: 4,
  },

  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginTop: 4,
    borderRadius: PREAUTH.radiusButton,
    borderWidth: 1,
    borderColor: PREAUTH.primary + '66',
    backgroundColor: PREAUTH.primary + '14',
  },
  biometricBtnText: { color: PREAUTH.primary, fontSize: 14, fontWeight: '700' },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginTop: -6,
  },
  errorText: { fontSize: 12, fontWeight: '600', flex: 1 },
  forgotRow: { alignItems: 'center', marginTop: 12 },
  forgotText: { color: PREAUTH.primary, fontSize: 13, fontWeight: '600', ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}) },
  moreOptionsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, paddingVertical: 6 },
  moreOptionsText: { color: PREAUTH.textMuted, fontSize: 12, fontWeight: '600' },
  optionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 10 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  checkLabel: { color: PREAUTH.textSecondary, fontSize: 12, fontWeight: '600' },
  linkTouchWeb: Platform.OS === 'web' ? { cursor: 'pointer' as const } : {},
  linkText: { color: PREAUTH.textMuted, textAlign: 'center', fontSize: 12, marginTop: 20 },
  highlight: { color: PREAUTH.text, fontWeight: 'bold', textDecorationLine: 'underline' },
});
