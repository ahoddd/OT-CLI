/**
 * OrbPass™ — Redemption: show PIN/QR, status, share.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { ORBTAP_APP_LINK } from '../../../constants/AppLinks';
import { ShareToSocialSheet } from '../../../components/ShareToSocialSheet';
import { useI18n } from '../../../context/I18nContext';

export default function OrbPassRedeemScreen() {
  const { t } = useI18n();
  const { redemptionId, pin, qrToken } = useLocalSearchParams<{ redemptionId: string; pin: string; qrToken: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [shareVisible, setShareVisible] = useState(false);
  const orbPassUrl = `${ORBTAP_APP_LINK.replace(/\/$/, '')}/orbpass`;
  const payload = {
    message: "I'm redeeming my OrbPass perk on OrbTap.",
    url: orbPassUrl,
    title: 'OrbPass',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Redemption</Text>
        <TouchableOpacity onPress={() => setShareVisible(true)} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>Show this PIN or token to the partner to verify.</Text>
        {pin ? (
          <View style={[styles.codeBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>PIN (6 digits)</Text>
            <Text style={[styles.codeValue, { color: colors.text }]} selectable>{pin}</Text>
          </View>
        ) : null}
        {qrToken ? (
          <View style={[styles.codeBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>QR token</Text>
            <Text style={[styles.codeValue, { color: colors.text }]} selectable>{qrToken}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={[styles.shareCardBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShareVisible(true)}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
          <Text style={[styles.shareCardBtnText, { color: colors.text }]}>Share OrbPass</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.replace('/orbpass')}>
          <Text style={[styles.doneBtnText, { color: colors.text }]}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
      <ShareToSocialSheet visible={shareVisible} onClose={() => setShareVisible(false)} payload={payload} label="Share OrbPass" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  shareBtn: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  instruction: { fontSize: 14, marginBottom: 20 },
  codeBlock: { padding: 20, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  codeLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  codeValue: { fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  shareCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  shareCardBtnText: { fontSize: 16, fontWeight: '700' },
  doneBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16, borderWidth: 1 },
  doneBtnText: { fontSize: 16, fontWeight: '700' },
});
