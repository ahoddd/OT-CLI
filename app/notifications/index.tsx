/**
 * Notification Center — Inbox + Trash, mark read, empty trash.
 * Next-level UX: clear segments, swipe-to-trash feel, OrbTap copy.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/Colors';
import { LIST_OPTIMIZATION } from '../../constants/DesignTokens';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { alert as alertDialog } from '../../utils/alert';
import type { AppNotification } from '../../services/userNotifications';
import { useI18n } from '../../context/I18nContext';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60 * 1000) return 'Just now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (diff < 7 * 24 * 60 * 60 * 1000) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'forecast_deleted': return 'close-circle';
    case 'broadcast': return 'megaphone';
    case 'poll': return 'checkbox';
    case 'mission': return 'flag';
    case 'drop': return 'gift';
    case 'partner': return 'storefront';
    case 'system': return 'shield-checkmark';
    default: return 'notifications';
  }
}

function NotificationRow({
  item,
  onPress,
  onTrash,
  colors,
}: {
  item: AppNotification;
  onPress: () => void;
  onTrash: () => void;
  colors: Record<string, string>;
}) {
  const icon = iconForType(item.type);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: item.read ? colors.surface : colors.surfaceHighlight, borderColor: colors.border },
        pressed && { opacity: 0.9 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: (colors.primary) + '22' }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.rowBody, { color: colors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
        <Text style={[styles.rowTime, { color: colors.textSecondary }]}>{formatTime(item.createdAt)}</Text>
      </View>
      <TouchableOpacity
        style={[styles.trashBtn, { backgroundColor: colors.surface }]}
        onPress={(e) => { e.stopPropagation(); onTrash(); }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Pressable>
  );
}

export default function NotificationCenterScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    inbox,
    trash,
    unreadCount,
    loading,
    tab,
    setTab,
    markRead,
    moveToTrash,
    emptyTrash,
    refreshTrash,
  } = useNotifications();

  const handleItemPress = useCallback(
    (item: AppNotification) => {
      safeHaptics.selectionAsync();
      if (!item.read) markRead(item.id);
      if (item.data?.screen) router.push(item.data.screen as any);
    },
    [markRead, router]
  );

  const handleTrash = useCallback(
    (id: string) => {
      safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      moveToTrash(id);
    },
    [moveToTrash]
  );

  const handleEmptyTrash = useCallback(() => {
    alertDialog(
      'Empty trash?',
      'Permanently delete all notifications in trash. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty trash',
          style: 'destructive',
          onPress: async () => {
            const count = await emptyTrash();
            safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            alertDialog('Trash cleared', `${count} notification${count === 1 ? '' : 's'} permanently deleted.`, [{ text: 'OK' }]);
          },
        },
      ]
    );
  }, [emptyTrash]);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safe}>
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Sign in to see notifications.</Text>
        </SafeAreaView>
      </View>
    );
  }

  const list = tab === 'inbox' ? inbox : trash;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, tab === 'inbox' && styles.tabActive, tab === 'inbox' && { borderBottomColor: colors.primary }]}
            onPress={() => { safeHaptics.selectionAsync(); setTab('inbox'); }}
          >
            <Ionicons name="mail" size={20} color={tab === 'inbox' ? (colors.primary) : colors.textSecondary} />
            <Text style={[styles.tabLabel, { color: tab === 'inbox' ? colors.text : colors.textSecondary }]}>Inbox</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'trash' && styles.tabActive, tab === 'trash' && { borderBottomColor: colors.textSecondary }]}
            onPress={() => { safeHaptics.selectionAsync(); setTab('trash'); refreshTrash(); }}
          >
            <Ionicons name="trash" size={20} color={tab === 'trash' ? colors.text : colors.textSecondary} />
            <Text style={[styles.tabLabel, { color: tab === 'trash' ? colors.text : colors.textSecondary }]}>Trash</Text>
          </TouchableOpacity>
        </View>

        {tab === 'trash' && trash.length > 0 && (
          <View style={[styles.emptyTrashWrap, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.emptyTrashBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleEmptyTrash}
            >
              <Ionicons name="trash-bin" size={18} color={COLORS.danger} />
              <Text style={[styles.emptyTrashLabel, { color: COLORS.danger }]}>Empty trash</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && tab === 'trash' ? (
          <ActivityIndicator size="large" color={colors.textSecondary} style={styles.loader} />
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name={tab === 'inbox' ? 'mail-open-outline' : 'trash-outline'} size={56} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {tab === 'inbox' ? 'No notifications yet' : 'Trash is empty'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {tab === 'inbox' ? 'Updates from OrbTap and partners will show up here.' : 'Notifications you remove will appear here.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationRow
                item={item}
                onPress={() => handleItemPress(item)}
                onTrash={() => handleTrash(item.id)}
                colors={colors}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={LIST_OPTIMIZATION.removeClippedSubviews}
            maxToRenderPerBatch={LIST_OPTIMIZATION.maxToRenderPerBatch}
            windowSize={LIST_OPTIMIZATION.windowSize}
            initialNumToRender={LIST_OPTIMIZATION.initialNumToRender}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerRight: { width: 44 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabLabel: { fontSize: 15, fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyTrashWrap: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  emptyTrashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyTrashLabel: { fontSize: 15, fontWeight: '600' },
  listContent: { paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  rowBody: { fontSize: 14, lineHeight: 20 },
  rowTime: { fontSize: 12, marginTop: 4, opacity: 0.9 },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  loader: { marginTop: 48 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  placeholder: { textAlign: 'center', marginTop: 48 },
});
