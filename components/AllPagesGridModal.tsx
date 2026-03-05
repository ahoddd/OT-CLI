/**
 * Dense grid of all OrbTap pages — opened from Orb Quick Actions "See all".
 * Same idea as map grid toggle: compact tiles with icon + label.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics } from '../utils/safeHaptics';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { useAuth } from '../context/AuthContext';
import { isAdminEmail } from '../constants/Admin';
import { useFlags } from '../components/FlagContext';
import { isPageVisible } from '../constants/AdminConfig';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLS = 3;
const GAP = 12;
const H_PAD = 16;
const TILE_SIZE = Math.floor((SCREEN_WIDTH - H_PAD * 2 - GAP * (COLS - 1)) / COLS);
const ICON_SIZE = 30;

interface GridPage {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** Admin Hub "Names" key (dir_* from AdminConfig). Omit for pages with no admin name. */
  displayNameKey?: string;
}

const ALL_PAGES: GridPage[] = [
  { id: 'admin', title: 'Admin', description: 'Admin Hub', route: '/admin', icon: 'construct', color: '#FBBF24', displayNameKey: 'dir_admin' },
  { id: 'bookmarks', title: 'Bookmarks', description: 'Saved partners', route: '/bookmarks', icon: 'bookmark', color: '#F59E0B', displayNameKey: 'dir_bookmarks' },
  { id: 'bounty', title: 'OrbBounty', description: 'Deal Bounty', route: '/bounty', icon: 'gift', color: '#F59E0B', displayNameKey: 'dir_bounty' },
  { id: 'compare', title: 'Compare', description: 'Free vs Premium', route: '/compare-accounts', icon: 'git-compare', color: '#A78BFA', displayNameKey: 'dir_compare-accounts' },
  { id: 'feed', title: 'Commerce Feed', description: 'Partner posts & deals', route: '/feed', icon: 'newspaper', color: '#4ADE80', displayNameKey: 'dir_feed' },
  { id: 'help', title: 'Help', description: 'FAQs & support', route: '/legal/help', icon: 'help-buoy', color: '#6b7280' },
  { id: 'intent', title: 'Deal Match', description: 'Post intent, get offers', route: '/intent', icon: 'flash', color: '#8B5CF6', displayNameKey: 'dir_intent' },
  { id: 'knowledge', title: 'Knowledge', description: 'Facts & quotes', route: '/knowledge', icon: 'bulb', color: '#FBBF24', displayNameKey: 'dir_knowledge' },
  { id: 'leaderboard', title: 'Leaderboard', description: 'Rankings', route: '/leaderboard', icon: 'trophy', color: '#A78BFA', displayNameKey: 'dir_leaderboard' },
  { id: 'map', title: 'Map', description: 'Explore nearby', route: '/(tabs)', icon: 'map', color: '#22C55E', displayNameKey: 'dir_map' },
  { id: 'missions', title: 'Missions', description: 'Earn OT Points', route: '/missions', icon: 'flag', color: '#FBBF24', displayNameKey: 'dir_missions' },
  { id: 'opportunities', title: 'Opportunities', description: 'Jobs & gigs', route: '/opportunities', icon: 'briefcase', color: '#22C55E', displayNameKey: 'dir_opportunities' },
  { id: 'orb', title: 'The Orb', description: 'Core experience', route: '/(tabs)/orb', icon: 'planet', color: '#60A5FA', displayNameKey: 'dir_orb' },
  { id: 'orbpass', title: 'OrbPass', description: 'Member perks & redemptions', route: '/orbpass', icon: 'card', color: '#22C55E', displayNameKey: 'dir_orbpass' },
  { id: 'orbsignal', title: 'Orb Signal', description: 'Predict & earn', route: '/orbsignal', icon: 'radio', color: '#EF4444', displayNameKey: 'dir_orbsignal' },
  { id: 'partners', title: 'Partners', description: 'Browse & perks', route: '/partners', icon: 'business', color: '#0EA5E9', displayNameKey: 'dir_partners' },
  { id: 'people', title: 'People', description: 'Friends & requests', route: '/people', icon: 'people', color: '#8B5CF6' },
  { id: 'premium', title: 'Premium', description: 'Unlock more', route: '/premium', icon: 'diamond', color: '#FBBF24', displayNameKey: 'dir_premium' },
  { id: 'profile', title: 'Profile', description: 'Your account', route: '/(tabs)/profile', icon: 'person', color: '#8B5CF6' },
  { id: 'pulse', title: 'OrbPulse', description: "City's heartbeat", route: '/pulse', icon: 'pulse', color: '#4ADE80', displayNameKey: 'dir_pulse' },
  { id: 'scan', title: 'Scan', description: 'Redeem & verify', route: '/(tabs)/scan', icon: 'qr-code', color: '#4ADE80' },
  { id: 'settings', title: 'Settings', description: 'Preferences', route: '/settings', icon: 'settings-sharp', color: '#9CA3AF', displayNameKey: 'dir_settings' },
  { id: 'spheres', title: 'Spheres', description: 'Invite-only groups', route: '/spheres', icon: 'people', color: '#8B5CF6', displayNameKey: 'dir_spheres' },
  { id: 'stats', title: 'Stats', description: 'Your impact', route: '/stats', icon: 'stats-chart', color: '#22C55E', displayNameKey: 'dir_stats' },
  { id: 'tutorials', title: 'Tutorials', description: 'Learn OrbTap', route: '/tutorials', icon: 'school', color: '#0891b2' },
  { id: 'upgrades', title: 'Upgrades', description: 'Tap power', route: '/upgrades', icon: 'flash', color: '#F59E0B', displayNameKey: 'dir_upgrades' },
  { id: 'vote', title: 'OrbVote', description: 'Polls', route: '/vote', icon: 'stats-chart', color: '#60A5FA', displayNameKey: 'dir_vote' },
  { id: 'wallet', title: 'Wallet', description: 'Assets & power-ups', route: '/(tabs)/wallet', icon: 'wallet', color: '#FBBF24', displayNameKey: 'dir_wallet' },
  { id: 'work-orders', title: 'Work Orders', description: 'Jobs & proof', route: '/work-orders', icon: 'document-text', color: '#22C55E', displayNameKey: 'dir_orbops' },
  { id: 'orbswipe', title: 'OrbSwipe', description: 'Swipe tonight — build your plan', route: '/orbswipe', icon: 'swap-horizontal', color: '#A78BFA', displayNameKey: 'dir_orbswipe' },
];

interface AllPagesGridModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AllPagesGridModal({ visible, onClose }: AllPagesGridModalProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getDisplayName } = useAdminLayout();
  const { flags } = useFlags();
  const isAdmin = isAdminEmail(user?.email);
  const pages = useMemo(() => {
    const list = ALL_PAGES.filter((p) => {
      if (p.id === 'admin') return isAdmin;
      return isPageVisible(p.id, flags);
    });
    return list.slice().sort((a, b) => {
      const labelA = getDisplayName(a.displayNameKey ?? '', a.title) || a.title;
      const labelB = getDisplayName(b.displayNameKey ?? '', b.title) || b.title;
      return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' });
    });
  }, [isAdmin, flags, getDisplayName]);

  const handlePress = (page: GridPage) => {
    safeHaptics.selectionAsync();
    onClose();
    setTimeout(() => router.push(page.route as any), 120);
  };

  const backdropOpacity = isDark ? 0.65 : 0.5;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: `rgba(0,0,0,${backdropOpacity})` }]}>
        {Platform.OS === 'ios' && (
          <BlurView intensity={isDark ? 70 : 50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        )}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 20,
              paddingLeft: insets.left + 16,
              paddingRight: insets.right + 16,
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>All pages</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Tap any tile to open · A–Z</Text>
            </View>
            <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); onClose(); }} style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.gridWrap}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {pages.map((page) => (
              <Pressable
                key={page.id}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && styles.tilePressed,
                ]}
                onPress={() => handlePress(page)}
              >
                <LinearGradient
                  colors={[page.color + '18', page.color + '06', 'transparent']}
                  style={[StyleSheet.absoluteFill, styles.tileGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={[styles.tileIconWrap, { backgroundColor: page.color + (isDark ? '28' : '20') }]}>
                  <Ionicons name={page.icon as any} size={ICON_SIZE} color={page.color} />
                </View>
                <Text style={[styles.tileLabel, { color: colors.text }]} numberOfLines={1}>
                  {page.displayNameKey ? getDisplayName(page.displayNameKey, page.title) : page.title}
                </Text>
                <Text style={[styles.tileDesc, { color: colors.textSecondary }]} numberOfLines={2}>{page.description}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    overflow: 'hidden',
    ...(Platform.OS !== 'web' ? { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 10 } : {}),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.2 },
  subtitle: { fontSize: 12, marginTop: 2, fontWeight: '500', opacity: 0.9 },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 32,
    paddingTop: 4,
  },
  tile: {
    width: TILE_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
  },
  tileGradient: { borderRadius: 16 },
  tilePressed: { opacity: 0.92 },
  tileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileLabel: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  tileDesc: { fontSize: 10, textAlign: 'center', marginTop: 2, lineHeight: 13 },
});
