import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { UserBadge } from './GamificationUI';

const MEDAL_BASE = {
  1: { label: '1st', icon: 'trophy' as const },
  2: { label: '2nd', icon: 'medal' as const },
  3: { label: '3rd', icon: 'medal' as const },
};

interface LegendPodiumCardProps {
  rank: 1 | 2 | 3;
  name: string;
  score: string;
  subtext: string;
  isPartner?: boolean;
  onPress?: () => void;
}

export function LegendPodiumCard({ rank, name, score, subtext, isPartner, onPress }: LegendPodiumCardProps) {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const base = MEDAL_BASE[rank];
  const m = rank === 1 
    ? { ...base, color: themeGold, gradient: [themeGold + '40', themeGold + '08'] as [string, string] }
    : rank === 2
    ? { ...base, color: '#94a3b8', gradient: ['#94a3b840', '#94a3b808'] as [string, string] }
    : { ...base, color: '#b45309', gradient: ['#b4530940', '#b4530908'] as [string, string] };
  const content = (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: m.color + '66' }]}>
      <LinearGradient colors={m.gradient as [string, string]} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={[styles.medalRing, { backgroundColor: m.color + '22', borderColor: m.color }]}>
        <Ionicons name={m.icon} size={rank === 1 ? 28 : 24} color={m.color} />
      </View>
      <Text style={[styles.rankLabel, { color: m.color }]}>{m.label}</Text>
      <View style={styles.avatarWrap}>
        {isPartner ? (
          <View style={[styles.partnerAvatar, { backgroundColor: m.color }]}>
            <Ionicons name="business" size={22} color="#fff" />
          </View>
        ) : (
          <UserBadge level={Math.max(4 - rank, 1)} size={44} streak={0} />
        )}
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>{subtext}</Text>
      <View style={[styles.scoreBadge, { backgroundColor: m.color + '25' }]}>
        <Text style={[styles.score, { color: m.color }]}>{score}</Text>
      </View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.88}>{content}</TouchableOpacity>;
  return content;
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 140,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  medalRing: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginBottom: 6 },
  avatarWrap: { marginBottom: 6 },
  partnerAvatar: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  sub: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  score: { fontSize: 13, fontWeight: '900' },
});
