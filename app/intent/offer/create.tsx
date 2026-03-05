/**
 * OrbIntent™ — Partner: place offer on an intent.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { COLORS } from '../../../constants/Colors';
import { INTENT_CATEGORY_LABELS, type IntentCategory } from '../../../constants/orbIntent';
import * as api from '../../../services/orbIntent';
import { showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

export default function CreateOfferScreen() {
  const { t } = useI18n();
  const { intentId } = useLocalSearchParams<{ intentId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const [intent, setIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [headline, setHeadline] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState('');
  const [discountText, setDiscountText] = useState('');
  const [valueScore, setValueScore] = useState('50');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (!intentId) return;
    api.intentGet(intentId).then((res) => {
      if (res.success) setIntent(res.intent);
      setLoading(false);
    });
  }, [intentId]);

  const handleSubmit = async () => {
    const id = intentId ?? '';
    if (!id) return;
    const h = headline.trim();
    if (!h) {
      showErrorAlert('Headline required', 'Please enter a short headline for your offer so the customer knows what you’re offering.');
      return;
    }
    setSubmitting(true);
    const res = await api.intentOffer(id, {
      headline: h,
      details: details.trim(),
      price: price.trim() ? parseFloat(price) : null,
      discountText: discountText.trim() || null,
      valueScore: Math.max(0, Math.min(100, parseFloat(valueScore) || 50)),
    });
    setSubmitting(false);
    if (res.success) router.replace({ pathname: '/intent/[id]', params: { id } } as any);
    else showErrorAlert(
      'Offer couldn’t be submitted',
      res.message ?? 'We couldn’t submit your offer. Please try again.',
    );
  };

  if (loading && !intent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={COLORS.neonBlue?.[0]} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading intent…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!intent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Place offer</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>Intent not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (intent.status !== 'open') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Place offer</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>This intent is no longer open for offers.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Place offer</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.intentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.intentTitle, { color: colors.text }]}>{intent.title}</Text>
          <Text style={[styles.intentMeta, { color: colors.textSecondary }]}>
            {INTENT_CATEGORY_LABELS[(intent.category as IntentCategory) ?? 'food']} · ${intent.budget?.min ?? 0}–${intent.budget?.max ?? 0}
          </Text>
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Headline *</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="e.g. 20% off lunch for 2" value={headline} onChangeText={setHeadline} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Details</Text>
        <TextInput style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="What you're offering" value={details} onChangeText={setDetails} multiline />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Price (USD)</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Optional" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Value score (0–100)</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="50" value={valueScore} onChangeText={setValueScore} keyboardType="number-pad" />
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: themeGold }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>Submit offer</Text>}
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
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16 },
  intentCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  intentTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  intentMeta: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
