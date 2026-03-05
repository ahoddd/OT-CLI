/**
 * Tinder-style swipeable card stack for OrbSwipe.
 * Pan: left = skip, right = add to tray, up = open detail (card stays in place).
 * Auto-adapts card size to screen dimensions via useWindowDimensions.
 */

import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  cancelAnimation,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import type { OrbSwipeCard } from '../constants/OrbSwipeDeck';
import { OrbSwipeCardView } from './OrbSwipeCardView';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import {
  ORBSWIPE_SWIPE_LEFT,
  ORBSWIPE_SWIPE_RIGHT,
  ORBSWIPE_SWIPE_UP,
} from '../constants/ViralCopy';

const SWIPE_X = 80;
const SWIPE_UP = 60;
const VELOCITY = 350;
const ROTATION = 8;
const EXIT_MS = 240;

const snapBack = { damping: 14, stiffness: 140, mass: 0.8 };
const exitAnim = { duration: EXIT_MS, easing: Easing.out(Easing.cubic) };

export interface OrbSwipeCardStackProps {
  cards: OrbSwipeCard[];
  currentIndex: number;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onSwipeUp: () => void;
  onAdvance: () => void;
  onTap?: () => void;
}

export function OrbSwipeCardStack({
  cards,
  currentIndex,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  onTap,
}: OrbSwipeCardStackProps) {
  const { colors } = useTheme();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const cardW = screenW - SPACE.base * 2;
  const cardH = Math.min(screenH * 0.55, 600);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const anchorX = useSharedValue(0);
  const anchorY = useSharedValue(0);
  const exiting = useSharedValue(false);

  useEffect(() => {
    tx.value = 0;
    ty.value = 0;
    anchorX.value = 0;
    anchorY.value = 0;
    exiting.value = false;
  }, [currentIndex]);

  const commitLR = useCallback(
    (dir: 'left' | 'right') => {
      if (dir === 'right') onSwipeRight();
      else onSwipeLeft();
    },
    [onSwipeRight, onSwipeLeft]
  );

  const pan = Gesture.Pan()
    .minDistance(10)
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .onStart(() => {
      if (exiting.value) return;
      cancelAnimation(tx);
      cancelAnimation(ty);
      anchorX.value = tx.value;
      anchorY.value = ty.value;
    })
    .onUpdate((e) => {
      if (exiting.value) return;
      tx.value = anchorX.value + e.translationX;
      ty.value = anchorY.value + e.translationY;
    })
    .onEnd((e) => {
      if (exiting.value) return;

      const goR = tx.value > SWIPE_X || e.velocityX > VELOCITY;
      const goL = tx.value < -SWIPE_X || e.velocityX < -VELOCITY;
      const goU = ty.value < -SWIPE_UP || e.velocityY < -VELOCITY;

      // Swipe up: spring back to center, then open detail (card stays)
      if (goU && !goR && !goL) {
        tx.value = withSpring(0, snapBack);
        ty.value = withSpring(0, snapBack);
        runOnJS(onSwipeUp)();
        return;
      }

      if (goR) {
        exiting.value = true;
        tx.value = withTiming(screenW + 100, exitAnim, () => {
          runOnJS(commitLR)('right');
        });
        ty.value = withTiming(0, exitAnim);
        return;
      }

      if (goL) {
        exiting.value = true;
        tx.value = withTiming(-screenW - 100, exitAnim, () => {
          runOnJS(commitLR)('left');
        });
        ty.value = withTiming(0, exitAnim);
        return;
      }

      tx.value = withSpring(0, snapBack);
      ty.value = withSpring(0, snapBack);
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      if (exiting.value) return;
      if (onTap) runOnJS(onTap)();
    });

  const composed = Gesture.Exclusive(pan, tap);

  const currentCard = cards[currentIndex] ?? null;

  const cardStyle = useAnimatedStyle(() => {
    const rot = interpolate(
      tx.value,
      [-screenW / 2, 0, screenW / 2],
      [ROTATION, 0, -ROTATION]
    );
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { rotate: `${rot}deg` },
      ],
    };
  });

  const rightGlow = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, SWIPE_X], [0, 0.85]),
  }));

  const leftGlow = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-SWIPE_X, 0], [0.85, 0]),
  }));

  const upGlow = useAnimatedStyle(() => ({
    opacity: interpolate(ty.value, [-SWIPE_UP, 0], [0.9, 0]),
  }));

  if (!currentCard) return null;

  return (
    <View style={[styles.wrap, { minHeight: cardH + 8 }]} pointerEvents="box-none">
      {cards[currentIndex + 1] && (
        <View style={[styles.behind, { width: cardW - 16, height: cardH - 8 }]}>
          <OrbSwipeCardView card={cards[currentIndex + 1]} fullHeight />
        </View>
      )}

      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.front, { width: cardW, height: cardH }, cardStyle]}>
          <View style={styles.inner}>
            <OrbSwipeCardView card={currentCard} fullHeight />
          </View>
          <Animated.View style={[styles.overlay, styles.oRight, rightGlow]}>
            <View style={[styles.pill, { borderColor: COLORS.success }]}>
              <Animated.Text style={[styles.pillTxt, { color: COLORS.success }]}>{ORBSWIPE_SWIPE_RIGHT}</Animated.Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.oLeft, leftGlow]}>
            <View style={[styles.pill, styles.pillL, { borderColor: COLORS.danger }]}>
              <Animated.Text style={[styles.pillTxt, { color: COLORS.danger }]}>{ORBSWIPE_SWIPE_LEFT}</Animated.Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.oUp, upGlow]}>
            <View style={[styles.pill, { borderColor: colors.primary }]}>
              <Animated.Text style={[styles.pillTxt, { color: colors.primary }]}>{ORBSWIPE_SWIPE_UP}</Animated.Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  behind: {
    position: 'absolute',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    opacity: 0.88,
    transform: [{ scale: 0.95 }],
  },
  front: {
    position: 'absolute',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
  },
  inner: {
    flex: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  oRight: { alignItems: 'flex-start', paddingLeft: 24 },
  oLeft: { alignItems: 'flex-end', paddingRight: 24 },
  oUp: { justifyContent: 'flex-start', paddingTop: 28 },
  pill: {
    borderWidth: 4,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    transform: [{ rotate: '-12deg' }],
  },
  pillL: { transform: [{ rotate: '12deg' }] },
  pillTxt: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
