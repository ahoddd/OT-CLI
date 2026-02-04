import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Share,
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
import { useGame } from '../../context/GameContext';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import {
  OrbSignalMarket,
  MOCK_ORB_SIGNAL_MARKETS,
  VOTE_COST,
  getFeaturedMarkets,
  getEndingSoonMarkets,
} from '../../constants/OrbSignal';
import { HOLO_COLORS, SHINE_COLORS } from '../../constants/PremiumStyles';
import { COLORS } from '../../constants/Colors';
import * as Haptics from 'expo-haptics';

const SIGNAL_HOLO_BORDER = 2;
const SIGNAL_SHINE_OPACITY = 0.5;

// --- How it works strip ---
function HowItWorksStrip() {
  const steps = [
    { icon: 'radio-outline' as const, label: 'Pick a signal', sub: 'Tap any market' },
    { icon: 'flash-outline' as const, label: 'Vote with OT Points', sub: `${VOTE_COST} pts per vote` },
    { icon: 'trophy-outline' as const, label: 'Earn rep & bonuses', sub: 'Correct = multipliers' },
  ];
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.howWrap}>
      <BlurView intensity={40} tint="dark" style={styles.howBlur}>
        <View style={styles.howInner}>
          <Text style={styles.howTitle}>How Orb Signal works</Text>
          <View style={styles.howSteps}>
            {steps.map((s, i) => (
              <View key={i} style={styles.howStep}>
                <View style={styles.howIconWrap}>
                  <Ionicons name={s.icon} size={22} color="#F59E0B" />
                </View>
                <Text style={styles.howStepLabel}>{s.label}</Text>
                <Text style={styles.howStepSub}>{s.sub}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.howDisclaimer}>
            Entertainment only. No cash value. Correct forecasts earn reputation & bonus OT Points.
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

// --- Share market ---
async function shareMarket(market: OrbSignalMarket, voted?: 'yes' | 'no') {
  try {
    const message = voted
      ? `I voted ${voted.toUpperCase()} on "${market.question}" — see the odds and vote on OrbTap Orb Signal.`
      : `"${market.question}" — What do you think? Vote with OT Points on OrbTap Orb Signal.`;
    await Share.share({
      title: 'Orb Signal',
      message,
      url: undefined,
    });
  } catch {}
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
    width: barWidth.value * 100 + '%',
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
    if (!canAfford) {
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (vote === 'yes') onVoteYes();
    else onVoteNo();
  };

  const accentColor = market.endingSoon ? '#EF4444' : market.featured ? '#F59E0B' : 'rgba(255,255,255,0.5)';
  return (
    <Animated.View style={[styles.cardWrap, shakeStyle]}>
      <Pressable onPress={onToggle}>
        <LinearGradient
          colors={[...HOLO_COLORS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardHoloBorder, { padding: SIGNAL_HOLO_BORDER }]}
        >
          <View style={[styles.cardInner, { backgroundColor: '#0d0d12' }]}>
            <View style={[styles.tierBar, { backgroundColor: accentColor }]} />
            <LinearGradient
              colors={[...SHINE_COLORS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity: SIGNAL_SHINE_OPACITY }]}
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
                <Text style={styles.categoryText}>{market.category}</Text>
              </View>
              {market.endingSoon && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>CLOSING SOON</Text>
                </View>
              )}
              {market.liveViewers != null && market.liveViewers > 0 && (
                <Text style={styles.viewersText}>{market.liveViewers} viewing</Text>
              )}
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  onShare();
                }}
                style={styles.shareBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardQuestion}>{market.question}</Text>

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
                <Animated.View style={[styles.sentimentBarFill, barFillStyle]}>
                  <LinearGradient
                    colors={['#0D9488', '#14B8A6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
              <View style={styles.sentimentBarOverlay} pointerEvents="none">
                <Text style={styles.sentimentBarLabel}>{probability}% YES</Text>
              </View>
            </View>

            <View style={styles.cardMeta}>
              <OTPointsBadge amount={market.pool.toLocaleString()} size={14} label="pts" compact textColor="#F59E0B" />
              <Text style={styles.endsText}>Ends {market.endsAtShort}</Text>
            </View>
            {market.rewardNote ? (
              <Text style={styles.rewardNote}>{market.rewardNote}</Text>
            ) : null}
            <View style={styles.voteCostRow}>
              <Text style={styles.voteCostLabel}>Vote cost</Text>
              <OTPointsBadge amount={market.voteCost} size={16} label="pts" compact textColor="#fff" />
            </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      <Animated.View style={[styles.expandedRow, expandedStyle]}>
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
      </Animated.View>
    </Animated.View>
  );
}

// --- Confirmed overlay with Share CTA ---
function ConfirmedOverlay({
  market,
  vote,
  onDismiss,
}: {
  market: OrbSignalMarket;
  vote: 'yes' | 'no';
  onDismiss: () => void;
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
    Haptics.selectionAsync();
    shareMarket(market, vote);
  };

  return (
    <Animated.View style={[styles.confirmOverlay, overlayStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <Animated.View style={[styles.confirmBox, iconStyle]}>
        <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
        <Text style={styles.confirmTitle}>Vote recorded</Text>
        <Text style={styles.confirmSub}>You voted {vote.toUpperCase()}. Correct forecasts earn bonus OT Points.</Text>
        <TouchableOpacity style={styles.sharePickBtn} onPress={handleSharePick} activeOpacity={0.85}>
          <Ionicons name="share-social" size={20} color="#000" />
          <Text style={styles.sharePickText}>Share your pick</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmDismissBtn} onPress={onDismiss}>
          <Text style={styles.confirmDismissText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// --- Screen ---
export default function OrbSignalScreen() {
  const router = useRouter();
  const { points, purchaseUpgrade } = useGame();
  const [markets, setMarkets] = useState<OrbSignalMarket[]>(() =>
    MOCK_ORB_SIGNAL_MARKETS.map((m) => ({ ...m, percentages: [...m.percentages] }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ market: OrbSignalMarket; vote: 'yes' | 'no' } | null>(null);

  const canAfford = points >= VOTE_COST;
  const featured = getFeaturedMarkets();
  const endingSoon = getEndingSoonMarkets();

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const applyVote = useCallback(
    (marketId: string, direction: 'yes' | 'no') => {
      const ok = purchaseUpgrade(VOTE_COST, 0);
      if (!ok) return;
      const market = markets.find((m) => m.id === marketId);
      if (!market) return;
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.id !== marketId) return m;
          const nextYes = Math.max(5, Math.min(95, m.percentages[0] + (direction === 'yes' ? 1 : -1)));
          return { ...m, percentages: [nextYes, 100 - nextYes] };
        })
      );
      setConfirmState({ market, vote: direction });
      setExpandedId(null);
    },
    [purchaseUpgrade, markets]
  );

  const handleShareMarket = useCallback((market: OrbSignalMarket) => {
    shareMarket(market);
  }, []);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0f0f12', '#1a1a20', '#0a0a0d']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Orb Signal</Text>
            <Text style={styles.headerSub}>Predict. Vote. Earn.</Text>
          </View>
          <View style={styles.reputationWrap}>
            <OTPointsBadge amount={points} size={20} label="pts" compact textColor="#F59E0B" />
            <Text style={styles.reputationLabel}>Balance</Text>
          </View>
      </View>
      
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <HowItWorksStrip />

          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Signals</Text>
            {endingSoon.length > 0 && (
              <Text style={styles.sectionSub}>Markets closing soon. Final hours to cast your prediction.</Text>
            )}
            {[...markets]
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
                canAfford={canAfford}
                onShare={() => handleShareMarket(market)}
                onDetails={() => router.push(`/orbsignal/${market.id}` as any)}
              />
            ))}
          </Animated.View>

          <TouchableOpacity
            style={styles.detailCta}
            onPress={() => router.push('/orbsignal/m1' as any)}
          >
            <Text style={styles.detailCtaText}>How are odds calculated?</Text>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Entertainment only. No wagering. Not financial advice. OT Points have no cash value.
          </Text>
        </ScrollView>
      </SafeAreaView>

      {confirmState && (
        <ConfirmedOverlay
          market={confirmState.market}
          vote={confirmState.vote}
          onDismiss={() => setConfirmState(null)}
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
  scrollContent: { padding: 20, paddingBottom: 48 },
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
  cardQuestion: { fontSize: 17, fontWeight: '800', color: '#FFF', lineHeight: 22, marginBottom: 14 },
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
  disclaimer: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 24, paddingHorizontal: 20, lineHeight: 14 },
});
