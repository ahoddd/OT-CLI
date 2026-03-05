/**
 * Upgrades — All OT Points power-ups. Costs from Orbinomics policy.
 * Each power-up has real utility that drives engagement and spending loops.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OTPointsBadge } from '../components/OTPointsBadge';
import { useTheme } from '../hooks/useTheme';
import { useWallet } from '../hooks/useWallet';
import { COLORS } from '../constants/Colors';
import { DEFAULT_ORBINOMICS_POLICY, LEDGER_REASON } from '../constants/OrbinomicsPolicy';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { showErrorAlert } from '../utils/alert';
import { useI18n } from '../context/I18nContext';

const POWER_UPS: Array<{
  productKey: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  category: 'protect' | 'boost' | 'unlock' | 'social';
}> = [
  { productKey: 'streak_shield', title: 'Streak Shield', description: 'Protect your streak for one missed day. Keep the chain alive.', icon: 'shield-checkmark', accent: '#EF4444', category: 'protect' },
  { productKey: 'multiplier_24h', title: '24h Multiplier', description: 'Double your OT Points earnings for 24 hours. Stack with missions.', icon: 'flash', accent: '#FBBF24', category: 'boost' },
  { productKey: 'quest_reroll', title: 'Mission Reroll', description: 'Don\u2019t like a mission? Reroll for a new one. Up to 2 per day.', icon: 'refresh', accent: '#22C55E', category: 'boost' },
  { productKey: 'quest_booster', title: 'Mission Booster', description: 'Earn 50% more OT Points on your next completed mission.', icon: 'rocket', accent: '#A78BFA', category: 'boost' },
  { productKey: 'early_access_unlock', title: 'Early Access', description: 'Unlock early access to new drops and features before everyone else.', icon: 'key', accent: COLORS.neonBlue[0], category: 'unlock' },
  { productKey: 'drop_reserve_fee', title: 'Drop Reserve', description: 'Reserve a spot on a limited drop before it sells out. Up to 5/day.', icon: 'bookmark', accent: '#EC4899', category: 'unlock' },
  { productKey: 'pulse_alerts_filters', title: 'Pulse Alerts', description: 'Get notified when trending drops and partners match your preferences.', icon: 'notifications', accent: '#F59E0B', category: 'unlock' },
  { productKey: 'receipt_cosmetics', title: 'Proof Card Frames', description: 'Custom frames for your proof cards. Stand out when you share.', icon: 'color-palette', accent: '#8B5CF6', category: 'social' },
  { productKey: 'circle_bonus_pool', title: 'Sphere Bonus Pool', description: 'Contribute to your Sphere\u2019s shared bonus pool. Help your crew earn more.', icon: 'people', accent: '#0EA5E9', category: 'social' },
];

function getCost(productKey: string): number {
  const rule = DEFAULT_ORBINOMICS_POLICY.burnRules.find((r) => r.productKey === productKey);
  return rule?.costPoints ?? 0;
}

function getCooldownLabel(productKey: string): string | null {
  const rule = DEFAULT_ORBINOMICS_POLICY.burnRules.find((r) => r.productKey === productKey);
  if (!rule) return null;
  const parts: string[] = [];
  if (rule.cooldownDays) parts.push(`${rule.cooldownDays}d cooldown`);
  if (rule.maxPerDay) parts.push(`${rule.maxPerDay}/day`);
  return parts.length ? parts.join(' \u00B7 ') : null;
}

const CATEGORY_LABELS: Record<string, string> = {
  protect: 'PROTECT',
  boost: 'BOOST',
  unlock: 'UNLOCK',
  social: 'SOCIAL',
};

export default function UpgradesScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { balance, spend, history } = useWallet();
  const [confirmProduct, setConfirmProduct] = useState<{ productKey: string; title: string; cost: number } | null>(null);

  const handleActivate = (productKey: string, title: string) => {
    const cost = getCost(productKey);
    if (balance < cost) {
      showErrorAlert('Not enough OT', `You need ${cost} OT Points. Earn more by scanning at partners.`);
      return;
    }
    setConfirmProduct({ productKey, title, cost });
  };

  const handleConfirmSpend = async () => {
    if (!confirmProduct) return;
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = await spend({ productKey: confirmProduct.productKey, amountExpected: confirmProduct.cost });
    setConfirmProduct(null);
    if (!result.success) {
      showErrorAlert('Couldn\u2019t activate', result.reason ?? 'Please try again later.');
    }
  };

  const activePowerUps = React.useMemo(() => {
    const now = Date.now();
    const H24 = 24 * 60 * 60 * 1000;
    const list: { key: string; label: string; expiresAt: number }[] = [];
    (history || []).forEach((tx) => {
      if (tx.type !== 'spend') return;
      const ts = tx.createdAt ?? 0;
      if (ts <= 0) return;
      if (tx.reason === LEDGER_REASON.BURN_MULTIPLIER_24H && ts + H24 > now) {
        list.push({ key: 'multiplier_24h', label: '24h Multiplier', expiresAt: ts + H24 });
      }
      if (tx.reason === LEDGER_REASON.BURN_STREAK_SHIELD && ts + H24 > now) {
        list.push({ key: 'streak_shield', label: 'Streak Shield', expiresAt: ts + H24 });
      }
    });
    return list.filter((p) => p.expiresAt > now);
  }, [history]);

  const categories = ['protect', 'boost', 'unlock', 'social'] as const;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Power-ups</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/wallet' as any)} style={styles.walletBtn}>
          <OTPointsBadge amount={balance} size={24} label="" compact textColor={themeGold} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activePowerUps.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.activeSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.activeSectionTitle, { color: colors.text }]}>Active Power-Ups</Text>
            {activePowerUps.map((p) => {
              const minsLeft = Math.max(0, Math.floor((p.expiresAt - Date.now()) / 60000));
              const h = Math.floor(minsLeft / 60);
              const m = minsLeft % 60;
              return (
                <View key={p.key} style={[styles.activeRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.activeLabel, { color: colors.text }]}>{p.label}</Text>
                  <Text style={[styles.activeTimer, { color: themeGold }]}>{h}h {m}m left</Text>
                </View>
              );
            })}
          </Animated.View>
        )}
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available balance</Text>
          <Text style={[styles.balanceValue, { color: colors.text }]}>{balance.toLocaleString()} OT</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/scan' as any)} style={[styles.earnMoreBtn, { backgroundColor: COLORS.neonBlue[0] + '15' }]}>
            <Ionicons name="qr-code" size={16} color={COLORS.neonBlue[0]} />
            <Text style={[styles.earnMoreText, { color: COLORS.neonBlue[0] }]}>Scan to earn more</Text>
          </TouchableOpacity>
        </Animated.View>

        {categories.map((cat) => {
          const items = POWER_UPS.filter((p) => p.category === cat);
          if (items.length === 0) return null;
          return (
            <View key={cat}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{CATEGORY_LABELS[cat]}</Text>
              {items.map((item, i) => {
                const cost = getCost(item.productKey);
                const canAfford = balance >= cost;
                const cooldown = getCooldownLabel(item.productKey);
                return (
                  <Animated.View
                    key={item.productKey}
                    entering={FadeInDown.delay(100 + i * 50).duration(400)}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.cardTop}>
                      <View style={[styles.iconWrap, { backgroundColor: item.accent + '18' }]}>
                        <Ionicons name={item.icon} size={22} color={item.accent} />
                      </View>
                      <View style={styles.cardTextWrap}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                        {cooldown && <Text style={[styles.cooldownText, { color: colors.textSecondary }]}>{cooldown}</Text>}
                      </View>
                    </View>
                    <View style={styles.cardBottom}>
                      <Text style={[styles.costText, { color: themeGold }]}>{cost} OT</Text>
                      <TouchableOpacity
                        style={[styles.activateBtn, { backgroundColor: canAfford ? item.accent : colors.surfaceHighlight ?? colors.border }]}
                        onPress={() => handleActivate(item.productKey, item.title)}
                        disabled={!canAfford}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.activateText, { color: canAfford ? '#000' : colors.textSecondary }]}>
                          {canAfford ? 'Activate' : 'Need more OT'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={!!confirmProduct} transparent animationType="fade">
        <Pressable style={styles.confirmBackdrop} onPress={() => setConfirmProduct(null)}>
          <View style={[styles.confirmBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Confirm spend</Text>
            {confirmProduct && (
              <>
                <Text style={[styles.confirmBody, { color: colors.textSecondary }]}>
                  You'll spend {confirmProduct.cost} OT on {confirmProduct.title}. Continue?
                </Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={[styles.confirmBtn, styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setConfirmProduct(null)}>
                    <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: themeGold }]} onPress={handleConfirmSpend}>
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  topBarTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  walletBtn: { paddingHorizontal: 8 },
  scroll: { padding: 20, paddingBottom: 40 },
  activeSection: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 16 },
  activeSectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1 },
  activeLabel: { fontSize: 14, fontWeight: '600' },
  activeTimer: { fontSize: 13, fontWeight: '700' },
  balanceCard: { borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 24, alignItems: 'center' },
  balanceLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 12 },
  earnMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  earnMoreText: { fontSize: 13, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12, marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTextWrap: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  cardDesc: { fontSize: 13, lineHeight: 19 },
  cooldownText: { fontSize: 11, fontWeight: '600', marginTop: 4, opacity: 0.7 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  costText: { fontSize: 16, fontWeight: '800' },
  activateBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  activateText: { fontSize: 14, fontWeight: '800' },
  confirmBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: { width: '100%', maxWidth: 340, borderRadius: 20, borderWidth: 1, padding: 24 },
  confirmTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  confirmBody: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  confirmActions: { flexDirection: 'row', gap: 12 },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontWeight: '700' },
  confirmBtnText: { fontSize: 15, fontWeight: '800', color: '#000' },
});
