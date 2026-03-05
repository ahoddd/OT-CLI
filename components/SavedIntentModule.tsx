/**
 * SavedIntent mini-module — shows up to 3 active SavedIntents with quick CTAs.
 * Collapsible. Used in Home/Tonight and Wallet screens.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import type { SavedIntent } from '../constants/SavedIntent';
import { getActiveSavedIntents, removeSavedIntent } from '../services/savedIntents';
import {
  SAVED_INTENT_MODULE_TITLE,
  SAVED_INTENT_EMPTY,
} from '../constants/ViralCopy';
import type { PartnerTier } from '../constants/PartnerTiers';

export function SavedIntentModule({ uid }: { uid: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [intents, setIntents] = useState<SavedIntent[]>([]);
  const [collapsed, setCollapsed] = useState(true);

  const loadIntents = useCallback(async () => {
    const active = await getActiveSavedIntents(uid, 3);
    setIntents(active);
  }, [uid]);

  useEffect(() => {
    loadIntents();
  }, [loadIntents]);

  const handlePress = useCallback((intent: SavedIntent) => {
    if (intent.kind === 'DROP') {
      router.push(`/drop/${intent.refId}?from=orbswipe` as any);
    } else if (intent.kind === 'MISSION') {
      router.push('/missions' as any);
    } else if (intent.kind === 'PARTNER') {
      router.push(`/partner/${intent.refId}?from=orbswipe` as any);
    } else if (intent.kind === 'MEAL_PROPOSAL') {
      router.push('/meal-mode' as any);
    } else if (intent.kind === 'MENU_ITEM' && intent.partnerId) {
      router.push(`/partner/${intent.partnerId}` as any);
    } else if (intent.kind === 'MENU_ITEM') {
      router.push('/(tabs)' as any);
    }
  }, [router]);

  const handleRemove = useCallback(async (intent: SavedIntent) => {
    await removeSavedIntent(intent.id, uid);
    setIntents((prev) => prev.filter((i) => i.id !== intent.id));
  }, [uid]);

  if (intents.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setCollapsed(!collapsed)}
        activeOpacity={0.7}
      >
        <Ionicons name="bookmark" size={16} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>{SAVED_INTENT_MODULE_TITLE}</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>{intents.length}</Text>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.list}>
          {intents.map((intent) => {
            const tierColor = PARTNER_TIER_COLORS[(intent.tier as PartnerTier) ?? 'silver'] ?? '#9ca3af';
            return (
              <TouchableOpacity
                key={intent.id}
                style={[styles.row, { borderColor: colors.border }]}
                onPress={() => handlePress(intent)}
                activeOpacity={0.8}
              >
                <View style={[styles.kindDot, { backgroundColor: tierColor }]} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                    {intent.displayName ?? intent.refId}
                  </Text>
                  {intent.displaySub && (
                    <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {intent.displaySub}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemove(intent)}
                  hitSlop={8}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACE.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.base,
  },
  title: { fontSize: 14, fontWeight: '700', flex: 1 },
  count: { fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: SPACE.sm, paddingBottom: SPACE.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  kindDot: { width: 8, height: 8, borderRadius: 4 },
  rowText: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 1 },
  removeBtn: { padding: 4 },
});
