import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { pilotAdminHealth, pilotAdminKillSwitch } from '../../../services/orbPilot';

interface HealthData {
  activeCampaigns: number;
  vv24h: number;
  failureRate24h: number;
  openDisputes: number;
  engineLastRun: Record<string, unknown> | null;
  globalKillActive: boolean;
  activeKillSwitches: number;
}

export default function OrbPilotHealthScreen() {
  const { colors } = useTheme();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pilotAdminHealth();
      if (res.success) setHealth(res as HealthData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const lastRun = health?.engineLastRun as Record<string, unknown> | null;

  const kpis = health ? [
    { label: 'Active Campaigns', value: String(health.activeCampaigns), icon: 'megaphone-outline', color: '#7C3AED' },
    { label: 'VV Last 24h', value: String(health.vv24h), icon: 'checkmark-circle-outline', color: '#22C55E' },
    { label: 'Failure Rate 24h', value: `${health.failureRate24h}%`, icon: 'close-circle-outline', color: health.failureRate24h > 30 ? '#EF4444' : '#FBBF24' },
    { label: 'Open Disputes', value: String(health.openDisputes), icon: 'flag-outline', color: health.openDisputes > 5 ? '#EF4444' : '#6B7280' },
    { label: 'Kill Switches', value: String(health.activeKillSwitches), icon: 'power-outline', color: health.globalKillActive ? '#EF4444' : '#6B7280' },
  ] : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={[styles.title, { color: colors.text }]}>System Health</Text>

        {/* Global Kill Alert */}
        {health?.globalKillActive && (
          <View style={styles.killAlert}>
            <Ionicons name="warning" size={18} color="#EF4444" />
            <Text style={styles.killAlertText}>GLOBAL KILL SWITCH ACTIVE — All OrbPilot offers paused</Text>
          </View>
        )}

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          {kpis.map((k) => (
            <View key={k.label} style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={k.icon as any} size={22} color={k.color} />
              <Text style={[styles.kpiValue, { color: colors.text }]}>{k.value}</Text>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Engine Last Run */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Engine Last Tick</Text>
          {lastRun ? (
            <>
              <Text style={[styles.field, { color: colors.textSecondary }]}>Run at: {String(lastRun.ranAtISO ?? '—')}</Text>
              <Text style={[styles.field, { color: colors.textSecondary }]}>Slots released: {String(lastRun.slotsReleased ?? '—')}</Text>
              <Text style={[styles.field, { color: colors.textSecondary }]}>Windows opened: {String(lastRun.windowsOpened ?? '—')}</Text>
              <Text style={[styles.field, { color: colors.textSecondary }]}>Campaigns processed: {String(lastRun.campaignCount ?? '—')}</Text>
              <Text style={[styles.field, { color: colors.textSecondary }]}>Duration: {String(lastRun.durationMs ?? '—')}ms</Text>
            </>
          ) : (
            <Text style={[styles.field, { color: colors.textMuted }]}>No tick data available</Text>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20, marginBottom: 8 }]}>Quick Actions</Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: health?.globalKillActive ? '#22C55E22' : '#EF444422', borderColor: health?.globalKillActive ? '#22C55E55' : '#EF444455' }]}
          onPress={async () => {
            const kill = !health?.globalKillActive;
            await pilotAdminKillSwitch('global', 'global', kill);
            load();
          }}
        >
          <Ionicons name={health?.globalKillActive ? 'power' : 'power-outline'} size={20} color={health?.globalKillActive ? '#22C55E' : '#EF4444'} />
          <Text style={{ color: health?.globalKillActive ? '#22C55E' : '#EF4444', fontWeight: '600', fontSize: 15 }}>
            {health?.globalKillActive ? 'Lift Global Kill Switch' : 'Engage Global Kill Switch'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 14 },
  killAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EF444422', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#EF444444' },
  killAlertText: { color: '#EF4444', fontWeight: '700', fontSize: 13, flex: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: { flex: 1, minWidth: '45%', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6 },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontSize: 11, textAlign: 'center' },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  field: { fontSize: 13, marginBottom: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 10 },
});
