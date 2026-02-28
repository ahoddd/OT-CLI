import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';
import { SPACE } from '../../constants/DesignTokens';
import { GuidedTutorialOverlay } from '../../components/GuidedTutorialOverlay';
import { useTutorial } from '../../context/TutorialContext';
import { PARTNER_PREMIUM_TEASER } from '../../constants/ConversionCopy';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { isPremiumPartnerTier, isProPartnerTier } from '../../constants/PartnerTiers';
import { PremiumBadge } from '../../components/PremiumBadge';
import { LinearGradient } from 'expo-linear-gradient';
import { safeHaptics } from '../../utils/safeHaptics';
import { getPartnerMetrics } from '../../services/partnerAttribution';
import { getPartnerAnalyticsSummary, type PartnerAnalyticsSummary } from '../../services/partnerAnalytics';
import { usePartners } from '../../context/PartnersContext';
import { useWallet } from '../../hooks/useWallet';
import { getPartnerTierShadow } from '../../constants/PartnerTiers';
import { useAdminLayout } from '../../context/AdminLayoutContext';
import { PartnerGrowthSuggestions } from '../../components/PartnerGrowthSuggestions';
import { GROWTH_SUGGESTIONS_TIERS } from '../../constants/OrbSwipeConfig';
import type { OrbSwipeEvent } from '../../services/orbswipeAnalytics';
import { useMyPartner } from '../../hooks/useMyPartner';
import { usePartnerTasks } from '../../hooks/usePartnerTasks';
import { useMenuContext } from '../../context/MenuContext';
import { KitEmptyState } from '../../components/ui';
import { PartnerFrostedCard } from '../../components/PartnerFrostedCard';

const CARD_GAP = SPACE.sm;

const ANALYTICS_CHART_MAX_BAR = 80;

function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      {right}
    </View>
  );
}

interface ChecklistState {
  dismissed: boolean;
  stampCard: boolean;
  shared: boolean;
  invitedSphere: boolean;
}

function GettingStartedChecklist({
  partnerId,
  hasPerks,
  hasViews,
  tierColor,
}: {
  partnerId: string;
  hasPerks: boolean;
  hasViews: boolean;
  tierColor: string;
}) {
  const [state, setState] = useState<ChecklistState | null>(null);
  const router = useRouter();
  const { colors } = useTheme();
  const storageKey = `ORBTAP_PARTNER_CHECKLIST_V1_${partnerId}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (raw) {
        try { setState(JSON.parse(raw)); } catch { setState({ dismissed: false, stampCard: false, shared: false, invitedSphere: false }); }
      } else {
        setState({ dismissed: false, stampCard: false, shared: false, invitedSphere: false });
      }
    });
  }, [storageKey]);

  const save = (next: ChecklistState) => {
    setState(next);
    AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
  };

  const step1 = hasPerks;
  const step2 = hasViews;
  const done = [step1, step2, state?.stampCard, state?.shared, state?.invitedSphere].filter(Boolean).length;

  useEffect(() => {
    if (state && !state.dismissed && done === 5) {
      save({ ...state, dismissed: true });
    }
  }, [done]);

  if (!state || state.dismissed) return null;

  const pct = done / 5;

  const steps = [
    {
      label: 'Add your first perk',
      done: step1,
      onPress: () => router.push('/partner/perks' as any),
    },
    {
      label: 'Get your first visit',
      done: step2,
      onPress: undefined as (() => void) | undefined,
    },
    {
      label: 'Set up a Stamp Card',
      done: state.stampCard,
      onPress: () => { save({ ...state, stampCard: true }); router.push('/partner/stamp-studio' as any); },
    },
    {
      label: 'Share your partner page',
      done: state.shared,
      onPress: () => {
        Share.share({ message: 'Check out my business on OrbTap!' });
        save({ ...state, shared: true });
      },
    },
    {
      label: 'Invite a Sphere group',
      done: state.invitedSphere,
      onPress: () => { save({ ...state, invitedSphere: true }); router.push('/partner/invite-sphere' as any); },
    },
  ];

  return (
    <View style={[checklistStyles.card, { backgroundColor: colors.surface, borderColor: tierColor + '40' }]}>
      <View style={checklistStyles.header}>
        <Text style={[checklistStyles.title, { color: colors.text }]}>Getting Started</Text>
        <Text style={[checklistStyles.count, { color: tierColor }]}>{done}/5</Text>
        <TouchableOpacity onPress={() => save({ ...state, dismissed: true })} hitSlop={12}>
          <Ionicons name="close" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={[checklistStyles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[checklistStyles.progressFill, { backgroundColor: tierColor, width: `${Math.round(pct * 100)}%` as any }]} />
      </View>
      {steps.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={checklistStyles.row}
          onPress={item.done ? undefined : item.onPress}
          activeOpacity={item.done ? 1 : 0.85}
          disabled={item.done || !item.onPress}
        >
          <Ionicons
            name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
            size={18}
            color={item.done ? tierColor : colors.textSecondary}
          />
          <Text style={[checklistStyles.rowLabel, { color: item.done ? colors.textSecondary : colors.text, textDecorationLine: item.done ? 'line-through' : 'none' }]}>
            {item.label}
          </Text>
          {!item.done && item.onPress && <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const checklistStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  title: { fontSize: 14, fontWeight: '800', flex: 1 },
  count: { fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 4, borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rowLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
});

function UpgradeTeaserCard() {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.upgradeTeaserCard, { backgroundColor: themeGold + '14', borderColor: themeGold + '50' }]}
      onPress={() => { safeHaptics.selectionAsync(); router.push('/compare-accounts' as any); }}
      activeOpacity={0.9}
    >
      <View style={styles.upgradeTeaserContent}>
        <View style={[styles.upgradeTeaserIconWrap, { backgroundColor: themeGold + '22' }]}>
          <Ionicons name="diamond" size={24} color={themeGold} />
        </View>
        <View style={styles.upgradeTeaserTextWrap}>
          <Text style={[styles.upgradeTeaserTitle, { color: colors.text }]}>Unlock Premium Partner</Text>
          <Text style={[styles.upgradeTeaserSub, { color: colors.textSecondary }]}>
            {PARTNER_PREMIUM_TEASER}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={themeGold} />
      </View>
    </TouchableOpacity>
  );
}

export default function PartnerDashboard({ embedInTabs }: { embedInTabs?: boolean } = {}) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const { partners, refresh, getPerksForPartner } = usePartners();
  const { testPartnerTier, isPartner } = useEffectiveTier();
  const layout = useAdminLayout();
  const { myPartnerId, myPartner, loading: myPartnerLoading, refresh: refreshMyPartner } = useMyPartner();
  const partner = myPartner ?? (partners[0] ?? null);
  const effectivePartnerTier: PartnerTier = (testPartnerTier ?? (partner?.tier as PartnerTier | undefined) ?? 'silver');
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();
  const [showDashboardTutorial, setShowDashboardTutorial] = useState(false);

  useEffect(() => {
    if (shouldShowTutorial('partner_dashboard')) setShowDashboardTutorial(true);
  }, [shouldShowTutorial]);
  const isPremiumPartner = isPremiumPartnerTier(effectivePartnerTier);
  const isProPartner = isProPartnerTier(effectivePartnerTier);
  const tierColor = PARTNER_TIER_COLORS[effectivePartnerTier];
  const [showOrbOpsButton, setShowOrbOpsButton] = useState(true);
  const [offersCatering, setOffersCatering] = useState(true);
  const partnerId = myPartnerId ?? partner?.id ?? 'p1';
  const perksForPartner = getPerksForPartner(partnerId);
  const hasNoPerks = perksForPartner.length === 0;
  const { tasks, taskCount } = usePartnerTasks(partnerId);
  const { getMenuForPartner } = useMenuContext();
  const menuDoc = getMenuForPartner(partnerId);
  const menuNeedsAttention = !menuDoc || menuDoc.status !== 'PUBLISHED' || menuDoc.status === 'NEEDS_REVIEW';
  const roi = getPartnerMetrics(partnerId);
  const { balance } = useWallet();
  const [analytics, setAnalytics] = useState<PartnerAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [orbSwipeEvents, setOrbSwipeEvents] = useState<OrbSwipeEvent[]>([]);
  const growthTier = (GROWTH_SUGGESTIONS_TIERS[effectivePartnerTier] ?? 'none') as 'full' | 'tip' | 'none';

  useEffect(() => {
    getPartnerAnalyticsSummary(partnerId, isPremiumPartner ? 30 : 7)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [partnerId, isPremiumPartner]);

  useEffect(() => {
    if (growthTier === 'none') return;
    import('../../services/orbswipeAnalytics').then(async (mod) => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      try {
        const raw = await AsyncStorage.getItem('ORBTAP_ORBSWIPE_EVENTS_QUEUE');
        if (raw) {
          const parsed = JSON.parse(raw);
          setOrbSwipeEvents(Array.isArray(parsed) ? parsed : []);
        }
      } catch {}
    });
  }, [partnerId, growthTier]);

  if (!isPartner) return <Redirect href={embedInTabs ? '/(tabs)/orb' : '/(tabs)'} />;

  if (!myPartnerLoading && !myPartnerId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            {!embedInTabs && (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            {embedInTabs && <View style={styles.backBtn} />}
            <Text style={[styles.headerTitle, { color: colors.text }]}>PARTNER COMMAND</Text>
          </View>
          <KitEmptyState
            title="No business linked"
            subtitle="You're in partner mode but no business is linked to your account. Apply to get on the map and start adding perks."
          />
          <TouchableOpacity
            style={[styles.upgradeTeaserCard, { backgroundColor: (colors.primary ?? themeGold) + '22', borderColor: (colors.primary ?? themeGold) + '50', marginHorizontal: SPACE.lg, marginTop: SPACE.md }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/partner-apply' as any); }}
            activeOpacity={0.9}
          >
            <Text style={[styles.upgradeTeaserTitle, { color: colors.text }]}>Apply to get on the map</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: tierColor + '60', borderBottomWidth: 2 }]}>
          {!embedInTabs && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          {embedInTabs && <View style={styles.backBtn} />}
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Partner Command</Text>
            {isPremiumPartner && <PremiumBadge variant="compact" size={20} />}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* First-perk onboarding — when partner has no perks yet */}
        {hasNoPerks && (
          <TouchableOpacity
            style={[styles.upgradeTeaserCard, { backgroundColor: (colors.primary ?? themeGold) + '22', borderColor: (colors.primary ?? themeGold) + '50', marginBottom: CARD_GAP }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/perks' as any); }}
            activeOpacity={0.9}
          >
            <View style={styles.upgradeTeaserContent}>
              <View style={[styles.upgradeTeaserIconWrap, { backgroundColor: (colors.primary ?? themeGold) + '22' }]}>
                <Ionicons name="pricetag" size={24} color={colors.primary ?? themeGold} />
              </View>
              <View style={styles.upgradeTeaserTextWrap}>
                <Text style={[styles.upgradeTeaserTitle, { color: colors.text }]}>Add your first perk</Text>
                <Text style={[styles.upgradeTeaserSub, { color: colors.textSecondary }]}>
                  So customers can discover and redeem at your location. You appear on the map; users scan at your venue and earn OT Points.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary ?? themeGold} />
            </View>
          </TouchableOpacity>
        )}
        {/* Wallet strip — show when partner has a balance */}
        {balance > 0 && (
          <TouchableOpacity
            style={[styles.walletStrip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '50' }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)/wallet' as any); }}
            activeOpacity={0.88}
          >
            <Ionicons name="wallet" size={22} color={colors.primary} />
            <Text style={[styles.walletStripLabel, { color: colors.text }]}>Your balance</Text>
            <Text style={[styles.walletStripAmount, { color: colors.primary }]}>{balance} OT</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Task notifications — add perk, menu, or resolve reports */}
        {tasks.length > 0 && (
          <View style={styles.tasksBanner}>
            {tasks.slice(0, 3).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: task.priority === 'high' ? COLORS.danger + '18' : colors.surface,
                    borderColor: task.priority === 'high' ? COLORS.danger + '50' : colors.border,
                  },
                ]}
                onPress={() => {
                  safeHaptics.selectionAsync();
                  router.push(task.route as any);
                }}
                activeOpacity={0.88}
              >
                <Ionicons
                  name={task.type === 'perks' ? 'pricetag' : task.type === 'menu-review' ? 'alert-circle' : 'restaurant'}
                  size={18}
                  color={task.priority === 'high' ? COLORS.danger : tierColor}
                />
                <Text style={[styles.taskCardText, { color: colors.text }]} numberOfLines={1}>
                  {task.message}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Getting Started checklist — new partner activation */}
        {!analyticsLoading && (
          <GettingStartedChecklist
            partnerId={partnerId}
            hasPerks={perksForPartner.length > 0}
            hasViews={(analytics?.views ?? 0) > 0}
            tierColor={tierColor}
          />
        )}

        {/* Hero: tier badge and upgrade teasers by partner tier */}
        {isPremiumPartner ? (
          <>
            <LinearGradient
              colors={effectivePartnerTier === 'platinum' ? [PARTNER_TIER_COLORS.platinum, '#8b5cf6'] : [themeGold, COLORS.gold[1]]}
              style={styles.banner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.bannerTextWrap}>
                <Text style={styles.bannerTitle}>
                  {effectivePartnerTier === 'platinum' ? 'PRO (PLATINUM) ACTIVE' : 'PREMIUM (GOLD) ACTIVE'}
                </Text>
                <Text style={styles.bannerSub}>
                  {effectivePartnerTier === 'platinum'
                    ? 'Unlimited perks, priority placement, Pro badge'
                    : '30-day analytics, export, conversion funnel & Premium badge'}
                </Text>
              </View>
              <Ionicons name={effectivePartnerTier === 'platinum' ? 'star' : 'diamond'} size={32} color="#000" />
            </LinearGradient>
            {!isProPartner && (
              <TouchableOpacity
                style={[styles.proTeaseRow, { backgroundColor: colors.surface, borderColor: PARTNER_TIER_COLORS.platinum + '60' }]}
                onPress={() => { safeHaptics.selectionAsync(); router.push('/premium?tier=pro' as any); }}
                activeOpacity={0.9}
              >
                <Ionicons name="star" size={18} color={PARTNER_TIER_COLORS.platinum} />
                <Text style={[styles.proTeaseText, { color: colors.text }]}>Go Platinum for unlimited perks and priority placement</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <UpgradeTeaserCard />
        )}

        {/* Value prop — tier-colored, premium strip */}
        <View style={[styles.valuePropStrip, { backgroundColor: tierColor + '18', borderColor: tierColor + '50' }, getPartnerTierShadow(effectivePartnerTier)]}>
          <Ionicons name="people" size={22} color={tierColor} />
          <Text style={[styles.valuePropText, { color: colors.text }]}>
            OrbTap brings you customers who are ready to visit — see your impact below.
          </Text>
        </View>

        {/* OVERVIEW — Your impact: 2x2 grid */}
        <SectionTitle title="YOUR IMPACT" />
        <View style={styles.impactGrid}>
          <View style={styles.impactRow}>
            <PartnerFrostedCard borderColor={tierColor} style={[styles.statCardHalf, styles.frostedStatCard]}>
              <View style={styles.statCardContent}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Profile views</Text>
                {analyticsLoading ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginVertical: 6 }} />
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>{analytics?.views ?? roi.views}</Text>
                )}
                <Text style={[styles.periodHint, { color: colors.textSecondary }]}>{isPremiumPartner ? 'Last 30 days' : 'Last 7 days'}</Text>
              </View>
            </PartnerFrostedCard>
            <PartnerFrostedCard borderColor={tierColor} style={[styles.statCardHalf, styles.frostedStatCard]}>
              <View style={styles.statCardContent}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Follows</Text>
                {analyticsLoading ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginVertical: 6 }} />
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>{analytics?.follows ?? 0}</Text>
                )}
                <Text style={[styles.periodHint, { color: colors.textSecondary }]}>{isPremiumPartner ? 'Last 30 days' : 'Last 7 days'}</Text>
              </View>
            </PartnerFrostedCard>
          </View>
          <View style={styles.impactRow}>
            <PartnerFrostedCard borderColor={tierColor} style={[styles.statCardHalf, styles.frostedStatCard]}>
              <View style={styles.statCardContent}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Redemptions</Text>
                <Text style={[styles.statValue, { color: tierColor }]}>{roi.redemptions}</Text>
                <Text style={[styles.periodHint, { color: colors.textSecondary }]}>This session</Text>
              </View>
            </PartnerFrostedCard>
            <PartnerFrostedCard borderColor={tierColor} style={[styles.statCardHalf, styles.frostedStatCard]}>
              <View style={styles.statCardContent}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Missions done</Text>
                {analyticsLoading ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginVertical: 6 }} />
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>{analytics?.missionsCompleted ?? 0}</Text>
                )}
                <Text style={[styles.periodHint, { color: colors.textSecondary }]}>{isPremiumPartner ? 'Last 30 days' : 'Last 7 days'}</Text>
              </View>
            </PartnerFrostedCard>
          </View>
        </View>
        <Text style={[styles.periodHint, { color: colors.textMuted ?? colors.textSecondary, marginTop: -4, marginBottom: 8 }]}>
          Profile views, follows, and missions from OrbTap users.
        </Text>
        {!isPremiumPartner && (
          <TouchableOpacity
            style={[styles.upgradeCta, { backgroundColor: themeGold + '18', borderColor: themeGold }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/compare-accounts' as any); }}
            activeOpacity={0.85}
          >
            <Ionicons name="diamond-outline" size={18} color={themeGold} />
            <Text style={[styles.upgradeCtaText, { color: colors.text }]}>See what Premium unlocks for your business</Text>
            <Ionicons name="chevron-forward" size={18} color={themeGold} />
          </TouchableOpacity>
        )}

        {/* TRAFFIC — Metric breakdown chart (real analytics data) */}
        <SectionTitle title="TRAFFIC BREAKDOWN" right={!isPremiumPartner ? <Text style={[styles.lockHint, { color: colors.textSecondary }]}>7 days · Premium: 30d</Text> : null} />
        <PartnerFrostedCard borderColor={tierColor} style={styles.chartCard}>
          <View style={styles.chartCardInner}>
            {analyticsLoading ? (
              <View style={styles.barChart}>
                {['V','F','R','M'].map((label) => (
                  <View key={label} style={styles.barColumn}>
                    <View style={[styles.barFill, { height: 40, backgroundColor: colors.border, opacity: 0.4 }]} />
                    <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{label}</Text>
                  </View>
                ))}
              </View>
            ) : (() => {
              const metrics = [
                { label: 'V', value: analytics?.views ?? 0, hint: 'Views' },
                { label: 'F', value: analytics?.follows ?? 0, hint: 'Follows' },
                { label: 'R', value: analytics?.reviews ?? 0, hint: 'Reviews' },
                { label: 'M', value: analytics?.missionsCompleted ?? 0, hint: 'Missions' },
              ];
              const maxVal = Math.max(1, ...metrics.map((m) => m.value));
              return (
                <View style={styles.barChart}>
                  {metrics.map((m) => (
                    <View key={m.label} style={styles.barColumn}>
                      <Text style={[styles.barCountLabel, { color: colors.textSecondary }]}>{m.value}</Text>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: Math.max(4, Math.round((m.value / maxVal) * ANALYTICS_CHART_MAX_BAR)),
                            backgroundColor: m.value > 0 ? tierColor : colors.border,
                          },
                        ]}
                      />
                      <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{m.label}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}
            <Text style={[styles.chartHintRow, { color: colors.textSecondary }]}>
              V=Views · F=Follows · R=Reviews · M=Missions · {isPremiumPartner ? '30-day window' : '7-day window'}
            </Text>
          </View>
        </PartnerFrostedCard>

        {/* Legends — friendly competition */}
        {flags.isLeaderboardEnabled && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)/leaderboard?tab=partners' as any); }}
          >
            <PartnerFrostedCard borderColor={tierColor} style={styles.legendsCard}>
            <View style={styles.legendsRow}>
              <View style={[styles.legendsIconWrap, { backgroundColor: themeGold + '22' }]}>
                <Ionicons name="trophy" size={24} color={themeGold} />
              </View>
              <View style={styles.legendsBody}>
                <Text style={[styles.legendsTitle, { color: colors.text }]}>Legends — Partner rank</Text>
                <Text style={[styles.legendsHint, { color: colors.textSecondary }]}>See how you stack up. Friendly competition between partner businesses.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={tierColor} />
            </View>
            </PartnerFrostedCard>
          </TouchableOpacity>
        )}

        {/* QUICK ACTIONS — Your tools */}
        <SectionTitle title="YOUR TOOLS" right={taskCount > 0 ? <Text style={[styles.taskCountBadge, { color: COLORS.danger }]}>{taskCount}</Text> : null} />
        <View style={styles.actionsBlock}>
          <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/perks' as any); }} activeOpacity={0.88} style={styles.actionCardWrap}>
            <PartnerFrostedCard borderColor={tierColor} style={styles.actionCard}>
              {hasNoPerks && (
                <View style={[styles.actionBadge, { backgroundColor: COLORS.danger }]}>
                  <Text style={styles.actionBadgeText}>!</Text>
                </View>
              )}
              <View style={[styles.actionIconWrap, { backgroundColor: tierColor + '22' }]}>
                <Ionicons name="pricetag" size={22} color={tierColor} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Perks</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>Add and manage perks customers can redeem</Text>
            </PartnerFrostedCard>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/invite-sphere' as any); }} activeOpacity={0.88}>
            <PartnerFrostedCard borderColor={tierColor} style={styles.actionCard}>
              <View style={[styles.actionIconWrap, { backgroundColor: tierColor + '22' }]}>
                <Ionicons name="people" size={22} color={tierColor} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Invite sphere</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>Offer a perk to a sphere — all through OrbTap</Text>
            </PartnerFrostedCard>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.push(`/partner/${partnerId}` as any); }} activeOpacity={0.88}>
            <PartnerFrostedCard borderColor={tierColor} style={styles.actionCard}>
              <View style={[styles.actionIconWrap, { backgroundColor: tierColor + '22' }]}>
                <Ionicons name="eye-outline" size={22} color={tierColor} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>View your page</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>See how customers see you</Text>
            </PartnerFrostedCard>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/edit-page' as any); }} activeOpacity={0.88}>
            <PartnerFrostedCard borderColor={tierColor} style={styles.actionCard}>
              <View style={[styles.actionIconWrap, { backgroundColor: tierColor + '22' }]}>
                <Ionicons name="create-outline" size={22} color={tierColor} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Edit your page</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>Store hours, description, about</Text>
            </PartnerFrostedCard>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.push('/partner-apply' as any); }} activeOpacity={0.88}>
            <PartnerFrostedCard borderColor={tierColor} style={styles.actionCard}>
              <View style={[styles.actionIconWrap, { backgroundColor: tierColor + '22' }]}>
                <Ionicons name="megaphone-outline" size={22} color={tierColor} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Featured / Sponsored</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>Apply for premium placement</Text>
            </PartnerFrostedCard>
          </TouchableOpacity>
        </View>

        {flags.isOrbFeedEnabled && flags.isOrbFeedPartnerComposerEnabled && (
          <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/posts/create' as any); }} activeOpacity={0.88}>
            <PartnerFrostedCard borderColor={tierColor} style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={[styles.settingIconWrap, { backgroundColor: tierColor + '18' }]}>
                  <Ionicons name="newspaper-outline" size={20} color={tierColor} />
                </View>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Create post</Text>
                  <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Commerce Feed — drops, events, products</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </PartnerFrostedCard>
          </TouchableOpacity>
        )}

        {flags.partnerMenusEnabled && (
          <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.push({ pathname: '/partner/menu', params: { partnerId } } as any); }} activeOpacity={0.88} style={styles.settingCardWrap}>
            <PartnerFrostedCard borderColor={tierColor} style={styles.settingsCard}>
              {menuNeedsAttention && (
                <View style={[styles.actionBadge, { backgroundColor: COLORS.danger }]}>
                  <Text style={styles.actionBadgeText}>!</Text>
                </View>
              )}
              <View style={styles.settingRow}>
                <View style={[styles.settingIconWrap, { backgroundColor: tierColor + '18' }]}>
                  <Ionicons name="restaurant-outline" size={20} color={tierColor} />
                </View>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Manage menu</Text>
                  <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Upload or paste → OCR → publish. Tonight Picks.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </PartnerFrostedCard>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/polls/create' as any); }}
          activeOpacity={0.88}
        >
          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: tierColor + '18' }]}>
              <Ionicons name="ellipse-outline" size={20} color={tierColor} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Run a poll</Text>
              <Text style={[styles.settingHint, { color: colors.textSecondary }]}>OrbVote — customers vote & earn OT. Quota by tier.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/polls' as any); }}
          activeOpacity={0.88}
        >
          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: tierColor + '18' }]}>
              <Ionicons name="list-outline" size={20} color={tierColor} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>My polls</Text>
              <Text style={[styles.settingHint, { color: colors.textSecondary }]}>View and manage your polls</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
        {flags.moduleStampCards && flags.stampCardsPartnerStudio && (
          <TouchableOpacity
            style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/stamp-studio' as any); }}
            activeOpacity={0.88}
          >
            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: tierColor + '18' }]}>
                <Ionicons name="pricetag-outline" size={20} color={tierColor} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Stamp Cards</Text>
                <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Display the Stamp Studio QR at your counter so customers can scan and earn stamps.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}
        {flags.moduleStampCards && flags.stampCardsRewardClaim && (
          <TouchableOpacity
            style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/stamp-redeem' as any); }}
            activeOpacity={0.88}
          >
            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: tierColor + '18' }]}>
                <Ionicons name="gift-outline" size={20} color={tierColor} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Redeem Stamp Reward</Text>
                <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Enter customer code to redeem their reward</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        {flags.isOrbOpportunitiesEnabled && (
          <TouchableOpacity
            style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: tierColor + '40' }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push({ pathname: '/partner/opportunities', params: { partnerId } } as any); }}
            activeOpacity={0.88}
          >
            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: tierColor + '18' }]}>
                <Ionicons name="briefcase-outline" size={20} color={tierColor} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>OrbOpportunities</Text>
                <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Post jobs, review applicants, verified work receipts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        {flags.isOrbOpsEnabled && flags.isOrbOpsWorkOrdersEnabled && (
          <TouchableOpacity
            style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: tierColor + '40' }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push({ pathname: '/work-orders', params: { role: 'partner' } } as any); }}
            activeOpacity={0.88}
          >
            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: tierColor + '18' }]}>
                <Ionicons name="document-text-outline" size={20} color={tierColor} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Work orders & catering</Text>
                <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Accept, deny, schedule — full control over requests</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        {flags.isOrbSwipeEnabled && (
          <TouchableOpacity
            style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: '#A78BFA' + '40' }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/orbswipe' as any); }}
            activeOpacity={0.88}
          >
            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: '#A78BFA' + '18' }]}>
                <Ionicons name="swap-horizontal" size={20} color="#A78BFA" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{layout.getDisplayName('screen_orbswipe_title', 'OrbSwipe')} Cockpit</Text>
                <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Leads, drops, reviews — act in seconds. {isProPartner ? 'Swipe Studio included.' : ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Meal Studio */}
        {flags['orbswipe.mealProposals'] && flags['partner.mealProposalComposer'] && (
          <TouchableOpacity
            style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: '#f59e0b' + '40' }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/meal-proposals' as any); }}
            activeOpacity={0.88}
          >
            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: '#f59e0b' + '18' }]}>
                <Ionicons name="restaurant" size={20} color="#f59e0b" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Meal Studio</Text>
                <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Create meal proposals for OrbSwipe — drive foot traffic</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* OrbOps & visibility */}
        <SectionTitle title="VISIBILITY" />
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: colors.background }]}>
              <Ionicons name="document-text-outline" size={20} color={colors.text} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Show Request Work / Catering</Text>
              <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Display action button on your page</Text>
            </View>
            <Switch
              value={showOrbOpsButton}
              onValueChange={(v) => { safeHaptics.selectionAsync(); setShowOrbOpsButton(v); }}
              trackColor={{ false: colors.border, true: COLORS.success + '99' }}
              thumbColor={showOrbOpsButton ? COLORS.success : colors.textSecondary}
            />
          </View>
          <View style={[styles.settingRow, styles.settingRowDivider, { borderTopColor: colors.border }]}>
            <View style={[styles.settingIconWrap, { backgroundColor: colors.background }]}>
              <Ionicons name="restaurant-outline" size={20} color={colors.text} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Offer catering</Text>
              <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Show "Request Catering" instead of "Request Work"</Text>
            </View>
            <Switch
              value={offersCatering}
              onValueChange={(v) => { safeHaptics.selectionAsync(); setOffersCatering(v); }}
              trackColor={{ false: colors.border, true: COLORS.success + '99' }}
              thumbColor={offersCatering ? COLORS.success : colors.textSecondary}
            />
          </View>
        </View>

        {/* Growth Suggestions (Phase E) */}
        {flags.isOrbSwipePartnerGrowthSuggestionsEnabled && growthTier !== 'none' && (
          <PartnerGrowthSuggestions partnerId={partnerId} events={orbSwipeEvents} tier={growthTier} />
        )}

        {/* ROI */}
        <SectionTitle title="ORBTAP ROI" />
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.roiRowFirst}>
            <Text style={[styles.roiLabel, { color: colors.textSecondary }]}>Views</Text>
            <Text style={[styles.roiValue, { color: colors.text }]}>{roi.views}</Text>
          </View>
          <View style={[styles.roiRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.roiLabel, { color: colors.textSecondary }]}>Clicks</Text>
            <Text style={[styles.roiValue, { color: colors.text }]}>{roi.clicks}</Text>
          </View>
          <View style={[styles.roiRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.roiLabel, { color: colors.textSecondary }]}>Reserves</Text>
            <Text style={[styles.roiValue, { color: colors.text }]}>{roi.reserves}</Text>
          </View>
          <View style={[styles.roiRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.roiLabel, { color: colors.textSecondary }]}>Redemptions</Text>
            <Text style={[styles.roiValue, { color: COLORS.success }]}>{roi.redemptions}</Text>
          </View>
          <Text style={[styles.roiHint, { color: colors.textSecondary }]}>From drops & proof flows</Text>
        </View>

        {/* Premium-only teaser row */}
        {!isPremiumPartner && (
          <View style={[styles.premiumTeaserRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
            <Text style={[styles.premiumTeaserText, { color: colors.textSecondary }]}>
              Premium: Conversion funnel · Export CSV · Partner Pro badge · Featured placement
            </Text>
          </View>
        )}

        {/* Latest intel */}
        <SectionTitle title="LATEST VERIFIED INTEL" />
        <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.reviewHeader}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.verifiedText}>VERIFIED VISIT</Text>
            </View>
            <Text style={[styles.date, { color: colors.textSecondary }]}>Recent</Text>
          </View>
          <Text style={[styles.reviewBody, { color: colors.text }]}>
            "Great spot. The new layout is genius. Definitely coming back for the midnight drop."
          </Text>
          <View style={styles.reviewerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.border }]} />
            <Text style={[styles.reviewerName, { color: colors.text }]}>Explorer</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="star" size={14} color={themeGold} />
            <Text style={[styles.rating, { color: colors.text }]}>5.0</Text>
          </View>
        </View>

        {!isPremiumPartner && (
          <TouchableOpacity
            style={[styles.upgradeCta, { backgroundColor: themeGold + '18', borderColor: themeGold, marginTop: 8 }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/compare-accounts' as any); }}
            activeOpacity={0.85}
          >
            <Ionicons name="diamond" size={18} color={themeGold} />
            <Text style={[styles.upgradeCtaText, { color: colors.text }]}>See all partner tier benefits</Text>
            <Ionicons name="chevron-forward" size={18} color={themeGold} />
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <GuidedTutorialOverlay
        visible={showDashboardTutorial}
        tutorialId="partner_dashboard"
        onClose={() => {
          markCompleted('partner_dashboard');
          setShowDashboardTutorial(false);
        }}
        onSkipAll={setSkipAllTutorials}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-start' },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 22, paddingBottom: 100 },
  walletStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  walletStripLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  walletStripAmount: { fontSize: 16, fontWeight: '800' },
  tasksBanner: { gap: 10, marginBottom: 16 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskCardText: { flex: 1, fontSize: 13, fontWeight: '600' },
  valuePropStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  valuePropText: { fontSize: 13, fontWeight: '600', flex: 1 },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  proTeaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  proTeaseText: { fontSize: 14, fontWeight: '600', flex: 1 },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1 },
  bannerSub: { fontSize: 12, color: '#333', marginTop: 4 },
  upgradeTeaserCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  upgradeTeaserContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeTeaserIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  upgradeTeaserTextWrap: { flex: 1, minWidth: 0 },
  upgradeTeaserTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  upgradeTeaserSub: { fontSize: 12, lineHeight: 18 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  lockHint: { fontSize: 10, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, marginBottom: 18 },
  impactGrid: { marginBottom: 18 },
  impactRow: { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP },
  statCardHalf: { flex: 1, minWidth: 0 },
  statCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '900' },
  periodHint: { fontSize: 10, marginTop: 4, opacity: 0.85 },
  upgradeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  upgradeCtaText: { fontSize: 13, fontWeight: '700', flex: 1 },
  chartCard: { marginBottom: 20 },
  chartCardInner: { padding: 16 },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 96, paddingHorizontal: 8 },
  barColumn: { alignItems: 'center', gap: 4, flex: 1 },
  barFill: { width: 28, borderRadius: 6 },
  barLabel: { fontSize: 11, fontWeight: 'bold' },
  barCountLabel: { fontSize: 12, fontWeight: '700' },
  chartHintRow: { fontSize: 10, marginTop: 10, textAlign: 'center' },
  frostedStatCard: { marginBottom: CARD_GAP },
  statCardContent: { padding: 18 },
  legendsCard: { marginBottom: 16 },
  legendsRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  legendsIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  legendsBody: { flex: 1, minWidth: 0 },
  legendsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  legendsHint: { fontSize: 12 },
  actionsBlock: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  actionCardWrap: { minWidth: 140, flex: 1, position: 'relative' as const },
  actionCard: {
    minWidth: 140,
    flex: 1,
    padding: 16,
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  actionBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  taskCountBadge: { fontSize: 12, fontWeight: '800' },
  settingCardWrap: { position: 'relative' as const },
  actionIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  actionHint: { fontSize: 11 },
  settingsCard: {
    padding: 18,
    marginBottom: 14,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  settingRowDivider: { borderTopWidth: 1 },
  settingIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingTextWrap: { flex: 1, minWidth: 0 },
  settingLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  settingHint: { fontSize: 12 },
  roiRowFirst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  roiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1 },
  roiLabel: { fontSize: 13 },
  roiValue: { fontSize: 16, fontWeight: '800' },
  roiHint: { fontSize: 10, marginTop: 8 },
  premiumTeaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  premiumTeaserText: { fontSize: 12, flex: 1 },
  reviewCard: { padding: 18, borderRadius: 14, borderWidth: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '18', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedText: { color: COLORS.success, fontSize: 10, fontWeight: 'bold' },
  date: { fontSize: 10 },
  reviewBody: { fontSize: 14, fontStyle: 'italic', marginBottom: 14, lineHeight: 20 },
  reviewerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  reviewerName: { fontSize: 12, fontWeight: 'bold' },
  rating: { fontSize: 12, fontWeight: 'bold' },
});
