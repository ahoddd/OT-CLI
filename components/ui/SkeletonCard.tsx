/**
 * Skeleton card — list/grid placeholder shapes for feed, wallet history, bounty list.
 * Uses KitSkeleton; provides preset layouts.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { KitSkeleton } from './KitSkeleton';
import { SPACE, RADIUS } from '../../constants/DesignTokens';

type Preset = 'listRow' | 'card' | 'feedCard' | 'bountyCard';

interface SkeletonCardProps {
  preset?: Preset;
}

export function SkeletonCard({ preset = 'listRow' }: SkeletonCardProps) {
  if (preset === 'listRow') {
    return (
      <View style={styles.listRow}>
        <KitSkeleton width={40} height={40} borderRadius={RADIUS.sm} />
        <View style={styles.listRowText}>
          <KitSkeleton width="70%" height={14} borderRadius={4} />
          <KitSkeleton width="40%" height={12} borderRadius={4} />
        </View>
      </View>
    );
  }

  if (preset === 'card') {
    return (
      <View style={styles.card}>
        <KitSkeleton width="100%" height={100} borderRadius={RADIUS.sm} />
        <KitSkeleton width="80%" height={16} borderRadius={4} />
        <KitSkeleton width="50%" height={12} borderRadius={4} />
      </View>
    );
  }

  if (preset === 'feedCard') {
    return (
      <View style={styles.feedCard}>
        <KitSkeleton width="100%" height={160} borderRadius={RADIUS.md} />
        <View style={styles.feedCardMeta}>
          <KitSkeleton width={32} height={32} borderRadius={RADIUS.full} />
          <View style={styles.feedCardText}>
            <KitSkeleton width="60%" height={14} borderRadius={4} />
            <KitSkeleton width="40%" height={12} borderRadius={4} />
          </View>
        </View>
      </View>
    );
  }

  if (preset === 'bountyCard') {
    return (
      <View style={styles.bountyCard}>
        <KitSkeleton width="90%" height={18} borderRadius={4} />
        <View style={styles.bountyCardRow}>
          <KitSkeleton width={60} height={20} borderRadius={RADIUS.xs} />
          <KitSkeleton width={50} height={20} borderRadius={RADIUS.xs} />
        </View>
        <KitSkeleton width="70%" height={12} borderRadius={4} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.base,
    gap: SPACE.md,
  },
  listRowText: {
    flex: 1,
    gap: SPACE.xs,
  },
  card: {
    padding: SPACE.base,
    gap: SPACE.sm,
    borderRadius: RADIUS.md,
  },
  feedCard: {
    marginBottom: SPACE.base,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  feedCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.base,
    gap: SPACE.sm,
  },
  feedCardText: {
    flex: 1,
    gap: SPACE.xs,
  },
  bountyCard: {
    padding: SPACE.base,
    gap: SPACE.sm,
    borderRadius: RADIUS.md,
  },
  bountyCardRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
});
