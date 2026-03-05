import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useWallet } from '../hooks/useWallet';
import { useStreak } from '../hooks/useStreak';
import { useBadges } from '../hooks/useBadges';
import { useFlags } from '../components/FlagContext';
import { useRouter } from 'expo-router';
import { OTPointsBadge } from './OTPointsBadge';
import { claimDailyOrbRitual } from '../services/ritualApi';
import { LEDGER_REASON } from '../constants/OrbinomicsPolicy';
import { getRandomShatterMessage } from '../constants/ShatterMessages';
import { getRitualBadge, getRitualBadgesByTier, type RitualBadgeTier } from '../constants/RitualBadges';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { ShareToSocialSheet } from './ShareToSocialSheet';
import { buildAppSharePayload } from '../utils/shareToSocial';
import { usePreferences } from '../hooks/usePreferences';

const ORB_SIZE_DEFAULT = 152;
const ORB_SIZE_COMPACT = 72;

/** Crack paths overlay — more visible each tap (1 = light, 2 = more, 3 = full) */
function CrackOverlay({ stage, size }: { stage: 0 | 1 | 2 | 3; size: number }) {
  if (stage === 0) return null;
  const opacity = stage === 1 ? 0.25 : stage === 2 ? 0.5 : 0.75;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
        <Path d="M 76 22 L 80 85" stroke="rgba(0,0,0,0.6)" strokeWidth={2} strokeLinecap="round" />
        <Path d="M 54 54 L 96 58" stroke="rgba(0,0,0,0.6)" strokeWidth={1.5} strokeLinecap="round" />
        {stage >= 2 && (
          <>
            <Path d="M 32 44 L 64 78" stroke="rgba(0,0,0,0.5)" strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M 88 34 L 92 98" stroke="rgba(0,0,0,0.5)" strokeWidth={1} strokeLinecap="round" />
          </>
        )}
        {stage >= 3 && (
          <>
            <Path d="M 22 66 L 76 70" stroke="rgba(0,0,0,0.5)" strokeWidth={1} strokeLinecap="round" />
            <Path d="M 60 18 L 62 82" stroke="rgba(0,0,0,0.5)" strokeWidth={1} strokeLinecap="round" />
          </>
        )}
      </Svg>
    </View>
  );
}

/** 3D-style sphere: base fill + strong specular + bottom shadow + rim for realistic orb */
function OrbSphere({ tapCount, size, themeGold }: { tapCount: number; size: number; themeGold: string }) {
  const half = size / 2;
  const iconSize = size <= 80 ? 18 : size <= 100 ? 24 : 36;
  return (
    <View style={[sphereStyles.outer, { width: size, height: size, borderRadius: half, borderWidth: Math.max(1, size / 76) }]} pointerEvents="none">
      {/* Base gradient — warm center to darker edge (curvature) */}
      <LinearGradient
        colors={['#fde047', '#fcd34d', themeGold, '#d97706', '#b45309', '#92400e']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0.15 }}
        end={{ x: 0.8, y: 0.95 }}
      />
      {/* Strong specular — top-left (main light source) */}
      <LinearGradient
        colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.08)', 'transparent']}
        style={[sphereStyles.specular, { borderTopLeftRadius: half }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Secondary highlight — smaller hot spot */}
      <LinearGradient
        colors={['rgba(255,255,255,0.6)', 'transparent']}
        style={{ position: 'absolute', top: size * 0.08, left: size * 0.12, width: size * 0.35, height: size * 0.3, borderRadius: half }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Bottom-right shadow — depth */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.95, y: 0.9 }}
      />
      {/* Rim light — top edge 3D pop */}
      <LinearGradient
        colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.15)', 'transparent']}
        style={[sphereStyles.rim, { height: size * 0.45, borderTopLeftRadius: half, borderTopRightRadius: half }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />
      {/* Inner core glow */}
      <View style={[sphereStyles.coreGlow, { top: size * 0.28, left: size * 0.28, width: size * 0.44, height: size * 0.44, borderRadius: size * 0.22 }]} />
      <CrackOverlay stage={tapCount as 0 | 1 | 2 | 3} size={size} />
      <View style={sphereStyles.iconWrap}>
        {tapCount === 0 && <Ionicons name="finger-print" size={iconSize} color="rgba(0,0,0,0.35)" />}
        {tapCount === 1 && <Ionicons name="warning" size={iconSize - 2} color="rgba(0,0,0,0.45)" />}
        {tapCount === 2 && <Ionicons name="flash" size={iconSize - 2} color="rgba(0,0,0,0.45)" />}
      </View>
    </View>
  );
}

const sphereStyles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: '58%',
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  coreGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  iconWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
});

export interface DailyStreakOrbProps {
  /** Called when user completes the ritual (shatters orb) so parent can collapse the section. Second arg is OT points earned. */
  onRitualComplete?: (streakCount: number, pointsEarned?: number) => void;
  /** Compact layout for orb page — smaller orb and tile */
  compact?: boolean;
}

export const DailyStreakOrb = ({ onRitualComplete, compact = false }: DailyStreakOrbProps) => {
  const ORB_SIZE = compact ? ORB_SIZE_COMPACT : ORB_SIZE_DEFAULT;
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const { addTransaction } = useWallet();
  const { streak: streakState, checkIn } = useStreak();
  const { earnBadge, earnRitualBadge } = useBadges();
  const [tapCount, setTapCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'shattering' | 'complete'>('idle');
  const [rewardAmount, setRewardAmount] = useState(0);
  const [message, setMessage] = useState('');
  const [badgeAwarded, setBadgeAwarded] = useState<{ badgeId: string; tier: string } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [displayStreak, setDisplayStreak] = useState(streakState.currentStreak);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const streak = displayStreak;
  const ritualEnabled = Boolean(flags.ritualDailyOrbEnabled);
  const { prefs } = usePreferences();

  useEffect(() => {
    setDisplayStreak(streakState.currentStreak);
  }, [streakState.currentStreak]);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shake = useSharedValue(0);
  const rotation = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    if (status === 'idle' && tapCount === 0) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 2500 }),
        withTiming(1, { duration: 2500 })
      );
    }
  }, [status, tapCount]);

  const handlePressIn = () => {
    if (status !== 'idle') return;
    pressScale.value = withTiming(0.92, { duration: 60 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const handleTap = () => {
    if (status !== 'idle') return;

    if (tapCount < 2) {
      setTapCount((c) => c + 1);
      safeHaptics.impactAsync(tapCount === 0 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
      shake.value = withSequence(withTiming(1, { duration: 80 }), withSpring(0));
      scale.value = withSequence(withTiming(0.97, { duration: 80 }), withSpring(1.02));
    } else {
      // Third tap: shatter
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus('shattering');
      scale.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 280 }, () => {
        runOnJS(onShatterComplete)();
      });
    }
  };

  const onShatterComplete = async () => {
    const newStreak = checkIn() ?? streakState.currentStreak + 1;
    setDisplayStreak(newStreak);
    if (newStreak >= 3) earnBadge('streak_3');
    if (newStreak >= 7) earnBadge('streak_7');
    if (newStreak >= 14) earnBadge('streak_14');
    if (newStreak >= 30) earnBadge('streak_30');
    if (newStreak >= 100) earnBadge('streak_100');
    setBadgeAwarded(null);
    setClaimError(null);

    let pointsEarned = 0;
    if (ritualEnabled) {
      try {
        const result = await claimDailyOrbRitual({ streakDays: newStreak });
        if (result.success) {
          pointsEarned = result.pointsAwarded;
          setRewardAmount(result.pointsAwarded);
          setMessage(getRandomShatterMessage());
          if (result.pointsAwarded > 0 && flags.ritualPointsEnabled) {
            addTransaction({
              type: 'earn',
              amount: result.pointsAwarded,
              reason: LEDGER_REASON.EMIT_DAILY_ORB_RITUAL,
            });
          }
          if (result.badgeAwarded && flags.ritualBadgesEnabled) {
            const tier = result.badgeAwarded.tier.toUpperCase() as RitualBadgeTier;
            const candidates = getRitualBadgesByTier(tier);
            const badgeId = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)].id : result.badgeAwarded.badgeId;
            setBadgeAwarded({ badgeId, tier: result.badgeAwarded.tier });
            earnRitualBadge(badgeId);
          }
        } else {
          setRewardAmount(0);
          setMessage(result.alreadyClaimed ? "You've already claimed today. Come back tomorrow!" : result.message ?? 'Connect to claim');
          setClaimError(result.message ?? 'Connect to claim');
        }
      } catch {
        setRewardAmount(0);
        setMessage('Connect to claim your daily reward.');
        setClaimError('Connect to claim');
      }
    } else {
      const prizes = [
        { label: '+50', amount: 50 },
        { label: '+25', amount: 25 },
        { label: '+100', amount: 100 },
        { label: '+10', amount: 10 },
      ];
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      pointsEarned = prize.amount;
      setRewardAmount(prize.amount);
      setMessage(getRandomShatterMessage());
      addTransaction({ type: 'earn', amount: prize.amount, reason: `Daily Streak Reward (${newStreak})` });
    }
    setStatus('complete');
    onRitualComplete?.(newStreak, pointsEarned);
  };

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value * pressScale.value },
      { translateX: shake.value * 6 },
    ],
    opacity: opacity.value,
  }));

  if (status === 'complete') {
    const ritualBadgeDef = badgeAwarded ? getRitualBadge(badgeAwarded.badgeId) : null;
    const showPointsEarned = rewardAmount > 0;
    return (
      <>
      <Animated.View layout={Layout.springify()} style={styles.completeWrap}>
        {/* Quick exciting popup: amount earned — first thing user sees */}
        {showPointsEarned && (
          <Animated.View
            entering={FadeInDown.duration(280).springify().damping(0.8)}
            style={[styles.earnedPopup, compact && styles.earnedPopupCompact, { borderColor: themeGold + '50' }]}
          >
            <Text style={[styles.earnedPopupText, compact && styles.earnedPopupTextCompact, { color: themeGold }]}>
              +{rewardAmount} OT
            </Text>
            <Text style={[styles.earnedPopupSub, { color: colors.textSecondary }]}>earned</Text>
          </Animated.View>
        )}
        <Animated.View entering={FadeInDown.duration(400).delay(showPointsEarned ? 120 : 0)} style={styles.messageBlock}>
          <Text style={[styles.shatterMessage, { color: colors.text }]}>{message}</Text>
          {/* Prominent OT Points earned — always visible for user/member accounts */}
          <Animated.View entering={FadeInDown.delay(150).duration(350)} style={styles.rewardRow}>
            <OTPointsBadge amount={rewardAmount} size={compact ? 24 : 32} label="pts" compact textColor={themeGold} />
          </Animated.View>
          {showPointsEarned && (
            <Text style={[styles.otPointsEarnedLabel, { color: themeGold }]}>
              +{rewardAmount} OT Points earned
            </Text>
          )}
          <Text style={[styles.dailyRitualSubtext, { color: colors.textSecondary }]}>{ritualEnabled ? 'Daily Ritual' : 'Daily Streak'}</Text>
          {badgeAwarded && ritualBadgeDef && (
            <View style={[styles.newBadgeChip, { backgroundColor: COLORS.neonBlue[0] + '22', borderColor: COLORS.neonBlue[0] }]}>
              <Ionicons name="medal" size={16} color={COLORS.neonBlue[0]} />
              <Text style={[styles.newBadgeText, { color: COLORS.neonBlue[0] }]}>New Badge! {ritualBadgeDef.name}</Text>
            </View>
          )}
        </Animated.View>
        <Animated.View
          entering={FadeIn.delay(300).duration(300)}
          style={[styles.minBar, { backgroundColor: colors.surface, borderColor: themeGold }]}
        >
          <View style={styles.minLeft}>
            <LinearGradient colors={[themeGold, '#b45309']} style={styles.fireBadge}>
              <Ionicons name="flame" size={16} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={[styles.minTitle, { color: colors.text }]}>{streak} DAY STREAK</Text>
              <View style={styles.minRewardRow}>
                <OTPointsBadge amount={rewardAmount} size={16} label="none" compact />
                <Text style={[styles.minSub, { color: COLORS.success }]}> Collected</Text>
              </View>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
        </Animated.View>
        <Text style={[styles.chainHint, { color: colors.textSecondary }]}>Don't break the chain — come back tomorrow.</Text>
        <View style={styles.revealActions}>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: themeGold }]}
            onPress={() => onRitualComplete?.(streak, rewardAmount)}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
          <View style={styles.revealLinks}>
            <TouchableOpacity onPress={() => { onRitualComplete?.(streak, rewardAmount); router.push('/(tabs)/wallet' as any); }}>
              <Text style={[styles.revealLinkText, { color: colors.textSecondary }]}>View Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onRitualComplete?.(streak, rewardAmount); router.push('/(tabs)/profile' as any); }}>
              <Text style={[styles.revealLinkText, { color: colors.textSecondary }]}>View Badges</Text>
            </TouchableOpacity>
          </View>
        </View>
        {!claimError && (
          <TouchableOpacity
            style={[styles.sharePrompt, { borderColor: colors.border }]}
            onPress={() => {
              setSharePayload(buildAppSharePayload(
                `I just extended my OrbTap streak to ${streak} days — shatter the orb daily for rewards. ${prefs.shareMessage}`,
                'OrbTap Streak'
              ));
              setShareSheetVisible(true);
            }}
          >
            <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.sharePromptText, { color: colors.textSecondary }]}>Proud? Share your streak</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share streak"
        />
      )}
    </>
    );
  }

  const progressLabel = tapCount === 0 ? '1 of 3' : tapCount === 1 ? '2 of 3' : '3 of 3';
  const hintText =
    tapCount === 0
      ? 'Tap 3 times to shatter & claim OT points'
      : tapCount === 1
        ? 'One more tap…'
        : 'Last tap to shatter!';

  return (
    <Animated.View layout={Layout.springify()} style={[styles.container, compact && styles.containerCompact]}>
      {status === 'idle' && (
        <View style={[styles.progressPill, compact && styles.progressPillCompact, { backgroundColor: colors.surface, borderColor: themeGold }]}>
          <Text style={[styles.progressPillText, compact && styles.progressPillTextCompact, { color: colors.text }]}>{progressLabel}</Text>
          <View style={styles.progressDotsRow}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  compact && styles.progressDotCompact,
                  i <= tapCount && [styles.progressDotFilled, { backgroundColor: themeGold }],
                  i === tapCount + 1 && tapCount < 3 && [styles.progressDotNext, { borderColor: themeGold }],
                ]}
              />
            ))}
          </View>
        </View>
      )}
      {status === 'idle' && !compact && (
        <Text style={[styles.ctaTitle, { color: colors.text }]}>
          {tapCount === 0 ? 'TAP 3× TO BREAK' : tapCount === 1 ? 'TAP AGAIN' : 'ONE MORE TAP'}
        </Text>
      )}
      {status === 'idle' && compact && (
        <Text style={[styles.ctaTitleCompact, { color: colors.text }]}>
          {tapCount === 0 ? 'Tap 3×' : tapCount === 1 ? 'Again' : 'One more'}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.touchable, { borderRadius: ORB_SIZE / 2, shadowColor: themeGold }]}
      >
        <Animated.View style={[styles.orbWrapper, { width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2 }, orbStyle]}>
          <OrbSphere tapCount={status === 'shattering' ? 0 : tapCount} size={ORB_SIZE} themeGold={themeGold} />
        </Animated.View>
      </TouchableOpacity>
      {status === 'idle' && (
        <Text style={[compact ? styles.hintBelowCompact : styles.hintBelow, { color: colors.textSecondary }]}>{hintText}</Text>
      )}
      {status === 'idle' && (
        <View style={[styles.streakRow, compact && styles.streakRowCompact]}>
          <Ionicons name="flame" size={compact ? 12 : 14} color={themeGold} />
          <Text style={[styles.streakLabel, compact && styles.streakLabelCompact, { color: colors.textSecondary }]}>STREAK: {streak}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  containerCompact: { marginBottom: 8, marginTop: 0 },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  progressPillCompact: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, marginBottom: 4 },
  progressPillText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  progressPillTextCompact: { fontSize: 10, letterSpacing: 0.5 },
  progressDotsRow: { flexDirection: 'row', gap: 6 },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  progressDotCompact: { width: 6, height: 6, borderRadius: 3 },
  progressDotFilled: {
    borderColor: 'rgba(0,0,0,0.15)',
  },
  progressDotNext: {
    backgroundColor: 'rgba(251, 191, 36, 0.35)',
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaTitleCompact: { fontSize: 11, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  touchable: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  orbWrapper: {
    overflow: 'hidden',
  },
  hintBelow: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  hintBelowCompact: { fontSize: 10, marginTop: 4, paddingHorizontal: 8 },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  streakRowCompact: { marginTop: 4, gap: 4 },
  streakLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, opacity: 0.9 },
  streakLabelCompact: { fontSize: 10, letterSpacing: 0.8 },
  minBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    width: '100%',
  },
  minLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fireBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  minTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  minRewardRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  minSub: { fontSize: 10, fontWeight: 'bold' },
  chainHint: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8, marginBottom: 4, fontStyle: 'italic' },
  completeWrap: { width: '100%', alignItems: 'center', marginBottom: 24 },
  earnedPopup: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
  },
  earnedPopupCompact: { marginBottom: 8, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12 },
  earnedPopupText: { fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  earnedPopupTextCompact: { fontSize: 20 },
  earnedPopupSub: { fontSize: 11, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
  messageBlock: { alignItems: 'center', marginBottom: 16, paddingHorizontal: 24 },
  shatterMessage: { fontSize: 15, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5, marginBottom: 10 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  otPointsEarnedLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5, marginTop: 2 },
  dailyRitualSubtext: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 4 },
  newBadgeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginTop: 10 },
  newBadgeText: { fontSize: 12, fontWeight: '700' },
  revealActions: { width: '100%', alignItems: 'center', marginTop: 12 },
  doneBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, marginBottom: 10 },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  revealLinks: { flexDirection: 'row', gap: 20 },
  revealLinkText: { fontSize: 13, fontWeight: '600' },
  sharePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  sharePromptText: { fontSize: 12, fontWeight: '600' },
});
