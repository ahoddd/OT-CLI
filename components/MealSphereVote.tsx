/**
 * MealSphereVote — in-sphere tray voting for meal proposals.
 * Each member taps thumbs up; votes affect Fuse ranking.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import type { MealProposal } from '../constants/MealProposals';
import { SPACE, RADIUS } from '../constants/DesignTokens';

interface MealSphereVoteProps {
  proposals: MealProposal[];
  getVotes: (proposalId: string) => number;
  onVote: (proposalId: string) => void;
  memberCount: number;
  readyCount: number;
}

export function MealSphereVote({ proposals, getVotes, onVote, memberCount, readyCount }: MealSphereVoteProps) {
  const { colors } = useTheme();

  if (proposals.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="people" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Sphere Vote</Text>
        <View style={[styles.readyBadge, { backgroundColor: readyCount >= memberCount ? '#22c55e22' : colors.primary + '14' }]}>
          <Text style={[styles.readyText, { color: readyCount >= memberCount ? '#22c55e' : colors.primary }]}>
            {readyCount}/{memberCount} ready
          </Text>
        </View>
      </View>

      {proposals.map((p) => {
        const votes = getVotes(p.id);
        return (
          <View key={p.id} style={[styles.voteRow, { borderColor: colors.border }]}>
            <View style={styles.voteInfo}>
              <Text style={[styles.voteName, { color: colors.text }]} numberOfLines={1}>{p.title}</Text>
              <Text style={[styles.votePartner, { color: colors.textSecondary }]}>{p.partnerName}</Text>
            </View>
            <TouchableOpacity
              style={[styles.voteBtn, { backgroundColor: votes > 0 ? colors.primary + '22' : colors.background, borderColor: votes > 0 ? colors.primary : colors.border }]}
              onPress={() => onVote(p.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.voteEmoji}>👍</Text>
              {votes > 0 && <Text style={[styles.voteCount, { color: colors.primary }]}>{votes}</Text>}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACE.base },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  title: { fontSize: 14, fontWeight: '800', flex: 1 },
  readyBadge: { paddingVertical: 2, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs },
  readyText: { fontSize: 11, fontWeight: '700' },
  voteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.sm, borderBottomWidth: 1 },
  voteInfo: { flex: 1, marginRight: SPACE.sm },
  voteName: { fontSize: 13, fontWeight: '700' },
  votePartner: { fontSize: 11, marginTop: 1 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: SPACE.xs, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.sm, borderWidth: 1 },
  voteEmoji: { fontSize: 16 },
  voteCount: { fontSize: 12, fontWeight: '800' },
});
