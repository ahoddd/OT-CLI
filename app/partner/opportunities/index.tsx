/**
 * OrbOpportunities — Partner list opportunities.
 * partnerId from route params or default "p1" for MVP.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../../components/FlagContext';
import { useTheme } from '../../../hooks/useTheme';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { usePartnerOpportunities } from '../../../hooks/useOpportunities';
import { OPPORTUNITY_TYPE_LABELS } from '../../../constants/Opportunities';
import type { Opportunity, OpportunityStatus } from '../../../constants/Opportunities';
import { COLORS } from '../../../constants/Colors';
import { useI18n } from '../../../context/I18nContext';

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  PAUSED: 'Paused',
  CLOSED: 'Closed',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PartnerOpportunitiesListScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ partnerId?: string }>();
  const { myPartnerId } = useMyPartner();
  const partnerId = params.partnerId ?? myPartnerId ?? 'p1';
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const insets = useSafeAreaInsets();
  const { opportunities, refresh } = usePartnerOpportunities(partnerId);

  if (!flags.isOrbOpportunitiesEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Opportunities</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.text }]}>OrbOpportunities is off.</Text>
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
        <Text style={[styles.title, { color: colors.text }]}>Opportunities</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: themeGold }]}
          onPress={() => router.push({ pathname: '/partner/opportunities/create', params: { partnerId } } as any)}
        >
          <Ionicons name="add" size={22} color="#000" />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.recordsRow, { borderBottomColor: colors.border }]}
        onPress={() => router.push({ pathname: '/partner/opportunities/records', params: { partnerId } } as any)}
      >
        <Ionicons name="document-text-outline" size={22} color={colors.text} />
        <Text style={[styles.recordsText, { color: colors.text }]}>Records & export</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <FlatList
        data={opportunities}
        keyExtractor={(o) => o.id}
        contentContainerStyle={[styles.list, { paddingBottom: 24 + insets.bottom }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No opportunities yet. Create one to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/partner/opportunities/[id]', params: { id: item.id, partnerId } } as any)}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <View style={styles.cardRow}>
              <View style={[styles.statusPill, { backgroundColor: item.status === 'PUBLISHED' ? COLORS.success + '25' : colors.surfaceHighlight }]}>
                <Text style={[styles.statusText, { color: item.status === 'PUBLISHED' ? COLORS.success : colors.textSecondary }]}>{STATUS_LABELS[item.status]}</Text>
              </View>
              <Text style={[styles.cardType, { color: colors.textSecondary }]}>{OPPORTUNITY_TYPE_LABELS[item.type]}</Text>
            </View>
            <Text style={[styles.cardDate, { color: colors.textSecondary }]}>Start {formatDate(item.startAt)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  createBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  recordsRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, borderBottomWidth: 1 },
  recordsText: { fontSize: 15, fontWeight: '600', flex: 1 },
  list: { padding: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardType: { fontSize: 12 },
  cardDate: { fontSize: 12 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16 },
});
