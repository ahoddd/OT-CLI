/**
 * OrbIntent™ — Locked: show PIN and QR token for partner to verify.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { COLORS } from '../../../constants/Colors';
import * as api from '../../../services/orbIntent';
import { useI18n } from '../../../context/I18nContext';

export default function LockedIntentScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [intent, setIntent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    api.intentGet(id).then((res) => {
      if (res.success) setIntent(res.intent);
      setLoading(false);
    });
  }, [id]);

  const pin = intent?.fulfillment?.pin ?? null;
  const qrToken = intent?.fulfillment?.qrToken ?? null;

  if (loading && !intent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!intent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Fulfillment</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.errText, { color: colors.text }]}>Not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (intent.status !== 'locked') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Fulfillment</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.errText, { color: colors.text }]}>{intent.status === 'fulfilled' ? 'Already fulfilled.' : 'Intent is not locked.'}</Text>
          {intent.status === 'fulfilled' && intent.dealCardId && (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: themeGold }]} onPress={() => router.replace({ pathname: '/intent/deal/[cardId]', params: { cardId: intent.dealCardId } } as any)}>
              <Text style={styles.primaryBtnText}>View Deal Card</Text>
            </TouchableOpacity>
          )}
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
        <Text style={[styles.title, { color: colors.text }]}>Show partner</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>Give the partner this PIN or token to verify fulfillment.</Text>
        {pin && (
          <View style={[styles.codeBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>PIN (6 digits)</Text>
            <Text style={[styles.codeValue, { color: colors.text }]} selectable>{pin}</Text>
          </View>
        )}
        {qrToken && (
          <View style={[styles.codeBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>QR token</Text>
            <Text style={[styles.codeValue, { color: colors.text }]} selectable>{qrToken}</Text>
          </View>
        )}
        {!pin && !qrToken && <Text style={[styles.codeValue, { color: colors.textSecondary }]}>Verification codes will appear after offer acceptance.</Text>}
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.replace({ pathname: '/intent/[id]', params: { id: intent.id } } as any)}>
          <Text style={[styles.primaryBtnText, { color: colors.text }]}>Back to intent</Text>
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
  loadText: { fontSize: 14 },
  errText: { fontSize: 16 },
  instruction: { fontSize: 14, marginBottom: 20 },
  codeBlock: { padding: 20, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  codeLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  codeValue: { fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  primaryBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16, borderWidth: 1 },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
