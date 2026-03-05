import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { isAdminEmail } from '../constants/Admin';
import { useFlags } from './FlagContext';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { isPageVisible } from '../constants/AdminConfig';
import { useTheme } from '../hooks/useTheme';
import { OrbTapLogoMark } from './OrbTapLogoMark';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { safeHaptics } from '../utils/safeHaptics';

const CARD_GAP = 12;

type DirectoryItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
  color: string;
};

const DIRECTORY_ITEMS: DirectoryItem[] = [
  { id: 'map', label: 'Map', icon: 'map', route: '/(tabs)', description: 'Explore nearby', color: '#22C55E' },
  { id: 'orb', label: 'The Orb', icon: 'planet', route: '/(tabs)/orb', description: 'Core experience', color: '#60A5FA' },
  { id: 'profile', label: 'Profile', icon: 'person', route: '/(tabs)/profile', description: 'Your account', color: '#8B5CF6' },
  { id: 'scan', label: 'Scan', icon: 'qr-code', route: '/(tabs)/scan', description: 'Redeem & verify', color: '#4ADE80' },
  { id: 'partners', label: 'Partners', icon: 'business', route: '/partners', description: 'Browse & perks', color: '#0EA5E9' },
  { id: 'people', label: 'People', icon: 'people', route: '/people', description: 'Friends & requests', color: '#8B5CF6' },
  { id: 'pulse', label: 'OrbPulse', icon: 'pulse', route: '/pulse', description: "City's heartbeat", color: '#4ADE80' },
  { id: 'missions', label: 'Missions', icon: 'flag', route: '/missions', description: 'Earn OT Points', color: '#FBBF24' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', route: '/(tabs)/wallet', description: 'Assets & power-ups', color: '#FBBF24' },
  { id: 'bookmarks', label: 'Bookmarks', icon: 'bookmark', route: '/bookmarks', description: 'Saved places', color: '#F59E0B' },
  { id: 'upgrades', label: 'Upgrades', icon: 'flash', route: '/upgrades', description: 'Tap power', color: '#F59E0B' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy', route: '/leaderboard', description: 'Rankings', color: '#A78BFA' },
  { id: 'vote', label: 'OrbVote', icon: 'stats-chart', route: '/vote', description: 'Polls', color: '#60A5FA' },
  { id: 'orbsignal', label: 'Orb Signal', icon: 'radio', route: '/orbsignal', description: 'Predict & earn', color: '#EF4444' },
  { id: 'spheres', label: 'Spheres', icon: 'people', route: '/spheres', description: 'Invite-only groups', color: '#8B5CF6' },
  { id: 'stats', label: 'Stats', icon: 'stats-chart', route: '/stats', description: 'Your impact', color: '#22C55E' },
  { id: 'knowledge', label: 'Knowledge', icon: 'bulb', route: '/knowledge', description: 'Facts & quotes', color: '#FBBF24' },
  { id: 'premium', label: 'Premium', icon: 'diamond', route: '/premium', description: 'Unlock more', color: '#FBBF24' },
  { id: 'compare-accounts', label: 'Compare', icon: 'git-compare', route: '/compare-accounts', description: 'Plans', color: '#A78BFA' },
  { id: 'settings', label: 'Settings', icon: 'settings-sharp', route: '/settings', description: 'Preferences', color: '#9CA3AF' },
];

const ADMIN_ITEM: DirectoryItem = { id: 'admin', label: 'Admin', icon: 'construct', route: '/admin', description: 'Hub', color: '#FBBF24' };
const ORBOPS_ITEM: DirectoryItem = { id: 'orbops', label: 'Work Orders', icon: 'document-text', route: '/work-orders', description: 'Jobs & proof', color: '#22C55E' };
const BOUNTY_ITEM: DirectoryItem = { id: 'bounty', label: 'OrbBounty', icon: 'gift', route: '/bounty', description: 'Deal Bounty', color: '#F59E0B' };
const INTENT_ITEM: DirectoryItem = { id: 'intent', label: 'Deal Match', icon: 'flash', route: '/intent', description: 'Post intent, get offers', color: '#8B5CF6' };
const ORBPASS_ITEM: DirectoryItem = { id: 'orbpass', label: 'OrbPass', icon: 'card', route: '/orbpass', description: 'Member perks & redemptions', color: '#22C55E' };
const FEED_ITEM: DirectoryItem = { id: 'feed', label: 'Commerce Feed', icon: 'newspaper', route: '/feed', description: 'Partner posts', color: '#4ADE80' };
const OPPORTUNITIES_ITEM: DirectoryItem = { id: 'opportunities', label: 'Opportunities', icon: 'briefcase', route: '/opportunities', description: 'Hiring', color: '#22C55E' };
const ORBSWIPE_ITEM: DirectoryItem = { id: 'orbswipe', label: 'OrbSwipe', icon: 'swap-horizontal', route: '/orbswipe', description: 'Swipe tonight', color: '#A78BFA' };
const SECTION_IDS = ['core', 'live', 'discover', 'learn', 'account'] as const;
const ALL_SECTION_ID = 'all' as const;
const TAB_SECTION_IDS = [ALL_SECTION_ID, ...SECTION_IDS] as const;
const SECTION_LABELS: Record<(typeof TAB_SECTION_IDS)[number], string> = {
  all: 'All',
  core: 'Core',
  live: 'Live & Compete',
  discover: 'Discover',
  learn: 'Learn & Grow',
  account: 'Account',
};
const ITEM_SECTION: Record<string, (typeof SECTION_IDS)[number]> = {
  map: 'core', orb: 'core', profile: 'core', scan: 'core', partners: 'discover', people: 'discover', wallet: 'core', pulse: 'live', missions: 'live', leaderboard: 'live',
  vote: 'live', orbsignal: 'live', orbswipe: 'discover', spheres: 'discover', bookmarks: 'discover', upgrades: 'discover',
  orbops: 'discover', bounty: 'discover', intent: 'discover', orbpass: 'discover', feed: 'discover', opportunities: 'discover', stats: 'learn', knowledge: 'learn',
  premium: 'learn', 'compare-accounts': 'learn', settings: 'account', admin: 'account',
};

const SECTION_ACCENT: Record<string, string> = {
  core: '#60A5FA',
  live: '#4ADE80',
  discover: '#8B5CF6',
  learn: '#FBBF24',
  account: '#9CA3AF',
};

function TileCard({
  item,
  onPress,
  colors,
  isDark,
  getDisplayName,
}: {
  item: DirectoryItem;
  onPress: () => void;
  colors: Record<string, string>;
  isDark: boolean;
  getDisplayName: (key: string, fallback: string) => string;
}) {
  const label = getDisplayName('dir_' + item.id, item.label);
  return (
    <Pressable
      onPress={() => { safeHaptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => [tileStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && tileStyles.cardPressed]}
    >
      <LinearGradient
        colors={[item.color + '22', item.color + '08', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[tileStyles.iconWrap, { backgroundColor: item.color + (isDark ? '28' : '18') }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={[tileStyles.title, { color: colors.text }]} numberOfLines={1}>{label}</Text>
      <Text style={[tileStyles.desc, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text>
    </Pressable>
  );
}

const tileStyles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.9 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  desc: { fontSize: 11, opacity: 0.85 },
});

interface MasterDirectoryProps {
  visible: boolean;
  onClose: () => void;
}

export default function MasterDirectory({ visible, onClose }: MasterDirectoryProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { flags } = useFlags();
  const isAdmin = isAdminEmail(user?.email);
  const { isPartner } = useEffectiveTier();
  const { getDisplayName } = useAdminLayout();
  const [selectedSection, setSelectedSection] = useState<(typeof TAB_SECTION_IDS)[number]>('all');

  const itemsBySection = useMemo(() => {
    const base = DIRECTORY_ITEMS.filter((item) => isPageVisible(item.id, flags));
    if (flags.isOrbOpsEnabled) base.push(ORBOPS_ITEM);
    if (flags.isOrbSwipeEnabled) base.push(ORBSWIPE_ITEM);
    if (isPartner && flags.isOrbBountyEnabled) base.push(BOUNTY_ITEM);
    if (isPartner && flags.isOrbIntentEnabled) base.push(INTENT_ITEM);
    if (flags.isOrbPassEnabled) base.push(ORBPASS_ITEM);
    if (isPartner && flags.isOrbFeedEnabled) base.push(FEED_ITEM);
    if (isPartner && flags.isOrbOpportunitiesEnabled) base.push(OPPORTUNITIES_ITEM);
    if (isAdmin) base.push(ADMIN_ITEM);
    const bySection: Record<string, DirectoryItem[]> = {};
    SECTION_IDS.forEach((sid) => { bySection[sid] = []; });
    base.forEach((item) => {
      const sid = ITEM_SECTION[item.id] ?? 'discover';
      if (bySection[sid]) bySection[sid].push(item);
    });
    const sortByLabel = (a: DirectoryItem, b: DirectoryItem) =>
      (getDisplayName('dir_' + a.id, a.label)).localeCompare(getDisplayName('dir_' + b.id, b.label), undefined, { sensitivity: 'base' });
    SECTION_IDS.forEach((sid) => { bySection[sid].sort(sortByLabel); });
    bySection[ALL_SECTION_ID] = base.slice().sort(sortByLabel);
    return bySection;
  }, [isAdmin, isPartner, flags.isOrbOpsEnabled, flags.isOrbSwipeEnabled, flags.isOrbBountyEnabled, flags.isOrbIntentEnabled, flags.isOrbPassEnabled, flags.isOrbFeedEnabled, flags.isOrbOpportunitiesEnabled, flags, getDisplayName]);

  const currentItems = itemsBySection[selectedSection] ?? [];

  const handlePress = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 120);
  };

  const overlayOpacity = isDark ? 0.7 : 0.5;

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]}>
        <BlurView intensity={isDark ? 90 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingTop: Math.max(insets.top, 10),
              paddingBottom: insets.bottom + 20,
              paddingLeft: insets.left + 16,
              paddingRight: insets.right + 16,
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.logoWrap, { backgroundColor: (SECTION_ACCENT.core || colors.primary) + '25', borderColor: (SECTION_ACCENT.core || colors.primary) + '50' }]}>
                <OrbTapLogoMark variant="small" width={28} height={24} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Master Directory</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Go anywhere in OrbTap</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => { safeHaptics.selectionAsync(); onClose(); }}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsWrap}
            style={styles.pillsScroll}
          >
            {TAB_SECTION_IDS.map((sid) => {
              const count = (itemsBySection[sid] ?? []).length;
              if (count === 0 && sid !== ALL_SECTION_ID) return null;
              const accent = sid === ALL_SECTION_ID ? (SECTION_ACCENT.core || colors.primary) : SECTION_ACCENT[sid];
              const isSelected = selectedSection === sid;
              return (
                <TouchableOpacity
                  key={sid}
                  onPress={() => { safeHaptics.selectionAsync(); setSelectedSection(sid); }}
                  activeOpacity={0.85}
                  style={[styles.pill, { backgroundColor: isSelected ? accent + '22' : colors.surface, borderColor: isSelected ? accent : colors.border }]}
                >
                  <Text style={[styles.pillText, { color: isSelected ? accent : colors.textSecondary }]}>{SECTION_LABELS[sid]}</Text>
                  <View style={[styles.pillBadge, { backgroundColor: isSelected ? accent + '40' : colors.surfaceHighlight }]}>
                    <Text style={[styles.pillBadgeText, { color: isSelected ? accent : colors.textSecondary }]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            key={selectedSection}
          >
            <Animated.View entering={FadeIn.duration(200)} style={styles.grid}>
              {currentItems.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(index * 40).duration(280)}
                  style={styles.gridItem}
                >
                  <TileCard
                    item={item}
                    onPress={() => handlePress(item.route)}
                    colors={colors}
                    isDark={isDark}
                    getDisplayName={getDisplayName}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          </ScrollView>

          <Text style={[styles.footer, { color: colors.textSecondary }]}>OrbTap · Hold center orb 1s to open</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '90%',
    ...(Platform.OS !== 'web' ? { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12 } : {}),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoWrap: {
    width: 40,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 2, fontWeight: '600', opacity: 0.85 },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsScroll: { marginTop: 12, flexGrow: 0 },
  pillsWrap: { paddingRight: 24, gap: 10, paddingVertical: 8, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 44,
  },
  pillText: { fontSize: 13, fontWeight: '800', lineHeight: 18 },
  pillBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pillBadgeText: { fontSize: 11, fontWeight: '800' },
  gridContent: { paddingTop: 16, paddingBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    justifyContent: 'space-between',
  },
  gridItem: { width: '48%' },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
