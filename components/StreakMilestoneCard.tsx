/**
 * StreakMilestoneCard — VM2 Viral Moment.
 * Shows a shareable animated card when the user hits a streak milestone (7/14/30/100 days).
 * Triggered from profile.tsx after streak count is read.
 * Uses expo-sharing to share a screenshot, or falls back to ShareToSocialSheet.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ShareToSocialSheet } from './ShareToSocialSheet';
import { COLORS } from '../constants/Colors';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import { ORBTAP_APP_LINK } from '../constants/AppLinks';

const { width: SCREEN_W } = Dimensions.get('window');

export const STREAK_MILESTONES = [7, 14, 30, 100] as const;
export type StreakMilestone = typeof STREAK_MILESTONES[number];

export function isStreakMilestone(streak: number): streak is StreakMilestone {
  return (STREAK_MILESTONES as readonly number[]).includes(streak);
}

interface Props {
  streak: number;
  visible: boolean;
  onClose: () => void;
}

function FlameRing({ streak }: { streak: number }) {
  const scale = useSharedValue(0.8);
  const rotate = useSharedValue(0);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withSpring(1.08, { damping: 6 }), withSpring(0.95, { damping: 6 })),
      -1,
      true,
    );
    rotate.value = withRepeat(withTiming(360, { duration: 8000 }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.flameRing, style]}>
      <LinearGradient
        colors={['#FBBF24', '#F59E0B', '#EF4444', '#7C3AED']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.flameInner}>
        <Text style={styles.flameEmoji}>🔥</Text>
        <Text style={styles.streakNum}>{streak}</Text>
        <Text style={styles.streakDaysLabel}>DAYS</Text>
      </View>
    </Animated.View>
  );
}

export function StreakMilestoneCard({ streak, visible, onClose }: Props) {
  const [shareVisible, setShareVisible] = React.useState(false);
  const slideY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideY.value = withDelay(100, withSpring(0, { damping: 14, stiffness: 120 }));
      opacity.value = withDelay(100, withTiming(1, { duration: 350 }));
    } else {
      slideY.value = 80;
      opacity.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: opacity.value,
  }));

  const milestoneLabel =
    streak >= 100 ? 'Century Streak 🏆' :
    streak >= 30 ? 'Month Streak 🌙' :
    streak >= 14 ? 'Fortnight Streak ⚡' :
    '7-Day Streak 🔥';

  const shareMessage = `I just hit a ${streak}-day streak on OrbTap — ${milestoneLabel}! 🔮 Get the app: ${ORBTAP_APP_LINK}`;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, cardStyle]} entering={FadeIn.duration(300)}>
          <LinearGradient
            colors={['#0f0f1a', '#1a0f2e', '#0f1a0f']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <FlameRing streak={streak} />

          <Animated.Text entering={FadeIn.delay(400).duration(400)} style={styles.headline}>
            {milestoneLabel}
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(500).duration(400)} style={styles.sub}>
            {streak} consecutive days on OrbTap. You're in the top tier of explorers.
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(650).duration(400)} style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: COLORS.gold[0] }]}
              onPress={() => setShareVisible(true)}
              activeOpacity={0.88}
            >
              <Ionicons name="share-social" size={18} color="#000" />
              <Text style={styles.shareBtnText}>Share this</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={styles.dismissText}>Later</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>

      <ShareToSocialSheet
        visible={shareVisible}
        onClose={() => { setShareVisible(false); onClose(); }}
        payload={{ message: shareMessage, url: ORBTAP_APP_LINK, title: milestoneLabel }}
        label="Share streak"
      />
    </Modal>
  );
}

const CARD_W = Math.min(SCREEN_W - 48, 360);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_W,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    padding: SPACE.xxl,
    paddingTop: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  flameRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.xl,
    overflow: 'hidden',
  },
  flameInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameEmoji: { fontSize: 28 },
  streakNum: { fontSize: 38, fontWeight: '900', color: '#FBBF24', lineHeight: 42, letterSpacing: -1 },
  streakDaysLabel: { fontSize: 11, fontWeight: '700', color: '#F59E0B', letterSpacing: 2 },
  headline: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: SPACE.sm },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 20, marginBottom: SPACE.xl },
  btnRow: { flexDirection: 'row', gap: SPACE.sm, width: '100%' },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.base,
  },
  shareBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  dismissBtn: {
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.base,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '600' },
});
