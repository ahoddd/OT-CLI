/**
 * OrbOpportunities — User's applications + receipts.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useMyApplications, useMyReceipts } from '../../hooks/useOpportunities';
import { useAuth } from '../../context/AuthContext';
import { APPLICATION_STATUS_LABELS } from '../../constants/Opportunities';
import type { ApplicationStatus } from '../../constants/Opportunities';
import { COLORS } from '../../constants/Colors';
import { useI18n } from '../../context/I18nContext';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyApplicationsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { applications } = useMyApplications(user?.uid ?? null);
  const receipts = useMyReceipts(user?.uid ?? null);

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>My applications</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sign in to see your applications.</Text>
          <TouchableOpacity style={[styles.signInBtn, { backgroundColor: themeGold }]} onPress={() => router.push('/auth/login' as any)}>
            <Text style={styles.signInBtnText}>Sign in</Text>
          </TouchableOpacity>
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
        <Text style={[styles.title, { color: colors.text }]}>My applications</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {receipts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VERIFIED WORK RECEIPTS</Text>
            {receipts.map((r) => (
              <View key={r.receiptId} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardRow}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{r.opportunityTitle}</Text>
                </View>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>Verified {formatDate(r.verifiedAt)}</Text>
                {r.hours != null && <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{r.hours} hrs</Text>}
              </View>
            ))}
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPLICATIONS</Text>
        {applications.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No applications yet.</Text>
        ) : (
          applications.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/opportunities/[id]', params: { id: a.opportunityId } } as any)}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>Application #{a.id.slice(-4)}</Text>
              <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>Opportunity ID: {a.opportunityId}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusColor(a.status, themeGold) + '25' }]}>
                <Text style={[styles.statusText, { color: statusColor(a.status, themeGold) }]}>{APPLICATION_STATUS_LABELS[a.status]}</Text>
              </View>
              <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>Submitted {formatDate(a.submittedAt)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function statusColor(s: ApplicationStatus, themeGold: string): string {
  if (s === 'ACCEPTED') return COLORS.success;
  if (s === 'REJECTED' || s === 'WITHDRAWN') return '#6b7280';
  return themeGold;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 4 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 14, marginBottom: 12 },
  signInBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  signInBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});
