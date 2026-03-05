/**
 * Admin — Create OrbVote poll. 2–4 options, full customization.
 * Persists to Firestore.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import { KitCard } from '../../../components/ui/KitCard';
import { KitButton } from '../../../components/ui/KitButton';
import { useModerationLevel } from '../../../hooks/useModerationLevel';
import { moderateContent } from '../../../utils/moderation';
import { COLORS } from '../../../constants/Colors';
import { PARTNER_TIER_COLORS } from '../../../constants/PartnerTiers';
import { createPoll } from '../../../services/polls';
import { safeHaptics, Haptics } from '../../../utils/safeHaptics';
import { useI18n } from '../../../context/I18nContext';

const POLL_TYPES: { key: 'sponsored' | 'featured' | 'standard'; label: string; color: string }[] = [
  { key: 'sponsored', label: 'Sponsored', color: '#fbbf24' },
  { key: 'featured', label: 'Featured', color: COLORS.neonBlue?.[0] ?? '#60a5fa' },
  { key: 'standard', label: 'Community', color: COLORS.success ?? '#4ade80' },
];

/** Quick-select colors for admin. Tier colors first (Silver, Gold, Platinum), then other known options. Only admin can set custom color; partner polls always use their account tier. */
const ACCENT_COLORS: { hex: string; label?: string }[] = [
  { hex: PARTNER_TIER_COLORS.silver, label: 'Silver' },
  { hex: PARTNER_TIER_COLORS.gold, label: 'Gold' },
  { hex: PARTNER_TIER_COLORS.platinum, label: 'Platinum' },
  { hex: '#60a5fa', label: 'Blue' },
  { hex: '#4ade80', label: 'Green' },
  { hex: '#f472b6', label: 'Pink' },
  { hex: '#fb923c', label: 'Orange' },
  { hex: '#22d3ee', label: 'Cyan' },
  { hex: '#ef4444', label: 'Red' },
];

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

export default function AdminCreatePollScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const moderationLevel = useModerationLevel();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [partnerName, setPartnerName] = useState('OrbTap');
  const [partnerId, setPartnerId] = useState('');
  const [tagline, setTagline] = useState('');
  const [pollType, setPollType] = useState<'sponsored' | 'featured' | 'standard'>('standard');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0].hex);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    safeHaptics.selectionAsync();
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    safeHaptics.selectionAsync();
    setOptions(options.filter((_, i) => i !== index));
  };

  const setOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
    setError(null);
  };

  const handleCreate = async () => {
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q) {
      setError('Question is required.');
      return;
    }
    if (opts.length < MIN_OPTIONS) {
      setError(`At least ${MIN_OPTIONS} options are required.`);
      return;
    }
    if (opts.length > MAX_OPTIONS) {
      setError(`Maximum ${MAX_OPTIONS} options allowed.`);
      return;
    }
    if (moderationLevel !== 'none') {
      const allText = [q, tagline.trim(), ...opts].filter(Boolean).join(' ');
      const result = moderateContent(allText, moderationLevel);
      if (!result.passed) {
        setError(result.reason ?? 'Poll contains content that cannot be published.');
        return;
      }
    }
    setError(null);
    setSubmitting(true);
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await createPoll({
      question: q,
      options: opts,
      partnerName: partnerName.trim() || 'OrbTap',
      partnerId: partnerId.trim() || undefined,
      type: pollType,
      accentColor: accentColor || undefined,
      tagline: tagline.trim() || undefined,
    });

    setSubmitting(false);
    if (result.success) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      setError(result.error || 'Failed to create poll.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Create poll</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LinearGradient
            colors={[(accentColor || COLORS.neonBlue?.[0]) + '24', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="stats-chart" size={36} color={accentColor || COLORS.neonBlue?.[0]} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>2–4 options, fully customizable</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Polls appear in OrbVote with your chosen accent and type.</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>QUESTION</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={question}
          onChangeText={(t) => { setQuestion(t); setError(null); }}
          placeholder="e.g. What should our next flavor be?"
          placeholderTextColor={colors.textSecondary}
          editable={!submitting}
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>OPTIONS (2–4)</Text>
        {options.map((opt, i) => (
          <View key={i} style={styles.optionRow}>
            <TextInput
              style={[styles.optionInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={opt}
              onChangeText={(v) => setOption(i, v)}
              placeholder={`Option ${i + 1}`}
              placeholderTextColor={colors.textSecondary}
              editable={!submitting}
            />
            <TouchableOpacity
              onPress={() => removeOption(i)}
              disabled={options.length <= MIN_OPTIONS}
              style={[styles.removeBtn, options.length <= MIN_OPTIONS && styles.removeBtnDisabled]}
            >
              <Ionicons name="remove-circle" size={24} color={options.length <= MIN_OPTIONS ? colors.border : COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
        {options.length < MAX_OPTIONS && (
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: colors.border }]}
            onPress={addOption}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.neonBlue?.[0]} />
            <Text style={[styles.addBtnText, { color: COLORS.neonBlue?.[0] }]}>Add option</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>POLL TYPE</Text>
        <View style={styles.typeRow}>
          {POLL_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.typePill,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pollType === t.key && { backgroundColor: t.color + '28', borderColor: t.color },
              ]}
              onPress={() => setPollType(t.key)}
            >
              <View style={[styles.typeDot, { backgroundColor: t.color }]} />
              <Text style={[styles.typeText, { color: pollType === t.key ? t.color : colors.text }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCENT COLOR (admin only)</Text>
        <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Partners' polls always use their account tier (Silver/Gold/Platinum). Only admin can set a custom color.</Text>
        <View style={styles.colorRow}>
          {ACCENT_COLORS.map((c) => (
            <TouchableOpacity
              key={c.hex}
              style={[
                styles.colorDot,
                { backgroundColor: c.hex },
                accentColor === c.hex && styles.colorDotSelected,
              ]}
              onPress={() => setAccentColor(c.hex)}
            >
              {accentColor === c.hex && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TAGLINE (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={tagline}
          onChangeText={setTagline}
          placeholder="Short one-liner under the question"
          placeholderTextColor={colors.textSecondary}
          editable={!submitting}
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PARTNER</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={partnerName}
          onChangeText={setPartnerName}
          placeholder="Business / partner name"
          placeholderTextColor={colors.textSecondary}
          editable={!submitting}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={partnerId}
          onChangeText={setPartnerId}
          placeholder="Partner ID (e.g. p1) for link to profile"
          placeholderTextColor={colors.textSecondary}
          editable={!submitting}
        />

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
            <Text style={[styles.errorText, { color: COLORS.danger }]}>{error}</Text>
          </View>
        ) : null}

        <KitButton
          title="Create poll"
          onPress={handleCreate}
          loading={submitting}
          disabled={submitting}
          style={{ marginTop: SPACE.md }}
        />

        <View style={{ height: SPACE.xxxl }} />
      </ScrollView>
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
  },
  backBtn: { padding: SPACE.sm, marginRight: SPACE.md },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  headerRight: { width: SPACE.xxxl },
  content: { padding: SPACE.base, paddingBottom: SPACE.xxxl },
  heroCard: {
    borderRadius: RADIUS.base,
    borderWidth: 1,
    padding: SPACE.lg,
    alignItems: 'center',
    marginBottom: SPACE.xl,
  },
  heroTitle: { fontSize: 16, fontWeight: '800', marginTop: SPACE.sm },
  heroSub: { fontSize: 13, textAlign: 'center', marginTop: SPACE.xs },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: SPACE.sm },
  sectionHint: { fontSize: 11, marginBottom: SPACE.sm },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.md,
    fontSize: 16,
    marginBottom: SPACE.base,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.md },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.md,
    fontSize: 16,
  },
  removeBtn: { padding: SPACE.xs },
  removeBtnDisabled: { opacity: 0.4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: SPACE.lg,
  },
  addBtnText: { fontSize: 14, fontWeight: '700' },
  typeRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.lg },
  typePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeText: { fontSize: 12, fontWeight: '700' },
  colorRow: { flexDirection: 'row', gap: SPACE.md, marginBottom: SPACE.lg },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.base },
  errorText: { fontSize: 13, fontWeight: '600' },
});
