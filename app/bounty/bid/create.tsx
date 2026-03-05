/**
 * OrbBounty™ — Partner: place a bid on a bounty.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useBountyDetail } from '../../../hooks/useOrbBounty';
import { COLORS } from '../../../constants/Colors';
import { BOUNTY_CATEGORY_LABELS } from '../../../constants/orbBounty';
import * as api from '../../../services/orbBounty';
import { showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

export default function CreateBidScreen() {
  const { t } = useI18n();
  const { bountyId } = useLocalSearchParams<{ bountyId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { bounty, loading: bountyLoading, error: bountyError } = useBountyDetail(bountyId ?? null);
  const [headline, setHeadline] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (bounty?.title) setHeadline(`Deal: ${bounty.title}`);
  }, [bounty?.title]);

  const handleSubmit = async () => {
    const bid = bountyId ?? '';
    if (!bid) return;
    const h = headline.trim();
    if (!h) {
      showErrorAlert('Headline required', 'Please enter a short headline for your bid so the bounty creator knows what you’re offering.');
      return;
    }
    setSubmitting(true);
    const res = await api.bountyBid(bid, {
      headline: h,
      details: details.trim() || '',
      price: price.trim() ? parseFloat(price) : null,
      discount: discount.trim() || null,
    });
    setSubmitting(false);
    if (res.success) {
      router.replace({ pathname: '/bounty/[id]', params: { id: bid } } as any);
    } else {
      showErrorAlert(
        'Bid couldn’t be submitted',
        res.message ?? 'We couldn’t submit your bid. Please try again.',
      );
    }
  };

  if (bountyLoading && !bounty) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={COLORS.neonBlue?.[0]} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading bounty…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (bountyError || !bounty) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Place bid</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>{bountyError ?? 'Bounty not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (bounty.status !== 'open') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Place bid</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>This bounty is no longer open for bids.</Text>
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
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>Bid on bounty</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.bountyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.bountyTitle, { color: colors.text }]}>{bounty.title}</Text>
          <Text style={[styles.bountyMeta, { color: colors.textSecondary }]}>
            {BOUNTY_CATEGORY_LABELS[bounty.category as keyof typeof BOUNTY_CATEGORY_LABELS]} · ${bounty.budget?.min ?? 0}–${bounty.budget?.max ?? 0}
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Headline *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. 20% off lunch for 2"
          placeholderTextColor={colors.textSecondary}
          value={headline}
          onChangeText={setHeadline}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Details</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="What you're offering"
          placeholderTextColor={colors.textSecondary}
          value={details}
          onChangeText={setDetails}
          multiline
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Price (USD)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="Optional"
          placeholderTextColor={colors.textSecondary}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Discount (e.g. 15% off)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="Optional"
          placeholderTextColor={colors.textSecondary}
          value={discount}
          onChangeText={setDiscount}
        />

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: themeGold }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitText}>Submit bid</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16 },
  bountyCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  bountyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  bountyMeta: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
