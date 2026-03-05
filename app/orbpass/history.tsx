/**
 * OrbPass™ — Redemption history.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import * as api from '../../services/orbPass';
import { useI18n } from '../../context/I18nContext';

export default function OrbPassHistoryScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.orbPassRedemptionHistory(50);
    if (res.success) setRedemptions(res.redemptions);
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  if (!flags.isOrbPassEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>History</Text>
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
        <Text style={[styles.title, { color: colors.text }]}>Redemption history</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.text} />}>
        {loading ? (
          <View style={styles.loadWrap}>
            <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
          </View>
        ) : redemptions.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No redemptions yet.</Text>
          </View>
        ) : (
          redemptions.map((r) => (
            <View key={r.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.rowStatus, { color: colors.text }]}>{r.status}</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>${((r.valueCents ?? 0) / 100).toFixed(2)}</Text>
              <Text style={[styles.rowDate, { color: colors.textSecondary }]}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</Text>
            </View>
          ))
        )}
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
  loadWrap: { padding: 24, alignItems: 'center' },
  loadText: { fontSize: 14 },
  empty: { padding: 20, borderRadius: 12, borderWidth: 1 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  row: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  rowStatus: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  rowValue: { fontSize: 13, marginBottom: 4 },
  rowDate: { fontSize: 12 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16 },
});
