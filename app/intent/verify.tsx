/**
 * OrbIntent™ — Partner: verify fulfillment (enter PIN or QR token).
 * Only the partner whose offer was accepted can verify; creates Deal Done Card on success.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import * as api from '../../services/orbIntent';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

export default function IntentVerifyScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ intentId?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const [intentId, setIntentId] = useState(params.intentId ?? '');
  const [pinOrToken, setPinOrToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleVerify = async () => {
    const id = intentId.trim();
    const token = pinOrToken.trim();
    if (!id || !token) {
      showErrorAlert('Information needed', 'Please enter the Intent ID and the PIN or QR token from the customer.');
      return;
    }
    setSubmitting(true);
    const res = await api.intentVerifyFulfillment(id, token);
    setSubmitting(false);
    if (res.success) {
      alertDialog('Verified', 'Fulfillment verified. Deal Done Card created.', [
        { text: 'View Deal Card', onPress: () => router.replace({ pathname: '/intent/deal/[cardId]', params: { cardId: res.cardId } } as any) },
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      showErrorAlert(
        'Verification didn’t succeed',
        res.message ?? 'We couldn’t verify this fulfillment. Check the ID and PIN or token, then try again.',
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
          <Text style={[styles.title, { color: colors.text }]}>Verify fulfillment</Text>
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
        <Text style={[styles.title, { color: colors.text }]}>Verify fulfillment</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>As the partner, enter the Intent ID and the PIN or QR token the customer shows you. Only the accepted partner can verify.</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Intent ID</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="Intent document ID"
          placeholderTextColor={colors.textSecondary}
          value={intentId}
          onChangeText={setIntentId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>PIN (6 digits) or QR token</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. 123456 or token string"
          placeholderTextColor={colors.textSecondary}
          value={pinOrToken}
          onChangeText={setPinOrToken}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: COLORS.success }, submitting && styles.submitDisabled]}
          onPress={handleVerify}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>Verify</Text>}
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
  instruction: { fontSize: 14, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  submitBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  offText: { fontSize: 16 },
});
