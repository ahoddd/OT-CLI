/**
 * FriendPass offer — shown after verified OrbSwipe-origin win.
 * "Send a Friend Pass" with share deep link.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { createFriendPass } from '../services/friendPass';
import {
  FRIEND_PASS_OFFER_TITLE,
  FRIEND_PASS_OFFER_SUB,
  FRIEND_PASS_CTA,
  FRIEND_PASS_SHARE_MSG,
} from '../constants/ViralCopy';

interface FriendPassOfferProps {
  creatorUid: string;
  partnerId: string;
  partnerName: string;
  dropId?: string;
  onDismiss: () => void;
}

export function FriendPassOffer({
  creatorUid,
  partnerId,
  partnerName,
  dropId,
  onDismiss,
}: FriendPassOfferProps) {
  const { colors } = useTheme();
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const { pass, error } = await createFriendPass({
        creatorUid,
        partnerId,
        partnerName,
        dropId,
      });
      if (error || !pass) {
        Alert.alert('Could not create pass', error ?? 'Unknown error');
        return;
      }
      const shareUrl = `https://orbtap.web.app/friendpass/${pass.id}`;
      const message = FRIEND_PASS_SHARE_MSG(partnerName) + '\n' + shareUrl;
      await Share.share({ message, url: shareUrl });
      onDismiss();
    } catch (err) {
      if (__DEV__) console.warn('FriendPass create error:', err);
    } finally {
      setCreating(false);
    }
  }, [creatorUid, partnerId, partnerName, dropId, onDismiss]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.primary + '44' }]}>
      <View style={styles.headerRow}>
        <Ionicons name="people" size={22} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>{FRIEND_PASS_OFFER_TITLE}</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={12}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>{FRIEND_PASS_OFFER_SUB}</Text>
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: colors.primary }]}
        onPress={handleCreate}
        disabled={creating}
        activeOpacity={0.85}
      >
        <Ionicons name="send" size={18} color="#000" />
        <Text style={styles.ctaText}>{creating ? 'Creating...' : FRIEND_PASS_CTA}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    padding: SPACE.base,
    marginBottom: SPACE.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.xs,
  },
  title: { fontSize: 16, fontWeight: '800', flex: 1 },
  sub: { fontSize: 13, lineHeight: 18, marginBottom: SPACE.base },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.sm,
  },
  ctaText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
