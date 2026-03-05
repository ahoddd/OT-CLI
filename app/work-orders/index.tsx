/**
 * OrbOps™ — Work Orders list. Customer or Partner role.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useWorkOrders, type WorkOrderRole } from '../../hooks/useWorkOrders';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { useTheme } from '../../hooks/useTheme';
import { WORK_ORDER_CATEGORY_LABELS } from '../../constants/OrbOps';
import type { WorkOrderCategory } from '../../constants/OrbOps';
import { COLORS } from '../../constants/Colors';
import { PageHero } from '../../components/PageHero';
import { useI18n } from '../../context/I18nContext';

function getStatusLabel(t: (key: string) => string, s: string): string {
  const key = `workOrders.status_${s}`;
  const out = t(key);
  return out !== key ? out : s;
}

export default function WorkOrdersListScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { isPartner } = useEffectiveTier();
  const initialRole: WorkOrderRole = params.role === 'partner' || (isPartner && params.role !== 'customer') ? 'partner' : 'customer';
  const { colors } = useTheme();
  const { flags } = useFlags();
  const {
    workOrders,
    loading,
    error,
    refresh,
    role,
    setRole,
  } = useWorkOrders(initialRole);
  const [refreshing, setRefreshing] = useState(false);

  if (!flags.isOrbOpsEnabled || !flags.isOrbOpsWorkOrdersEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('workOrders.title')}</Text>
        </View>
        <View style={styles.offState}>
          <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.offText, { color: colors.text }]}>{t('workOrders.offTitle')}</Text>
          <Text style={[styles.offSub, { color: colors.textSecondary }]}>{t('workOrders.offSub')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('workOrders.title')}</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: COLORS.success ?? '#22C55E' }]}
          onPress={() => router.push('/work-orders/create')}
        >
          <Ionicons name="add" size={22} color="#000" />
          <Text style={styles.createBtnText}>{t('workOrders.requestWork')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.roleRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.rolePill, { backgroundColor: role === 'customer' ? colors.success : colors.surface }]}
          onPress={() => setRole('customer')}
        >
          <Text style={[styles.roleText, { color: role === 'customer' ? '#000' : colors.textSecondary }]}>{t('workOrders.myRequests')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rolePill, { backgroundColor: role === 'partner' ? colors.success : colors.surface }]}
          onPress={() => setRole('partner')}
        >
          <Text style={[styles.roleText, { color: role === 'partner' ? '#000' : colors.textSecondary }]}>{t('workOrders.partnerInbox')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>{t('workOrders.loading')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        >
          <PageHero
            icon="document-text"
            iconColor={colors.primary}
            title={t('workOrders.heroTitle')}
            description={t('workOrders.heroDesc')}
            trustLine={t('workOrders.heroTrust')}
          />
          {error ? (
            <View style={[styles.errorCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            </View>
          ) : null}
          {workOrders.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="document-text-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('workOrders.emptyTitle')}</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {role === 'customer' ? t('workOrders.emptyCustomer') : t('workOrders.emptyPartner')}
              </Text>
            </View>
          ) : (
            workOrders.map((wo) => (
              <TouchableOpacity
                key={wo.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/work-orders/[id]', params: { id: wo.id } } as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{wo.title}</Text>
                <View style={styles.cardMeta}>
                  <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>
                    {WORK_ORDER_CATEGORY_LABELS[wo.category as WorkOrderCategory] ?? wo.category}
                  </Text>
                  <Text style={[styles.cardStatus, { color: colors.primary }]}>{getStatusLabel(t, wo.status)}</Text>
                </View>
                <Text style={[styles.cardDate, { color: colors.textSecondary }]}>{new Date(wo.updatedAt).toLocaleDateString()}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
  roleRow: { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1 },
  rolePill: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  roleText: { fontSize: 13, fontWeight: '600' },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  errorCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
  errorText: { fontSize: 14 },
  empty: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardCategory: { fontSize: 12 },
  cardStatus: { fontSize: 12, fontWeight: '600' },
  cardDate: { fontSize: 11 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  offSub: { fontSize: 13, marginTop: 4 },
});
