/**
 * OrbOpportunities — Opportunity detail + Apply (user).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useOpportunityById } from '../../hooks/useOpportunities';
import { useAuth } from '../../context/AuthContext';
import { useCanApply, useApply } from '../../hooks/useOpportunities';
import { OPPORTUNITY_TYPE_LABELS } from '../../constants/Opportunities';
import type { Opportunity } from '../../constants/Opportunities';
import { COLORS } from '../../constants/Colors';
import { showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function compensationLabel(opp: Opportunity): string {
  const c = opp.compensation;
  if (c.type === 'pay_range' && c.payMin != null && c.payMax != null) return `$${c.payMin}–${c.payMax}/hr`;
  if (c.type === 'perk_value' && c.perkValue) return c.perkValue;
  if (c.type === 'fixed' && c.fixedLabel) return c.fixedLabel;
  return 'Contact for details';
}

export default function OpportunityDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const opportunity = useOpportunityById(id ?? null);
  const canApply = useCanApply(user?.uid ?? null);
  const apply = useApply(user?.uid ?? null, () => router.replace('/opportunities/my-applications' as any));
  const [availability, setAvailability] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!id || !opportunity) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Opportunity</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPublished = opportunity.status === 'PUBLISHED';
  const handleApply = async () => {
    if (!user) {
      router.push('/auth/login' as any);
      return;
    }
    if (!canApply) {
      showErrorAlert(
        'Applying restricted',
        'You have too many no-shows in the last 30 days. Applying will be available again later.',
      );
      return;
    }
    setSubmitting(true);
    const res = await apply(opportunity.id, availability.trim() || undefined, note.trim().slice(0, 500) || undefined);
    setSubmitting(false);
    if (res.success) {
      router.push('/opportunities/my-applications' as any);
    } else {
      showErrorAlert('Application didn’t submit', res.message ?? 'We couldn’t submit your application. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{opportunity.title}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.typeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>Type</Text>
          <Text style={[styles.typeValue, { color: colors.text }]}>{OPPORTUNITY_TYPE_LABELS[opportunity.type]}</Text>
        </View>
        <View style={[styles.compRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.compLabel, { color: colors.textSecondary }]}>Compensation</Text>
          <Text style={[styles.compValue, { color: themeGold }]}>{compensationLabel(opportunity)}</Text>
        </View>
        <View style={[styles.metaRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Start</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{formatDate(opportunity.startAt)}</Text>
        </View>
        {opportunity.durationHours != null && (
          <View style={[styles.metaRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Duration</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{opportunity.durationHours} hrs</Text>
          </View>
        )}
        {opportunity.capacity != null && (
          <View style={[styles.metaRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Slots</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{opportunity.capacity}</Text>
          </View>
        )}
        {opportunity.requirementsTags.length > 0 && (
          <View style={[styles.tagsWrap, { borderColor: colors.border }]}>
            <Text style={[styles.tagsLabel, { color: colors.textSecondary }]}>Requirements</Text>
            <Text style={[styles.tagsValue, { color: colors.text }]}>{opportunity.requirementsTags.join(', ')}</Text>
          </View>
        )}

        {isPublished && user && (
          <>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Availability (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Weekends, evenings"
              placeholderTextColor={colors.textSecondary}
              value={availability}
              onChangeText={setAvailability}
              maxLength={200}
            />
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Short note (optional, max 500 chars)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Why you're a good fit"
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              maxLength={500}
              multiline
              numberOfLines={3}
            />
            {!canApply && (
              <Text style={[styles.restrictNote, { color: COLORS.danger }]}>
                Applying is temporarily restricted due to no-show history.
              </Text>
            )}
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: themeGold }, submitting && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={submitting || !canApply}
            >
              <Text style={styles.applyBtnText}>{submitting ? 'Submitting…' : 'Apply'}</Text>
            </TouchableOpacity>
          </>
        )}
        {isPublished && !user && (
          <TouchableOpacity style={[styles.applyBtn, { backgroundColor: themeGold }]} onPress={() => router.push('/auth/login' as any)}>
            <Text style={styles.applyBtnText}>Sign in to apply</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  typeLabel: { fontSize: 12 },
  typeValue: { fontSize: 14, fontWeight: '700' },
  compRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  compLabel: { fontSize: 12 },
  compValue: { fontSize: 14, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  metaLabel: { fontSize: 12 },
  metaValue: { fontSize: 14, fontWeight: '600' },
  tagsWrap: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  tagsLabel: { fontSize: 12, marginBottom: 4 },
  tagsValue: { fontSize: 14 },
  formLabel: { fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 12 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  restrictNote: { fontSize: 12, marginBottom: 12 },
  applyBtn: {
    backgroundColor: COLORS.gold[0],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 14 },
});
