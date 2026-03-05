/**
 * OrbPass™ — Offer detail: Redeem with OrbPass CTA.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../../components/FlagContext';
import { useTheme } from '../../../hooks/useTheme';
import { COLORS } from '../../../constants/Colors';
import * as api from '../../../services/orbPass';
import { showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

export default function OrbPassOfferDetailScreen() {
  const { t } = useI18n();
  const { id, partnerId, partnerName, title, valueCents } = useLocalSearchParams<{ id: string; partnerId: string; partnerName: string; title: string; valueCents: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const [submitting, setSubmitting] = useState(false);

  const value = Math.max(0, parseInt(valueCents ?? '0', 10));

  const handleRedeem = async () => {
    if (!flags.isOrbPassEnabled) return;
    setSubmitting(true);
    const res = await api.orbPassRedemptionInitiate({
      partnerId: partnerId ?? '',
      offerTemplateId: id ?? null,
      valueCents: value,
      cityId: 'default',
    });
    setSubmitting(false);
    if (res.success) {
      router.push({ pathname: '/orbpass/redeem/[redemptionId]', params: { redemptionId: res.redemptionId, pin: res.pin, qrToken: res.qrToken } } as any);
    } else {
      showErrorAlert(
        'Redemption couldn’t be started',
        res.message ?? 'We couldn’t start this redemption. Please try again or check that the offer is still valid.',
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
          <Text style={[styles.title, { color: colors.text }]}>Offer</Text>
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
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>Offer</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title ?? 'OrbPass offer'}</Text>
          <Text style={[styles.cardPartner, { color: colors.textSecondary }]}>{partnerName ?? partnerId}</Text>
          <Text style={[styles.cardValue, { color: COLORS.success }]}>Value: ${(value / 100).toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={[styles.redeemBtn, { backgroundColor: COLORS.success }]} onPress={handleRedeem} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.redeemBtnText}>Redeem with OrbPass</Text>}
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
  card: { padding: 20, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardPartner: { fontSize: 14, marginBottom: 8 },
  cardValue: { fontSize: 16, fontWeight: '700' },
  redeemBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  redeemBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16 },
});
