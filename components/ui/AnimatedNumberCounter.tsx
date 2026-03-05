/**
 * Animated number counter — rolling number for balance, points, rank.
 */

import React, { useState, useRef, useLayoutEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MOTION } from '../../constants/DesignTokens';

interface AnimatedNumberCounterProps {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
  style?: Record<string, unknown> | unknown[];
}

function useAnimatedNumber(target: number, durationMs: number) {
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef(target);
  const rafRef = useRef<number>();
  const startRef = useRef({ value: target, time: 0 });

  useLayoutEffect(() => {
    if (prevTarget.current === target) return;
    const startValue = prevTarget.current;
    const startTime = performance.now();
    startRef.current = { value: startValue, time: startTime };
    prevTarget.current = target;

    const tick = (now: number) => {
      const elapsed = now - startRef.current.time;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - t) * (1 - t);
      const current = Math.round(startValue + (target - startValue) * eased);
      setDisplay(current);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return display;
}

export function AnimatedNumberCounter({
  value,
  duration = MOTION.normal,
  formatter = (n) => Math.round(n).toLocaleString(),
  style,
}: AnimatedNumberCounterProps) {
  const { colors } = useTheme();
  const displayValue = useAnimatedNumber(value, duration);

  return (
    <Text
      style={[
        styles.text,
        { color: colors.text },
        Array.isArray(style) ? Object.assign({}, ...(style as object[])) : (style as object),
      ]}
    >
      {formatter(displayValue)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    fontWeight: '700',
  },
});
