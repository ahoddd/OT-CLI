import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
  Keyboard,
} from 'react-native';
import { alert as showAlert } from '../../utils/alert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { OrbTapLogoMark } from '../../components/OrbTapLogoMark';
import { PREAUTH } from '../../constants/PreAuthTheme';
import { SPACE, RADIUS, TYPE } from '../../constants/DesignTokens';
import { LandingVideoBackground } from '../../components/LandingVideoBackground';
import { PrimaryButton, PreAuthInput } from '../../components/preauth';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import {
  signUpWithEmailAndSendVerification,
  initializeUserProfileCallable,
} from '../../services/emailVerification';
import { recordTermsAcceptance } from '../../services/termsAcceptance';
import { recordReferredBy } from '../../services/userReferral';
import { setRoleFromInvite } from '../../services/adminInvite';
import { auth } from '../../firebaseConfig';
import { logSignupComplete } from '../../services/analytics';
import { MINIMUM_AGE } from '../../constants/AppConfig';
import { useWebTitle } from '../../hooks/useWebTitle';
import { useI18n } from '../../context/I18nContext';
import { signInWithGoogle, signInWithApple, ensureSocialUserProfile, handleAppleRedirectResult, isGoogleSignInAvailable, isAppleSignInAvailable } from '../../services/socialAuth';
import { HERO_STAGGER_MS } from '../../constants/DesignTokens';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1909 }, (_, i) => CURRENT_YEAR - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const PICKER_ITEM_HEIGHT = 44;
const PICKER_COLUMN_HEIGHT = 200;

/** Returns age in years. Invalid date returns 0. */
function getAgeFromBirthDate(year: number, month: number, day: number): number {
  const birth = new Date(year, month - 1, day);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatBirthday(month: number, day: number, year: number): string {
  if (!month || !day || !year) return '';
  const m = MONTHS[month - 1] ?? '';
  return `${m} ${day}, ${year}`;
}

type PasswordStrength = 'weak' | 'medium' | 'strong' | 'empty';
function getPasswordStrength(pwd: string): PasswordStrength {
  if (!pwd) return 'empty';
  if (pwd.length < 6) return 'weak';
  const hasNumber = /\d/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const variety = [hasNumber, hasUpper, hasLower, hasSpecial].filter(Boolean).length;
  if (pwd.length >= 10 && variety >= 2) return 'strong';
  if (pwd.length >= 6 && (variety >= 1 || pwd.length >= 8)) return 'medium';
  return 'weak';
}

export default function SignupScreen() {
  useWebTitle('Create account');
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ invite?: string }>();
  const inviteCode = typeof params.invite === 'string' ? params.invite.trim() : '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [birthMonth, setBirthMonth] = useState(0);
  const [birthDay, setBirthDay] = useState(0);
  const [birthYear, setBirthYear] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [birthdayModalVisible, setBirthdayModalVisible] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSocialSignUp = useCallback(async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    try {
      const result = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      if (!result.success) {
        if (result.message?.includes('Redirecting')) return;
        showAlert('Sign-up failed', result.message);
        return;
      }
      await ensureSocialUserProfile(result.credential);
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/auth/onboarding' as any);
    } catch (e: any) {
      showAlert('Sign-up failed', e?.message ?? 'Try again.');
    } finally {
      setSocialLoading(null);
    }
  }, [router]);

  // Web: complete Apple sign-in after redirect from Firebase handler
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    handleAppleRedirectResult().then((credential) => {
      if (cancelled || !credential) return;
      ensureSocialUserProfile(credential).then(() => {
        if (!cancelled) {
          safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/auth/onboarding' as any);
        }
      }).catch(() => {});
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [router]);

  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  const hasBirthday = birthMonth >= 1 && birthDay >= 1 && birthYear >= 1900;
  const birthdayLabel = hasBirthday ? formatBirthday(birthMonth, birthDay, birthYear) : t('auth.selectBirthday');

  // Debounced username availability check
  const handleUsernameChange = useCallback((val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
    setUsername(cleaned);
    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    if (cleaned.length < 3) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    usernameCheckRef.current = setTimeout(async () => {
      try {
        const q = query(collection(db, 'users'), where('username', '==', cleaned), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          setUsernameStatus('available');
          safeHaptics.selectionAsync();
        } else {
          setUsernameStatus('taken');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);
  }, []);

  // Email format validation on blur
  const handleEmailBlur = useCallback(() => {
    if (!email.trim()) { setEmailError(null); return; }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!valid) {
      setEmailError('Enter a valid email address');
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setEmailError(null);
    }
  }, [email]);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !username.trim()) {
      showAlert(t('auth.alertOops'), t('auth.alertMissingFields'));
      return;
    }
    if (!hasBirthday) {
      showAlert(t('auth.alertBirthdayRequired'), t('auth.mustBeAge', { age: MINIMUM_AGE }));
      return;
    }
    const age = getAgeFromBirthDate(birthYear, birthMonth, birthDay);
    if (age < MINIMUM_AGE) {
      showAlert(
        t('auth.alertMinimumAge'),
        t('auth.alertMinimumAgeMessage', { age: String(MINIMUM_AGE) })
      );
      return;
    }
    if (!ageConfirmed) {
      showAlert(t('auth.alertMinimumAge'), t('auth.alertConfirmAge', { age: String(MINIMUM_AGE) }));
      return;
    }
    if (!agreedToTerms) {
      showAlert(t('auth.alertOops'), t('auth.alertTermsRequired'));
      return;
    }
    if (password.length < 6) {
      showAlert(t('auth.alertOops'), t('auth.alertPasswordMin'));
      return;
    }
    if (password !== confirmPassword) {
      showAlert(t('auth.alertOops'), t('auth.alertPasswordsDontMatch'));
      return;
    }
    setLoading(true);
    try {
      const result = await signUpWithEmailAndSendVerification(
        email.trim(),
        password,
        username.trim(),
        { year: birthYear, month: birthMonth, day: birthDay }
      );
      if (!result.success) {
        showAlert(t('auth.alertSignupFailed'), result.message ?? t('auth.alertTryAgain'));
        setLoading(false);
        return;
      }
      const initResult = await initializeUserProfileCallable(username.trim(), birthYear);
      if (!initResult.success) {
        showAlert(t('auth.alertOops'), initResult.message ?? t('auth.alertTryAgain'));
      }
      const uid = auth.currentUser?.uid;
      if (uid) {
        await recordTermsAcceptance(uid);
        if (inviteCode) {
          await recordReferredBy(uid, inviteCode);
          await setRoleFromInvite(inviteCode);
        }
      }
      logSignupComplete();
      showAlert(t('auth.alertAccountCreated'), t('auth.alertAccountCreatedMessage'));
      router.replace('/auth/onboarding' as any);
    } catch (e: any) {
      showAlert(t('auth.alertOops'), e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.replace('/' as any);

  const confirmBirthday = () => {
    if (birthMonth >= 1 && birthMonth <= 12 && birthDay >= 1 && birthDay <= 31 && birthYear >= 1900 && birthYear <= CURRENT_YEAR) {
      setBirthdayModalVisible(false);
    }
  };

  // When modal opens, scroll each column so the selected value is in view
  useEffect(() => {
    if (!birthdayModalVisible) return;
    const t = setTimeout(() => {
      const my = birthMonth >= 1 ? (birthMonth - 1) * PICKER_ITEM_HEIGHT : 0;
      const dy = birthDay >= 1 ? (birthDay - 1) * PICKER_ITEM_HEIGHT : 0;
      const yrIndex = YEARS.indexOf(birthYear);
      const yy = yrIndex >= 0 ? yrIndex * PICKER_ITEM_HEIGHT : 0;
      monthScrollRef.current?.scrollTo({ y: Math.max(0, my - PICKER_COLUMN_HEIGHT / 2 + PICKER_ITEM_HEIGHT / 2), animated: false });
      dayScrollRef.current?.scrollTo({ y: Math.max(0, dy - PICKER_COLUMN_HEIGHT / 2 + PICKER_ITEM_HEIGHT / 2), animated: false });
      yearScrollRef.current?.scrollTo({ y: Math.max(0, yy - PICKER_COLUMN_HEIGHT / 2 + PICKER_ITEM_HEIGHT / 2), animated: false });
    }, 100);
    return () => clearTimeout(t);
  }, [birthdayModalVisible, birthMonth, birthDay, birthYear]);

  return (
    <View style={styles.container}>
      <LandingVideoBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backBtnLabel}>{t('common.back')}</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.glassCard}>
          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
            <OrbTapLogoMark variant="hero" width={72} height={62} />
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.signupSubtitle', { age: String(MINIMUM_AGE) })}
            </Text>
            {inviteCode ? (
              <View style={styles.inviteBanner}>
                <Ionicons name="gift" size={18} color={PREAUTH.primary} />
                <Text style={styles.inviteBannerText}>{t('auth.inviteBannerText')}</Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Social sign-up — primary path first */}
          <View style={styles.socialRow}>
            {isGoogleSignInAvailable() && (
              <Animated.View entering={FadeInDown.delay(HERO_STAGGER_MS).duration(400).springify()} style={styles.socialBtnWrap}>
                <TouchableOpacity
                  style={[styles.socialBtn, styles.socialBtnGoogle]}
                  onPress={() => handleSocialSignUp('google')}
                  disabled={!!socialLoading}
                  accessibilityLabel={t('auth.signUpWithGoogle')}
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-google" size={20} color="#fff" />
                  <Text style={styles.socialBtnText}>{socialLoading === 'google' ? '…' : t('auth.signUpWithGoogle')}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            {isAppleSignInAvailable() && (
              <Animated.View entering={FadeInDown.delay(HERO_STAGGER_MS * 2).duration(400).springify()} style={styles.socialBtnWrap}>
                <TouchableOpacity
                  style={[styles.socialBtn, styles.socialBtnApple]}
                  onPress={() => handleSocialSignUp('apple')}
                  disabled={!!socialLoading}
                  accessibilityLabel={t('auth.signUpWithApple')}
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-apple" size={22} color="#fff" />
                  <Text style={styles.socialBtnText}>{socialLoading === 'apple' ? '…' : t('auth.signUpWithApple')}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
          {(isGoogleSignInAvailable() || isAppleSignInAvailable()) && (
            <Animated.View entering={FadeInDown.delay(HERO_STAGGER_MS * 3).duration(300)} style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>{t('auth.orContinueWithEmail')}</Text>
              <View style={styles.orLine} />
            </Animated.View>
          )}

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
            <Animated.View entering={FadeInUp.delay(80).duration(400).springify()}>
              <PreAuthInput label={t('auth.username')} placeholder={t('auth.usernamePlaceholder')} value={username} onChangeText={handleUsernameChange} autoCapitalize="none" autoCorrect={false} maxLength={32} returnKeyType="next" />
              {usernameStatus !== 'idle' && (
                <View style={styles.usernameStatus}>
                  {usernameStatus === 'checking' && <Text style={[styles.usernameStatusText, { color: PREAUTH.textMuted }]}>Checking…</Text>}
                  {usernameStatus === 'available' && <><Ionicons name="checkmark-circle" size={13} color="#22c55e" /><Text style={[styles.usernameStatusText, { color: '#22c55e' }]}>{username} is available</Text></>}
                  {usernameStatus === 'taken' && <><Ionicons name="close-circle" size={13} color="#ef4444" /><Text style={[styles.usernameStatusText, { color: '#ef4444' }]}>Username taken — try another</Text></>}
                </View>
              )}
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(160).duration(400).springify()}>
              <PreAuthInput label={t('auth.email')} placeholder={t('auth.emailPlaceholderSignup')} value={email} onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(null); }} autoCapitalize="none" keyboardType="email-address" returnKeyType="next" onBlur={handleEmailBlur} />
              {emailError && (
                <View style={styles.usernameStatus}>
                  <Ionicons name="alert-circle" size={13} color="#ef4444" />
                  <Text style={[styles.usernameStatusText, { color: '#ef4444' }]}>{emailError}</Text>
                </View>
              )}
            </Animated.View>
            <Text style={[styles.fieldLabel, { color: PREAUTH.textSecondary }]}>{t('auth.passwordMinLabel')}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={PREAUTH.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="next"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={PREAUTH.textSecondary} />
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={[styles.strengthBar, styles.strengthBar1, getPasswordStrength(password) !== 'empty' && (getPasswordStrength(password) === 'weak' ? styles.strengthWeak : getPasswordStrength(password) === 'medium' ? styles.strengthMedium : styles.strengthStrong)]} />
                <View style={[styles.strengthBar, styles.strengthBar2, (getPasswordStrength(password) === 'medium' || getPasswordStrength(password) === 'strong') && (getPasswordStrength(password) === 'strong' ? styles.strengthStrong : styles.strengthMedium)]} />
                <View style={[styles.strengthBar, styles.strengthBar3, getPasswordStrength(password) === 'strong' && styles.strengthStrong]} />
                <Text style={[styles.strengthLabel, getPasswordStrength(password) === 'weak' ? styles.strengthLabelWeak : getPasswordStrength(password) === 'medium' ? styles.strengthLabelMedium : styles.strengthLabelStrong]}>
                  {getPasswordStrength(password) === 'weak' ? t('auth.weak') : getPasswordStrength(password) === 'medium' ? t('auth.medium') : t('auth.strong')}
                </Text>
              </View>
            )}
            <Text style={[styles.fieldLabel, { color: PREAUTH.textSecondary }]}>{t('auth.confirmPassword')}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={PREAUTH.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword((v) => !v)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={PREAUTH.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: PREAUTH.textSecondary }]}>{t('auth.birthday')}</Text>
            <TouchableOpacity
              style={styles.birthdayBtn}
              onPress={() => {
                if (!hasBirthday) {
                  setBirthMonth(1);
                  setBirthDay(1);
                  setBirthYear(CURRENT_YEAR - 25);
                }
                setBirthdayModalVisible(true);
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={PREAUTH.textSecondary} />
              <Text style={[styles.birthdayBtnText, { color: hasBirthday ? PREAUTH.text : PREAUTH.textSecondary }]}>{birthdayLabel}</Text>
              <Ionicons name="chevron-forward" size={16} color={PREAUTH.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.hint, { color: PREAUTH.textMuted }]}>{t('auth.mustBeAgeShort', { age: String(MINIMUM_AGE) })}</Text>

            <View style={[styles.termsRow]}>
              <TouchableOpacity
                style={[styles.checkbox, ageConfirmed && styles.checkboxChecked, Platform.OS === 'web' && styles.cursorPointerWeb]}
                onPress={() => setAgeConfirmed((v) => !v)}
              >
                {ageConfirmed && <Ionicons name="checkmark" size={12} color="#000" />}
              </TouchableOpacity>
              <Text style={[styles.termsText, { color: PREAUTH.text }]}>{t('auth.imAtLeast', { age: String(MINIMUM_AGE) })}</Text>
            </View>
            <View style={[styles.termsRow]}>
              <TouchableOpacity
                style={[styles.checkbox, agreedToTerms && styles.checkboxChecked, Platform.OS === 'web' && styles.cursorPointerWeb]}
                onPress={() => setAgreedToTerms((v) => !v)}
              >
                {agreedToTerms && <Ionicons name="checkmark" size={12} color="#000" />}
              </TouchableOpacity>
              <View style={styles.termsTextWrap}>
                <Text style={[styles.termsText, { color: PREAUTH.text }]}>{t('auth.iAgreeTo')}</Text>
                <TouchableOpacity style={Platform.OS === 'web' ? styles.cursorPointerWeb : undefined} onPress={() => router.push('/legal/terms' as any)}><Text style={styles.termsLink}>{t('auth.terms')}</Text></TouchableOpacity>
                <Text style={[styles.termsText, { color: PREAUTH.text }]}> & </Text>
                <TouchableOpacity style={Platform.OS === 'web' ? styles.cursorPointerWeb : undefined} onPress={() => router.push('/legal/privacy' as any)}><Text style={styles.termsLink}>{t('auth.privacy')}</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            onPress={() => { Keyboard.dismiss(); handleSignUp(); }}
            label={loading ? t('auth.creatingAccount') : t('auth.createAccount')}
            loading={loading}
            disabled={!ageConfirmed || !agreedToTerms || !hasBirthday || loading}
          />
        </View>
      </SafeAreaView>

      <Modal visible={birthdayModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setBirthdayModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('auth.selectBirthdayModal')}</Text>
            <Text style={styles.selectedSummary}>
              {hasBirthday ? t('auth.selectedBirthdaySummary', { date: formatBirthday(birthMonth, birthDay, birthYear) }) : t('auth.tapBirthdayHint')}
            </Text>
            <View style={styles.pickerRow}>
              <ScrollView ref={monthScrollRef} style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, i) => {
                  const selected = birthMonth === i + 1;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, selected && styles.pickerItemSelected]}
                      onPress={() => setBirthMonth(i + 1)}
                    >
                      <Text style={[styles.pickerItemText, selected && styles.pickerItemTextSelected]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.pickerDivider} />
              <ScrollView ref={dayScrollRef} style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {DAYS.map((d) => {
                  const selected = birthDay === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.pickerItem, selected && styles.pickerItemSelected]}
                      onPress={() => setBirthDay(d)}
                    >
                      <Text style={[styles.pickerItemText, selected && styles.pickerItemTextSelected]}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.pickerDivider} />
              <ScrollView ref={yearScrollRef} style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {YEARS.map((y) => {
                  const selected = birthYear === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={[styles.pickerItem, selected && styles.pickerItemSelected]}
                      onPress={() => setBirthYear(y)}
                    >
                      <Text style={[styles.pickerItemText, selected && styles.pickerItemTextSelected]}>{y}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={confirmBirthday}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PREAUTH.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh', width: '100%' } : {}),
  },
  safe: { flex: 1, zIndex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    ...(Platform.OS === 'web' ? { maxWidth: 420, alignSelf: 'center' as const, width: '100%' } : {}),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  backBtnLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  glassCard: {
    backgroundColor: PREAUTH.surface,
    borderRadius: PREAUTH.radius,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    padding: 20,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          cursor: 'default',
        }
      : {}),
  },
  header: { alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4, color: PREAUTH.text },
  subtitle: { fontSize: 12, textAlign: 'center', paddingHorizontal: 12, marginBottom: 4, color: PREAUTH.textSecondary },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: PREAUTH.primary + '18',
    borderWidth: 1,
    borderColor: PREAUTH.primary + '40',
  },
  inviteBannerText: { color: PREAUTH.primary, fontSize: 12, fontWeight: '700', flex: 1 },
  socialRow: { flexDirection: 'column', gap: 10, marginBottom: 8 },
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
  socialBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: PREAUTH.surfaceBorder },
  orText: { color: PREAUTH.textMuted, fontSize: 12, fontWeight: '600' },
  form: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderRadius: PREAUTH.radiusButton,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: PREAUTH.inputBackground,
    borderColor: PREAUTH.inputBorder,
    color: PREAUTH.text,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  strengthBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', flex: 1, maxWidth: 48 },
  strengthBar1: {},
  strengthBar2: {},
  strengthBar3: {},
  strengthWeak: { backgroundColor: PREAUTH.textMuted },
  strengthMedium: { backgroundColor: PREAUTH.primary + '99' },
  strengthStrong: { backgroundColor: PREAUTH.primary },
  strengthLabel: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  strengthLabelWeak: { color: PREAUTH.textMuted },
  strengthLabelMedium: { color: PREAUTH.primary },
  strengthLabelStrong: { color: PREAUTH.primary },
  birthdayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: PREAUTH.radiusButton,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: PREAUTH.inputBackground,
    borderColor: PREAUTH.inputBorder,
  },
  birthdayBtnText: { flex: 1, fontSize: 15 },
  hint: { fontSize: 11, marginTop: 2 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? { cursor: 'default' as const } : {}),
  },
  cursorPointerWeb: Platform.OS === 'web' ? { cursor: 'pointer' as const } : {},
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: PREAUTH.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: PREAUTH.primary, borderColor: PREAUTH.primary },
  termsTextWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  termsText: { fontSize: 12, lineHeight: 18 },
  termsLink: { color: PREAUTH.primary, fontWeight: '700', textDecorationLine: 'underline', fontSize: 12, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: PREAUTH.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: PREAUTH.surfaceBorder,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center', color: PREAUTH.text },
  selectedSummary: { fontSize: 14, textAlign: 'center', marginBottom: 12, color: PREAUTH.textSecondary },
  pickerRow: { flexDirection: 'row', height: PICKER_COLUMN_HEIGHT, marginBottom: 20 },
  pickerColumn: { flex: 1 },
  pickerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },
  usernameStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 2 },
  usernameStatusText: { fontSize: 11, fontWeight: '600' },
  pickerItem: { height: PICKER_ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  pickerItemSelected: { backgroundColor: PREAUTH.primary + '30' },
  pickerItemText: { fontSize: 16, fontWeight: '600', color: PREAUTH.text },
  pickerItemTextSelected: { fontWeight: '800', color: PREAUTH.primary },
  modalDoneBtn: { paddingVertical: 16, borderRadius: PREAUTH.radiusButton, alignItems: 'center', backgroundColor: PREAUTH.primary },
  modalDoneText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
