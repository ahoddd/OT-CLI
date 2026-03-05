/**
 * OrbPass™ — Partner: verify redemption (enter PIN or QR token).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import * as api from '../../services/orbPass';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

export default function OrbPassPartnerVerifyScreen() {
  const { t } = useI18n();
  const { redemptionId } = useLocalSearchParams<{ redemptionId?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const [redemptionIdLocal, setRedemptionIdLocal] = useState(redemptionId ?? '');
  const [pinOrToken, setPinOrToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const id = redemptionId ?? redemptionIdLocal;

  const handleVerify = async () => {
    const value = pinOrToken.trim();
    if (!id.trim() || !value) {
      showErrorAlert('Information needed', 'Please enter the redemption ID and the 6-digit PIN or token from the customer.');
      return;
    }
    setSubmitting(true);
    const res = await api.orbPassRedemptionVerify(id.trim(), value);
    setSubmitting(false);
    if (res.success) {
      alertDialog('Verified', 'Redemption verified. The customer can complete the redemption from their side.', [{ text: 'OK', onPress: () => router.replace('/orbpass/partner-inbox') }]);
    } else {
      showErrorAlert(
        'Verification didn’t succeed',
        res.message ?? 'We couldn’t verify this redemption. Check the ID and PIN or token, then try again.',
      );
    }
  };

  if (!flags.isOrbPassEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Verify</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.text }]}>OrbPass is disabled.</Text>
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
        <Text style={[styles.title, { color: colors.text }]}>Verify redemption</Text>
      </View>
      <View style={styles.body}>
        {!redemptionId ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Redemption ID</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="From inbox or customer"
              placeholderTextColor={colors.textSecondary}
              value={redemptionIdLocal}
              onChangeText={setRedemptionIdLocal}
              autoCapitalize="none"
            />
          </>
        ) : null}
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Enter the 6-digit PIN or token the customer shows you.</Text>
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
        <TouchableOpacity style={[styles.verifyBtn, { backgroundColor: COLORS.success }]} onPress={handleVerify} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.verifyBtnText}>Verify</Text>}
        </TouchableOpacity>
        {id ? <Text style={[styles.redemptionId, { color: colors.textSecondary }]}>Redemption: {id.slice(0, 8)}…</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  body: { flex: 1, padding: 24 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  hint: { fontSize: 14, marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, marginBottom: 20 },
  verifyBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  verifyBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  redemptionId: { fontSize: 12, marginTop: 16 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16 },
});
