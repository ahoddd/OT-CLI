/**
 * Swipe-to-confirm slider — draggable thumb; on full drag, fires callback.
 * Use for high-stakes actions: send, split, redeem, Fuse.
 * Full track is touchable; PanResponder (JS thread) to avoid native gesture-handler crashes.
 */

import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS, TAP_TARGET_MIN } from '../../constants/DesignTokens';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';

const TRACK_HEIGHT = 56;
const THUMB_SIZE = 48;
const PADDING = 6;

interface SwipeToConfirmSliderProps {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  /** Optional: accent color (default: theme primary/gold) */
  accentColor?: string;
}

export function SwipeToConfirmSlider({
  label,
  onConfirm,
  disabled = false,
  accentColor,
}: SwipeToConfirmSliderProps) {
  const { colors } = useTheme();
  const accent = accentColor ?? colors.primary ?? colors.gold ?? '#fbbf24';
  const translateX = useRef(new Animated.Value(0)).current;
  const baseFillWidth = useRef(new Animated.Value(PADDING + THUMB_SIZE / 2)).current;
  const trackWidthRef = useRef(0);
  const currentXRef = useRef(0);
  const confirmedRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const triggerConfirm = useCallback(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  }, [onConfirm]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onStartShouldSetPanResponderCapture: () => !disabledRef.current,
      onMoveShouldSetPanResponder: (_, g) => {
        if (disabledRef.current) return false;
        const dx = Math.abs(g.dx);
        const dy = Math.abs(g.dy);
        return dx > 8 && dx >= dy * 0.8;
      },
      onMoveShouldSetPanResponderCapture: (_, g) => {
        if (disabledRef.current) return false;
        const dx = Math.abs(g.dx);
        const dy = Math.abs(g.dy);
        return dx > 8 && dx >= dy * 0.8;
      },
      onPanResponderGrant: () => {
        if (disabledRef.current) return;
        confirmedRef.current = false;
        safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, g) => {
        if (disabledRef.current) return;
        const max = Math.max(0, trackWidthRef.current - THUMB_SIZE - PADDING * 2);
        const x = Math.max(0, Math.min(g.dx, max));
        currentXRef.current = x;
        translateX.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        if (disabledRef.current) return;
        const max = Math.max(0, trackWidthRef.current - THUMB_SIZE - PADDING * 2);
        const currentX = currentXRef.current;
        const pastThreshold = max > 0 && (currentX >= max * 0.78 || g.vx > 0.25);
        if (pastThreshold) {
          Animated.spring(translateX, {
            toValue: max,
            useNativeDriver: true,
            damping: 16,
            stiffness: 180,
          }).start(() => {
            triggerConfirm();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            damping: 16,
            stiffness: 180,
          }).start();
        }
      },
    })
  ).current;

  const fillWidth = Animated.add(baseFillWidth, translateX);

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.track,
        {
          backgroundColor: disabled ? colors.border : colors.surfaceHighlight,
          borderRadius: RADIUS.full,
        },
      ]}
      onLayout={(e) => {
        trackWidthRef.current = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: accent + '50', borderRadius: RADIUS.full },
          { width: fillWidth },
        ]}
      />
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: disabled ? colors.textSecondary : accent,
            borderRadius: RADIUS.full,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            minWidth: TAP_TARGET_MIN,
            minHeight: TAP_TARGET_MIN,
            transform: [{ translateX }],
          },
        ]}
        pointerEvents="none"
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Text
          style={[styles.label, { color: disabled ? colors.textSecondary : colors.text }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    minHeight: TAP_TARGET_MIN,
    padding: PADDING,
    justifyContent: 'center',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: PADDING,
    top: PADDING,
    bottom: PADDING,
    borderRadius: RADIUS.full,
  },
  thumb: {
    position: 'absolute',
    left: PADDING,
    top: PADDING,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: THUMB_SIZE + SPACE.sm,
  },
});
