/**
 * OrbOpportunities — Partner create opportunity.
 * Compensation required. Partner acknowledgement (labor/tax compliance).
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
import { useTheme } from '../../../hooks/useTheme';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { useModerationLevel } from '../../../hooks/useModerationLevel';
import { moderateContent } from '../../../utils/moderation';
import { useCreateOpportunity, usePublishOpportunity } from '../../../hooks/useOpportunities';
import { OPPORTUNITY_TYPE_LABELS } from '../../../constants/Opportunities';
import type { OpportunityType, CompensationDisclosure } from '../../../constants/Opportunities';
import { COLORS } from '../../../constants/Colors';
import { alert as alertDialog, showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

const TYPES: OpportunityType[] = ['shift', 'gig', 'event', 'trial', 'apprenticeship', 'part-time', 'full-time'];

export default function PartnerCreateOpportunityScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ partnerId?: string }>();
  const { myPartnerId } = useMyPartner();
  const partnerId = myPartnerId ?? params.partnerId ?? 'p1';
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const moderationLevel = useModerationLevel();
  const insets = useSafeAreaInsets();
  const createOpportunity = useCreateOpportunity(partnerId);
  const publishOpportunity = usePublishOpportunity();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<OpportunityType>('shift');
  const [startDate, setStartDate] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [compType, setCompType] = useState<'pay_range' | 'perk_value'>('pay_range');
  const [payMin, setPayMin] = useState('');
  const [payMax, setPayMax] = useState('');
  const [perkValue, setPerkValue] = useState('');
  const [capacity, setCapacity] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const buildCompensation = (): CompensationDisclosure | null => {
    if (compType === 'pay_range') {
      const min = parseFloat(payMin);
      const max = parseFloat(payMax);
      if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < min) return null;
      return { type: 'pay_range', payMin: min, payMax: max };
    }
    if (compType === 'perk_value' && perkValue.trim()) {
      return { type: 'perk_value', perkValue: perkValue.trim() };
    }
    return null;
  };

  const handlePublish = () => {
    const t = title.trim();
    if (t.length < 3) {
      showErrorAlert('Title too short', 'Title must be at least 3 characters.');
      return;
    }
    if (moderationLevel !== 'none') {
      const result = moderateContent(t, moderationLevel);
      if (!result.passed) {
        showErrorAlert('Content not allowed', result.reason ?? "This opportunity contains content that can't be published. Please edit and try again.");
        return;
      }
    }
    const comp = buildCompensation();
    if (!comp) {
      showErrorAlert('Compensation required', 'Enter a pay range or perk value. OrbTap requires compensation details to be specified.');
      return;
    }
    if (!acknowledged) {
      showErrorAlert('Acknowledgement required', "Please confirm that you're responsible for complying with local labor and tax laws.");
      return;
    }
    const startAt = startDate ? new Date(startDate).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000;
    if (Number.isNaN(startAt) || startAt < Date.now()) {
      showErrorAlert('Invalid start date', 'The start date must be in the future.');
      return;
    }
    const tags = tagsStr.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    const opp = createOpportunity({
      title: t,
      type,
      startAt,
      durationHours: durationHours ? Math.max(0, parseInt(durationHours, 10) || 0) : undefined,
      compensation: comp,
      capacity: capacity ? Math.max(1, parseInt(capacity, 10) || 0) : undefined,
      requirementsTags: tags,
    });
    if (!opp) return;
    setPublishing(true);
    publishOpportunity(opp.id);
    setPublishing(false);
    alertDialog('Opportunity published', 'Your opportunity is now live and visible to members.', [
      { text: 'OK', onPress: () => router.replace({ pathname: '/partner/opportunities', params: { partnerId } } as any) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Create opportunity</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. Weekend Barista"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
        <View style={styles.typeRow}>
          {TYPES.slice(0, 4).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typePill, type === t && { backgroundColor: themeGold }, { borderColor: colors.border }]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typePillText, { color: type === t ? '#000' : colors.text }]}>{OPPORTUNITY_TYPE_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.typeRow}>
          {TYPES.slice(4).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typePill, type === t && { backgroundColor: themeGold }, { borderColor: colors.border }]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typePillText, { color: type === t ? '#000' : colors.text }]}>{OPPORTUNITY_TYPE_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Start date * (e.g. 2025-12-01)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
          value={startDate}
          onChangeText={setStartDate}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (hours, optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="6"
          placeholderTextColor={colors.textSecondary}
          value={durationHours}
          onChangeText={setDurationHours}
          keyboardType="number-pad"
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Compensation * (required for quality applicants)</Text>
        <View style={styles.compRow}>
          <TouchableOpacity
            style={[styles.compPill, compType === 'pay_range' && { backgroundColor: themeGold }, { borderColor: colors.border }]}
            onPress={() => setCompType('pay_range')}
          >
            <Text style={[styles.compPillText, { color: compType === 'pay_range' ? '#000' : colors.text }]}>Pay range</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.compPill, compType === 'perk_value' && { backgroundColor: themeGold }, { borderColor: colors.border }]}
            onPress={() => setCompType('perk_value')}
          >
            <Text style={[styles.compPillText, { color: compType === 'perk_value' ? '#000' : colors.text }]}>Perk / value</Text>
          </TouchableOpacity>
        </View>
        {compType === 'pay_range' && (
          <View style={styles.payRow}>
            <TextInput
              style={[styles.inputSmall, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Min $"
              placeholderTextColor={colors.textSecondary}
              value={payMin}
              onChangeText={setPayMin}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.payDash, { color: colors.textSecondary }]}>–</Text>
            <TextInput
              style={[styles.inputSmall, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Max $"
              placeholderTextColor={colors.textSecondary}
              value={payMax}
              onChangeText={setPayMax}
              keyboardType="decimal-pad"
            />
          </View>
        )}
        {compType === 'perk_value' && (
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. Meal + $150 stipend"
            placeholderTextColor={colors.textSecondary}
            value={perkValue}
            onChangeText={setPerkValue}
          />
        )}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Capacity (slots, optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="5"
          placeholderTextColor={colors.textSecondary}
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="number-pad"
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Requirements (comma or space separated)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="barista, customer service"
          placeholderTextColor={colors.textSecondary}
          value={tagsStr}
          onChangeText={setTagsStr}
        />

        <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>LIVE PREVIEW — How members will see it</Text>
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={2}>
            {title.trim() || 'Your opportunity title'}
          </Text>
          <View style={[styles.previewTypeChip, { backgroundColor: themeGold + '22', borderColor: themeGold + '66' }]}>
            <Text style={[styles.previewTypeText, { color: colors.text }]}>{OPPORTUNITY_TYPE_LABELS[type]}</Text>
          </View>
          {buildCompensation() && (
            <Text style={[styles.previewComp, { color: colors.textSecondary }]}>
              {buildCompensation()?.type === 'pay_range'
                ? `$${payMin || '—'} – $${payMax || '—'}`
                : perkValue.trim() || 'Perk / value'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.ackRow, { borderColor: colors.border }]}
          onPress={() => setAcknowledged((a) => !a)}
        >
          <Ionicons name={acknowledged ? 'checkbox' : 'square-outline'} size={22} color={acknowledged ? COLORS.success : colors.textSecondary} />
          <Text style={[styles.ackText, { color: colors.text }]}>
            You are responsible for complying with local labor and tax laws. OrbTap is a platform for posting opportunities and recording verification receipts.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishBtn, { backgroundColor: themeGold }, publishing && styles.publishBtnDisabled]}
          onPress={handlePublish}
          disabled={publishing}
        >
          <Text style={styles.publishBtnText}>{publishing ? 'Publishing…' : 'Publish opportunity'}</Text>
        </TouchableOpacity>
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
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 14 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  typePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  typePillText: { fontSize: 13, fontWeight: '600' },
  compRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  compPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  compPillText: { fontSize: 13, fontWeight: '600' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  inputSmall: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  payDash: { fontSize: 16 },
  previewLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  previewCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  previewTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  previewTypeChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  previewTypeText: { fontSize: 12, fontWeight: '600' },
  previewComp: { fontSize: 14, marginTop: 10 },
  ackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  ackText: { fontSize: 12, flex: 1 },
  publishBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  publishBtnDisabled: { opacity: 0.7 },
  publishBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
