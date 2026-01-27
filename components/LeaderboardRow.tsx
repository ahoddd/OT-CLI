import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { UserBadge } from './GamificationUI';

interface LeaderboardRowProps {
  rank: number;
  name: string;
  score: string;
  subtext: string;
  isPartner?: boolean;
}

export const LeaderboardRow = ({ rank, name, score, subtext, isPartner }: LeaderboardRowProps) => {
  const { colors, isDark } = useTheme();

  const getRankColor = (r: number) => {
    switch(r) {
      case 1: return COLORS.gold[0];
      case 2: return '#94a3b8'; // Silver
      case 3: return '#b45309'; // Bronze
      default: return colors.textSecondary;
    }
  };

  const isTop3 = rank <= 3;
  const rankColor = getRankColor(rank);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface, 
        borderColor: isTop3 ? rankColor : colors.border,
        borderWidth: isTop3 ? 1 : 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }
    ]}>
      <View style={styles.rankCol}>
        {isTop3 ? (
            <Ionicons name="trophy" size={20} color={rankColor} />
        ) : (
            <Text style={[styles.rankText, { color: colors.textSecondary }]}>{rank}</Text>
        )}
      </View>

      <View style={styles.avatarCol}>
         {isPartner ? (
            <View style={[styles.partnerAvatar, { backgroundColor: isTop3 ? rankColor : '#333' }]}>
                <Ionicons name="business" size={16} color="#fff" />
            </View>
         ) : (
            <UserBadge level={Math.max(10 - rank, 1)} size={36} />
         )}
      </View>

      <View style={styles.infoCol}>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{subtext}</Text>
      </View>

      <View style={styles.scoreCol}>
        <Text style={[styles.score, { color: isTop3 ? rankColor : colors.text }]}>{score}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8, borderRadius: 12 },
  rankCol: { width: 30, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontWeight: 'bold', fontSize: 14 },
  avatarCol: { width: 50, alignItems: 'center', justifyContent: 'center' },
  partnerAvatar: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  infoCol: { flex: 1, paddingHorizontal: 12 },
  name: { fontWeight: 'bold', fontSize: 14 },
  sub: { fontSize: 11, marginTop: 2 },
  scoreCol: { alignItems: 'flex-end' },
  score: { fontWeight: '900', fontSize: 14 }
});
