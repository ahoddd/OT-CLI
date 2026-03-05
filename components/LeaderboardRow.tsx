import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { UserBadge } from './GamificationUI';
import { PremiumBadge } from './PremiumBadge';
import { PartnerProBadge } from './PartnerProBadge';

interface LeaderboardRowProps {
  rank: number;
  name: string;
  score: string;
  subtext: string;
  isPartner?: boolean;
  /** When provided, shows tier badge next to name (Premium or Pro) */
  tier?: 'free' | 'premium' | 'pro';
  onPress?: () => void;
  /** Rank change from previous period — positive = up, negative = down */
  rankChange?: number;
}

export function LeaderboardRow({ rank, name, score, subtext, isPartner, tier, onPress, rankChange }: LeaderboardRowProps) {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];

  const getRankStyle = (r: number) => {
    if (r === 1) return { bg: themeGold + '22', border: themeGold, icon: 'trophy' as const };
    if (r === 2) return { bg: '#94a3b822', border: '#94a3b8', icon: 'medal' as const };
    if (r === 3) return { bg: '#b4530922', border: '#b45309', icon: 'medal' as const };
    return { bg: colors.surfaceHighlight, border: colors.border, icon: null as const };
  };

  const isTop3 = rank <= 3;
  const rankStyle = getRankStyle(rank);

  const row = (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        borderColor: rankStyle.border,
        borderLeftWidth: isTop3 ? 4 : 0,
      },
    ]}>
      <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
        {rankStyle.icon ? (
          <Ionicons name={rankStyle.icon} size={18} color={rankStyle.border} />
        ) : (
          <Text style={[styles.rankNum, { color: colors.textSecondary }]}>{rank}</Text>
        )}
      </View>
      <View style={styles.avatarCol}>
        {isPartner ? (
          <View style={[styles.partnerAvatar, { backgroundColor: rankStyle.border }]}>
            <Ionicons name="business" size={18} color="#fff" />
          </View>
        ) : (
          <UserBadge level={Math.max(1, 10 - rank)} size={40} streak={0} />
        )}
      </View>
      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
          {(tier === 'pro' || isPartner) ? <View style={styles.tierBadge}><PartnerProBadge size="small" showIcon={true} /></View> : tier === 'premium' ? <View style={styles.tierBadge}><PremiumBadge variant="compact" size={14} /></View> : null}
        </View>
        <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>{subtext}</Text>
      </View>
      <View style={styles.scoreCol}>
        <Text style={[styles.score, { color: isTop3 ? rankStyle.border : colors.text }]}>{score}</Text>
        {rankChange != null && rankChange !== 0 && (
          <View style={styles.rankChangeRow}>
            <Ionicons
              name={rankChange > 0 ? 'arrow-up' : 'arrow-down'}
              size={10}
              color={rankChange > 0 ? COLORS.success : COLORS.danger}
            />
            <Text style={[styles.rankChangeText, { color: rankChange > 0 ? COLORS.success : COLORS.danger }]}>
              {Math.abs(rankChange)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.88}>{row}</TouchableOpacity>;
  return row;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderRadius: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNum: { fontSize: 14, fontWeight: '800' },
  avatarCol: { marginRight: 12 },
  partnerAvatar: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoCol: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'nowrap' },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  tierBadge: { flexShrink: 0 },
  sub: { fontSize: 12, marginTop: 2 },
  scoreCol: { alignItems: 'flex-end' },
  score: { fontSize: 15, fontWeight: '800' },
  rankChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  rankChangeText: { fontSize: 10, fontWeight: '700' },
});
