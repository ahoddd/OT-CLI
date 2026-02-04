import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useFlags } from '../../components/FlagContext';
import { DEFAULT_FLAGS, type FlagKey, type MapProvider } from '../../constants/Flags';
import { useRouter } from 'expo-router';
import { useOrbinomics } from '../../context/OrbinomicsContext';
import { DEFAULT_ORBINOMICS, type OrbinomicsConfig } from '../../constants/Orbinomics';

const APP_VERSION = '1.0.0';
const EXPO_SDK_VERSION = Constants.expoConfig?.sdkVersion ?? '52';

const BOOLEAN_KEYS: FlagKey[] = [
  'isMapboxEnabled',
  'isFirestoreLiveEnabled',
  'isRedemptionEnabled',
  'isShareEnabled',
  'isFollowEnabled',
  'isCirclesEnabled',
  'isOrbSignalEnabled',
  'isOrbTapStreakEnabled',
  'isPremiumUserEnabled',
  'isPartnerProEnabled',
  'isDebugMenuEnabled',
  'isOrbProofEnabled',
  'isOrbDropsEnabled',
  'isOrbQuestEnabled',
  'isOrbPassEnabled',
  'isOrbPulseEnabled',
  'isOrbCircleEnabled',
  'isOrbKeyEnabled',
  'isOrbWalletEnabled',
  'isOrbinomicsEnabled',
  'walletSpendQuestReroll',
  'walletSpendQuestBooster',
  'walletSpendDropReserveFee',
  'walletSpendDropEarlyAccess',
  'walletSpendStreakShield',
  'walletSpendMultiplier24h',
  'walletSpendReceiptCosmetics',
  'walletSpendCircleBonusPool',
  'walletSpendPulseAlertsFilters',
  'isOrbScopeEnabled',
  'isOrbScopeShareCardEnabled',
  'isOrbScopeStreakEnabled',
  'isOrbScopeNotificationsEnabled',
  // OrbArena™
  'isOrbArenaEnabled',
  'isOrbArenaSubmitEnabled',
  'isOrbArenaVoteEnabled',
  'isOrbArenaVoteWeightingEnabled',
  'isOrbArenaIntegrityPanelEnabled',
  'isOrbArenaPulseSurfacingEnabled',
];

const MAP_PROVIDER_OPTIONS: MapProvider[] = ['mapbox', 'native', 'none'];

function formatAuditTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminHub() {
  const { flags, setFlag, resetFlags, auditLog } = useFlags();
  const { config: orbinomicsConfig, setConfig: setOrbinomicsConfig, resetConfig: resetOrbinomicsConfig } = useOrbinomics();
  const router = useRouter();
  const lastFive = auditLog.slice(-5).reverse();

  const [burnRate, setBurnRate] = useState(String(orbinomicsConfig.burnRateOnSpend));
  const [feeRate, setFeeRate] = useState(String(orbinomicsConfig.feeRateOnEarn));
  const [appreciation, setAppreciation] = useState(String(orbinomicsConfig.appreciationFactor));
  const [minThreshold, setMinThreshold] = useState(String(orbinomicsConfig.minPointsThreshold));

  useEffect(() => {
    setBurnRate(String(orbinomicsConfig.burnRateOnSpend));
    setFeeRate(String(orbinomicsConfig.feeRateOnEarn));
    setAppreciation(String(orbinomicsConfig.appreciationFactor));
    setMinThreshold(String(orbinomicsConfig.minPointsThreshold));
  }, [orbinomicsConfig]);

  const applyOrbinomics = () => {
    const c: OrbinomicsConfig = {
      ...orbinomicsConfig,
      burnRateOnSpend: Math.max(0, Math.min(1, parseFloat(burnRate) || 0)),
      feeRateOnEarn: Math.max(0, Math.min(1, parseFloat(feeRate) || 0)),
      appreciationFactor: Math.max(0.5, Math.min(3, parseFloat(appreciation) || 1)),
      minPointsThreshold: Math.max(0, Math.floor(parseFloat(minThreshold) || 0)),
    };
    setOrbinomicsConfig(c);
  };

  const handleResetOrbinomics = () => {
    resetOrbinomicsConfig();
    setBurnRate(String(DEFAULT_ORBINOMICS.burnRateOnSpend));
    setFeeRate(String(DEFAULT_ORBINOMICS.feeRateOnEarn));
    setAppreciation(String(DEFAULT_ORBINOMICS.appreciationFactor));
    setMinThreshold(String(DEFAULT_ORBINOMICS.minPointsThreshold));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Hub</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expo SDK Version</Text>
            <Text style={styles.infoValue}>{EXPO_SDK_VERSION}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Map Provider</Text>
          <View style={styles.pillRow}>
            {MAP_PROVIDER_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.pill,
                  flags.mapProvider === p && styles.pillActive,
                ]}
                onPress={() => setFlag('mapProvider', p)}
              >
                <Text
                  style={[
                    styles.pillText,
                    flags.mapProvider === p && styles.pillTextActive,
                  ]}
                >
                  {p.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feature Flags</Text>
          {BOOLEAN_KEYS.map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key}</Text>
              <Switch
                value={Boolean(flags[key])}
                onValueChange={(val) => setFlag(key, val)}
                trackColor={{ false: '#333', true: '#4ade80' }}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audit Log (last 5)</Text>
          {lastFive.length === 0 ? (
            <Text style={styles.auditEmpty}>No flag changes yet.</Text>
          ) : (
            lastFive.map((entry, i) => (
              <View key={`${entry.timestamp}-${i}`} style={styles.auditRow}>
                <Text style={styles.auditKey}>{entry.key}</Text>
                <Text style={styles.auditValue}>
                  {typeof entry.value === 'boolean' ? String(entry.value) : entry.value}
                </Text>
                <Text style={styles.auditTime}>{formatAuditTime(entry.timestamp)}</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity onPress={resetFlags} style={styles.resetButton}>
          <Text style={styles.resetText}>Reset Defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 16 },
  backText: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scroll: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: {
    color: '#888',
    marginBottom: 16,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  infoLabel: { color: '#aaa', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  pillActive: { backgroundColor: '#4ade80' },
  pillText: { color: '#888', fontSize: 11, fontWeight: 'bold' },
  pillTextActive: { color: '#000' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  label: { color: '#fff', fontSize: 14, flex: 1 },
  auditEmpty: { color: '#666', fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
  auditRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  auditKey: { color: '#aaa', fontSize: 12 },
  auditValue: { color: '#fff', fontSize: 12, marginTop: 2 },
  auditTime: { color: '#666', fontSize: 10, marginTop: 2 },
  resetButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  resetText: { color: '#fff', fontWeight: 'bold' },
  orbinomicsHint: { color: '#666', fontSize: 12, marginBottom: 12 },
  orbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  orbLabel: { color: '#aaa', fontSize: 13, flex: 1 },
  orbInput: {
    backgroundColor: '#222',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    fontSize: 14,
  },
  orbResetBtn: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  orbResetText: { color: '#a78bfa', fontWeight: 'bold', fontSize: 13 },
});
