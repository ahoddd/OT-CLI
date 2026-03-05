import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import {
  pilotAdminAbuse,
  pilotRestrictUser,
  pilotLiftUserRestriction,
} from '../../../services/orbPilot';

export default function OrbPilotAbuseScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<{
    bruteForceFlags: Record<string, unknown>[];
    highRejection: Record<string, unknown>[];
    restricted: Record<string, unknown>[];
  }>({ bruteForceFlags: [], highRejection: [], restricted: [] });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'brute' | 'rejections' | 'restricted'>('brute');
  const [restrictForm, setRestrictForm] = useState({ userId: '', reason: '', expiresISO: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pilotAdminAbuse();
      if (res.success) {
        setData({
          bruteForceFlags: res.bruteForceFlags as Record<string, unknown>[],
          highRejection: res.highRejection as Record<string, unknown>[],
          restricted: res.restricted as Record<string, unknown>[],
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestrictUser = async () => {
    const { userId, reason, expiresISO } = restrictForm;
    if (!userId.trim() || !reason.trim()) { Alert.alert('Missing', 'userId and reason required'); return; }
    const res = await pilotRestrictUser(userId.trim(), 'temporary_ban', reason.trim(), expiresISO.trim() || undefined);
    if (res.success) { Alert.alert('Restricted', `User ${userId} restricted`); load(); setRestrictForm({ userId: '', reason: '', expiresISO: '' }); }
    else Alert.alert('Error', res.message);
  };

  const handleLift = async (userId: string) => {
    Alert.alert('Lift Restriction', `Remove restriction for ${userId}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Lift', onPress: async () => { await pilotLiftUserRestriction(userId); load(); } },
    ]);
  };

  const TABS = [
    { key: 'brute', label: `Brute Force (${data.bruteForceFlags.length})` },
    { key: 'rejections', label: `High Rejection (${data.highRejection.length})` },
    { key: 'restricted', label: `Restricted (${data.restricted.length})` },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={[styles.title, { color: colors.text }]}>Abuse Monitor</Text>

        {/* Tab bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key as typeof tab)}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Restrict User Form (always visible) */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Restrict a User</Text>
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]} placeholder="User UID" placeholderTextColor={colors.textMuted} value={restrictForm.userId} onChangeText={(t) => setRestrictForm((p) => ({ ...p, userId: t }))} autoCapitalize="none" />
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]} placeholder="Reason" placeholderTextColor={colors.textMuted} value={restrictForm.reason} onChangeText={(t) => setRestrictForm((p) => ({ ...p, reason: t }))} />
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]} placeholder="Expires ISO (optional)" placeholderTextColor={colors.textMuted} value={restrictForm.expiresISO} onChangeText={(t) => setRestrictForm((p) => ({ ...p, expiresISO: t }))} />
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={handleRestrictUser}>
            <Ionicons name="ban" size={16} color="#fff" />
            <Text style={styles.btnText}>Restrict User</Text>
          </TouchableOpacity>
        </View>

        {/* Brute Force Tab */}
        {tab === 'brute' && data.bruteForceFlags.map((item, i) => (
          <View key={i} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: '#EF444433' }]}>
            <Ionicons name="key-outline" size={16} color="#EF4444" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.itemField, { color: colors.text }]}>User: {String(item.userId)}</Text>
              <Text style={[styles.itemField, { color: colors.textSecondary }]}>Partner: {String(item.partnerId || '—')}</Text>
              <Text style={[styles.itemField, { color: colors.textMuted }]}>{String(item.createdAt || '').slice(0, 16)}</Text>
            </View>
          </View>
        ))}

        {/* High Rejection Tab */}
        {tab === 'rejections' && data.highRejection.map((item, i) => (
          <View key={i} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: '#FBBF2433' }]}>
            <Ionicons name="close-circle-outline" size={16} color="#FBBF24" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.itemField, { color: colors.text }]}>User: {String(item.userId || '—')}</Text>
              <Text style={[styles.itemField, { color: colors.textSecondary }]}>Rejections 30d: {String(item.rejections30d)}</Text>
              <Text style={[styles.itemField, { color: colors.textSecondary }]}>Tier: {String(item.tier || 'bronze')}</Text>
            </View>
          </View>
        ))}

        {/* Restricted Tab */}
        {tab === 'restricted' && data.restricted.map((item, i) => (
          <View key={i} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: '#7C3AED33' }]}>
            <Ionicons name="ban-outline" size={16} color="#7C3AED" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.itemField, { color: colors.text }]}>User: {String(item.userId || item.id || '—')}</Text>
              <Text style={[styles.itemField, { color: colors.textSecondary }]}>Type: {String(item.type || '—')}</Text>
              <Text style={[styles.itemField, { color: colors.textSecondary }]}>Reason: {String(item.reason || '—')}</Text>
              {item.expiresISO && <Text style={[styles.itemField, { color: colors.textMuted }]}>Expires: {String(item.expiresISO).slice(0, 16)}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleLift(String(item.id || item.userId || ''))}>
              <Ionicons name="arrow-up-circle-outline" size={22} color="#22C55E" />
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 14 },
  tabRow: { marginBottom: 14 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1A1A2E', marginRight: 8 },
  tabActive: { backgroundColor: '#7C3AED' },
  tabLabel: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  tabLabelActive: { color: '#fff' },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  input: { borderRadius: 10, borderWidth: 1, padding: 10, fontSize: 13, marginBottom: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, justifyContent: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  itemCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  itemField: { fontSize: 13, marginBottom: 3 },
});
