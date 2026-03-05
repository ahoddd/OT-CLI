/**
 * Partner Self-Serve Onboarding Wizard — Sprint 15.
 * 3 steps: Profile → First Perk → Activate OrbPilot.
 * "Go live in 10 minutes" headline. Silver tier auto-approved.
 *
 * Entry: from partner-apply.tsx after auto-approval, or from partner dashboard.
 * Param: partnerId (required)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../hooks/useTheme';
import { COLORS } from '../../../constants/Colors';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import { safeHaptics, Haptics } from '../../../utils/safeHaptics';

const STEPS = [
  { id: 'profile', label: 'Profile', icon: 'storefront' as const, headline: 'Tell customers about you' },
  { id: 'perk', label: 'First Perk', icon: 'pricetag' as const, headline: 'Create your first offer' },
  { id: 'orbpilot', label: 'OrbPilot', icon: 'shield-checkmark' as const, headline: 'Activate verified visits' },
] as const;

type StepId = typeof STEPS[number]['id'];

const PERK_PRESETS = [
  { label: '10% off for OrbTap members', icon: 'pricetags' as const },
  { label: 'Free coffee with any purchase', icon: 'cafe' as const },
  { label: 'Happy hour 4–6pm daily', icon: 'time' as const },
  { label: 'Custom offer…', icon: 'create' as const },
];

export default function PartnerOnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const params = useLocalSearchParams<{ partnerId?: string }>();
  const partnerId = params.partnerId ?? '';

  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — profile
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 — first perk
  const [perkPreset, setPerkPreset] = useState<string | null>(null);
  const [perkCustom, setPerkCustom] = useState('');
  const [perkPoints, setPerkPoints] = useState('50');

  // Step 3 — OrbPilot
  const [orbPilotBudget, setOrbPilotBudget] = useState('50');
  const [orbPilotActivated, setOrbPilotActivated] = useState(false);

  const currentStep = STEPS[stepIdx]!;
  const isLastStep = stepIdx === STEPS.length - 1;

  const progress = (stepIdx + 1) / STEPS.length;
  const progressAnim = useSharedValue(progress);
  useEffect(() => {
    progressAnim.value = withSpring(progress, { damping: 18, stiffness: 120 });
  }, [progress]);
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%` as any,
  }));

  async function handleProfileSave() {
    if (!description.trim()) { setError('Please describe your business.'); return; }
    setLoading(true);
    setError('');
    try {
      if (partnerId) {
        await updateDoc(doc(db, 'partners', partnerId), {
          description: description.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          onboardingStep: 1,
          updatedAt: serverTimestamp(),
        });
      }
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStepIdx(1);
    } catch (e: any) {
      setError(e?.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePerkSave() {
    const perkTitle = perkPreset === 'Custom offer…' ? perkCustom.trim() : perkPreset;
    if (!perkTitle) { setError('Please select or enter a perk offer.'); return; }
    setLoading(true);
    setError('');
    try {
      if (partnerId) {
        await addDoc(collection(db, 'partners', partnerId, 'perks'), {
          title: perkTitle,
          pointsCost: parseInt(perkPoints, 10) || 50,
          active: true,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'partners', partnerId), {
          onboardingStep: 2,
          updatedAt: serverTimestamp(),
        });
      }
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStepIdx(2);
    } catch (e: any) {
      setError(e?.message || 'Failed to create perk. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOrbPilotActivate() {
    setLoading(true);
    setError('');
    try {
      const budget = parseInt(orbPilotBudget, 10) || 50;
      if (partnerId) {
        await addDoc(collection(db, 'orbPilotCampaigns'), {
          partnerId,
          ownerUid: user?.uid,
          budget,
          cpaPerVisit: 3,
          status: 'active',
          objective: 'fill_rate',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isQuickStart: true,
        });
        await updateDoc(doc(db, 'partners', partnerId), {
          onboardingStep: 3,
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        });
      }
      setOrbPilotActivated(true);
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.message || 'Failed to activate OrbPilot. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleFinish() {
    router.replace({ pathname: '/partner/dashboard' } as any);
  }

  function handleSkipOrbPilot() {
    if (partnerId) {
      updateDoc(doc(db, 'partners', partnerId), { onboardingComplete: true, updatedAt: serverTimestamp() }).catch(() => {});
    }
    router.replace({ pathname: '/partner/dashboard' } as any);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#040408' : '#f6f6fa' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {stepIdx > 0 && !orbPilotActivated && (
          <TouchableOpacity onPress={() => setStepIdx((p) => p - 1)} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Partner Setup</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Go live in 10 minutes</Text>
        </View>
        {!orbPilotActivated && isLastStep && (
          <TouchableOpacity onPress={handleSkipOrbPilot} hitSlop={12}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressFill, progressBarStyle, { backgroundColor: themeGold }]} />
      </View>

      {/* Step indicators */}
      <View style={styles.stepRow}>
        {STEPS.map((s, i) => (
          <View key={s.id} style={styles.stepDot}>
            <View style={[
              styles.dotCircle,
              {
                backgroundColor: i < stepIdx ? themeGold : i === stepIdx ? themeGold + 'CC' : colors.border,
                borderColor: i <= stepIdx ? themeGold : colors.border,
              },
            ]}>
              {i < stepIdx
                ? <Ionicons name="checkmark" size={14} color="#000" />
                : <Ionicons name={s.icon} size={14} color={i === stepIdx ? '#000' : colors.textSecondary} />
              }
            </View>
            <Text style={[styles.dotLabel, { color: i <= stepIdx ? themeGold : colors.textSecondary }]} numberOfLines={1}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Step headline */}
          <Animated.Text entering={FadeInDown.duration(350)} style={[styles.stepHeadline, { color: colors.text }]}>
            {currentStep.headline}
          </Animated.Text>

          {/* ── STEP 1: Profile ── */}
          {stepIdx === 0 && (
            <Animated.View entering={FadeInRight.duration(300)} style={styles.stepBody}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Business description *</Text>
              <TextInput
                style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={description}
                onChangeText={setDescription}
                placeholder="What makes your place special? Tell customers in 2–3 sentences."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={400}
              />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={address}
                onChangeText={setAddress}
                placeholder="123 Main St, City"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: themeGold }]}
                onPress={handleProfileSave}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Text style={styles.ctaBtnText}>Save & Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="#000" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── STEP 2: First Perk ── */}
          {stepIdx === 1 && (
            <Animated.View entering={FadeInRight.duration(300)} style={styles.stepBody}>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                Pick a quick-start offer. You can customise or add more from your dashboard.
              </Text>
              {PERK_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={[
                    styles.presetRow,
                    {
                      borderColor: perkPreset === p.label ? themeGold : colors.border,
                      backgroundColor: perkPreset === p.label ? themeGold + '18' : colors.surface,
                    },
                  ]}
                  onPress={() => { setPerkPreset(p.label); safeHaptics.selectionAsync(); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name={p.icon} size={20} color={perkPreset === p.label ? themeGold : colors.textSecondary} />
                  <Text style={[styles.presetLabel, { color: perkPreset === p.label ? themeGold : colors.text }]}>{p.label}</Text>
                  {perkPreset === p.label && <Ionicons name="checkmark-circle" size={20} color={themeGold} />}
                </TouchableOpacity>
              ))}
              {perkPreset === 'Custom offer…' && (
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={perkCustom}
                  onChangeText={setPerkCustom}
                  placeholder="e.g. Free side dish with main course"
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                />
              )}
              <View style={styles.pointsRow}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>OT Points cost</Text>
                <TextInput
                  style={[styles.pointsInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={perkPoints}
                  onChangeText={setPerkPoints}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: themeGold }]}
                onPress={handlePerkSave}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Text style={styles.ctaBtnText}>Create Perk & Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="#000" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── STEP 3: OrbPilot ── */}
          {stepIdx === 2 && !orbPilotActivated && (
            <Animated.View entering={FadeInRight.duration(300)} style={styles.stepBody}>
              <LinearGradient
                colors={['#1a0f2e', '#0f0f1a']}
                style={styles.orbPilotCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="shield-checkmark" size={36} color="#7C3AED" style={{ marginBottom: SPACE.sm }} />
                <Text style={styles.orbPilotTitle}>OrbPilot™ Quick Start</Text>
                <Text style={styles.orbPilotSub}>
                  Pay only when customers show up. OrbPilot automatically fills your slow hours with verified visits.
                  Default: $3 per verified visit.
                </Text>
                <View style={styles.orbPilotStats}>
                  {[
                    { label: 'Avg ROI', value: '4.2×' },
                    { label: 'Cost/visit', value: '$3.00' },
                    { label: 'Setup time', value: '< 1 min' },
                  ].map((s) => (
                    <View key={s.label} style={styles.orbPilotStat}>
                      <Text style={styles.orbPilotStatVal}>{s.value}</Text>
                      <Text style={styles.orbPilotStatLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Monthly budget ($)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={orbPilotBudget}
                onChangeText={setOrbPilotBudget}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                You won't be charged until a visit is verified. Pause or cancel any time from your dashboard.
              </Text>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: '#7C3AED' }]}
                onPress={handleOrbPilotActivate}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="flash" size={18} color="#fff" />
                    <Text style={[styles.ctaBtnText, { color: '#fff' }]}>Activate OrbPilot</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── COMPLETE ── */}
          {orbPilotActivated && (
            <Animated.View entering={FadeInDown.duration(400)} style={[styles.stepBody, styles.completeBlock]}>
              <View style={styles.completeTick}>
                <Ionicons name="checkmark-circle" size={72} color={themeGold} />
              </View>
              <Text style={[styles.completeTitle, { color: colors.text }]}>You're live! 🎉</Text>
              <Text style={[styles.completeSub, { color: colors.textSecondary }]}>
                Your profile, first perk, and OrbPilot campaign are all active.
                Customers can now discover and visit your venue to earn OT Points.
              </Text>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: themeGold }]}
                onPress={handleFinish}
                activeOpacity={0.88}
              >
                <Text style={styles.ctaBtnText}>Go to Dashboard</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </TouchableOpacity>
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
    minHeight: 56,
    gap: SPACE.sm,
  },
  backBtn: { padding: SPACE.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  skipText: { fontSize: 14, fontWeight: '600' },
  progressBg: { height: 3, width: '100%' },
  progressFill: { height: 3, borderRadius: 2 },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE.xxl,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.base,
  },
  stepDot: { alignItems: 'center', gap: SPACE.xs, flex: 1 },
  dotCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dotLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  content: { padding: SPACE.base, gap: SPACE.base, paddingBottom: 60 },
  stepHeadline: { fontSize: 22, fontWeight: '900', marginBottom: SPACE.sm },
  stepBody: { gap: SPACE.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: SPACE.xs },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.md,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.md,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hintText: { fontSize: 13, lineHeight: 19 },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  presetLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.base,
  },
  pointsInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.sm,
    fontSize: 16,
    fontWeight: '700',
    width: 90,
    textAlign: 'center',
  },
  orbPilotCard: {
    borderRadius: RADIUS.lg,
    padding: SPACE.xl,
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  orbPilotTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: SPACE.sm },
  orbPilotSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: SPACE.lg },
  orbPilotStats: { flexDirection: 'row', gap: SPACE.xxl },
  orbPilotStat: { alignItems: 'center' },
  orbPilotStatVal: { color: '#7C3AED', fontSize: 20, fontWeight: '900' },
  orbPilotStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.base,
    marginTop: SPACE.sm,
    minHeight: 52,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  completeBlock: { alignItems: 'center', paddingTop: SPACE.xxl },
  completeTick: { marginBottom: SPACE.lg },
  completeTitle: { fontSize: 28, fontWeight: '900', marginBottom: SPACE.sm },
  completeSub: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: SPACE.lg },
});
