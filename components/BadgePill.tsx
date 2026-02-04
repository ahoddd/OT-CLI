/**
 * Single badge pill — icon + label. Used on profile, leaderboard, achievements grid.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BadgeDef } from '../constants/Badges';

interface BadgePillProps {
  badge: BadgeDef;
  earned: boolean;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  onPress?: () => void;
}

const SIZES = { small: 36, medium: 48, large: 64 };
const ICON_SIZES = { small: 18, medium: 24, large: 32 };

export function BadgePill({ badge, earned, size = 'medium', showName = true, onPress }: BadgePillProps) {
  const dim = SIZES[size];
  const iconSize = ICON_SIZES[size];
  const opacity = earned ? 1 : 0.35;

  const content = (
    <View style={[styles.wrap, showName && { maxWidth: dim + 100 }, { opacity }]}>
      <View style={[styles.iconWrap, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: badge.color + '28', borderColor: earned ? badge.color : 'rgba(255,255,255,0.2)' }]}>
        <Ionicons name={badge.icon as any} size={iconSize} color={earned ? badge.color : 'rgba(255,255,255,0.5)'} />
      </View>
      {showName && <Text style={[styles.name, { color: earned ? '#fff' : 'rgba(255,255,255,0.5)' }]} numberOfLines={1}>{badge.name}</Text>}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  }
  return content;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 13, fontWeight: '700', flex: 1 },
});
