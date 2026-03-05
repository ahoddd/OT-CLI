/**
 * FirstGridEntryModal — shown once when a new user enters the Grid for the first time.
 * Celebratory overlay to drive activation (Discover → Scan → Earn).
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { safeHaptics, Haptics } from '../utils/safeHaptics';

const { width } = Dimensions.get('window');

const PARTICLE_COUNT = 24;
const GOLD = COLORS.gold[0];
const BLUE = COLORS.neonBlue[0];
const PARTICLE_COLORS = [GOLD, BLUE, '#a78bfa', '#4ade80', '#f97316', '#ec4899'];

function ParticleView({ index, visible }: { index: number; visible: boolean }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];

  useEffect(() => {
    if (!visible) return;
    const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
    const distance = 80 + Math.random() * 80;
    const delay = 200 + index * 18;
    x.value = withDelay(delay, withTiming(Math.cos(angle) * distance, { duration: 700, easing: Easing.out(Easing.cubic) }));
    y.value = withDelay(delay, withTiming(Math.sin(angle) * distance - 20, { duration: 700, easing: Easing.out(Easing.cubic) }));
    scale.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(300, withTiming(0, { duration: 400 }))
    ));
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(350, withTiming(0, { duration: 400 }))
    ));
  }, [visible, index, x, y, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: color }, style]}
    />
  );
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function FirstGridEntryModal({ visible, onDismiss }: Props) {
  const orbScale = useSharedValue(0);
  const orbGlow = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(60);
  const buttonScale = useSharedValue(1);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!visible || hasAnimated.current) return;
    hasAnimated.current = true;

    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    orbScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 120 }));

    orbGlow.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    cardOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    cardTranslateY.value = withDelay(300, withSpring(0, { damping: 14, stiffness: 110 }));

    setTimeout(() => {
      safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 900);
  }, [visible]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(orbGlow.value, [0, 1], [0.25, 0.85]),
    transform: [{ scale: interpolate(orbGlow.value, [0, 1], [1, 1.35]) }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleDismiss = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withTiming(1, { duration: 120 })
    );
    setTimeout(onDismiss, 150);
  };

  const CounterText = () => {
    const [count, setCount] = React.useState(0);
    useEffect(() => {
      if (!visible) return;
      let start = 0;
      const total = 800;
      const steps = 20;
      const interval = total / steps;
      const timer = setInterval(() => {
        start++;
        setCount(Math.round((start / steps) * 5));
        if (start >= steps) clearInterval(timer);
      }, interval);
      return () => clearInterval(timer);
    }, [visible]);
    return (
      <Text style={styles.counterText}>+{count}</Text>
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.particleContainer} pointerEvents="none">
          {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
            <ParticleView key={i} index={i} visible={visible} />
          ))}
        </View>

        <Animated.View style={[styles.card, cardStyle]}>
          <LinearGradient
            colors={['#0a0a0f', '#0d1221', '#0a0a0f']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.orbContainer}>
            <Animated.View style={[styles.orbGlow, glowStyle]}>
              <LinearGradient
                colors={[BLUE, '#a78bfa']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            <Animated.View style={[styles.orb, orbStyle]}>
              <LinearGradient
                colors={[BLUE, '#6366f1', '#a78bfa']}
                style={styles.orbInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="map" size={36} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={styles.pointsRow}>
            <CounterText />
            <Text style={styles.otLabel}> OT Points</Text>
          </View>

          <Text style={styles.headline}>You're on the Grid!</Text>
          <Text style={styles.subtitle}>
            Welcome to OrbTap. Explore the map, scan partner orbs, and earn your way up the leaderboard.
          </Text>

          <View style={styles.divider} />

          <View style={styles.hintRow}>
            <Ionicons name="scan-outline" size={16} color={GOLD} />
            <Text style={styles.hintText}>  Scan an orb to earn your first real points</Text>
          </View>
          <View style={styles.hintRow}>
            <Ionicons name="flame-outline" size={16} color="#f97316" />
            <Text style={styles.hintText}>  Check in daily to build your streak</Text>
          </View>
          <View style={styles.hintRow}>
            <Ionicons name="trophy-outline" size={16} color={BLUE} />
            <Text style={styles.hintText}>  Climb the leaderboard to Scout → Legend</Text>
          </View>

          <Animated.View style={[styles.btnWrap, btnStyle]}>
            <TouchableOpacity onPress={handleDismiss} activeOpacity={0.85}>
              <LinearGradient
                colors={[BLUE, '#6366f1']}
                style={styles.btn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.btnText}>Let's go!</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  card: {
    width: Math.min(width - 40, 380),
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: 'center',
  },
  orbContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  orbGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.6,
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  orbInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  counterText: {
    fontSize: 52,
    fontWeight: '800',
    color: COLORS.gold[0],
    letterSpacing: -1,
  },
  otLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gold[0],
    opacity: 0.9,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  hintText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
  },
  btnWrap: {
    width: '100%',
    marginTop: 24,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
