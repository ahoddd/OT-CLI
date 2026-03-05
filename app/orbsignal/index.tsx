import React, { useState, useCallback, useMemo } from 'react';
import Svg, { Polyline } from 'react-native-svg';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  Easing,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWallet } from '../../hooks/useWallet';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import {
  OrbSignalMarket,
  MOCK_ORB_SIGNAL_MARKETS,
  VOTE_COST,
} from '../../constants/OrbSignal';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { useSignal } from '../../hooks/useSignal';
import { usePartners } from '../../context/PartnersContext';
import { useFlags } from '../../components/FlagContext';
import { fetchOrbSignalMarketsFromFirestore } from '../../services/orbsignalMarkets';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { ORBTAP_APP_LINK } from '../../constants/AppLinks';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { useI18n } from '../../context/I18nContext';
import { useDemoDataEnabled } from '../../hooks/useDemoDataEnabled';

const SIGNAL_DAILY_LIMIT: Record<'free' | 'premium' | 'pro', number> = {
  free: 2,
  premium: 10,
  pro: Infinity,
};

const SIGNAL_HOLO_BORDER = 2;
const SIGNAL_SHINE_OPACITY = 0.5;

// --- How it works strip ---
function HowItWorksStrip() {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const steps = [
    { icon: 'radio-outline' as const, label: 'Pick a signal', sub: 'Tap any market' },
    { icon: 'flash-outline' as const, label: 'Vote with OT Points', sub: `${VOTE_COST} pts per vote` },
    { icon: 'trophy-outline' as const, label: 'Earn rep & bonuses', sub: 'Correct = multipliers' },
  ];
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={[styles.howWrap, { borderColor: colors.border }]}>
      <BlurView intensity={40} tint="dark" style={styles.howBlur}>
        <View style={styles.howInner}>
          <Text style={[styles.howTitle, { color: colors.text }]}>How Orb Signal works</Text>
          <View style={styles.howSteps}>
            {steps.map((s, i) => (
              <View key={i} style={styles.howStep}>
                <View style={styles.howIconWrap}>
                  <Ionicons name={s.icon} size={22} color={themeGold} />
                </View>
                <Text style={[styles.howStepLabel, { color: colors.text }]}>{s.label}</Text>
                <Text style={[styles.howStepSub, { color: colors.textSecondary }]}>{s.sub}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.howDisclaimer, { color: colors.textSecondary }]}>
            Entertainment only. No cash value. Correct forecasts earn reputation & bonus OT Points.
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

/** Mini 5-point sparkline using market ID as seed for deterministic "momentum" */
function MiniSparkline({ marketId, probability, color }: { marketId: string; probability: number; color: string }) {
  const W = 60; const H = 24;
  // Generate 5 deterministic data points from market ID hash
  const points = useMemo(() => {
    let seed = marketId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
    const base = probability / 100;
    const data = [rng() * 0.4 + 0.3, rng() * 0.3 + base * 0.7, rng() * 0.2 + base * 0.8, rng() * 0.15 + base * 0.85, base];
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - v * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [marketId, probability]);
  return (
    <Svg width={W} height={H}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </Svg>
  );
}

// --- Market Card ---
function SignalCard({
  market,
  isExpanded,
  onToggle,
  onVoteYes,
  onVoteNo,
  canAfford,
  onShare,
  onDetails,
  probability,
  userVote,
}: {
  market: OrbSignalMarket;
  isExpanded: boolean;
  onToggle: () => void;
  onVoteYes: () => void;
  onVoteNo: () => void;
  canAfford: boolean;
  onShare: () => void;
  onDetails?: () => void;
  probability: number;
  /** If user already voted on this market, show that instead of Yes/No buttons. */
  userVote: 'yes' | 'no' | null;
}) {
  const expandProgress = useSharedValue(isExpanded ? 1 : 0);
  const shakeX = useSharedValue(0);
  const barWidth = useSharedValue(probability / 100);

  React.useEffect(() => {
    expandProgress.value = withSpring(isExpanded ? 1 : 0, { damping: 20, stiffness: 200 });
  }, [isExpanded, expandProgress]);

  React.useEffect(() => {
    barWidth.value = withTiming(probability / 100, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [probability, barWidth]);

  const expandedStyle = useAnimatedStyle(() => ({
    maxHeight: expandProgress.value * 180,
    opacity: expandProgress.value,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const barFillStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-6, { duration: 40 }),
      withTiming(6, { duration: 40 }),
      withTiming(-4, { duration: 40 }),
      withTiming(4, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );
  }, [shakeX]);

  const handleVote = (vote: 'yes' | 'no') => {
    if (userVote !== null) return; // already voted
    if (!canAfford) {
      triggerShake();
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (vote === 'yes') onVoteYes();
    else onVoteNo();
  };

  const { colors } = useTheme();
  const { getPartner } = usePartners();
  // Resolve tier from partner so tiles auto-adapt when partner upgrades/downgrades. Silver = free, Gold = premium, Platinum = pro.
  const partner = market.partnerId ? getPartner(market.partnerId) : undefined;
  const tier = partner?.tier ?? market.tier ?? 'silver';
  const accentColor = PARTNER_TIER_COLORS[tier];
  const borderColors = [accentColor, accentColor + 'dd', accentColor] as [string, string, ...string[]];
  return (
    <Animated.View style={[styles.cardWrap, shakeStyle]}>
      <Pressable onPress={onToggle}>
        <LinearGradient
          colors={borderColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardHoloBorder, { padding: SIGNAL_HOLO_BORDER }]}
        >
          <View style={[styles.cardInner, { backgroundColor: colors.surface }]}>
            <View style={[styles.tierBar, { backgroundColor: accentColor }]} />
            <LinearGradient
              colors={[accentColor + '18', accentColor + '08', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
              pointerEvents="none"
            />
            {market.imageUrl ? (
              <View style={styles.cardImageWrap}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[styles.cardImagePlaceholder, { borderColor: accentColor + '44' }]}>
                  <Ionicons name="radio" size={32} color={accentColor} />
                </View>
              </View>
            ) : null}
            <View style={styles.cardInnerContent}>
            <View style={styles.cardTopRow}>
              <View style={[styles.categoryPill, market.featured && styles.categoryPillFeatured]}>
                <Text style={[styles.categoryText, { color: colors.text }]}>{market.category}</Text>
              </View>
              {market.endingSoon && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>CLOSING SOON</Text>
                </View>
              )}
              {market.liveViewers != null && market.liveViewers > 0 && (
                <Text style={[styles.viewersText, { color: colors.textSecondary }]}>{market.liveViewers} viewing</Text>
              )}
              <TouchableOpacity
                onPress={() => {
                  safeHaptics.selectionAsync();
                  onShare();
                }}
                style={styles.shareBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.questionRow}>
              <Text style={[styles.cardQuestion, { color: colors.text }]}>{market.question}</Text>
              <MiniSparkline marketId={market.id} probability={probability} color={accentColor} />
            </View>

            {/* Confidence meter label */}
            <View style={styles.confidenceLabels}>
              <Text style={[styles.confidenceLabelYes, { color: '#14B8A6' }]}>{probability}% YES</Text>
              <Text style={[styles.confidenceLabelNo, { color: '#F43F5E' }]}>{100 - probability}% NO</Text>
            </View>

            <View style={styles.sentimentBarWrap}>
              <View style={styles.sentimentBarBg}>
                <View style={styles.sentimentBarNo}>
                  <LinearGradient
                    colors={['#E11D48', '#F43F5E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
                <Animated.View style={[styles.sentimentBarFill as Record<string, unknown>, barFillStyle]}>
                  <LinearGradient
                    colors={['#0D9488', '#14B8A6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
              <View style={styles.sentimentBarOverlay} pointerEvents="none">
                <Text style={[styles.sentimentBarLabel, { color: colors.text }]}>{probability}% YES</Text>
              </View>
            </View>

            <View style={styles.cardMeta}>
              <OTPointsBadge amount={market.pool.toLocaleString()} size={14} label="pts" compact textColor={accentColor} />
              <Text style={[styles.endsText, { color: colors.textSecondary }]}>Ends {market.endsAtShort}</Text>
            </View>
            {market.rewardNote ? (
              <Text style={[styles.rewardNote, { color: accentColor }]}>{market.rewardNote}</Text>
            ) : null}
            <View style={styles.voteCostRow}>
              <Text style={[styles.voteCostLabel, { color: colors.textSecondary }]}>Vote cost</Text>
              <OTPointsBadge amount={market.voteCost} size={16} label="pts" compact textColor={colors.text} />
            </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      <Animated.View style={[styles.expandedRow, expandedStyle]}>
        {userVote !== null ? (
          <View style={[styles.votedRow, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            <Text style={[styles.votedText, { color: colors.text }]}>You voted {userVote.toUpperCase()}</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.voteBtn, styles.voteYes]}
              onPress={() => handleVote('yes')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#0D9488', '#14B8A6']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.voteBtnText}>VOTE YES</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.voteBtn, styles.voteNo]}
              onPress={() => handleVote('no')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#E11D48', '#F43F5E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.voteBtnText}>VOTE NO</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

// --- Confirmed overlay with Share CTA ---
function ConfirmedOverlay({
  market,
  vote,
  onDismiss,
  onShareRequest,
}: {
  market: OrbSignalMarket;
  vote: 'yes' | 'no';
  onDismiss: () => void;
  onShareRequest: (payload: { message: string; title: string; url?: string }) => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleSharePick = () => {
    safeHaptics.selectionAsync();
    const message = `I voted ${vote.toUpperCase()} on "${market.question}" — see the odds and vote on OrbTap Orb Signal.`;
    onShareRequest({ message, title: 'Orb Signal', url: ORBTAP_APP_LINK });
  };

  const { colors } = useTheme();
  return (
    <Animated.View style={[styles.confirmOverlay, overlayStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <Animated.View style={[styles.confirmBox, iconStyle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
        <Text style={[styles.confirmTitle, { color: colors.text }]}>Vote recorded</Text>
        <Text style={[styles.confirmSub, { color: colors.textSecondary }]}>You voted {vote.toUpperCase()}. Correct forecasts earn bonus OT Points.</Text>
        <TouchableOpacity style={[styles.sharePickBtn, { backgroundColor: colors.surfaceHighlight }]} onPress={handleSharePick} activeOpacity={0.85}>
          <Ionicons name="share-social" size={20} color={colors.text} />
          <Text style={[styles.sharePickText, { color: colors.text }]}>Share your pick</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmDismissBtn} onPress={onDismiss}>
          <Text style={[styles.confirmDismissText, { color: colors.textSecondary }]}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// --- Screen ---
export default function OrbSignalScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { balance: points } = useWallet();
  const { placeForecast, getMyVoteForMarket, myForecasts } = useSignal();
  const { flags } = useFlags();
  const { tier } = useEffectiveTier();
  const { demoDataEnabled } = useDemoDataEnabled();
  const [markets, setMarkets] = useState<OrbSignalMarket[]>([]);
  const [marketsError, setMarketsError] = useState(false);
  const [marketsLoading, setMarketsLoading] = useState(false);

  const fetchMarkets = React.useCallback(() => {
    if (!flags.isFirestoreLiveEnabled) {
      if (demoDataEnabled) {
        setMarkets(MOCK_ORB_SIGNAL_MARKETS.map((m) => ({ ...m, percentages: [...m.percentages] })));
      } else {
        setMarkets([]);
      }
      return;
    }
    setMarketsError(false);
    setMarketsLoading(true);
    fetchOrbSignalMarketsFromFirestore(50)
      .then((list) => {
        if (list.length > 0) {
          setMarkets(list.map((m) => ({ ...m, percentages: [...m.percentages] })));
        } else if (demoDataEnabled) {
          setMarkets(MOCK_ORB_SIGNAL_MARKETS.map((m) => ({ ...m, percentages: [...m.percentages] })));
        } else {
          setMarkets([]);
        }
      })
      .catch(() => setMarketsError(true))
      .finally(() => setMarketsLoading(false));
  }, [flags.isFirestoreLiveEnabled, demoDataEnabled]);

  React.useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ market: OrbSignalMarket; vote: 'yes' | 'no' } | null>(null);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; title?: string; url?: string } | null>(null);
  const [segment, setSegment] = useState<'all' | 'featured' | 'endingSoon'>('all');

  const canAfford = points >= VOTE_COST;

  // Rate-limit calculations
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayForecastCount = myForecasts.filter((f) => f.createdAt >= todayStart.getTime()).length;
  const dailyLimit = SIGNAL_DAILY_LIMIT[tier];
  const remaining = dailyLimit === Infinity ? Infinity : Math.max(0, dailyLimit - todayForecastCount);
  const isRateLimited = remaining === 0;

  const featured = React.useMemo(() => markets.filter((m) => m.featured), [markets]);
  const endingSoon = React.useMemo(() => markets.filter((m) => m.endingSoon), [markets]);
  const filteredMarkets = segment === 'featured' ? featured : segment === 'endingSoon' ? endingSoon : [...markets];

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const applyVote = useCallback(
    async (marketId: string, direction: 'yes' | 'no') => {
      if (getMyVoteForMarket(marketId)) return; // already voted
      if (points < VOTE_COST) return;
      if (isRateLimited) {
        router.push('/premium' as any);
        return;
      }
      const market = markets.find((m) => m.id === marketId);
      if (!market) return;
      const outcomeIndex = direction === 'yes' ? 0 : 1;
      const outcomeLabel = market.outcomes?.[outcomeIndex] ?? direction.toUpperCase();
      await placeForecast(marketId, outcomeIndex, VOTE_COST, market.question, outcomeLabel);
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.id !== marketId) return m;
          const nextYes = Math.max(5, Math.min(95, m.percentages[0] + (direction === 'yes' ? 1 : -1)));
          return { ...m, percentages: [nextYes, 100 - nextYes] };
        })
      );
      setConfirmState({ market, vote: direction });
      setExpandedId(null);
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [points, markets, placeForecast, getMyVoteForMarket, isRateLimited, router]
  );

  const handleShareMarket = useCallback((market: OrbSignalMarket) => {
    const message = `"${market.question}" — What do you think? Vote with OT Points on OrbTap Orb Signal.`;
    setSharePayload({ message, title: 'Orb Signal', url: ORBTAP_APP_LINK });
    setShareSheetVisible(true);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Orb Signal</Text>
            {dailyLimit !== Infinity && (
              <Text style={[styles.headerSub, { color: isRateLimited ? COLORS.danger : colors.textSecondary }]}>
                {isRateLimited ? 'Daily limit reached' : `${remaining}/${dailyLimit} forecasts left today`}
              </Text>
            )}
            {dailyLimit === Infinity && (
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Predict. Vote. Earn.</Text>
            )}
          </View>
          <TouchableOpacity style={[styles.reputationWrap, { backgroundColor: colors.surfaceHighlight }]} onPress={() => router.push('/(tabs)/wallet' as any)} activeOpacity={0.8} accessibilityLabel="Your OT Points. Tap to open Wallet." accessibilityRole="button">
            <OTPointsBadge amount={points} size={20} label="pts" compact textColor={themeGold} />
            <Text style={[styles.reputationLabel, { color: colors.textSecondary }]}>Balance</Text>
          </TouchableOpacity>
      </View>
      
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <HowItWorksStrip />

          <View style={[styles.segmentRow, { borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.segmentPill, segment === 'all' && styles.segmentPillActive, segment === 'all' && { backgroundColor: themeGold + '30', borderColor: themeGold }]} onPress={() => setSegment('all')}>
              <Text style={[styles.segmentPillText, { color: segment === 'all' ? themeGold : colors.textSecondary }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentPill, segment === 'featured' && styles.segmentPillActive, segment === 'featured' && { backgroundColor: themeGold + '30', borderColor: themeGold }]} onPress={() => setSegment('featured')}>
              <Text style={[styles.segmentPillText, { color: segment === 'featured' ? themeGold : colors.textSecondary }]}>Featured</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentPill, segment === 'endingSoon' && styles.segmentPillActive, segment === 'endingSoon' && { backgroundColor: themeGold + '30', borderColor: themeGold }]} onPress={() => setSegment('endingSoon')}>
              <Text style={[styles.segmentPillText, { color: segment === 'endingSoon' ? themeGold : colors.textSecondary }]}>Ending soon</Text>
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Signals</Text>
            {segment === 'endingSoon' && endingSoon.length > 0 && (
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Markets closing soon. Final hours to cast your prediction.</Text>
            )}
            {marketsError ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="wifi-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Could not load markets</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Check your connection and try again.</Text>
                <TouchableOpacity style={[styles.emptyCta, { backgroundColor: COLORS.neonBlue[0] }]} onPress={fetchMarkets}>
                  <Text style={styles.emptyCtaText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !marketsLoading && filteredMarkets.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No active markets</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Check back soon — new prediction markets open daily.</Text>
                <TouchableOpacity style={[styles.emptyCta, { backgroundColor: colors.primary }]} onPress={() => router.push('/pulse' as any)}>
                  <Text style={styles.emptyCtaText}>OrbPulse</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.emptyCta, { borderColor: colors.border }]} onPress={() => router.push('/missions' as any)}>
                  <Text style={[styles.emptyCtaText, { color: colors.text }]}>Missions</Text>
                </TouchableOpacity>
              </View>
            ) : (
            [...filteredMarkets]
              .sort((a, b) => (a.endingSoon === b.endingSoon ? 0 : a.endingSoon ? -1 : 1))
              .map((market) => (
          <SignalCard 
                key={market.id}
                market={market}
                probability={market.percentages[0]}
                isExpanded={expandedId === market.id}
                onToggle={() => handleToggleExpand(market.id)}
                onVoteYes={() => applyVote(market.id, 'yes')}
                onVoteNo={() => applyVote(market.id, 'no')}
                canAfford={canAfford && !isRateLimited}
                onShare={() => handleShareMarket(market)}
                onDetails={() => router.push(`/orbsignal/${market.id}` as any)}
                userVote={(() => { const f = getMyVoteForMarket(market.id); return f ? (f.outcomeIndex === 0 ? 'yes' as const : 'no' as const) : null; })()}
              />
            ))
            )}
          </Animated.View>

          <TouchableOpacity
            style={styles.detailCta}
            onPress={() => router.push('/orbsignal/m1' as any)}
          >
            <Text style={[styles.detailCtaText, { color: colors.textSecondary }]}>How are odds calculated?</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.quickLinksWrap}>
            <Text style={[styles.quickLinksLabel, { color: colors.textSecondary }]}>More</Text>
            <View style={styles.quickLinksRow}>
              <TouchableOpacity style={[styles.quickLinkPill, { backgroundColor: colors.surface }]} onPress={() => router.push('/pulse' as any)}>
                <Ionicons name="pulse" size={18} color={colors.text} />
                <Text style={[styles.quickLinkPillText, { color: colors.text }]}>OrbPulse</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickLinkPill, { backgroundColor: colors.surface }]} onPress={() => router.push('/vote' as any)}>
                <Ionicons name="stats-chart" size={18} color={colors.text} />
                <Text style={[styles.quickLinkPillText, { color: colors.text }]}>OrbVote</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickLinkPill, { backgroundColor: colors.surface }]} onPress={() => router.push('/stats' as any)}>
                <Ionicons name="stats-chart" size={18} color={colors.text} />
                <Text style={[styles.quickLinkPillText, { color: colors.text }]}>Stats</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            Entertainment only. No wagering. Not financial advice. OT Points have no cash value.
          </Text>
        </ScrollView>
      </SafeAreaView>

      {confirmState && (
        <ConfirmedOverlay
          market={confirmState.market}
          vote={confirmState.vote}
          onDismiss={() => setConfirmState(null)}
          onShareRequest={(payload) => {
            setSharePayload(payload);
            setShareSheetVisible(true);
          }}
        />
      )}
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share Orb Signal"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0d' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  headerBack: { padding: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  reputationWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reputationLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  howWrap: { marginBottom: 24, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  howBlur: { borderRadius: 16, overflow: 'hidden' },
  howInner: { padding: 18 },
  howTitle: { fontSize: 14, fontWeight: '800', color: '#FFF', marginBottom: 14, letterSpacing: 0.5 },
  howSteps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  howStep: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  howIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245,158,11,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  howStepLabel: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  howStepSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  howDisclaimer: { fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 14, textAlign: 'center' },
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 20, paddingHorizontal: 4 },
  segmentPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  segmentPillActive: {},
  segmentPillText: { fontSize: 14, fontWeight: '700' },
  emptyWrap: { paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  emptyCta: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1, marginTop: 10 },
  emptyCtaText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  cardWrap: { marginBottom: 14, borderRadius: 20, overflow: 'hidden' },
  cardHoloBorder: { borderRadius: 20, overflow: 'hidden' },
  cardInner: { borderRadius: 18, overflow: 'hidden', minHeight: 140 },
  tierBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 18, borderTopRightRadius: 18, zIndex: 1 },
  cardImageWrap: { height: 88, position: 'relative', marginBottom: 8 },
  cardImagePlaceholder: { flex: 1, borderBottomWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardInnerContent: { padding: 18, paddingTop: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  categoryPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
  categoryPillFeatured: { backgroundColor: 'rgba(245,158,11,0.25)' },
  categoryText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.25)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 },
  viewersText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  shareBtn: { marginLeft: 'auto', padding: 6 },
  questionRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  cardQuestion: { fontSize: 17, fontWeight: '800', color: '#FFF', lineHeight: 22, flex: 1 },
  confidenceLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confidenceLabelYes: { fontSize: 11, fontWeight: '800' },
  confidenceLabelNo: { fontSize: 11, fontWeight: '800' },
  sentimentBarWrap: { height: 44, borderRadius: 12, overflow: 'hidden', marginBottom: 12, position: 'relative' },
  sentimentBarBg: { ...StyleSheet.absoluteFillObject, borderRadius: 12, overflow: 'hidden' },
  sentimentBarNo: { ...StyleSheet.absoluteFillObject, borderRadius: 12, overflow: 'hidden' },
  sentimentBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 12, overflow: 'hidden' },
  sentimentBarOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  sentimentBarLabel: { fontSize: 14, fontWeight: '800', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  endsText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  rewardNote: { fontSize: 11, color: 'rgba(245,158,11,0.9)', marginBottom: 4 },
  voteCostRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voteCostLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  detailsLinkWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 18 },
  detailsLinkText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  expandedRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingBottom: 18, overflow: 'hidden' },
  voteBtn: { flex: 1, height: 52, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  voteYes: {},
  voteNo: {},
  voteBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  votedRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
  },
  votedText: { fontSize: 15, fontWeight: '700' },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 24,
  },
  confirmBox: { alignItems: 'center', backgroundColor: '#1a1a1f', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', maxWidth: 320 },
  confirmTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 16 },
  confirmSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  sharePickBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, marginTop: 20 },
  sharePickText: { fontSize: 15, fontWeight: '800', color: '#000' },
  confirmDismissBtn: { marginTop: 12 },
  confirmDismissText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  detailCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, paddingVertical: 14 },
  detailCtaText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  quickLinksWrap: { marginTop: 16, marginBottom: 8, paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1, borderRadius: 12, borderColor: 'rgba(255,255,255,0.08)' },
  quickLinksLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, marginHorizontal: 4, color: 'rgba(255,255,255,0.5)' },
  quickLinksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickLinkPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.06)' },
  quickLinkPillText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  disclaimer: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 24, paddingHorizontal: 20, lineHeight: 14 },
});
