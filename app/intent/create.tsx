/**
 * OrbIntent™ — Create Intent (template-first).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/Colors';
import { INTENT_CATEGORY_LABELS } from '../../constants/orbIntent';
import { computeIntentScore, DEFAULT_ORB_INTENT_CONFIG } from '../../constants/orbIntent';
import * as api from '../../services/orbIntent';
import type { IntentCategory } from '../../constants/orbIntent';
import { showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

const CATEGORIES: IntentCategory[] = ['food', 'retail', 'services', 'nightlife', 'appointment'];

export default function CreateIntentScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { user } = useAuth();
  const [category, setCategory] = useState<IntentCategory>('food');
  const [title, setTitle] = useState('');
  const [budgetMin, setBudgetMin] = useState('10');
  const [budgetMax, setBudgetMax] = useState('50');
  const [radiusMeters, setRadiusMeters] = useState('5000');
  const [offerDeadlineHours, setOfferDeadlineHours] = useState('1');
  const [fulfillmentDeadlineHours, setFulfillmentDeadlineHours] = useState('24');
  const [flexibility, setFlexibility] = useState('0.5');
  const [submitting, setSubmitting] = useState(false);

  if (!flags.isOrbIntentEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Create Intent</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.text }]}>Deal Match is disabled.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const budgetMinNum = Math.max(0, parseFloat(budgetMin) || 0);
  const budgetMaxNum = Math.max(budgetMinNum, parseFloat(budgetMax) || 50);
  const radiusNum = Math.max(500, Math.min(50000, parseInt(radiusMeters, 10) || 5000));
  const offerDeadlineSeconds = Math.max(600, (parseFloat(offerDeadlineHours) || 1) * 3600);
  const fulfillmentDeadlineSeconds = Math.max(offerDeadlineSeconds, (parseFloat(fulfillmentDeadlineHours) || 24) * 3600);
  const flexNum = Math.max(0, Math.min(1, parseFloat(flexibility) || 0.5));
  const config = DEFAULT_ORB_INTENT_CONFIG;
  const intentScore = computeIntentScore({
    budgetMin: budgetMinNum,
    budgetMax: budgetMaxNum,
    category,
    radiusMeters: radiusNum,
    offerDeadlineSeconds,
    constraintCount: 0,
    flexibility: flexNum,
    weights: config.intentScoringWeights,
  });

  const handleSubmit = async () => {
    if (!user) return;
    const t = title.trim();
    if (!t) {
      showErrorAlert('Title required', 'Please enter a short title so partners know what you’re looking for.');
      return;
    }
    if (intentScore < (config.gatingRules.minScoreToRouteToPartners ?? 50)) {
      showErrorAlert(
        'Intent score too low',
        `Your score is ${intentScore}. Adjust budget, radius, or time window to reach at least ${config.gatingRules.minScoreToRouteToPartners} so partners can see your intent.`,
      );
      return;
    }
    setSubmitting(true);
    const res = await api.intentCreate({
      cityId: 'default',
      geo: { lat: 0, lng: 0 },
      radiusMeters: radiusNum,
      category,
      budgetMin: budgetMinNum,
      budgetMax: budgetMaxNum,
      offerDeadlineSeconds,
      fulfillmentDeadlineSeconds,
      flexibility: flexNum,
      privacy: 'public',
      title: t,
      templateData: {},
    });
    setSubmitting(false);
    if (res.success) {
      router.replace({ pathname: '/intent/[id]', params: { id: res.intentId } } as any);
    } else {
      showErrorAlert(
        'Intent couldn’t be created',
        res.message ?? 'We couldn’t post your intent. Please check your connection and try again.',
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Create Intent</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: colors.textSecondary }]}>CATEGORY</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.slice(0, 3).map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryPill, { borderColor: colors.border }, category === c && { backgroundColor: COLORS.neonBlue?.[0] + '30', borderColor: COLORS.neonBlue?.[0] }]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.categoryText, { color: colors.text }]}>{INTENT_CATEGORY_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.categoryRow}>
          {CATEGORIES.slice(3).map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryPill, { borderColor: colors.border }, category === c && { backgroundColor: COLORS.neonBlue?.[0] + '30', borderColor: COLORS.neonBlue?.[0] }]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.categoryText, { color: colors.text }]}>{INTENT_CATEGORY_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>TITLE</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. Lunch for two under $25"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>BUDGET (USD) min – max</Text>
        <View style={styles.row}>
          <TextInput style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="10" value={budgetMin} onChangeText={setBudgetMin} keyboardType="decimal-pad" />
          <TextInput style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="50" value={budgetMax} onChangeText={setBudgetMax} keyboardType="decimal-pad" />
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>RADIUS (m)</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="5000" value={radiusMeters} onChangeText={setRadiusMeters} keyboardType="number-pad" />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Offer deadline (hours) / Fulfillment deadline (hours)</Text>
        <View style={styles.row}>
          <TextInput style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="1" value={offerDeadlineHours} onChangeText={setOfferDeadlineHours} keyboardType="decimal-pad" />
          <TextInput style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="24" value={fulfillmentDeadlineHours} onChangeText={setFulfillmentDeadlineHours} keyboardType="decimal-pad" />
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Intent score: {intentScore} {intentScore < 50 ? '(too low — adjust above)' : ''}</Text>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? colors.primary }, submitting && styles.submitDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Post Intent</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  categoryPill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  categoryText: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  submitBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16 },
});
