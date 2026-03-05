/**
 * Partner Apply — Immersive 8-slide wizard experience.
 * Makes business owners feel excited and chosen. Tinder-style progression.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/Colors';
import { submitPartnerApplication, submitAndAutoApprovePartner } from '../services/partnerApplications';
import { useModerationLevel } from '../hooks/useModerationLevel';
import { moderateContent } from '../utils/moderation';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { ShareToSocialSheet } from '../components/ShareToSocialSheet';
import { partnerReferralSharePayload } from '../utils/shareToSocial';
import { useI18n } from '../context/I18nContext';
import {
  SlideProgress,
  CategoryGrid,
  GoalCard,
  SuperpowerChip,
  StatCarousel,
  GOAL_OPTIONS,
  SUPERPOWER_OPTIONS,
  BUSINESS_CATEGORIES,
} from '../components/PartnerApplySlide';

const { width: SCREEN_W } = Dimensions.get('window');
const TOTAL_SLIDES = 8;

export default function PartnerApplyScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ ref?: string }>();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { user } = useAuth();
  const moderationLevel = useModerationLevel();

  // Slide state
  const [slideIndex, setSlideIndex] = useState(0);

  // Form state
  const [category, setCategory] = useState('');
  const [goal, setGoal] = useState('');
  const [superpowers, setSuperpowers] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [description, setDescription] = useState('');
  const [placementInterest, setPlacementInterest] = useState<'featured' | 'sponsored' | 'both'>('featured');
  const [referralCode, setReferralCode] = useState(params.ref || '');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  const goToSlide = (next: number) => {
    setSlideIndex(next);
  };

  const handleNext = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (slideIndex < TOTAL_SLIDES - 1) goToSlide(slideIndex + 1);
  };

  const handleBack = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (slideIndex > 0) goToSlide(slideIndex - 1);
    else router.back();
  };

  const toggleSuperpower = (key: string) => {
    safeHaptics.selectionAsync();
    setSuperpowers(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSubmitting(true);
    try {
      const categoryLabel = BUSINESS_CATEGORIES.find(c => c.key === category)?.label ?? category;
      const descriptionText = `[${categoryLabel}] Goal: ${goal}. Superpowers: ${superpowers.join(', ')}. ${description}`.trim();

      if (moderationLevel !== 'none') {
        const modResult = moderateContent(descriptionText, moderationLevel);
        if (!modResult.passed) {
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        businessName,
        contactName,
        email,
        category: categoryLabel,
        description: descriptionText,
        placementInterest,
        referralCode: referralCode.trim() || undefined,
        userId: user?.uid,
        submittedAt: new Date().toISOString(),
      };

      if (moderationLevel === 'auto_approve') {
        await submitAndAutoApprovePartner(payload);
      } else {
        await submitPartnerApplication(payload);
      }

      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goToSlide(7);
    } catch (err) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const canAdvanceSlide = (): boolean => {
    switch (slideIndex) {
      case 0: return !!category;
      case 1: return !!goal;
      case 2: return superpowers.length > 0;
      case 3: return businessName.trim().length >= 2 && email.includes('@');
      case 4: return description.trim().length >= 20;
      case 5: return !!placementInterest;
      case 6: return true;
      default: return true;
    }
  };

  const renderSlide = () => {
    switch (slideIndex) {
      case 0:
        return (
          <View style={styles.slideContent}>
            <Animated.Text entering={FadeInDown.duration(400)} style={[styles.slideTitle, { color: colors.text }]}>
              What kind of business are you?
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
              We'll personalise your setup around your category.
            </Animated.Text>
            <CategoryGrid
              selected={category}
              onSelect={(key) => {
                safeHaptics.selectionAsync();
                setCategory(key);
                setTimeout(() => handleNext(), 300);
              }}
              accentColor={themeGold}
              colors={colors}
            />
          </View>
        );

      case 1:
        return (
          <View style={styles.slideContent}>
            <Animated.Text entering={FadeInDown.duration(400)} style={[styles.slideTitle, { color: colors.text }]}>
              What&apos;s your biggest goal?
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
              Pick one — we&apos;ll focus your setup around it.
            </Animated.Text>
            {GOAL_OPTIONS.map((opt, i) => (
              <GoalCard
                key={opt.key}
                option={opt}
                selected={goal === opt.key}
                onSelect={() => {
                  safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setGoal(opt.key);
                  setTimeout(() => handleNext(), 350);
                }}
                accentColor={themeGold}
                colors={colors}
                index={i}
              />
            ))}
          </View>
        );

      case 2:
        return (
          <View style={styles.slideContent}>
            <Animated.Text entering={FadeInDown.duration(400)} style={[styles.slideTitle, { color: colors.text }]}>
              Pick your superpower
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
              Select all that interest you — you can change these later.
            </Animated.Text>
            {SUPERPOWER_OPTIONS.map((opt, i) => (
              <SuperpowerChip
                key={opt.key}
                label={opt.label}
                description={opt.description}
                icon={opt.icon}
                selected={superpowers.includes(opt.key)}
                onToggle={() => toggleSuperpower(opt.key)}
                accentColor={themeGold}
                colors={colors}
                index={i}
              />
            ))}
            {superpowers.length > 0 && (
              <Animated.View entering={FadeIn.duration(300)}>
                <TouchableOpacity
                  style={[styles.continueBtn, { backgroundColor: themeGold }]}
                  onPress={handleNext}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueBtnText}>Continue →</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        );

      case 3:
        return (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.slideContent}>
              <Animated.Text entering={FadeInDown.duration(400)} style={[styles.slideTitle, { color: colors.text }]}>
                Tell us about your business
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
                3 quick fields — you&apos;re almost halfway there.
              </Animated.Text>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Business name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="The Corner Roastery"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Your name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="Alex Chen"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@yourbusiness.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {canAdvanceSlide() && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <TouchableOpacity style={[styles.continueBtn, { backgroundColor: themeGold }]} onPress={handleNext} activeOpacity={0.85}>
                    <Text style={styles.continueBtnText}>Continue →</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </KeyboardAvoidingView>
        );

      case 4:
        return (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.slideContent}>
              <Animated.Text entering={FadeInDown.duration(400)} style={[styles.slideTitle, { color: colors.text }]}>
                Describe your vibe
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
                This is your first impression on 12,400+ explorers.
              </Animated.Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.surface, color: colors.text, borderColor: description.length >= 20 ? themeGold : colors.border }]}
                value={description}
                onChangeText={setDescription}
                placeholder="We're the hidden gem of the neighbourhood — craft coffee, no attitude, 2min walk from the light rail..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={[styles.charCount, { color: description.length >= 20 ? themeGold : colors.textSecondary }]}>
                {description.length} / 500 {description.length < 20 ? `(${20 - description.length} more to continue)` : '✓'}
              </Text>
              {canAdvanceSlide() && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <TouchableOpacity style={[styles.continueBtn, { backgroundColor: themeGold }]} onPress={handleNext} activeOpacity={0.85}>
                    <Text style={styles.continueBtnText}>Continue →</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </KeyboardAvoidingView>
        );

      case 5:
        return (
          <View style={styles.slideContent}>
            <Animated.Text entering={FadeInDown.duration(400)} style={[styles.slideTitle, { color: colors.text }]}>
              How did you hear about us?
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
              Choose your placement interest and optional referral.
            </Animated.Text>
            {(['featured', 'sponsored', 'both'] as const).map((opt, i) => {
              const meta = {
                featured: { label: 'Featured Partner', sub: 'Top of Orb hub · Carousel slot', icon: 'star' as keyof typeof Ionicons.glyphMap },
                sponsored: { label: 'Sponsored Ad Spots', sub: 'Orb page, Pulse, Feed · Image ads', icon: 'megaphone' as keyof typeof Ionicons.glyphMap },
                both: { label: 'Featured + Ads', sub: 'Best of both — recommended', icon: 'diamond' as keyof typeof Ionicons.glyphMap },
              }[opt];
              const isSelected = placementInterest === opt;
              return (
                <Animated.View key={opt} entering={FadeInDown.delay(i * 80).duration(400)}>
                  <TouchableOpacity
                    style={[styles.placementCard, { backgroundColor: isSelected ? themeGold + '18' : colors.surface, borderColor: isSelected ? themeGold : colors.border }]}
                    onPress={() => { safeHaptics.selectionAsync(); setPlacementInterest(opt); }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={meta.icon} size={22} color={isSelected ? themeGold : colors.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.placementLabel, { color: isSelected ? themeGold : colors.text }]}>{meta.label}</Text>
                      <Text style={[styles.placementSub, { color: colors.textSecondary }]}>{meta.sub}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={themeGold} />}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
            <Animated.View entering={FadeInDown.delay(280).duration(400)}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, marginTop: 8 }]}
                value={referralCode}
                onChangeText={setReferralCode}
                placeholder="Referral code (optional)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </Animated.View>
            <TouchableOpacity style={[styles.continueBtn, { backgroundColor: themeGold, marginTop: 16 }]} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.continueBtnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        );

      case 6:
        return (
          <View style={styles.slideContent}>
            <Animated.Text entering={FadeInDown.duration(400)} style={[styles.slideTitle, { color: colors.text }]}>
              You&apos;re almost there
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
              Here&apos;s what other business owners say about OrbTap.
            </Animated.Text>
            <StatCarousel accentColor={themeGold} colors={colors} />
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>Your application summary</Text>
              <Text style={[styles.summaryLine, { color: colors.text }]}>📍 {BUSINESS_CATEGORIES.find(c => c.key === category)?.label ?? category}</Text>
              <Text style={[styles.summaryLine, { color: colors.text }]}>🎯 {GOAL_OPTIONS.find(g => g.key === goal)?.label ?? goal}</Text>
              <Text style={[styles.summaryLine, { color: colors.text }]}>⚡ {superpowers.map(s => SUPERPOWER_OPTIONS.find(o => o.key === s)?.label).join(', ')}</Text>
              <Text style={[styles.summaryLine, { color: colors.text }]}>🏢 {businessName}</Text>
            </Animated.View>
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: themeGold, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.continueBtnText}>Submit application ✨</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 7:
        return (
          <View style={styles.slideContent}>
            <Animated.View entering={FadeInDown.duration(500).springify()} style={[styles.successBadge, { backgroundColor: themeGold + '22', borderColor: themeGold }]}>
              <Ionicons name="checkmark-circle" size={56} color={themeGold} />
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(100).duration(400)} style={[styles.successTitle, { color: colors.text }]}>
              Application submitted! ✨
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(180).duration(400)} style={[styles.successSub, { color: colors.textSecondary }]}>
              We review within{' '}
              <Text style={{ color: themeGold, fontWeight: '700' }}>3–5 business days</Text>
              . Check your inbox for a confirmation email.
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(260).duration(400)} style={[styles.prepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.prepTitle, { color: colors.text }]}>What to prepare</Text>
              {[
                'A great cover photo',
                'Your business hours',
                'Your first perk idea (e.g. "Free coffee on your 5th visit")',
              ].map((tip, i) => (
                <View key={i} style={styles.prepRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={themeGold} />
                  <Text style={[styles.prepTip, { color: colors.textSecondary }]}>{tip}</Text>
                </View>
              ))}
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(340).duration(400)}>
              <TouchableOpacity
                style={[styles.continueBtn, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: themeGold }]}
                onPress={() => setShowShareSheet(true)}
                activeOpacity={0.85}
              >
                <Text style={[styles.continueBtnText, { color: themeGold }]}>Share OrbTap while you wait →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
                <Text style={[styles.doneBtnText, { color: colors.textSecondary }]}>Back to app</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name={slideIndex === 0 ? 'close' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        {slideIndex < 7 && (
          <SlideProgress current={slideIndex} total={TOTAL_SLIDES - 1} accentColor={themeGold} trackColor={colors.border} />
        )}
        <View style={{ width: 40 }} />
      </View>

      {/* Slide */}
      <Animated.View key={slideIndex} entering={FadeInDown.duration(350).springify()} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderSlide()}
        </ScrollView>
      </Animated.View>

      <ShareToSocialSheet
        visible={showShareSheet}
        payload={partnerReferralSharePayload(user?.uid ?? '')}
        onClose={() => setShowShareSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  slideContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  slideTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  slideSubtitle: { fontSize: 16, lineHeight: 22, marginBottom: 24 },
  continueBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  continueBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  textarea: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, minHeight: 140, marginBottom: 4 },
  charCount: { fontSize: 12, textAlign: 'right', marginBottom: 16 },
  placementCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 14, marginBottom: 10 },
  placementLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  placementSub: { fontSize: 12 },
  successBadge: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 16, marginTop: 20 },
  successTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  successSub: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  prepCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 10 },
  prepTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  prepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  prepTip: { fontSize: 14, flex: 1, lineHeight: 20 },
  summaryBox: { marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, marginTop: 16 },
  summaryTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryLine: { fontSize: 14 },
  doneBtn: { paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { fontSize: 15 },
});
