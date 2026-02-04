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
import { OTPointsBadge } from './OTPointsBadge';
import { getRandomShatterMessage } from '../constants/ShatterMessages';
import * as Haptics from 'expo-haptics';
import { Share } from 'react-native';

const ORB_SIZE = 152;

/** Crack paths overlay — more visible each tap (1 = light, 2 = more, 3 = full) */
function CrackOverlay({ stage }: { stage: 0 | 1 | 2 | 3 }) {
  if (stage === 0) return null;
  const opacity = stage === 1 ? 0.25 : stage === 2 ? 0.5 : 0.75;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${ORB_SIZE} ${ORB_SIZE}`} style={{ opacity }}>
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

/** 3D-style sphere: base fill + specular highlight + bottom shadow + rim light */
function OrbSphere({ tapCount }: { tapCount: number }) {
  return (
    <View style={sphereStyles.outer} pointerEvents="none">
      {/* Base gradient — warm center to darker edge (simulates curvature) */}
      <LinearGradient
        colors={['#fcd34d', COLORS.gold[0], '#d97706', '#b45309', '#92400e']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.35, y: 0.2 }}
        end={{ x: 0.75, y: 0.9 }}
      />
      {/* Specular highlight — top-left (light on sphere) */}
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.2)', 'transparent']}
        style={sphereStyles.specular}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Bottom-right shadow — depth */}
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.45)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.9, y: 0.95 }}
      />
      {/* Rim light — top edge for 3D pop */}
      <LinearGradient
        colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.12)', 'transparent']}
        style={sphereStyles.rim}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
      />
      {/* Inner core glow (optional) */}
      <View style={sphereStyles.coreGlow} />
      <CrackOverlay stage={tapCount as 0 | 1 | 2 | 3} />
      {/* Center icon only — minimal so orb reads as sphere */}
      <View style={sphereStyles.iconWrap}>
        {tapCount === 0 && <Ionicons name="finger-print" size={36} color="rgba(0,0,0,0.35)" />}
        {tapCount === 1 && <Ionicons name="warning" size={32} color="rgba(0,0,0,0.45)" />}
        {tapCount === 2 && <Ionicons name="flash" size={32} color="rgba(0,0,0,0.45)" />}
      </View>
    </View>
  );
}

const sphereStyles = StyleSheet.create({
  outer: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '65%',
    height: '55%',
    borderTopLeftRadius: ORB_SIZE / 2,
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    borderTopLeftRadius: ORB_SIZE / 2,
    borderTopRightRadius: ORB_SIZE / 2,
  },
  coreGlow: {
    position: 'absolute',
    top: '28%',
    left: '28%',
    width: '44%',
    height: '44%',
    borderRadius: ORB_SIZE / 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
});

export const DailyStreakOrb = () => {
  const { colors } = useTheme();
  const { addTransaction } = useWallet();
  const { streak: streakState, checkIn } = useStreak();
  const { earnBadge } = useBadges();
  const [tapCount, setTapCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'shattering' | 'complete'>('idle');
  const [rewardAmount, setRewardAmount] = useState(0);
  const [message, setMessage] = useState('');
  const [displayStreak, setDisplayStreak] = useState(streakState.currentStreak);
  const streak = displayStreak;

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
      Haptics.impactAsync(tapCount === 0 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
      shake.value = withSequence(withTiming(1, { duration: 80 }), withSpring(0));
      scale.value = withSequence(withTiming(0.97, { duration: 80 }), withSpring(1.02));
    } else {
      // Third tap: shatter
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus('shattering');
      scale.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 280 }, () => {
        runOnJS(onShatterComplete)();
      });
    }
  };

  const onShatterComplete = () => {
    const newStreak = checkIn() ?? streakState.currentStreak + 1;
    setDisplayStreak(newStreak);
    if (newStreak >= 7) earnBadge('streak_7');
    if (newStreak >= 30) earnBadge('streak_30');
    if (newStreak >= 100) earnBadge('streak_100');
    const prizes = [
      { label: '+50', amount: 50 },
      { label: '+25', amount: 25 },
      { label: '+100', amount: 100 },
      { label: '+10', amount: 10 },
    ];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    setRewardAmount(prize.amount);
    setMessage(getRandomShatterMessage());
    addTransaction({ type: 'earn', amount: prize.amount, reason: `Daily Streak Reward (${newStreak})` });
    setStatus('complete');
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
    return (
      <Animated.View layout={Layout.springify()} style={styles.completeWrap}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.messageBlock}>
          <Text style={[styles.shatterMessage, { color: colors.text }]}>{message}</Text>
          <View style={styles.rewardRow}>
            <OTPointsBadge amount={rewardAmount} size={28} label="pts" compact textColor={COLORS.gold[0]} />
          </View>
        </Animated.View>
        <Animated.View
          entering={FadeIn.delay(300).duration(300)}
          style={[styles.minBar, { backgroundColor: colors.surface, borderColor: COLORS.gold[0] }]}
        >
          <View style={styles.minLeft}>
            <LinearGradient colors={[COLORS.gold[0], '#b45309']} style={styles.fireBadge}>
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
        <TouchableOpacity
          style={[styles.sharePrompt, { borderColor: colors.border }]}
          onPress={async () => {
            try {
              await Share.share({
                message: `I just extended my OrbTap streak to ${streak} days — shatter the orb daily for rewards.`,
                title: 'OrbTap Streak',
              });
            } catch {}
          }}
        >
          <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.sharePromptText, { color: colors.textSecondary }]}>Proud? Share your streak</Text>
        </TouchableOpacity>
      </Animated.View>
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
    <Animated.View layout={Layout.springify()} style={styles.container}>
      {/* Progress badge — above orb, no cut-off */}
      {status === 'idle' && (
        <View style={[styles.progressPill, { backgroundColor: colors.surface, borderColor: COLORS.gold[0] }]}>
          <Text style={[styles.progressPillText, { color: colors.text }]}>{progressLabel}</Text>
          <View style={styles.progressDotsRow}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i <= tapCount && styles.progressDotFilled,
                  i === tapCount + 1 && tapCount < 3 && styles.progressDotNext,
                ]}
              />
            ))}
          </View>
        </View>
      )}
      {status === 'idle' && (
        <Text style={[styles.ctaTitle, { color: colors.text }]}>
          {tapCount === 0 ? 'TAP 3× TO BREAK' : tapCount === 1 ? 'TAP AGAIN' : 'ONE MORE TAP'}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <Animated.View style={[styles.orbWrapper, orbStyle]}>
          <OrbSphere tapCount={status === 'shattering' ? 0 : tapCount} />
        </Animated.View>
      </TouchableOpacity>
      {/* Hint — below orb, fully visible */}
      {status === 'idle' && (
        <Text style={[styles.hintBelow, { color: colors.textSecondary }]}>{hintText}</Text>
      )}
      {status === 'idle' && (
        <View style={styles.streakRow}>
          <Ionicons name="flame" size={14} color={COLORS.gold[0]} />
          <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>STREAK: {streak}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
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
  progressPillText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  progressDotsRow: { flexDirection: 'row', gap: 6 },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  progressDotFilled: {
    backgroundColor: COLORS.gold[0],
    borderColor: 'rgba(0,0,0,0.15)',
  },
  progressDotNext: {
    borderColor: COLORS.gold[0],
    backgroundColor: 'rgba(251, 191, 36, 0.35)',
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 12,
    textAlign: 'center',
  },
  touchable: {
    borderRadius: ORB_SIZE / 2,
    shadowColor: COLORS.gold[0],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 16,
  },
  orbWrapper: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
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
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  streakLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, opacity: 0.9 },
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
  completeWrap: { width: '100%', alignItems: 'center', marginBottom: 24 },
  messageBlock: { alignItems: 'center', marginBottom: 16, paddingHorizontal: 24 },
  shatterMessage: { fontSize: 15, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5, marginBottom: 10 },
  rewardRow: { flexDirection: 'row', alignItems: 'center' },
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
