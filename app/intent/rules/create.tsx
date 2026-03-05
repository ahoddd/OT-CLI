/**
 * OrbIntent™ — Create rule (minimal form; backend fills schedule/constraints defaults).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../../components/FlagContext';
import { useTheme } from '../../../hooks/useTheme';
import { COLORS } from '../../../constants/Colors';
import { INTENT_CATEGORY_LABELS, type IntentCategory } from '../../../constants/orbIntent';
import * as api from '../../../services/orbIntent';
import { alert as alertDialog, showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

const CATEGORIES: IntentCategory[] = ['food', 'retail', 'services', 'nightlife', 'appointment'];

export default function CreateRuleScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IntentCategory>('food');
  const [cityId, setCityId] = useState('default');
  const [cooldownMinutes, setCooldownMinutes] = useState('60');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const cooldown = Math.max(0, Math.min(10080, parseInt(cooldownMinutes, 10) || 60));
    setSubmitting(true);
    const res = await api.ruleCreate({
      name: name.trim() || 'My rule',
      category,
      cityId: cityId.trim() || 'default',
      schedule: { type: 'daypart', timezone: 'America/New_York', daysOfWeek: [1, 2, 3, 4, 5], startHour: 8, endHour: 10 },
      constraints: {},
      cooldownMinutes: cooldown,
      autoAccept: { enabled: false, graceSeconds: 300, requiresTrusted: true },
      templateData: {},
    });
    setSubmitting(false);
    if (res.success) {
      alertDialog('Rule created', `Rule "${(res.rule?.name ?? name) || 'My rule'}" is active.`, [
        { text: 'Back to Rules', onPress: () => router.replace('/intent') },
        { text: 'OK' },
      ]);
    } else {
      showErrorAlert(
        'Rule couldn’t be created',
        res.message ?? 'We couldn’t save this rule. Please try again.',
      );
    }
  };

  if (!flags.isOrbIntentEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Create rule</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.offText, { color: colors.textSecondary }]}>Deal Match is disabled.</Text>
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
        <Text style={[styles.title, { color: colors.text }]}>Create rule</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. Weekday lunch"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryPill, { borderColor: colors.border }, category === c && { backgroundColor: COLORS.neonBlue?.[0] + '30', borderColor: COLORS.neonBlue?.[0] }]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.categoryText, { color: colors.text }]} numberOfLines={1}>{INTENT_CATEGORY_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>City ID</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="default"
          placeholderTextColor={colors.textSecondary}
          value={cityId}
          onChangeText={setCityId}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Cooldown (minutes)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="60"
          placeholderTextColor={colors.textSecondary}
          value={cooldownMinutes}
          onChangeText={setCooldownMinutes}
          keyboardType="number-pad"
        />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Schedule and constraints use defaults. Edit in Firestore or add more Admin UI to customize.</Text>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? colors.primary }, submitting && styles.submitDisabled]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>Create rule</Text>}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  categoryPill: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  categoryText: { fontSize: 12, fontWeight: '600' },
  hint: { fontSize: 12, marginTop: 16 },
  submitBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  offText: { fontSize: 16 },
});
