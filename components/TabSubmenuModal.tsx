/**
 * Tab bar sub-menu: modal shown when user long-presses a tab.
 * Lists quick actions for that tab; tap one to navigate and close.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useFlags } from './FlagContext';
import { useAuth } from '../context/AuthContext';
import { isAdminEmail } from '../constants/Admin';
import { COLORS } from '../constants/Colors';
import { TAB_LABELS } from '../constants/AdminConfig';
import type { TabId } from '../constants/AdminConfig';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { TAB_SUBMENU_ACTIONS, type TabSubmenuAction } from '../constants/TabSubmenus';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { safeHaptics } from '../utils/safeHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MAX_WIDTH = 320;
const CARD_PADDING = 16;

interface TabSubmenuModalProps {
  visible: boolean;
  tabId: TabId | null;
  onClose: () => void;
}

function filterActions(
  actions: TabSubmenuAction[],
  flags: Record<string, boolean>,
  showAdmin: boolean,
  isPartner: boolean
): TabSubmenuAction[] {
  return actions.filter((a) => {
    if (a.label === 'Admin Hub') return showAdmin;
    if (a.partnerOnly) return isPartner;
    if (a.flagKey) return Boolean(flags[a.flagKey]);
    return true;
  });
}

export function TabSubmenuModal({ visible, tabId, onClose }: TabSubmenuModalProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { flags } = useFlags();
  const { user } = useAuth();
  const { getDisplayName } = useAdminLayout();
  const fl: Record<string, boolean> = { ...(flags as Record<string, unknown>), mapProvider: (flags as { mapProvider?: string }).mapProvider !== 'none' } as Record<string, boolean>;
  const showAdmin = isAdminEmail(user?.email);
  const { isPartner } = useEffectiveTier();

  const actions = tabId ? TAB_SUBMENU_ACTIONS[tabId] ?? [] : [];
  const filtered = filterActions(actions, fl, showAdmin, isPartner);
  const title = tabId ? getDisplayName('tab_' + tabId, TAB_LABELS[tabId] ?? tabId) : '';

  const handleSelect = (route: string) => {
    safeHaptics.selectionAsync();
    onClose();
    router.push(route as any);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      </Pressable>
      <View style={styles.centered} pointerEvents="box-none">
        <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.cardHead, { borderBottomColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Quick actions</Text>
          </View>
          <View style={styles.list}>
            {filtered.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>No actions for this tab</Text>
            ) : (
              filtered.map((action, i) => (
                <TouchableOpacity
                  key={`${action.route}-${i}`}
                  style={[styles.row, i < filtered.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={() => handleSelect(action.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
                    <Ionicons name={action.icon as any} size={20} color={COLORS.neonBlue?.[0] ?? '#60a5fa'} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>{action.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </View>
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>Hold tab to open this menu</Text>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 88,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHead: {
    padding: CARD_PADDING,
    borderBottomWidth: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  cardSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  list: { paddingVertical: 4 },
  empty: { padding: 20, textAlign: 'center', fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: CARD_PADDING,
    gap: 12,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  hint: { fontSize: 11, fontWeight: '600' },
});
