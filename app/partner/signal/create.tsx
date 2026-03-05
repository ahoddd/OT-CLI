/**
 * Partner Orb Signal market creation — Phase 6.
 * Partners create prediction markets about their venue (e.g. "Will we sell out tonight?").
 * Partner pays OT to create (spend sink). Drives engagement.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { partnerCreateOrbSignalMarket } from '../../../services/partnerRevenue';
import { COLORS } from '../../../constants/Colors';
import { PARTNER_TIER_COLORS } from '../../../constants/PartnerTiers';
import { showErrorAlert } from '../../../utils/alert';
import { alert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

const DEFAULT_OUTCOMES = ['Yes', 'No'];

export default function PartnerSignalCreateScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { myPartnerId, myPartner, loading: partnerLoading } = useMyPartner();
  const [question, setQuestion] = useState('');
  const [outcomeA, setOutcomeA] = useState('Yes');
  const [outcomeB, setOutcomeB] = useState('No');
  const [endDays, setEndDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const tierColor = myPartner ? PARTNER_TIER_COLORS[myPartner.tier as keyof typeof PARTNER_TIER_COLORS] : COLORS.neonBlue?.[0] ?? colors.primary;

  const handleCreate = async () => {
    const q = question.trim();
    if (!q) {
      showErrorAlert('Question required', 'Enter a prediction question for your venue.');
      return;
    }
    if (!myPartnerId) {
      showErrorAlert('Partner required', 'Link your business first.');
      return;
    }
    setSubmitting(true);
    try {
      const endAt = Date.now() + endDays * 24 * 60 * 60 * 1000;
      const outcomes = [outcomeA.trim() || 'Yes', outcomeB.trim() || 'No'];
      const res = await partnerCreateOrbSignalMarket({
        partnerId: myPartnerId,
        question: q.slice(0, 200),
        outcomes: outcomes.length >= 2 ? outcomes : DEFAULT_OUTCOMES,
        endAt,
      });
      if (res.success && res.id) {
        alert(
          'Market created',
          'Your Orb Signal market is live. Users can vote with OT Points. Correct forecasts earn bonus OT.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        showErrorAlert('Create failed', res.message ?? 'Please try again.');
      }
    } catch (e) {
      showErrorAlert('Create failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (partnerLoading || !myPartnerId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Signal market</Text>
        </View>
        <View style={styles.placeholder}>
          <ActivityIndicator size="small" color={tierColor} />
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: tierColor + '50' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Signal market</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, { backgroundColor: tierColor + '18', borderColor: tierColor + '44' }]}>
            <View style={[styles.heroIcon, { backgroundColor: tierColor + '30' }]}>
              <Ionicons name="megaphone" size={28} color={tierColor} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Orb Signal market</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              Create a prediction market about your venue. Users vote with OT Points. Great for “Will we sell out tonight?” or “Will we hit 100 scans this week?”
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Question</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. Will we sell out tonight?"
            placeholderTextColor={colors.textSecondary}
            value={question}
            onChangeText={setQuestion}
            maxLength={200}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Outcomes (e.g. Yes / No)</Text>
          <View style={styles.outcomeRow}>
            <TextInput
              style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Yes"
              placeholderTextColor={colors.textSecondary}
              value={outcomeA}
              onChangeText={setOutcomeA}
              maxLength={50}
            />
            <TextInput
              style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="No"
              placeholderTextColor={colors.textSecondary}
              value={outcomeB}
              onChangeText={setOutcomeB}
              maxLength={50}
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Closes in (days)</Text>
          <View style={styles.daysRow}>
            {[1, 3, 7].map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dayChip,
                  { backgroundColor: endDays === d ? tierColor + '35' : colors.surface, borderColor: endDays === d ? tierColor : colors.border },
                ]}
                onPress={() => setEndDays(d)}
              >
                <Text style={[styles.dayChipText, { color: endDays === d ? colors.text : colors.textSecondary }]}>{d} day{d > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: tierColor }]}
            onPress={handleCreate}
            disabled={submitting}
            activeOpacity={0.88}
          >
            {submitting ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.ctaText}>Create market</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  placeholderText: { fontSize: 14 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  hero: { padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  heroIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heroTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  heroSub: { fontSize: 13, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  outcomeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputHalf: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  daysRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  dayChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  dayChipText: { fontSize: 14, fontWeight: '600' },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
