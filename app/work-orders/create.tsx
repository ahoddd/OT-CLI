/**
 * OrbOps™ — Request Work: create work order (category, title, description).
 * Entry: partner page "Request Work" or Master Directory → Work Orders → create.
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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useModerationLevel } from '../../hooks/useModerationLevel';
import { moderateContent } from '../../utils/moderation';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { useTheme } from '../../hooks/useTheme';
import { WORK_ORDER_CATEGORY_LABELS, WORK_ORDER_TEMPLATES } from '../../constants/OrbOps';
import type { WorkOrderCategory } from '../../constants/OrbOps';
import { COLORS } from '../../constants/Colors';
import { usePartners } from '../../context/PartnersContext';
import { capitalizeFirstLetter } from '../../utils/capitalizeFirstLetter';
import { safeHaptics } from '../../utils/safeHaptics';
import { showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

const CATEGORIES: WorkOrderCategory[] = ['phoneRepair', 'plumbing', 'cleaning', 'handyman', 'delivery', 'other'];

export default function CreateWorkOrderScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ partnerId?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const moderationLevel = useModerationLevel();
  const { create } = useWorkOrders();
  const partnerIdFromParams = params.partnerId ?? '';
  const { partners } = usePartners();

  const [selectedPartnerId, setSelectedPartnerId] = useState(partnerIdFromParams);
  const partnerId = partnerIdFromParams || selectedPartnerId;

  const [category, setCategory] = useState<WorkOrderCategory>('handyman');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const templatesForCategory = WORK_ORDER_TEMPLATES.filter((t) => t.category === category);

  const handleTemplateSelect = (t: (typeof WORK_ORDER_TEMPLATES)[0]) => {
    setTemplateId(t.id);
    if (!title.trim()) setTitle(t.name);
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    safeHaptics.selectionAsync();
    const t = title.trim();
    const desc = description.trim();
    if (!t) {
      showErrorAlert('Title required', 'Please enter a short title for the work request.');
      return;
    }
    if (moderationLevel !== 'none') {
      const allText = [t, desc].filter(Boolean).join(' ');
      const result = moderateContent(allText, moderationLevel);
      if (!result.passed) {
        showErrorAlert('Content not allowed', result.reason ?? 'This work order contains content that can’t be submitted. Please edit and try again.');
        return;
      }
    }
    if (!partnerId) {
      showErrorAlert('Partner required', 'Choose a partner above, or open a partner page and tap Request Work.');
      return;
    }
    setSubmitting(true);
    const res = await create({
      partnerId,
      category,
      title: t,
      description: description.trim() || undefined,
      intakeTemplateId: templateId,
    });
    setSubmitting(false);
    if (res.success && res.workOrder) {
      router.replace(`/work-orders/${res.workOrder.id}`);
    } else {
      showErrorAlert('Request didn’t complete', res.message ?? 'We couldn’t create the work order. Please try again.');
    }
  };

  if (!flags.isOrbOpsEnabled || !flags.isOrbOpsWorkOrdersEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Request Work</Text>
        </View>
        <Text style={[styles.offText, { color: colors.text }]}>OrbOps is disabled.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Request Work</Text>
      </View>

      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {!partnerIdFromParams && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Partner *</Text>
              <View style={styles.partnerList}>
                {partners.slice(0, 12).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.partnerPill,
                      { borderColor: colors.border, backgroundColor: partnerId === p.id ? (COLORS.neonBlue?.[0] ?? '#60a5fa') + '22' : colors.surface },
                      partnerId === p.id && { borderColor: COLORS.neonBlue?.[0] ?? '#60a5fa' },
                    ]}
                    onPress={() => setSelectedPartnerId(p.id)}
                  >
                    <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                    <Text style={[styles.partnerCategory, { color: colors.textSecondary }]}>{p.category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>Or open a partner from the map and tap Request Work there.</Text>
            </>
          )}

          <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.categoryPill,
                  { borderColor: colors.border, backgroundColor: category === c ? (COLORS.neonBlue?.[0] ?? '#60a5fa') + '22' : colors.surface },
                  category === c && { borderColor: COLORS.neonBlue?.[0] ?? '#60a5fa' },
                ]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.categoryLabel, { color: category === c ? COLORS.neonBlue?.[0] ?? '#60a5fa' : colors.text }]}>
                  {WORK_ORDER_CATEGORY_LABELS[c]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {templatesForCategory.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Quick template (optional)</Text>
              <View style={styles.templateRow}>
                {templatesForCategory.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.templatePill,
                      { borderColor: colors.border, backgroundColor: templateId === t.id ? colors.surface : 'transparent' },
                    ]}
                    onPress={() => handleTemplateSelect(t)}
                  >
                    <Text style={[styles.templateLabel, { color: colors.text }]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={title}
            onChangeText={(t) => setTitle(capitalizeFirstLetter(t))}
            placeholder="e.g. Fix kitchen faucet"
            placeholderTextColor={colors.textSecondary}
            maxLength={80}
            autoCapitalize="sentences"
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={description}
            onChangeText={(t) => setDescription(capitalizeFirstLetter(t))}
            placeholder="Brief details"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: COLORS.success }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitLabel}>Submit request</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  offText: { padding: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  partnerList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  partnerPill: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, maxWidth: '48%' },
  partnerName: { fontSize: 14, fontWeight: '700' },
  partnerCategory: { fontSize: 11, marginTop: 2 },
  hint: { fontSize: 11, marginBottom: 12 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  categoryLabel: { fontSize: 13, fontWeight: '600' },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  templatePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  templateLabel: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  inputArea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitLabel: { color: '#000', fontSize: 16, fontWeight: '800' },
});
