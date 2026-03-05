/**
 * OrbPilot™ Partner Cockpit — KPI overview, alerts, quick actions.
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useFlags } from '../../../components/FlagContext';
import { useOrbPilotCampaign } from '../../../hooks/useOrbPilotCampaign';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import { CAMPAIGN_STATUS_LABEL } from '../../../constants/OrbPilot';
import type { CampaignDoc } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
  colors,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
  colors: Record<string, string>;
}) {
  return (
    <View style={[kpiStyles.card, { backgroundColor: colors.card }]}>
      <View style={[kpiStyles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[kpiStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[kpiStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      {sub ? <Text style={[kpiStyles.sub, { color }]}>{sub}</Text> : null}
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  card: { flex: 1, minWidth: '44%', borderRadius: RADIUS.md, padding: 14, gap: 4 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 12 },
  sub: { fontSize: 11, fontWeight: '600' },
});

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  paused: '#F59E0B',
  draft: '#94A3B8',
  ended: '#6B7280',
  killed: '#EF4444',
};

export default function OrbPilotCockpit() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isOrbPilotEnabled, isOrbPilotPartnerEnabled } = useFlags();
  const router = useRouter();
  const { myPartnerId } = useMyPartner();
  const { campaigns, metrics, loading, loadCampaigns, loadMetrics, pause, resume } =
    useOrbPilotCampaign(myPartnerId ?? undefined);

  useFocusEffect(
    useCallback(() => {
      loadCampaigns();
      if (myPartnerId) loadMetrics(myPartnerId);
    }, [myPartnerId]),
  );

  const activeCampaign: CampaignDoc | null =
    campaigns.find((c) => c.status === 'active') ?? campaigns[0] ?? null;

  if (!isOrbPilotEnabled || !isOrbPilotPartnerEnabled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 15 }}>OrbPilot not enabled</Text>
      </SafeAreaView>
    );
  }

  const statusColor = activeCampaign ? (STATUS_COLORS[activeCampaign.status] ?? '#94A3B8') : '#94A3B8';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>OrbPilot Cockpit</Text>
        <TouchableOpacity
          onPress={() => router.push('/partner/orbpilot/setup' as any)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {loading && !metrics ? (
        <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACE.base, gap: 16 }}>
          {/* Campaign Status Banner */}
          {activeCampaign && (
            <View
              style={[
                styles.statusBar,
                { backgroundColor: statusColor + '15', borderColor: statusColor + '30' },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                Campaign {CAMPAIGN_STATUS_LABEL[activeCampaign.status]}
              </Text>
              <View style={{ flex: 1 }} />
              {activeCampaign.status === 'active' && (
                <TouchableOpacity
                  onPress={() => pause(activeCampaign.id)}
                  style={[styles.quickBtn, { backgroundColor: statusColor + '20' }]}
                >
                  <Text style={[styles.quickBtnText, { color: statusColor }]}>Pause</Text>
                </TouchableOpacity>
              )}
              {activeCampaign.status === 'paused' && (
                <TouchableOpacity
                  onPress={() => resume(activeCampaign.id)}
                  style={[styles.quickBtn, { backgroundColor: statusColor + '20' }]}
                >
                  <Text style={[styles.quickBtnText, { color: statusColor }]}>Resume</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* KPI Grid */}
          <View style={styles.kpiGrid}>
            <KpiCard
              label="Verified Visits"
              value={String(metrics?.totalVV ?? 0)}
              icon="shield-checkmark"
              color="#22C55E"
              colors={colors}
            />
            <KpiCard
              label="CPA"
              value={metrics ? `$${metrics.cpaMeanUsd.toFixed(2)}` : '—'}
              icon="cash-outline"
              color="#FBBF24"
              colors={colors}
            />
            <KpiCard
              label="Budget Spent"
              value={metrics ? `$${metrics.budgetSpentUsd.toFixed(2)}` : '—'}
              icon="wallet-outline"
              color="#60A5FA"
              colors={colors}
              sub={
                activeCampaign
                  ? `$${activeCampaign.remainingWeeklyUsd.toFixed(0)} left`
                  : undefined
              }
            />
            <KpiCard
              label="New Customers"
              value={String(metrics?.newCustomerVV ?? 0)}
              icon="person-add-outline"
              color="#A78BFA"
              colors={colors}
            />
          </View>

          {/* Fill Rate */}
          {metrics && (
            <View style={[styles.fillRateCard, { backgroundColor: colors.card }]}>
              <View style={styles.fillRateRow}>
                <Text style={[styles.fillRateLabel, { color: colors.textSecondary }]}>Avg Fill Rate</Text>
                <Text style={[styles.fillRateValue, { color: colors.text }]}>
                  {(metrics.fillRateMean * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={[styles.fillRateBar, { backgroundColor: colors.background }]}>
                <View
                  style={[
                    styles.fillRateFill,
                    {
                      width: `${Math.min(100, metrics.fillRateMean * 100)}%`,
                      backgroundColor:
                        metrics.fillRateMean > 0.5
                          ? '#22C55E'
                          : metrics.fillRateMean > 0.25
                          ? '#F59E0B'
                          : '#EF4444',
                    },
                  ]}
                />
              </View>
              <View style={styles.fillRateRow}>
                <Text style={[styles.fillRateHint, { color: colors.textSecondary }]}>
                  New: {metrics.newCustomerVV} · Repeat: {metrics.repeatCustomerVV}
                </Text>
                <Text style={[styles.fillRateHint, { color: colors.textSecondary }]}>
                  Reliability: {metrics.reliabilityScore}/100
                </Text>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            {[
              { label: 'PIN Screen', icon: 'keypad-outline', route: '/partner/orbpilot/verify', color: '#7C3AED' },
              { label: 'Schedule', icon: 'calendar-outline', route: '/partner/orbpilot/schedule', color: '#0EA5E9' },
              { label: 'Reward Ladder', icon: 'trophy-outline', route: '/partner/orbpilot/rewards', color: '#F59E0B' },
              { label: 'Guardrails', icon: 'shield-outline', route: '/partner/orbpilot/guardrails', color: '#EF4444' },
              { label: 'Analytics', icon: 'bar-chart-outline', route: '/partner/orbpilot/analytics', color: '#22C55E' },
              { label: 'Activity Log', icon: 'list-outline', route: '/partner/orbpilot/activity', color: '#60A5FA' },
              { label: 'Disputes', icon: 'flag-outline', route: '/partner/orbpilot/disputes', color: '#F97316' },
              { label: 'Verify Guide', icon: 'help-circle-outline', route: '/partner/orbpilot/verification-help', color: '#A78BFA' },
            ].map((a) => (
              <TouchableOpacity
                key={a.route}
                style={styles.actionRow}
                onPress={() => router.push(a.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
                  <Ionicons name={a.icon as any} size={18} color={a.color} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.text }]}>{a.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Low budget alert */}
          {activeCampaign &&
            activeCampaign.remainingWeeklyUsd < activeCampaign.weeklyBudgetUsd * 0.15 && (
              <View
                style={[
                  styles.alertCard,
                  { backgroundColor: '#EF444415', borderColor: '#EF444430' },
                ]}
              >
                <Ionicons name="warning-outline" size={18} color="#EF4444" />
                <Text style={{ color: '#EF4444', flex: 1, marginLeft: 8, fontSize: 13 }}>
                  Weekly budget low: ${activeCampaign.remainingWeeklyUsd.toFixed(2)} remaining
                </Text>
              </View>
            )}

          {/* No campaign CTA */}
          {campaigns.length === 0 && !loading && (
            <TouchableOpacity
              style={[styles.setupCta, { borderColor: '#7C3AED40', backgroundColor: '#7C3AED10' }]}
              onPress={() => router.push('/partner/orbpilot/setup' as any)}
            >
              <Ionicons name="rocket-outline" size={28} color="#7C3AED" />
              <Text style={[styles.setupCtaTitle, { color: colors.text }]}>
                Create Your First Campaign
              </Text>
              <Text style={[styles.setupCtaSub, { color: colors.textSecondary }]}>
                Set budget, schedule, and rewards — go live in minutes
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.base,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontWeight: '700', fontSize: 14 },
  quickBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.xs },
  quickBtnText: { fontWeight: '700', fontSize: 12 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fillRateCard: { borderRadius: RADIUS.md, padding: SPACE.base, gap: 8 },
  fillRateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fillRateLabel: { fontSize: 12, fontWeight: '600' },
  fillRateValue: { fontSize: 16, fontWeight: '800' },
  fillRateBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fillRateFill: { height: '100%', borderRadius: 3 },
  fillRateHint: { fontSize: 11 },
  section: { borderRadius: RADIUS.md, padding: SPACE.base },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  actionIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: RADIUS.sm, borderWidth: 1 },
  setupCta: { alignItems: 'center', padding: 28, borderRadius: RADIUS.base, borderWidth: 1, gap: 8 },
  setupCtaTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  setupCtaSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
