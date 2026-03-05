/**
 * Partner Meal Proposal Studio — create, manage, and publish meal proposals.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { useMealProposals } from '../../hooks/useMealProposals';
import { getMealAnalytics, computeFunnel, getBestTimeToPost, getRecommendedPartySize } from '../../hooks/useMealAnalytics';
import { getMealTierLimits } from '../../constants/MealProposalTierConfig';
import { MealProposalComposer } from '../../components/MealProposalComposer';
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ICONS,
  getMealPriceLabel,
  getPartySizeLabel,
  type MealProposal,
  type MealProposalStatus,
} from '../../constants/MealProposals';
import { PARTNER_TIER_COLORS, isPremiumPartnerTier, isProPartnerTier } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { useI18n } from '../../context/I18nContext';

const STATUS_COLORS: Record<MealProposalStatus, string> = {
  DRAFT: '#94a3b8',
  PUBLISHED: '#22c55e',
  PAUSED: '#f59e0b',
  EXPIRED: '#ef4444',
  REMOVED: '#6b7280',
};

export default function PartnerMealProposalsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { testPartnerTier } = useEffectiveTier();
  const { partners } = usePartners();
  const { myPartner } = useMyPartner();
  const partner = myPartner ?? partners[0] ?? null;
  const partnerId = partner?.id ?? 'p1';
  const partnerName = partner?.name ?? 'Partner';
  const partnerVerified = partner?.verified ?? false;
  const effectiveTier: PartnerTier = (testPartnerTier ?? (partner?.tier as PartnerTier | undefined) ?? 'silver');
  const tierColor = PARTNER_TIER_COLORS[effectiveTier];
  const limits = getMealTierLimits(effectiveTier);
  const isPremium = isPremiumPartnerTier(effectiveTier);
  const isPro = isProPartnerTier(effectiveTier);

  const { proposals, getPartnerProposals, createProposal, updateStatus } = useMealProposals(partnerId);
  const [showComposer, setShowComposer] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const myProposals = useMemo(() => getPartnerProposals(partnerId), [getPartnerProposals, partnerId]);
  const activeCount = myProposals.filter((p) => p.status === 'PUBLISHED' || p.status === 'DRAFT').length;

  React.useEffect(() => {
    getMealAnalytics().then((events) => {
      const myEvents = events.filter((e) => myProposals.some((p) => p.id === e.proposalId));
      setAnalyticsData({ funnel: computeFunnel(myEvents), bestTime: getBestTimeToPost(myEvents), recParty: getRecommendedPartySize(myEvents) });
    });
  }, [myProposals]);

  const handlePublish = useCallback(
    async (draft: Omit<MealProposal, 'id' | 'analytics' | 'createdAt' | 'updatedAt'>) => {
      const result = await createProposal(draft, effectiveTier);
      if (result.success) {
        setShowComposer(false);
        Alert.alert('Published', 'Your meal proposal is now live in OrbSwipe!');
      }
      return result;
    },
    [createProposal, effectiveTier],
  );

  const handleStatusChange = useCallback(
    (id: string, status: MealProposalStatus) => {
      updateStatus(id, status);
    },
    [updateStatus],
  );

  if (!flags['partner.mealProposalComposer']) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Meal Proposals coming soon</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showComposer) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <MealProposalComposer
          partnerTier={effectiveTier}
          partnerId={partnerId}
          partnerName={partnerName}
          partnerVerified={partnerVerified}
          onPublish={handlePublish}
          onCancel={() => setShowComposer(false)}
          existingActiveCount={activeCount}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meal Studio</Text>
        <TouchableOpacity onPress={() => setShowComposer(true)} hitSlop={12}>
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Analytics summary (Premium/Pro) */}
        {isPremium && analyticsData?.funnel && (
          <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>Funnel (all proposals)</Text>
            <View style={styles.funnelRow}>
              {(['impressions', 'opens', 'trayAdds', 'fuseSelects', 'navigations'] as const).map((key) => (
                <View key={key} style={styles.funnelItem}>
                  <Text style={[styles.funnelNum, { color: colors.text }]}>{analyticsData.funnel[key]}</Text>
                  <Text style={[styles.funnelLabel, { color: colors.textSecondary }]}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                </View>
              ))}
            </View>
            {limits.studioInsightsEnabled && (
              <View style={styles.insightsRow}>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>Best time: {analyticsData.bestTime}</Text>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>Party size: {analyticsData.recParty}</Text>
              </View>
            )}
          </View>
        )}

        {/* Create CTA */}
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowComposer(true)}
          activeOpacity={0.9}
        >
          <Ionicons name="restaurant" size={22} color="#000" />
          <Text style={styles.createBtnText}>Create Meal Proposal</Text>
          <Text style={styles.createBtnSub}>{activeCount}/{limits.maxActiveProposals} active</Text>
        </TouchableOpacity>

        {/* Proposal list */}
        {myProposals.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No proposals yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Create your first meal proposal to appear in OrbSwipe</Text>
          </View>
        ) : (
          myProposals.map((p) => (
            <View key={p.id} style={[styles.proposalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.proposalHeader}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[p.status] }]} />
                <Text style={[styles.proposalStatus, { color: STATUS_COLORS[p.status] }]}>{p.status}</Text>
                <View style={[styles.mealBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name={MEAL_TYPE_ICONS[p.mealType] as any} size={14} color={colors.primary} />
                  <Text style={[{ color: colors.primary, fontSize: 11, fontWeight: '700' }]}>{MEAL_TYPE_LABELS[p.mealType]}</Text>
                </View>
              </View>
              <Text style={[styles.proposalTitle, { color: colors.text }]}>{p.title}</Text>
              <Text style={[styles.proposalMeta, { color: colors.textSecondary }]}>
                {getMealPriceLabel(p)} · {getPartySizeLabel(p)} · {p.menuItems.length} items
              </Text>
              {limits.analyticsLevel !== 'basic' && (
                <View style={styles.miniAnalytics}>
                  <Text style={[styles.miniStat, { color: colors.textSecondary }]}>{p.analytics.impressions} views</Text>
                  <Text style={[styles.miniStat, { color: colors.textSecondary }]}>{p.analytics.trayAdds} tray</Text>
                  <Text style={[styles.miniStat, { color: colors.textSecondary }]}>{p.analytics.verifiedRedemptions} verified</Text>
                </View>
              )}
              <View style={styles.proposalActions}>
                {p.status === 'PUBLISHED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#f59e0b' }]}
                    onPress={() => handleStatusChange(p.id, 'PAUSED')}
                  >
                    <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '700' }}>Pause</Text>
                  </TouchableOpacity>
                )}
                {p.status === 'PAUSED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#22c55e' }]}
                    onPress={() => handleStatusChange(p.id, 'PUBLISHED')}
                  >
                    <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '700' }}>Resume</Text>
                  </TouchableOpacity>
                )}
                {(p.status === 'PUBLISHED' || p.status === 'PAUSED') && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#ef4444' }]}
                    onPress={() => handleStatusChange(p.id, 'REMOVED')}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Remove</Text>
                  </TouchableOpacity>
                )}
                {isPro && limits.duplicateEnabled && p.status === 'PUBLISHED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: tierColor }]}
                    onPress={() => Alert.alert('Duplicate', 'Coming soon: duplicate this proposal.')}
                  >
                    <Text style={{ color: tierColor, fontSize: 12, fontWeight: '700' }}>Duplicate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.base, paddingVertical: SPACE.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: SPACE.base, paddingBottom: 80 },
  analyticsCard: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACE.base, marginBottom: SPACE.base },
  analyticsTitle: { fontSize: 14, fontWeight: '800', marginBottom: SPACE.sm },
  funnelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACE.sm },
  funnelItem: { alignItems: 'center' },
  funnelNum: { fontSize: 16, fontWeight: '800' },
  funnelLabel: { fontSize: 9, fontWeight: '600', textTransform: 'capitalize' },
  insightsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SPACE.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  insightText: { fontSize: 11, fontWeight: '600' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.md, marginBottom: SPACE.base },
  createBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  createBtnSub: { color: 'rgba(0,0,0,0.6)', fontSize: 12 },
  center: { alignItems: 'center', paddingVertical: SPACE.xl * 2 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: SPACE.base },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: SPACE.sm, paddingHorizontal: SPACE.xl },
  proposalCard: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACE.base, marginBottom: SPACE.sm },
  proposalHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  proposalStatus: { fontSize: 11, fontWeight: '700', flex: 1 },
  mealBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  proposalTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  proposalMeta: { fontSize: 12, marginBottom: SPACE.sm },
  miniAnalytics: { flexDirection: 'row', gap: SPACE.base, marginBottom: SPACE.sm },
  miniStat: { fontSize: 11, fontWeight: '600' },
  proposalActions: { flexDirection: 'row', gap: SPACE.sm },
  actionBtn: { paddingVertical: 4, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs, borderWidth: 1 },
});
