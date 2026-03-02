import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../hooks/useWallet';
import { useXP } from '../../hooks/useXP';
import { useTheme } from '../../hooks/useTheme';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { useFlags } from '../../components/FlagContext';
import { useDrops } from '../../hooks/useDrops';
import { useStampCards } from '../../hooks/useStampCards';
import { PremiumCard } from '../../components/PremiumCard';
import { WalletActions } from '../../components/Wallet/WalletActions';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { OrbTapLogoMark } from '../../components/OrbTapLogoMark';
import { RewardLockerSection } from '../../components/RewardLockerSection';
import { StampCardStack } from '../../components/StampCardStack';
import { StampCardModal } from '../../components/StampCardModal';
import { COLORS } from '../../constants/Colors';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { DEFAULT_ORBINOMICS_POLICY, LEDGER_REASON } from '../../constants/OrbinomicsPolicy';
import { usePartners } from '../../context/PartnersContext';
import { useNextPerkGoal } from '../../hooks/useNextPerkGoal';
import { useOrbProofStreak } from '../../hooks/useOrbProofStreak';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';
import { useAuth } from '../../context/AuthContext';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolateColor,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { showErrorAlert } from '../../utils/alert';
import type { StampCardWithProgram } from '../../hooks/useStampCards';
import { SavedIntentModule } from '../../components/SavedIntentModule';
import { KitEmptyState } from '../../components/ui/KitEmptyState';
import { KitAccordion } from '../../components/ui/KitAccordion';

const STAMP_CARDS_EXPANDED_KEY = 'ORBTAP_STAMP_CARDS_EXPANDED';

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
  const { user } = useAuth();
  const { balance, history, verifiedActions, spend, loading: walletLoading } = useWallet();
  const rank = useXP();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { isPremium, isPro, tier: effectiveTier } = useEffectiveTier();
  const { flags } = useFlags();
  const { drops } = useDrops();
  const { streak: orbProofStreak } = useOrbProofStreak();
  const { displayName, photoURL } = useCurrentUserProfile();
  const { partners, perks, getPartner } = usePartners();
  const nextPerkGoal = useNextPerkGoal();
  const stampCardsEnabled = Boolean(flags.moduleStampCards && flags.stampCardsUserWallet);
  const {
    cardsWithPrograms,
    rewardLocker,
    loading: stampCardsLoading,
    refetch: refetchStampCards,
    activeCardCount,
    rewardReadyCount,
  } = useStampCards(stampCardsEnabled);
  const activeStampCards = cardsWithPrograms.filter((c) => c.program?.status === 'ACTIVE');
  const partnerLogoMap = React.useMemo(() => {
    const m: Record<string, string | null> = {};
    activeStampCards.forEach((c) => {
      const pid = c.program?.partnerId;
      if (pid) {
        const p = getPartner(pid);
        m[pid] = p?.logoUrl ?? null;
      }
    });
    return m;
  }, [activeStampCards, getPartner]);
  const partnerTierMap = React.useMemo(() => {
    const m: Record<string, 'silver' | 'gold' | 'platinum'> = {};
    activeStampCards.forEach((c) => {
      const pid = c.program?.partnerId;
      if (pid) {
        const p = getPartner(pid);
        if (p?.tier) m[pid] = p.tier;
      }
    });
    return m;
  }, [activeStampCards, getPartner]);

  const safeHistory = (history || []).slice(0, 10);
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
  const [activeAction, setActiveAction] = useState<'send' | 'receive' | 'split' | 'redeem' | null>(null);
  const [spendingKey, setSpendingKey] = useState<string | null>(null);
  const [stampCardDetail, setStampCardDetail] = useState<StampCardWithProgram | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    earnMore: false,
    powerUps: false,
    proofReceipts: false,
    recentActivity: false,
    stampCards: true,
  });
  const [stampCardsExpandedLoaded, setStampCardsExpandedLoaded] = useState(false);
  useEffect(() => {
    if (!stampCardsEnabled) return;
    AsyncStorage.getItem(STAMP_CARDS_EXPANDED_KEY).then((v) => {
      if (v !== null) setCollapsed((prev) => ({ ...prev, stampCards: v !== 'true' }));
      setStampCardsExpandedLoaded(true);
    });
  }, [stampCardsEnabled]);
  const toggleSection = (key: string) => {
    safeHaptics.selectionAsync();
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === 'stampCards') AsyncStorage.setItem(STAMP_CARDS_EXPANDED_KEY, next.stampCards ? 'false' : 'true').catch(() => {});
      return next;
    });
  };

  const hasVerifiedActions = (verifiedActions?.length ?? 0) > 0;
  const hasLiveDrops = drops.some((d) => d.qtyRemaining > 0 && Date.now() >= d.startAt && Date.now() <= d.endAt);
  const earnNextCta =
    !hasVerifiedActions ? 'Get your first OrbProof' : hasLiveDrops ? 'Reserve a drop' : 'Start a quest';
  const earnNextRoute =
    !hasVerifiedActions ? '/(tabs)/scan' : hasLiveDrops ? '/pulse' : '/missions';

  const handleSpend = (productKey: string) => {
    const rule = DEFAULT_ORBINOMICS_POLICY.burnRules.find((r) => r.productKey === productKey);
    if (!rule) return;
    const name = EARN_NEXT_LABELS[productKey] ?? productKey;
    Alert.alert(
      "Confirm Purchase",
      `Spend ${rule.costPoints} OT on ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setSpendingKey(productKey);
            const result = await spend({
              productKey,
              amountExpected: rule.costPoints,
            });
            setSpendingKey(null);
            if (result.success) {
              safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              showErrorAlert(
                "Spend didn’t complete",
                result.reason
                  ? `${result.reason} Tap OK and try again when you’re ready.`
                  : "We couldn’t complete this spend. Please try again or check your balance.",
              );
            }
          },
        },
      ],
    );
  };

  const handleScan = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/scan' as any);
  };

  const handleAction = (type: any) => {
    safeHaptics.selectionAsync();
    setActiveAction(type);
  };

  const redeemablePerks = React.useMemo(
    () => perks.filter((p) => p.cost <= balance && balance > 0),
    [perks, balance]
  );
  const readyToRedeemCount = rewardReadyCount + redeemablePerks.length;

  const mainContent = (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <WalletActions
          action={activeAction}
          onClose={() => setActiveAction(null)}
          balance={balance}
          onRedeemOpenScanner={() => {
            setActiveAction(null);
            router.push('/(tabs)/scan' as any);
          }}
        />
        
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HEADER — at top of page (ScreenWrapper already provides top safe area) */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerBrandWrap}>
              <OrbTapLogoMark variant="small" />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>OT POINTS</Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Earned from verified visits & redemptions</Text>
              <Text style={[styles.headerTrust, { color: colors.textSecondary }]}>Daily caps keep it fair — spend on perks, drops & boosts</Text>
            </View>
            <TouchableOpacity
              style={[styles.scanBtn, styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleScan}
            >
              <Ionicons name="qr-code" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* THE CARD */}
        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.cardContainer}>
            <PremiumCard balance={balance} rank={rank} photoURL={photoURL} displayName={displayName} nextPerkGoal={nextPerkGoal} />
        </Animated.View>

        {/* ── Dopamine stats strip: OT value + lifetime earned + 7-day sparkline ── */}
        <WalletDopamineStrip balance={balance} history={safeHistory} verifiedActions={verifiedActions ?? []} colors={colors} themeGold={themeGold} loading={walletLoading} />

        {/* Points-to-perk ladder — Starbucks Stars style (frosted) */}
        <View style={[styles.pointsLadderCard, styles.pointsLadderGlass, { borderColor: colors.border }]}>
          {Platform.OS !== 'web' && (
            <BlurView intensity={isDark ? 50 : 56} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          )}
          {Platform.OS === 'web' && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />}
          <View style={styles.pointsLadderContent}>
          <Text style={[styles.pointsLadderTitle, { color: colors.text }]}>Points to Perk</Text>
          <View style={styles.pointsLadderRow}>
            {[
              { ot: 500, label: 'Silver' },
              { ot: 1000, label: 'Gold' },
              { ot: 2500, label: 'Platinum' },
            ].map((tier, i) => {
              const reached = balance >= tier.ot;
              return (
                <View key={tier.label} style={[styles.pointsLadderItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                  <Text style={[styles.pointsLadderOT, { color: reached ? themeGold : colors.textSecondary }]}>{tier.ot} OT</Text>
                  <Text style={[styles.pointsLadderLabel, { color: reached ? colors.text : colors.textSecondary }]}>{tier.label}</Text>
                </View>
              );
            })}
          </View>
          </View>
        </View>

        {/* Active Power-Ups — streak shield, multiplier countdown */}
        <TouchableOpacity
            style={[styles.activePowerUpsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/upgrades' as any)}
            activeOpacity={0.88}
          >
            <View style={styles.activePowerUpsHeader}>
              <Ionicons name="flash" size={18} color={themeGold} />
              <Text style={[styles.activePowerUpsTitle, { color: colors.text }]}>Active Power-Ups</Text>
            </View>
            {activePowerUps.length > 0 ? (
              activePowerUps.map((p) => {
                const minsLeft = Math.max(0, Math.floor((p.expiresAt - Date.now()) / 60000));
                const h = Math.floor(minsLeft / 60);
                const m = minsLeft % 60;
                return (
                  <View key={p.key} style={[styles.activePowerUpRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.activePowerUpLabel, { color: colors.text }]}>{p.label}</Text>
                    <Text style={[styles.activePowerUpTimer, { color: themeGold }]}>{h}h {m}m left</Text>
                  </View>
                );
              })
            ) : (
              <Text style={[styles.activePowerUpEmpty, { color: colors.textSecondary }]}>No active power-ups — buy one in Upgrades</Text>
            )}
          </TouchableOpacity>

        {/* Earn more — always visible for free users to keep North Star loop top of mind */}
        {!isPremium && (
          <TouchableOpacity
            style={[styles.earnMoreStrip, { backgroundColor: COLORS.neonBlue[0] + '18', borderColor: COLORS.neonBlue[0] + '40' }]}
            onPress={() => router.push('/(tabs)/scan' as any)}
            activeOpacity={0.9}
          >
            <Ionicons name="qr-code" size={22} color={COLORS.neonBlue[0]} />
            <View style={styles.earnMoreStripText}>
              <Text style={[styles.earnMoreStripTitle, { color: colors.text }]}>Earn more OT</Text>
              <Text style={[styles.earnMoreStripSub, { color: colors.textSecondary }]}>Scan at a partner to add points</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.neonBlue[0]} />
          </TouchableOpacity>
        )}

        {/* Upgrade CTA for free users — subtle 3-color shift */}
        {!isPremium && (
          <UpgradeCtaTile onPress={() => router.push('/premium' as any)} colors={colors} />
        )}

        {/* ACTIONS — Send/Receive/Split are OT Points to Sphere members, not real money */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <View style={styles.actionsRow}>
            <ActionButton icon="paper-plane" label="Send" onPress={() => handleAction('send')} colors={colors} isDark={isDark} />
            <ActionButton icon="qr-code" label="Receive" onPress={() => handleAction('receive')} colors={colors} isDark={isDark} />
            <ActionButton icon="git-branch-outline" label="Split" onPress={() => handleAction('split')} colors={colors} isDark={isDark} />
            <ActionButton icon="gift" label="Redeem" onPress={() => handleAction('redeem')} colors={colors} isDark={isDark} />
          </View>
          <Text style={[styles.actionsHint, { color: colors.textSecondary }]}>Send OT to Sphere members · Not real money</Text>
        </Animated.View>

        {/* ——— Reward Locker (Stamp Cards) ——— */}
        {stampCardsEnabled && rewardLocker.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <RewardLockerSection items={rewardLocker} />
          </View>
        )}

        {/* ——— Accordion: STAMP CARDS ——— */}
        {stampCardsEnabled && stampCardsExpandedLoaded && (
          <KitAccordion
            title="Stamp Cards"
            expanded={!collapsed.stampCards}
            onToggle={() => toggleSection('stampCards')}
            style={styles.sectionCard}
            rightAction={
              activeStampCards.length > 0 ? (
                <TouchableOpacity
                  onPress={() => router.push('/stamp-cards' as any)}
                  hitSlop={8}
                  activeOpacity={0.7}
                  style={[styles.stampCountBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}
                >
                  <Text style={[styles.stampCountBadgeText, { color: colors.primary }]}>
                    {activeStampCards.length} active
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => router.push('/stamp-cards' as any)} hitSlop={8} activeOpacity={0.7}>
                  <Text style={[styles.sectionLink, { color: colors.primary }]}>Scan to stamp</Text>
                </TouchableOpacity>
              )
            }
          >
            <StampCardStack
              cards={activeStampCards}
              onCardPress={setStampCardDetail}
              maxHeight={320}
              nestedInScrollView
              partnerTierMap={partnerTierMap}
            />
          </KitAccordion>
        )}

        <StampCardModal
          visible={stampCardDetail != null}
          cards={activeStampCards}
          initialIndex={
            stampCardDetail
              ? Math.max(0, activeStampCards.findIndex((c) => c.state.id === stampCardDetail.state.id))
              : 0
          }
          onClose={() => setStampCardDetail(null)}
          onRedeem={(stateId) => {
            const item = rewardLocker.find((r) => r.stateId === stateId);
            if (item) setStampCardDetail(null);
          }}
          partnerLogoMap={partnerLogoMap}
          partnerTierMap={partnerTierMap}
        />

        {/* ——— Saved Intents module (Phase C) ——— */}
        {flags.isOrbSwipeSavedIntentsEnabled && (
          <SavedIntentModule uid={user?.uid ?? 'anon'} />
        )}

        {/* ——— Accordion: EARN MORE ——— */}
        {flags.isOrbWalletEnabled && (
          <KitAccordion
            title="Earn more"
            expanded={!collapsed.earnMore}
            onToggle={() => toggleSection('earnMore')}
            style={styles.sectionCard}
          >
            <TouchableOpacity style={[styles.earnRow, { borderBottomColor: colors.border }]} onPress={() => router.push(earnNextRoute as any)} activeOpacity={0.88}>
              <Text style={[styles.earnRowLabel, { color: colors.textSecondary }]}>Earn next</Text>
              <View style={styles.earnRowCta}>
                <Text style={[styles.earnRowCtaText, { color: colors.primary }]}>{earnNextCta}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>
            {nextPerkGoal && (
              <TouchableOpacity
                style={[styles.earnRow, { borderBottomColor: colors.border }]}
                onPress={() => nextPerkGoal.type === 'redeem' ? router.push('/(tabs)/scan' as any) : router.push('/(tabs)' as any)}
                activeOpacity={0.88}
              >
                <Text style={[styles.earnRowLabel, { color: colors.textSecondary }]}>
                  {nextPerkGoal.type === 'earn' ? 'Next reward' : 'You can redeem'}
                </Text>
                <View style={styles.earnRowCta}>
                  <Text style={[styles.earnRowCtaText, { color: colors.primary }]} numberOfLines={1}>
                    {nextPerkGoal.type === 'earn'
                      ? `${nextPerkGoal.gap} more OT → ${nextPerkGoal.perk.title}`
                      : `${nextPerkGoal.perk.title} — ${nextPerkGoal.perk.cost} pts`}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.earnRow} onPress={() => router.push('/vote' as any)} activeOpacity={0.88}>
              <Text style={[styles.earnRowLabel, { color: colors.textSecondary }]}>OrbVote</Text>
              <View style={styles.earnRowCta}>
                <Text style={[styles.earnRowCtaText, { color: colors.primary }]}>Vote in polls → earn OT</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </KitAccordion>
        )}

        {/* ——— Accordion: SPEND POWER-UPS ——— */}
        {flags.isOrbWalletEnabled && flags.isOrbinomicsEnabled && (
          <KitAccordion
            title="Spend power-ups"
            expanded={!collapsed.powerUps}
            onToggle={() => toggleSection('powerUps')}
            style={styles.sectionCard}
          >
            <View style={styles.powerUpsList}>
              {DEFAULT_ORBINOMICS_POLICY.burnRules.slice(0, 6).map((r) => (
                <View key={r.productKey} style={[styles.powerUpRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.powerUpInfo}>
                    <Text style={[styles.powerUpName, { color: colors.text }]}>{EARN_NEXT_LABELS[r.productKey] ?? r.productKey}</Text>
                    <Text style={[styles.powerUpCost, { color: colors.textSecondary }]}>{r.costPoints} OT</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.powerUpBtn, { backgroundColor: (colors.primary) + '20' }]}
                    onPress={() => handleSpend(r.productKey)}
                    disabled={balance < r.costPoints || spendingKey === r.productKey}
                  >
                    <Text style={[styles.powerUpBtnText, { color: colors.primary }]}>
                      {spendingKey === r.productKey ? '…' : 'Use'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </KitAccordion>
        )}

        {/* OrbProof Streak — compact card */}
        {flags.isOrbTapStreakEnabled && (orbProofStreak.currentStreakDays > 0 || orbProofStreak.bestStreakDays > 0) && (
          <Animated.View entering={FadeInDown.delay(520).duration(500)} style={[styles.sectionCard, styles.streakCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.earnRowLabel, { color: colors.textSecondary }]}>OrbProof Streak</Text>
            <View style={styles.streakRow}>
              <Text style={[styles.streakVal, { color: colors.text }]}>{orbProofStreak.currentStreakDays} day streak</Text>
              <Text style={[styles.streakBest, { color: colors.textSecondary }]}>Best: {orbProofStreak.bestStreakDays}</Text>
            </View>
          </Animated.View>
        )}

        {/* ——— Accordion: PROOF RECEIPTS ——— */}
        {flags.isOrbProofEnabled && (verifiedActions?.length ?? 0) > 0 && (
          <KitAccordion
            title="Proof receipts"
            expanded={!collapsed.proofReceipts}
            onToggle={() => toggleSection('proofReceipts')}
            style={styles.sectionCard}
          >
            <View style={styles.receiptsList}>
              {(verifiedActions ?? []).slice(0, 5).map((va, index) => {
                const partner = getPartner(va.partnerId);
                const partnerName = partner?.name ?? va.partnerId;
                const tier = partner?.tier ?? 'gold';
                return (
                  <TouchableOpacity
                    key={`va-${va.id}-${index}`}
                    style={[styles.receiptRow, { borderBottomColor: colors.border }]}
                    onPress={() =>
                      router.push({
                        pathname: '/proof/[id]',
                        params: {
                          id: va.id,
                          partner: partnerName,
                          points: String(va.pointsAwarded),
                          tier,
                          createdAt: String(va.createdAt),
                        },
                      } as any)
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.receiptInfo}>
                      <Text style={[styles.receiptPartner, { color: colors.text }]} numberOfLines={1}>{partnerName}</Text>
                      <Text style={[styles.receiptDate, { color: colors.textSecondary }]}>{new Date(va.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.receiptRight}>
                      <OTPointsBadge amount={va.pointsAwarded} size={14} label="pts" compact textColor={COLORS.success} />
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </KitAccordion>
        )}

        {/* ——— Accordion: RECENT ACTIVITY ——— */}
        <KitAccordion
          title="Recent activity"
          expanded={!collapsed.recentActivity}
          onToggle={() => toggleSection('recentActivity')}
          style={styles.sectionCard}
          rightAction={(history?.length ?? 0) > 10 ? (
            <TouchableOpacity onPress={() => router.push('/stats' as any)}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>View in Stats</Text>
            </TouchableOpacity>
          ) : undefined}
        >
          <View style={styles.historyList}>
            {safeHistory.map((item, index) => (
              <Animated.View
                key={`history-${item.id}-${index}`}
                entering={FadeInDown.delay(600 + index * 50).duration(500)}
                style={[styles.historyItem, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.iconBox, { backgroundColor: item.amount > 0 ? (isDark ? 'rgba(74, 222, 128, 0.1)' : '#e6fcf5') : (isDark ? 'rgba(255,255,255,0.1)' : '#f1f3f5') }]}>
                  <Ionicons name={item.amount > 0 ? 'arrow-down' : 'arrow-up'} size={18} color={item.amount > 0 ? COLORS.success : colors.text} />
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
              <KitEmptyState title="No transactions yet" subtitle="Scan at a partner to earn OT Points and see activity here." />
            )}
          </View>
        </KitAccordion>
        <View style={{ height: 40 }} />
      </ScrollView>
      </View>
    );

  return <ScreenWrapper>{mainContent}</ScreenWrapper>;
}

/** Silver, Gold, Pro (platinum) tier colors — visible shift to catch the eye. */
const UPGRADE_TILE_BG = [
  PARTNER_TIER_COLORS.silver + '32',
  PARTNER_TIER_COLORS.gold + '38',
  PARTNER_TIER_COLORS.platinum + '35',
] as const;
const UPGRADE_TILE_BORDER = [
  PARTNER_TIER_COLORS.silver + '99',
  PARTNER_TIER_COLORS.gold + 'b0',
  PARTNER_TIER_COLORS.platinum + 'a8',
] as const;

/* ─────────────────────────────────────────────────────────
 * WalletDopamineStrip — OT value display + 7-day sparkline
 * ──────────────────────────────────────────────────────── */
function WalletDopamineStrip({
  balance,
  history,
  verifiedActions,
  colors,
  themeGold,
  loading,
}: {
  balance: number;
  history: any[];
  verifiedActions: any[];
  colors: any;
  themeGold: string;
  loading?: boolean;
}) {
  // Build 7-day earn data from history — filter out invalid timestamps (createdAt = 0)
  const last7 = React.useMemo(() => {
    const days: number[] = Array(7).fill(0);
    const now = Date.now();
    const validActions = verifiedActions.filter((a) => {
      const ts = a.createdAt ?? 0;
      return ts > 0 && ts <= now;
    });
    validActions.forEach((a) => {
      const ago = now - (a.createdAt ?? 0);
      const dayIdx = Math.floor(ago / 86400000);
      if (dayIdx >= 0 && dayIdx < 7) {
        days[6 - dayIdx] += (a.pointsAwarded ?? 0);
      }
    });
    return days;
  }, [verifiedActions]);

  const maxBar = Math.max(...last7, 1);
  const lifetimeEarned = verifiedActions.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);

  return (
    <Animated.View entering={FadeInDown.delay(420).duration(500)} style={[walletDopamineStyles.strip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Balance in OT (no $ to avoid currency confusion) */}
      <View style={walletDopamineStyles.row}>
        <View style={walletDopamineStyles.valueBlock}>
          {loading ? (
            <View style={walletDopamineStyles.balanceSkeleton} />
          ) : (
            <Text style={[walletDopamineStyles.dollarValue, { color: COLORS.success }]}>{balance.toLocaleString()} OT</Text>
          )}
          <Text style={[walletDopamineStyles.dollarLabel, { color: colors.textSecondary }]}>available balance</Text>
        </View>
        <View style={[walletDopamineStyles.divider, { backgroundColor: colors.border }]} />
        <View style={walletDopamineStyles.valueBlock}>
          {loading ? (
            <View style={walletDopamineStyles.lifetimeSkeleton} />
          ) : (
            <Text style={[walletDopamineStyles.lifetimeValue, { color: colors.text }]}>{lifetimeEarned.toLocaleString()}</Text>
          )}
          <Text style={[walletDopamineStyles.dollarLabel, { color: colors.textSecondary }]}>lifetime OT</Text>
        </View>
      </View>

      {/* 7-day sparkline */}
      <View style={walletDopamineStyles.sparklineRow}>
        <Text style={[walletDopamineStyles.sparkLabel, { color: colors.textSecondary }]}>7-day earn</Text>
        <View style={walletDopamineStyles.sparkBars}>
          {last7.map((v, i) => (
            <View key={i} style={walletDopamineStyles.sparkBarWrap}>
              <View
                style={[
                  walletDopamineStyles.sparkBar,
                  {
                    height: Math.max(4, Math.round((v / maxBar) * 36)),
                    backgroundColor: i === 6 ? themeGold : themeGold + '55',
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const walletDopamineStyles = StyleSheet.create({
  strip: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  valueBlock: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 32, marginHorizontal: 8 },
  dollarValue: { fontSize: 22, fontWeight: '900' },
  dollarLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  lifetimeValue: { fontSize: 18, fontWeight: '800' },
  sparklineRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  sparkLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, width: 52 },
  sparkBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 36 },
  sparkBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 36 },
  sparkBar: { width: '100%', borderRadius: 3, minHeight: 4 },
  balanceSkeleton: { width: 120, height: 28, borderRadius: 8, backgroundColor: 'rgba(128,128,128,0.2)', marginBottom: 2 },
  lifetimeSkeleton: { width: 80, height: 22, borderRadius: 6, backgroundColor: 'rgba(128,128,128,0.2)', marginBottom: 2 },
});

function UpgradeCtaTile({ onPress, colors }: { onPress: () => void; colors: { text: string; textSecondary: string } }) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3200 }),
        withTiming(2, { duration: 3200 }),
        withTiming(0, { duration: 3200 })
      ),
      -1,
      false
    );
  }, [t]);
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1, 2], [...UPGRADE_TILE_BG]),
    borderColor: interpolateColor(t.value, [0, 1, 2], [...UPGRADE_TILE_BORDER]),
  }));
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.upgradeCtaCardWrap}>
      <Animated.View style={[styles.upgradeCtaCard, animatedStyle]}>
        <Ionicons name="diamond-outline" size={24} color={PARTNER_TIER_COLORS.gold} />
        <View style={styles.upgradeCtaTextWrap}>
          <Text style={[styles.upgradeCtaTitle, { color: colors.text }]}>Unlock Premium or Pro — see what you're missing</Text>
          <Text style={[styles.upgradeCtaSub, { color: colors.textSecondary }]}>More perks, power-ups, early drops & the Pro badge</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={PARTNER_TIER_COLORS.platinum} />
      </Animated.View>
    </TouchableOpacity>
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
  content: { paddingHorizontal: SPACE.base, paddingBottom: 100 },
  header: { marginBottom: SPACE.md },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBrandWrap: { marginRight: SPACE.md },
  headerTextWrap: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 0.8 },
  headerSub: { fontSize: 12, marginTop: 4 },
  headerTrust: { fontSize: 10, fontWeight: '600', marginTop: 2, opacity: 0.9 },
  headerIconBtn: { width: 44, height: 44, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginLeft: SPACE.md },
  scanBtn: { width: 44, height: 44, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginLeft: SPACE.sm },
  cardContainer: { alignItems: 'center', marginBottom: SPACE.xxl },
  pointsLadderCard: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: SPACE.base,
    marginBottom: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  pointsLadderGlass: {},
  pointsLadderContent: { padding: SPACE.md },
  pointsLadderTitle: { fontSize: 12, fontWeight: '800', marginBottom: SPACE.sm },
  pointsLadderRow: { flexDirection: 'row', justifyContent: 'space-around' },
  pointsLadderItem: { flex: 1, alignItems: 'center', paddingVertical: SPACE.xs },
  pointsLadderOT: { fontSize: 13, fontWeight: '800' },
  pointsLadderLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  activePowerUpsCard: {
    marginHorizontal: SPACE.base,
    marginBottom: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE.md,
  },
  activePowerUpsHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  activePowerUpsTitle: { fontSize: 14, fontWeight: '800' },
  activePowerUpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACE.sm, borderTopWidth: 1 },
  activePowerUpLabel: { fontSize: 13, fontWeight: '600' },
  activePowerUpTimer: { fontSize: 12, fontWeight: '700' },
  activePowerUpEmpty: { fontSize: 13 },
  earnMoreStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.base,
    marginHorizontal: SPACE.base,
    marginBottom: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACE.md,
  },
  earnMoreStripText: { flex: 1, minWidth: 0 },
  earnMoreStripTitle: { fontSize: 15, fontWeight: '700' },
  earnMoreStripSub: { fontSize: 12, marginTop: 2 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACE.xs, paddingHorizontal: SPACE.md },
  actionsHint: { fontSize: 10, textAlign: 'center', marginBottom: SPACE.xxl },
  actionBtn: { alignItems: 'center', gap: SPACE.sm },
  actionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  actionLabel: { fontSize: 11, fontWeight: 'bold' },
  sectionCard: { marginBottom: SPACE.lg, borderRadius: RADIUS.base, borderWidth: 1, overflow: 'hidden' },
  earnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACE.md, borderBottomWidth: 1 },
  earnRowLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  earnRowCta: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  earnRowCtaText: { fontSize: 14, fontWeight: '700', maxWidth: '80%' },
  sectionHeader: { marginBottom: SPACE.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: SPACE.sm },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  sectionLink: { fontSize: 12, fontWeight: '600' },
  stampCountBadge: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  stampCountBadgeText: { fontSize: 11, fontWeight: '700' },
  powerUpsList: { marginTop: SPACE.sm },
  powerUpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACE.lg, paddingHorizontal: 4, borderBottomWidth: 1 },
  powerUpInfo: { flex: 1 },
  powerUpName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  powerUpCost: { fontSize: 12 },
  powerUpBtn: { paddingHorizontal: SPACE.base, paddingVertical: SPACE.sm, borderRadius: RADIUS.sm },
  powerUpBtnText: { fontSize: 13, fontWeight: '700' },
  receiptsList: { marginTop: SPACE.sm },
  receiptRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACE.lg, paddingHorizontal: 4, borderBottomWidth: 1 },
  receiptInfo: { flex: 1 },
  receiptPartner: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  receiptDate: { fontSize: 11 },
  receiptRight: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  streakCard: { padding: SPACE.base },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  streakVal: { fontSize: 15, fontWeight: '700' },
  streakBest: { fontSize: 12 },
  historyList: { marginTop: SPACE.sm },
  emptyStateText: { padding: SPACE.lg, textAlign: 'center', fontStyle: 'italic', fontSize: 13 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.lg, paddingHorizontal: 4, borderBottomWidth: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: SPACE.base },
  historyInfo: { flex: 1 },
  historyTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  historyDate: { fontSize: 10 },
  historyAmount: { fontWeight: 'bold', fontSize: 14 },
  upgradeCtaCardWrap: { marginHorizontal: SPACE.base, marginBottom: SPACE.base },
  upgradeCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.lg,
    paddingHorizontal: SPACE.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACE.md,
  },
  upgradeCtaTextWrap: { flex: 1, minWidth: 0 },
  upgradeCtaTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  upgradeCtaSub: { fontSize: 12 },
});
