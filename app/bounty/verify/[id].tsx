/**
 * OrbBounty™ — Partner: verify fulfillment (enter PIN or QR token).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useBountyDetail } from '../../../hooks/useOrbBounty';
import { COLORS } from '../../../constants/Colors';
import * as api from '../../../services/orbBounty';
import { showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

export default function VerifyFulfillmentScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { bounty, loading, error, refresh } = useBountyDetail(id ?? null);
  const [pinOrToken, setPinOrToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleVerify = async () => {
    const bountyId = id ?? '';
    const value = pinOrToken.trim();
    if (!bountyId || !value) {
      showErrorAlert('Information needed', 'Please enter the 6-digit PIN or QR token from the customer.');
      return;
    }
    setSubmitting(true);
    const res = await api.bountyVerifyFulfillment(bountyId, value);
    setSubmitting(false);
    if (res.success) {
      router.replace({ pathname: '/bounty/win/[id]', params: { id: bountyId } } as any);
    } else {
      showErrorAlert(
        'Verification didn’t succeed',
        res.message ?? 'We couldn’t verify this fulfillment. Check the PIN or token and try again.',
      );
    }
  };

  if (loading && !bounty) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="small" color={COLORS.neonBlue?.[0]} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !bounty) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Verify</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.errText, { color: colors.text }]}>{error ?? 'Bounty not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (bounty.status === 'fulfilled') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Verify</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.errText, { color: colors.text }]}>Already verified.</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: themeGold }]}
            onPress={() => router.replace({ pathname: '/bounty/win/[id]', params: { id: bounty.id } } as any)}
          >
            <Text style={styles.primaryBtnText}>View Win Card</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (bounty.status !== 'locked') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Verify</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.errText, { color: colors.text }]}>This bounty is not locked. Ask the customer to accept your bid first.</Text>
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

      <View style={styles.body}>
        <Text style={[styles.bountyTitle, { color: colors.text }]}>{bounty.title}</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Enter the 6-digit PIN or QR token the customer shows you.
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="PIN or token"
          placeholderTextColor={colors.textSecondary}
          value={pinOrToken}
          onChangeText={setPinOrToken}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={64}
        />
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: themeGold }]}
          onPress={handleVerify}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  errText: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  body: { flex: 1, padding: 24 },
  bountyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 14, marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, marginBottom: 20 },
  primaryBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
