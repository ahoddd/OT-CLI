/**
 * Receipt tape — collapsible receipt block (amount, fee, date, recipient).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS } from '../../constants/DesignTokens';

export interface ReceiptLine {
  label: string;
  value: string;
}

interface ReceiptTapeProps {
  title?: string;
  lines: ReceiptLine[];
  expanded?: boolean;
  onToggle?: () => void;
}

export function ReceiptTape({
  title = 'Receipt',
  lines,
  expanded: controlledExpanded,
  onToggle,
}: ReceiptTapeProps) {
  const { colors } = useTheme();
  const [internalExpanded, setInternalExpanded] = useState(true);
  const expanded = controlledExpanded ?? internalExpanded;
  const toggle = () => {
    if (onToggle) onToggle();
    else setInternalExpanded((e) => !e);
  };

  const height = useSharedValue(expanded ? 1 : 0);
  React.useEffect(() => {
    height.value = withTiming(expanded ? 1 : 0, { duration: 250 });
  }, [expanded, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    maxHeight: height.value === 1 ? 400 : 0,
    overflow: 'hidden' as const,
  }));

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.header, { borderBottomColor: colors.border }]}
        onPress={toggle}
        activeOpacity={0.8}
      >
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      <Animated.View style={animatedStyle}>
        <View style={styles.body}>
          {lines.map((line, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{line.label}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{line.value}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACE.base,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    padding: SPACE.base,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACE.xs,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
});
