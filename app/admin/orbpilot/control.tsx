/**
 * OrbPilot™ Admin — Global Control Panel: kill switches, engine status.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../context/AuthContext';
import { isAdminEmail } from '../../../constants/Admin';
import { useOrbPilotAdmin } from '../../../hooks/useOrbPilotAdmin';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import { useI18n } from '../../../context/I18nContext';

export default function OrbPilotAdminControl() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { campaigns, lastRun, loading, fetchCampaigns, fetchTick, killSwitch, runTick } = useOrbPilotAdmin();
  const [globalKill, setGlobalKill] = useState(false);
  const [killing, setKilling] = useState(false);
  const [ticking, setTicking] = useState(false);

  if (!isAdminEmail(user?.email ?? '')) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Admin only</Text>
      </SafeAreaView>
    );
  }

  useFocusEffect(useCallback(() => {
    fetchCampaigns();
    fetchTick();
  }, []));

  const handleKillSwitch = async (val: boolean) => {
    if (val) {
      Alert.alert('Enable Global Kill Switch?', 'This will stop ALL OrbPilot campaigns immediately.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Kill All', style: 'destructive', onPress: async () => {
            setKilling(true);
            const res = await killSwitch('global', '', val);
            if (res.success) setGlobalKill(val);
            else Alert.alert('Error', res.message ?? 'Failed');
            setKilling(false);
          }
        }
      ]);
    } else {
      setKilling(true);
      const res = await killSwitch('global', '', val);
      if (res.success) setGlobalKill(val);
      else Alert.alert('Error', res.message ?? 'Failed');
      setKilling(false);
    }
  };

  const handleRunTick = async () => {
    setTicking(true);
    const res = await runTick();
    setTicking(false);
    if (res.success) {
      Alert.alert('Engine Tick Complete', `Released ${res.slotsReleased} slots across ${res.windowsOpened} windows`);
      await fetchTick();
    } else {
      Alert.alert('Error', res.message ?? 'Tick failed');
    }
  };

  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const lastRunData = lastRun as Record<string, unknown> | null;

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>OrbPilot Control</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACE.md, gap: 16 }}>
        {/* Global Kill Switch */}
        <View style={[styles.card, { backgroundColor: globalKill ? '#EF444415' : colors.card, borderColor: globalKill ? '#EF4444' : 'transparent', borderWidth: 1 }]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: globalKill ? '#EF4444' : colors.text }]}>Global Kill Switch</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Stops ALL active campaigns immediately</Text>
            </View>
            {killing ? <ActivityIndicator size="small" color="#EF4444" /> : (
              <Switch value={globalKill} onValueChange={handleKillSwitch} trackColor={{ false: colors.border, true: colors.error }} thumbColor={colors.text} />
            )}
          </View>
        </View>

        {/* Engine Status */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Engine Status</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#7C3AED' }]}>{activeCampaigns}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Campaigns</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#22C55E' }]}>{String(lastRunData?.slotsReleased ?? '—')}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Tick Slots</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FBBF24' }]}>{lastRunData?.ranAtISO ? new Date(lastRunData.ranAtISO as string).toLocaleTimeString() : '—'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Tick At</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.tickBtn, ticking && { opacity: 0.6 }]} onPress={handleRunTick} disabled={ticking}>
            {ticking ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="play" size={16} color="#fff" />}
            <Text style={styles.tickBtnText}>{ticking ? 'Running…' : 'Run Engine Tick Now'}</Text>
          </TouchableOpacity>
        </View>

        {/* Campaign summary */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Campaign Summary</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#7C3AED" style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.statsRow}>
              {(['active', 'paused', 'draft', 'ended', 'killed'] as const).map((status) => {
                const count = campaigns.filter((c) => c.status === status).length;
                const statusColors: Record<string, string> = {
                  active: '#22C55E',
                  paused: '#FBBF24',
                  draft: '#94A3B8',
                  ended: '#64748B',
                  killed: '#EF4444',
                };
                return (
                  <View key={status} style={styles.statItem}>
                    <Text style={[styles.statValue, { color: statusColors[status] }]}>{count}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick navigation */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Admin Sections</Text>
          {[
            { label: 'Visit Audit Explorer', icon: 'search', route: '/admin/orbpilot/audit', color: '#0EA5E9' },
            { label: 'Trust Tier Manager', icon: 'shield-checkmark', route: '/admin/orbpilot/trust', color: '#22C55E' },
            { label: 'Partner Risk Manager', icon: 'warning', route: '/admin/orbpilot/risk', color: '#F59E0B' },
            { label: 'Rules & Thresholds', icon: 'settings', route: '/admin/orbpilot/rules', color: '#A78BFA' },
          ].map((item) => (
            <TouchableOpacity key={item.route} style={styles.navRow} onPress={() => router.push(item.route as any)}>
              <View style={[styles.navIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.md, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  card: { borderRadius: RADIUS.md, padding: SPACE.md, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 13 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statsRow: { flexDirection: 'row', marginTop: 12, marginBottom: 16, gap: 8 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  tickBtn: { backgroundColor: '#7C3AED', borderRadius: RADIUS.md, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tickBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  navIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  navLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
});
