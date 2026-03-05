/**
 * OrbIntent™ — Home: Feed, My Intents, Rules, Partner Inbox (partner only).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { COLORS } from '../../constants/Colors';
import { INTENT_CATEGORY_LABELS } from '../../constants/orbIntent';
import * as api from '../../services/orbIntent';
import type { IntentDoc } from '../../constants/orbIntent';
import { useI18n } from '../../context/I18nContext';

type TabKey = 'feed' | 'mine' | 'rules' | 'inbox';

export default function OrbIntentHomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold?.[0];
  const { flags } = useFlags();
  const { isPartner } = useEffectiveTier();

  const [tab, setTab] = useState<TabKey>('feed');
  const [feed, setFeed] = useState<IntentDoc[]>([]);
  const [myIntents, setMyIntents] = useState<IntentDoc[]>([]);
  const [inbox, setInbox] = useState<IntentDoc[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    const res = await api.intentFeed({ limit: 30 });
    if (res.success) {
      setFeed(res.intents ?? []);
      setError(null);
    } else setError(res.message ?? 'Could not load feed.');
  }, []);
  const loadMine = useCallback(async () => {
    const res = await api.intentListMine(50);
    if (res.success) {
      setMyIntents(res.intents ?? []);
      setError(null);
    } else setError(res.message ?? 'Could not load.');
  }, []);
  const loadInbox = useCallback(async () => {
    const res = await api.intentListForPartner(50);
    if (res.success) {
      setInbox(res.intents ?? []);
      setError(null);
    } else setError(res.message ?? 'Could not load.');
  }, []);
  const loadRules = useCallback(async () => {
    const res = await api.ruleList(50);
    if (res.success) {
      setRules(res.rules ?? []);
      setError(null);
    } else setError(res.message ?? 'Could not load.');
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    if (tab === 'feed') await loadFeed();
    else if (tab === 'mine') await loadMine();
    else if (tab === 'inbox') await loadInbox();
    else await loadRules();
    setRefreshing(false);
  }, [tab, loadFeed, loadMine, loadInbox, loadRules]);

  useEffect(() => {
    setLoading(true);
    loadFeed().finally(() => setLoading(false));
  }, [loadFeed]);

  useEffect(() => {
    if (tab === 'feed') return;
    setError(null);
    setTabLoading(true);
    const load = tab === 'mine' ? loadMine : tab === 'inbox' ? loadInbox : loadRules;
    load().finally(() => setTabLoading(false));
  }, [tab, loadMine, loadInbox, loadRules]);

  if (!flags.isOrbIntentEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Deal Match</Text>
        </View>
        <View style={styles.offState}>
          <Ionicons name="flash-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.offTitle, { color: colors.text }]}>Deal Match is off</Text>
          <Text style={[styles.offSub, { color: colors.textSecondary }]}>Enable it in Admin Hub to post intents and receive offers.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'mine', label: 'My Intents' },
    { key: 'rules', label: 'Rules' },
  ];
  if (isPartner) tabs.push({ key: 'inbox', label: 'Inbox' });

  const list = tab === 'feed' ? feed : tab === 'mine' ? myIntents : tab === 'inbox' ? inbox : rules;
  const isIntentList = tab !== 'rules';
  const emptyMessage = tab === 'feed' ? 'No open intents' : tab === 'mine' ? 'You haven’t created any intents' : tab === 'inbox' ? 'No eligible intents' : 'No rules yet';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Deal Match</Text>
        {isPartner && (
          <TouchableOpacity onPress={() => router.push('/intent/verify')} style={styles.postBtn}>
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.push('/intent/create')} style={styles.postBtn}>
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabPill, tab === t.key && { borderBottomColor: COLORS.neonBlue?.[0] ?? colors.primary }]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, { color: colors.text }, tab === t.key && { color: COLORS.neonBlue?.[0], fontWeight: '700' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />}
      >
        {(loading && tab === 'feed') || (tabLoading && tab !== 'feed') ? (
          <View style={styles.loadWrap}>
            <ActivityIndicator size="small" color={COLORS.neonBlue?.[0]} />
            <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{error}</Text>
          </View>
        ) : Array.isArray(list) && list.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyMessage}</Text>
            {tab === 'feed' && (
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? colors.primary }]} onPress={() => router.push('/intent/create')}>
                <Text style={styles.primaryBtnText}>Create intent</Text>
              </TouchableOpacity>
            )}
            {tab === 'rules' && (
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? colors.primary }]} onPress={() => router.push('/intent/rules/create')}>
                <Text style={styles.primaryBtnText}>Create rule</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : isIntentList ? (
          (list as IntentDoc[]).map((intent) => (
            <TouchableOpacity
              key={intent.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/intent/[id]', params: { id: intent.id } } as any)}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{intent.title}</Text>
              <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                {INTENT_CATEGORY_LABELS[intent.category as keyof typeof INTENT_CATEGORY_LABELS]} · ${(intent.budget as any)?.min ?? 0}–${(intent.budget as any)?.max ?? 0} · {intent.status}
              </Text>
              {(intent as any).intentScore >= 70 && (
                <View style={styles.highScore}>
                  <Ionicons name="flash" size={12} color={themeGold} />
                  <Text style={[styles.highScoreText, { color: themeGold }]}>High likelihood</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 16 }]} onPress={() => router.push('/intent/rules/create')}>
              <Text style={[styles.primaryBtnText, { color: colors.text }]}>Create rule</Text>
            </TouchableOpacity>
            {(list as any[]).map((rule) => (
              <View key={rule.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{rule.name}</Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{rule.category} · {rule.enabled ? 'On' : 'Off'}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  postBtn: { padding: 8 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tabPill: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  loadWrap: { padding: 24, alignItems: 'center' },
  loadText: { marginTop: 8 },
  empty: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: 'center' },
  primaryBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  card: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardMeta: { fontSize: 12 },
  highScore: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  highScoreText: { fontSize: 11, fontWeight: '600' },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  offSub: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
