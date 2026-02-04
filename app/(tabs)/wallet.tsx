import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../hooks/useWallet';
import { useGamification } from '../../hooks/useGamification';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';
import { useDrops } from '../../hooks/useDrops';
import { PremiumCard } from '../../components/PremiumCard';
import { WalletActions } from '../../components/Wallet/WalletActions';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { COLORS } from '../../constants/Colors';
import { DEFAULT_ORBINOMICS_POLICY } from '../../constants/OrbinomicsPolicy';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const EARN_NEXT_LABELS: Record<string, string> = {
  quest_reroll: 'Quest Reroll',
  quest_booster: 'Quest Booster',
  drop_reserve_fee: 'Drop Reserve',
  early_access_unlock: 'Early Access',
  streak_shield: 'Streak Shield',
  multiplier_24h: '24h Multiplier',
  receipt_cosmetics: 'Receipt Frames',
  circle_bonus_pool: 'Circle Pool',
  pulse_alerts_filters: 'Pulse Alerts',
};

export default function WalletScreen() {
  const router = useRouter();
  const { balance, history, verifiedActions, spend } = useWallet();
  const { rank } = useGamification();
  const { colors, isDark } = useTheme();
  const { flags } = useFlags();
  const { drops } = useDrops();

  const safeHistory = (history || []).slice(0, 10);
  const [activeAction, setActiveAction] = useState<'send' | 'receive' | 'swap' | 'redeem' | null>(null);
  const [spendingKey, setSpendingKey] = useState<string | null>(null);

  const hasVerifiedActions = (verifiedActions?.length ?? 0) > 0;
  const hasLiveDrops = drops.some((d) => d.qtyRemaining > 0 && Date.now() >= d.startAt && Date.now() <= d.endAt);
  const earnNextCta =
    !hasVerifiedActions ? 'Get your first OrbProof' : hasLiveDrops ? 'Reserve a drop' : 'Start a quest';
  const earnNextRoute =
    !hasVerifiedActions ? '/(tabs)/scan' : hasLiveDrops ? '/pulse' : '/missions';

  const handleSpend = async (productKey: string) => {
    const rule = DEFAULT_ORBINOMICS_POLICY.burnRules.find((r) => r.productKey === productKey);
    if (!rule) return;
    setSpendingKey(productKey);
    const result = await spend({
      productKey,
      amountExpected: rule.costPoints,
    });
    setSpendingKey(null);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Spend failed', result.reason);
    }
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)/scan' as any);
  };

  const handleAction = (type: any) => {
    Haptics.selectionAsync();
    setActiveAction(type);
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <WalletActions action={activeAction} onClose={() => setActiveAction(null)} balance={balance} />
        
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <SafeAreaView edges={['top']}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>ASSET VAULT</Text>
                <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Portfolio Value: ${(balance * 0.05).toFixed(2)} USD</Text>
            </SafeAreaView>
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleScan}
            >
              <Ionicons name="qr-code" size={22} color={colors.text} />
            </TouchableOpacity>
        </Animated.View>

        {/* THE CARD */}
        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.cardContainer}>
            <PremiumCard balance={balance} rank={rank} />
        </Animated.View>

        {/* ACTIONS */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.actionsRow}>
            <ActionButton icon="paper-plane" label="Send" onPress={() => handleAction('send')} colors={colors} isDark={isDark} />
            <ActionButton icon="qr-code" label="Receive" onPress={() => handleAction('receive')} colors={colors} isDark={isDark} />
            <ActionButton icon="swap-horizontal" label="Swap" onPress={() => handleAction('swap')} colors={colors} isDark={isDark} />
            <ActionButton icon="gift" label="Redeem" onPress={() => handleAction('redeem')} colors={colors} isDark={isDark} />
        </Animated.View>

        {/* EARN NEXT (OrbWallet) */}
        {flags.isOrbWalletEnabled && (
          <Animated.View entering={FadeInDown.delay(450).duration(500)} style={[styles.earnNextWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.earnNextTitle, { color: colors.textSecondary }]}>Earn next</Text>
            <TouchableOpacity
              style={styles.earnNextCta}
              onPress={() => router.push(earnNextRoute as any)}
            >
              <Text style={[styles.earnNextCtaText, { color: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}>{earnNextCta}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.neonBlue?.[0] ?? '#60a5fa'} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* SPEND POWER-UPS (OrbWallet) */}
        {flags.isOrbWalletEnabled && flags.isOrbinomicsEnabled && (
          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SPEND POWER-UPS</Text>
            <View style={[styles.powerUpsWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {DEFAULT_ORBINOMICS_POLICY.burnRules.slice(0, 6).map((r) => (
                <View key={r.productKey} style={[styles.powerUpRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.powerUpInfo}>
                    <Text style={[styles.powerUpName, { color: colors.text }]}>{EARN_NEXT_LABELS[r.productKey] ?? r.productKey}</Text>
                    <Text style={[styles.powerUpCost, { color: colors.textSecondary }]}>{r.costPoints} OT</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.powerUpBtn, { backgroundColor: (COLORS.neonBlue?.[0] ?? '#60a5fa') + '20' }]}
                    onPress={() => handleSpend(r.productKey)}
                    disabled={balance < r.costPoints || spendingKey === r.productKey}
                  >
                    <Text style={[styles.powerUpBtnText, { color: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}>
                      {spendingKey === r.productKey ? '…' : 'Use'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* LEDGER */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT ACTIVITY</Text>
        </View>
        
        <View style={[styles.historyList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {safeHistory.map((item, index) => (
                <Animated.View 
                    key={item.id} 
                    entering={FadeInDown.delay(600 + (index * 50)).duration(500)}
                    style={[styles.historyItem, { borderBottomColor: colors.border }]}
                >
                    <View style={[styles.iconBox, { backgroundColor: item.amount > 0 ? (isDark ? 'rgba(74, 222, 128, 0.1)' : '#e6fcf5') : (isDark ? 'rgba(255,255,255,0.1)' : '#f1f3f5') }]}>
                        <Ionicons 
                            name={item.amount > 0 ? "arrow-down" : "arrow-up"} 
                            size={18} 
                            color={item.amount > 0 ? COLORS.success : colors.text} 
                        />
                    </View>
                    <View style={styles.historyInfo}>
                        <Text style={[styles.historyTitle, { color: colors.text }]}>{item.reason}</Text>
                        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={[styles.historyAmount, { color: item.amount > 0 ? COLORS.success : colors.text }]}>
                        {item.amount > 0 ? '+' : ''}{item.amount}
                    </Text>
                </Animated.View>
            ))}
            {safeHistory.length === 0 && (
                <Text style={{ padding: 20, textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic' }}>No transactions yet.</Text>
            )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const ActionButton = ({ icon, label, onPress, colors, isDark }: any) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
        <View style={[styles.actionIcon, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            shadowColor: isDark ? '#000' : '#ccc',
            shadowOpacity: isDark ? 0 : 0.2,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: isDark ? 0 : 2
        }]}>
            <Ionicons name={icon} size={22} color={colors.text} />
        </View>
        <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  headerSub: { fontSize: 12, marginTop: 4 },
  scanBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginTop: 4 },
  cardContainer: { alignItems: 'center', marginBottom: 30 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingHorizontal: 10 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  actionLabel: { fontSize: 11, fontWeight: 'bold' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  earnNextWrap: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  earnNextTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  earnNextCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  earnNextCtaText: { fontSize: 15, fontWeight: '700' },
  powerUpsWrap: { borderRadius: 16, borderWidth: 1, padding: 4, marginTop: 8 },
  powerUpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1 },
  powerUpInfo: {},
  powerUpName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  powerUpCost: { fontSize: 12 },
  powerUpBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  powerUpBtnText: { fontSize: 13, fontWeight: '700' },
  historyList: { borderRadius: 20, padding: 4, borderWidth: 1 },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  historyInfo: { flex: 1 },
  historyTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  historyDate: { fontSize: 10 },
  historyAmount: { fontWeight: 'bold', fontSize: 14 }
});
