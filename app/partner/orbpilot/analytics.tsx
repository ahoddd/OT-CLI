/**
 * OrbPilot™ Analytics — VV over time, CPA trend, new vs repeat breakdown.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useFlags } from '../../../components/FlagContext';
import { useOrbPilotCampaign } from '../../../hooks/useOrbPilotCampaign';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import type { OrbPilotMetrics } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

type DateRange = '7d' | '30d' | '90d';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
};

function getFromISO(range: DateRange): string {
  const d = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function SkeletonBar({ colors }: { colors: Record<string, string> }) {
  return (
    <View style={[skeletonStyles.bar, { backgroundColor: colors.card }]} />
  );
}

const skeletonStyles = StyleSheet.create({
  bar: { height: 14, borderRadius: 4, marginBottom: 8, opacity: 0.4 },
});

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  colors,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
  colors: Record<string, string>;
  trend?: 'up' | 'down' | 'flat';
}) {
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';
  const trendColor = trend === 'up' ? '#22C55E' : trend === 'down' ? '#EF4444' : '#94A3B8';
  return (
    <View style={[statStyles.card, { backgroundColor: colors.card }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[statStyles.value, { color: colors.text }]}>{value}</Text>
      {trend && (
        <Ionicons name={trendIcon as any} size={14} color={trendColor} style={{ position: 'absolute', top: 12, right: 12 }} />
      )}
      <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      {sub ? <Text style={[statStyles.sub, { color }]}>{sub}</Text> : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, minWidth: '44%', borderRadius: RADIUS.md, padding: 14, gap: 4 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11 },
  sub: { fontSize: 10, fontWeight: '600' },
});

/** Compute rolling-window sorted day entries from vvByDay */
function getSortedDayEntries(vvByDay: Record<string, number>, days: number): Array<{ day: string; vv: number }> {
  const result: Array<{ day: string; vv: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ day: key, vv: vvByDay[key] ?? 0 });
  }
  return result;
}

export default function OrbPilotAnalytics() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isOrbPilotEnabled, isOrbPilotPartnerEnabled } = useFlags();
  const router = useRouter();
  const { myPartnerId } = useMyPartner();
  const { metrics, loading, loadMetrics } = useOrbPilotCampaign(myPartnerId ?? undefined);

  const [range, setRange] = useState<DateRange>('7d');

  const fetchMetrics = useCallback(
    (r: DateRange) => {
      if (!myPartnerId) return;
      loadMetrics(myPartnerId, getFromISO(r), new Date().toISOString());
    },
    [myPartnerId],
  );

  useFocusEffect(
    useCallback(() => {
      fetchMetrics(range);
    }, [range]),
  );

  function handleRangeChange(r: DateRange) {
    setRange(r);
    fetchMetrics(r);
  }

  if (!isOrbPilotEnabled || !isOrbPilotPartnerEnabled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>OrbPilot not enabled</Text>
      </SafeAreaView>
    );
  }

  const dayCount = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const dayEntries = metrics ? getSortedDayEntries(metrics.vvByDay ?? {}, dayCount) : [];
  const maxVV = Math.max(...dayEntries.map((d) => d.vv), 1);

  // CPA by day sorted
  const cpaEntries = metrics
    ? getSortedDayEntries(metrics.cpaByDay ?? {}, dayCount).filter((d) => d.vv > 0)
    : [];
  const maxCPA = Math.max(...Object.values(metrics?.cpaByDay ?? {}), 0.01);

  // New vs repeat
  const totalVV = metrics?.totalVV ?? 0;
  const newVV = metrics?.newCustomerVV ?? 0;
  const repeatVV = metrics?.repeatCustomerVV ?? 0;
  const newPct = totalVV > 0 ? (newVV / totalVV) * 100 : 0;
  const repeatPct = totalVV > 0 ? (repeatVV / totalVV) * 100 : 0;

  // Fill rate by hour (best hours)
  const fillByHour = metrics?.fillRateByHour ?? {};
  const hourEntries = Object.entries(fillByHour)
    .map(([h, r]) => ({ hour: parseInt(h), rate: r as number }))
    .sort((a, b) => a.hour - b.hour);
  const maxFill = Math.max(...hourEntries.map((e) => e.rate), 0.01);

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
        <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>
        <TouchableOpacity onPress={() => fetchMetrics(range)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Date range picker */}
      <View style={[styles.rangeRow, { backgroundColor: colors.card }]}>
        {(['7d', '30d', '90d'] as DateRange[]).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => handleRangeChange(r)}
            style={[
              styles.rangeBtn,
              range === r
                ? { backgroundColor: '#22C55E', borderRadius: RADIUS.sm }
                : undefined,
            ]}
          >
            <Text
              style={[
                styles.rangeBtnText,
                { color: range === r ? '#fff' : colors.textSecondary },
              ]}
            >
              {DATE_RANGE_LABELS[r]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ padding: SPACE.base, gap: 16, marginTop: 8 }}>
          {[1, 2, 3, 4].map((i) => <SkeletonBar key={i} colors={colors} />)}
          <View style={{ height: 120, backgroundColor: colors.card, borderRadius: RADIUS.md, opacity: 0.4 }} />
        </View>
      ) : !metrics ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>No data yet</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
            Analytics will appear once your campaign has verified visits.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACE.base, gap: 20, paddingBottom: 40 }}>
          {/* KPI summary */}
          <View style={styles.kpiGrid}>
            <StatCard
              label="Verified Visits"
              value={String(metrics.totalVV)}
              icon="shield-checkmark"
              color="#22C55E"
              colors={colors}
            />
            <StatCard
              label="Avg CPA"
              value={`$${metrics.cpaMeanUsd.toFixed(2)}`}
              icon="cash-outline"
              color="#FBBF24"
              colors={colors}
              trend={metrics.cpaMeanUsd < 2 ? 'up' : metrics.cpaMeanUsd > 4 ? 'down' : 'flat'}
            />
            <StatCard
              label="Budget Spent"
              value={`$${metrics.budgetSpentUsd.toFixed(2)}`}
              icon="wallet-outline"
              color="#60A5FA"
              colors={colors}
            />
            <StatCard
              label="Fill Rate"
              value={`${(metrics.fillRateMean * 100).toFixed(0)}%`}
              icon="speedometer-outline"
              color="#A78BFA"
              colors={colors}
              trend={metrics.fillRateMean > 0.6 ? 'up' : metrics.fillRateMean < 0.3 ? 'down' : 'flat'}
            />
          </View>

          {/* VV over time bar chart */}
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Verified Visits — Last {DATE_RANGE_LABELS[range]}
            </Text>
            {dayEntries.every((d) => d.vv === 0) ? (
              <View style={styles.chartEmpty}>
                <Text style={[styles.chartEmptyText, { color: colors.textSecondary }]}>
                  No verified visits in this period
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.barChart}>
                  {dayEntries.map((entry, i) => {
                    const barHeight = Math.max(2, (entry.vv / maxVV) * 80);
                    const isWeekend =
                      new Date(entry.day).getDay() === 0 ||
                      new Date(entry.day).getDay() === 6;
                    return (
                      <View key={i} style={styles.barCol}>
                        <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                          {entry.vv > 0 ? entry.vv : ''}
                        </Text>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight,
                              backgroundColor: isWeekend ? '#22C55E' : '#22C55E80',
                            },
                          ]}
                        />
                        {dayCount <= 14 && (
                          <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                            {entry.day.slice(5)}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
                <Text style={[styles.chartHint, { color: colors.textSecondary }]}>
                  Total: {metrics.totalVV} visits · Peak day: {Math.max(...dayEntries.map((d) => d.vv))} visits
                </Text>
              </>
            )}
          </View>

          {/* CPA Trend */}
          {cpaEntries.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>CPA Trend</Text>
              <View style={styles.barChart}>
                {cpaEntries.slice(-14).map((entry, i) => {
                  const barHeight = Math.max(2, ((metrics.cpaByDay[entry.day] ?? 0) / maxCPA) * 60);
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                        {metrics.cpaByDay[entry.day]
                          ? `$${(metrics.cpaByDay[entry.day] as number).toFixed(1)}`
                          : ''}
                      </Text>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: (metrics.cpaByDay[entry.day] as number) > 3
                              ? '#EF444480'
                              : '#FBBF2480',
                          },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
              <View style={styles.cpaSummaryRow}>
                <Text style={[styles.chartHint, { color: colors.textSecondary }]}>
                  Current avg: ${metrics.cpaMeanUsd.toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {/* New vs Repeat breakdown */}
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>New vs Repeat</Text>
            {totalVV === 0 ? (
              <Text style={[styles.chartEmptyText, { color: colors.textSecondary }]}>
                No visit data available
              </Text>
            ) : (
              <>
                {/* New customers bar */}
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#A78BFA' }]} />
                  <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                    New Customers
                  </Text>
                  <Text style={[styles.breakdownCount, { color: '#A78BFA' }]}>
                    {newVV} ({newPct.toFixed(0)}%)
                  </Text>
                </View>
                <View style={[styles.breakdownBar, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.breakdownFill,
                      { width: `${newPct}%`, backgroundColor: '#A78BFA' },
                    ]}
                  />
                </View>

                {/* Repeat customers bar */}
                <View style={[styles.breakdownRow, { marginTop: 10 }]}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#60A5FA' }]} />
                  <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                    Repeat Customers
                  </Text>
                  <Text style={[styles.breakdownCount, { color: '#60A5FA' }]}>
                    {repeatVV} ({repeatPct.toFixed(0)}%)
                  </Text>
                </View>
                <View style={[styles.breakdownBar, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.breakdownFill,
                      { width: `${repeatPct}%`, backgroundColor: '#60A5FA' },
                    ]}
                  />
                </View>

                <Text style={[styles.chartHint, { color: colors.textSecondary, marginTop: 6 }]}>
                  {newPct > 60
                    ? 'Strong new customer acquisition — consider a repeat visit campaign'
                    : repeatPct > 60
                    ? 'Strong repeat loyalty — great retention'
                    : 'Healthy mix of new and returning customers'}
                </Text>
              </>
            )}
          </View>

          {/* Fill rate by hour */}
          {hourEntries.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Fill Rate by Hour</Text>
              <View style={styles.barChart}>
                {hourEntries.map((entry, i) => {
                  const barHeight = Math.max(2, (entry.rate / maxFill) * 70);
                  const fillColor =
                    entry.rate >= 0.5
                      ? '#22C55E80'
                      : entry.rate >= 0.25
                      ? '#F59E0B80'
                      : '#EF444480';
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={[styles.bar, { height: barHeight, backgroundColor: fillColor }]} />
                      <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                        {entry.hour}h
                      </Text>
                    </View>
                  );
                })}
              </View>
              {metrics.bestHours.length > 0 && (
                <Text style={[styles.chartHint, { color: colors.textSecondary }]}>
                  Best hours: {metrics.bestHours.map((h) => `${h}:00`).join(', ')}
                </Text>
              )}
            </View>
          )}

          {/* Reliability score */}
          <View style={[styles.reliabilityCard, { backgroundColor: colors.card }]}>
            <View style={styles.reliabilityRow}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Reliability Score</Text>
              <Text
                style={[
                  styles.reliabilityScore,
                  {
                    color:
                      metrics.reliabilityScore >= 70
                        ? '#22C55E'
                        : metrics.reliabilityScore >= 40
                        ? '#F59E0B'
                        : '#EF4444',
                  },
                ]}
              >
                {metrics.reliabilityScore}/100
              </Text>
            </View>
            <View style={[styles.reliabilityBar, { backgroundColor: colors.background }]}>
              <View
                style={[
                  styles.reliabilityFill,
                  {
                    width: `${metrics.reliabilityScore}%`,
                    backgroundColor:
                      metrics.reliabilityScore >= 70
                        ? '#22C55E'
                        : metrics.reliabilityScore >= 40
                        ? '#F59E0B'
                        : '#EF4444',
                  },
                ]}
              />
            </View>
            <Text style={[styles.chartHint, { color: colors.textSecondary }]}>
              {metrics.reliabilityScore >= 70
                ? 'Excellent — you appear prominently in the offer feed'
                : metrics.reliabilityScore >= 40
                ? 'Good — maintain consistent hours to improve'
                : 'Low — improve fill rate and reduce rejected visits'}
            </Text>
          </View>
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
  rangeRow: { flexDirection: 'row', padding: 6, marginHorizontal: SPACE.base, borderRadius: RADIUS.md, gap: 4 },
  rangeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  rangeBtnText: { fontSize: 13, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chartCard: { borderRadius: RADIUS.md, padding: SPACE.base, gap: 10 },
  chartTitle: { fontSize: 13, fontWeight: '700' },
  chartEmpty: { height: 80, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontSize: 13 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 100 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  bar: { width: '100%', borderRadius: 2 },
  barValue: { fontSize: 8, fontWeight: '700' },
  barLabel: { fontSize: 8, textAlign: 'center' },
  chartHint: { fontSize: 11 },
  cpaSummaryRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { flex: 1, fontSize: 13 },
  breakdownCount: { fontSize: 13, fontWeight: '700' },
  breakdownBar: { height: 10, borderRadius: 5, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 5 },
  reliabilityCard: { borderRadius: RADIUS.md, padding: SPACE.base, gap: 8 },
  reliabilityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reliabilityScore: { fontSize: 22, fontWeight: '800' },
  reliabilityBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  reliabilityFill: { height: '100%', borderRadius: 4 },
});
