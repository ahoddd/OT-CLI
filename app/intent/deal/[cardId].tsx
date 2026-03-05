/**
 * OrbIntent™ — Deal Done Card: preview + share.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { dealDoneDeepLink } from '../../../constants/AppLinks';
import { ShareToSocialSheet } from '../../../components/ShareToSocialSheet';
import * as api from '../../../services/orbIntent';
import { useI18n } from '../../../context/I18nContext';

export default function DealDoneCardScreen() {
  const { t } = useI18n();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareVisible, setShareVisible] = useState(false);

  React.useEffect(() => {
    if (!cardId) return;
    api.dealDoneGet(cardId).then((res) => {
      if (res.success) setCard(res.card);
      setLoading(false);
    });
  }, [cardId]);

  if (loading && !card) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Deal Done Card</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.errText, { color: colors.text }]}>Card not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const summary = card.summary || {};
  const timeToWinHours = (summary.timeToWinSeconds ?? 0) / 3600;
  const payload = {
    message: `I closed this deal on Deal Match: ${summary.title}. ${summary.savingsText}. Time to win: ${timeToWinHours.toFixed(1)}h.`,
    title: 'Deal Match — Deal Done Card',
    url: dealDoneDeepLink(card.id),
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Deal Done Card</Text>
        <TouchableOpacity onPress={() => setShareVisible(true)} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.badge, { color: colors.textSecondary }]}>Deal Match</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{summary.title}</Text>
          <View style={[styles.row, { borderTopColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Time to win</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{timeToWinHours.toFixed(1)} hours</Text>
          </View>
          <View style={[styles.row, { borderTopColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Value</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{summary.savingsText ?? '—'}</Text>
          </View>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{summary.verifiedAt ? new Date(summary.verifiedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}</Text>
        </View>
        <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShareVisible(true)}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
          <Text style={[styles.shareButtonText, { color: colors.text }]}>Share Deal Done Card</Text>
        </TouchableOpacity>
      </ScrollView>
      <ShareToSocialSheet visible={shareVisible} onClose={() => setShareVisible(false)} payload={payload} label="Share Deal Card" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  shareBtn: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { fontSize: 14 },
  errText: { fontSize: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { padding: 24, borderRadius: 16, borderWidth: 1 },
  badge: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 12, marginTop: 12 },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginTop: 24 },
  shareButtonText: { fontSize: 16, fontWeight: '700' },
});
