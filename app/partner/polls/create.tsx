/**
 * Partner — Create OrbVote poll. Quota from admin config (free vs premium tier).
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../context/AuthContext';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { useEffectiveTier } from '../../../hooks/useEffectiveTier';
import { createPoll } from '../../../services/polls';
import { useModerationLevel } from '../../../hooks/useModerationLevel';
import { moderateContent } from '../../../utils/moderation';
import { useOrbVoteConfig } from '../../../hooks/useOrbVoteConfig';
import { COLORS } from '../../../constants/Colors';
import { PremiumBadge } from '../../../components/PremiumBadge';
import { alert as alertDialog, showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

export default function PartnerCreatePollScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { myPartnerId, myPartner } = useMyPartner();
  const moderationLevel = useModerationLevel();
  const { config: orbVoteQuotas } = useOrbVoteConfig();
  const { isPremium } = useEffectiveTier();
  const quota = isPremium ? orbVoteQuotas.businessPremiumTierPollsPerMonth : orbVoteQuotas.businessFreeTierPollsPerMonth;

  const [question, setQuestion] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');
  const [option4, setOption4] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const q = question.trim();
    const o1 = option1.trim();
    const o2 = option2.trim();
    const o3 = option3.trim();
    const o4 = option4.trim();
    const options = [o1, o2, o3, o4].filter(Boolean);
    if (!q || options.length < 2) {
      showErrorAlert('Information needed', 'Enter a question and at least two options.');
      return;
    }
    if (!myPartnerId) {
      showErrorAlert('Link a business', 'You need a linked business to create a poll. Go to Partner Command and link your business, or apply to get on the map.');
      return;
    }
    if (moderationLevel !== 'none') {
      const result = moderateContent(`${q} ${o1} ${o2} ${o3} ${o4}`, moderationLevel);
      if (!result.passed) {
        showErrorAlert('Content not allowed', result.reason ?? 'This poll contains content that can’t be published. Please edit and try again.');
        return;
      }
    }
    setSubmitting(true);
    const result = await createPoll({
      question: q,
      options,
      partnerName: myPartner?.name ?? 'Partner',
      partnerId: myPartnerId,
      type: 'standard',
    });
    setSubmitting(false);
    if (result.success) {
      alertDialog('Poll created', 'Your poll is live on OrbVote. Users can vote and earn OT Points.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      showErrorAlert('Poll couldn’t be created', result.error ?? 'We couldn’t create the poll. Please try again.');
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
        <View style={[styles.quotaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.quotaRow}>
            <Text style={[styles.quotaLabel, { color: colors.textSecondary }]}>Your quota</Text>
            {isPremium && <PremiumBadge variant="compact" size={16} />}
          </View>
          <Text style={[styles.quotaValue, { color: colors.text }]}>{quota} poll{quota !== 1 ? 's' : ''} per month</Text>
          <Text style={[styles.quotaSub, { color: colors.textSecondary }]}>
            {isPremium ? 'Premium tier' : 'Free tier'}. Admin can change quotas in Admin Hub.
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>QUESTION</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={question}
          onChangeText={setQuestion}
          placeholder="e.g. What should our next special be?"
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>OPTION 1</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={option1}
          onChangeText={setOption1}
          placeholder="First choice"
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>OPTION 2</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={option2}
          onChangeText={setOption2}
          placeholder="Second choice"
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>OPTION 3 (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={option3}
          onChangeText={setOption3}
          placeholder="Third choice"
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>OPTION 4 (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={option4}
          onChangeText={setOption4}
          placeholder="Fourth choice"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>LIVE PREVIEW — How members will see it</Text>
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.previewQuestion, { color: colors.text }]} numberOfLines={2}>
            {question.trim() || 'Your question will appear here'}
          </Text>
          {[option1, option2, option3, option4].map((val, i) => (
            <View key={i} style={[styles.previewOption, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.previewOptionText, { color: colors.text }]} numberOfLines={1}>{val.trim() || `Option ${i + 1}`}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa' }]} onPress={handleCreate} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? 'Creating…' : 'Create poll'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  headerRight: { width: 40 },
  content: { padding: 16, paddingBottom: 40 },
  quotaCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24 },
  quotaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  quotaLabel: { fontSize: 12, fontWeight: '600' },
  quotaValue: { fontSize: 20, fontWeight: '800' },
  quotaSub: { fontSize: 12, marginTop: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16 },
  previewLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  previewQuestion: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  previewOption: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  previewOptionText: { fontSize: 15 },
  submitBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
