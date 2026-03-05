/**
 * Search overlay — world-class search with Fuse.js fuzzy matching, recent searches,
 * trending chips, category filters, grouped multi-type results (partners + perks + people + pages).
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Fuse from 'fuse.js';
import { useTheme } from '../hooks/useTheme';
import type { Partner, Perk } from '../constants/MockData';
import { MOCK_PERKS } from '../constants/MockData';
import { usePartners } from '../context/PartnersContext';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { useFlags } from '../components/FlagContext';
import { isPageVisible } from '../constants/AdminConfig';
import { COLORS } from '../constants/Colors';
import { searchDiscoverableUsers, type SearchUserResult } from '../services/userSearch';
import { useSearchHistory } from '../hooks/useSearchHistory';

export type SearchScope = 'map' | 'all' | 'businesses' | 'members' | 'pages';

const SCOPES: { key: SearchScope; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'businesses', label: 'Businesses' },
  { key: 'members',    label: 'People' },
  { key: 'pages',      label: 'Pages' },
  { key: 'map',        label: 'Map' },
];

const SCOPE_COLORS: Record<Exclude<SearchScope, 'all'>, string> = {
  map: '#2563eb',
  businesses: '#16a34a',
  members: '#7c3aed',
  pages: '#0891b2',
};

const TIER_LEFT_COLORS: Record<string, string> = {
  platinum: '#8b5cf6',
  gold: '#fbbf24',
  silver: '#64748b',
};

const BUSINESS_CATEGORIES = ['All', 'Dining', 'Nightlife', 'Services', 'Retail', 'Hospitality', 'Cafe', 'Entertainment'];

const TRENDING_SEARCHES = ['coffee', 'tacos', 'happy hour', 'deals', 'BOGO', 'brunch', 'nightlife', 'free'];

interface SearchablePage {
  id: string;
  title: string;
  route: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  displayNameKey?: string;
}

const SEARCHABLE_PAGES: SearchablePage[] = [
  { id: 'map', title: 'Map', route: '/(tabs)', description: 'Explore nearby orbs and partners', icon: 'map', displayNameKey: 'dir_map' },
  { id: 'orb', title: 'Orb Hub', route: '/(tabs)/orb', description: 'Daily ritual, points, quick actions', icon: 'planet', displayNameKey: 'dir_orb' },
  { id: 'feed', title: 'Commerce Feed', route: '/feed', description: 'Partner posts, drops, and deals', icon: 'newspaper', displayNameKey: 'dir_feed' },
  { id: 'pulse', title: 'OrbPulse Live', route: '/pulse', description: "City's live heartbeat — verified momentum", icon: 'pulse', displayNameKey: 'dir_pulse' },
  { id: 'vote', title: 'OrbVote', route: '/vote', description: 'Premium polls — vote and earn XP', icon: 'stats-chart', displayNameKey: 'dir_vote' },
  { id: 'people', title: 'People', route: '/people', description: 'Friends and connection requests', icon: 'people' },
  { id: 'spheres', title: 'Spheres', route: '/spheres', description: 'Invite-only groups, pool points', icon: 'people-circle', displayNameKey: 'dir_spheres' },
  { id: 'opportunities', title: 'Opportunities', route: '/opportunities', description: 'Partner hiring and gigs', icon: 'briefcase', displayNameKey: 'dir_opportunities' },
  { id: 'leaderboard', title: 'Leaderboard', route: '/leaderboard', description: 'Global rankings and legends', icon: 'podium', displayNameKey: 'dir_leaderboard' },
  { id: 'wallet', title: 'Wallet', route: '/(tabs)/wallet', description: 'OT Points and spend power-ups', icon: 'wallet', displayNameKey: 'dir_wallet' },
  { id: 'missions', title: 'Missions', route: '/missions', description: 'Daily missions — earn OT Points', icon: 'flag', displayNameKey: 'dir_missions' },
  { id: 'bookmarks', title: 'Bookmarks', route: '/bookmarks', description: 'Saved partners and perks', icon: 'bookmark', displayNameKey: 'dir_bookmarks' },
  { id: 'settings', title: 'Settings', route: '/settings', description: 'Theme, security, tutorials', icon: 'settings-sharp', displayNameKey: 'dir_settings' },
  { id: 'tutorials', title: 'Tutorials', route: '/tutorials', description: 'Learn how to use OrbTap', icon: 'school' },
  { id: 'help', title: 'Help Center', route: '/legal/help', description: 'FAQs and support', icon: 'help-buoy' },
  { id: 'privacy', title: 'Privacy Policy', route: '/legal/privacy', description: 'How we handle your data', icon: 'lock-closed' },
  { id: 'terms', title: 'Terms of Service', route: '/legal/terms', description: 'Terms and conditions', icon: 'document-text' },
  { id: 'orbswipe', title: 'OrbSwipe', route: '/orbswipe', description: 'Swipe tonight — build your plan', icon: 'swap-horizontal', displayNameKey: 'dir_orbswipe' },
];

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  defaultScope?: SearchScope;
  onSelectMember?: (user: SearchUserResult) => void;
}

const MEMBER_SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 1;

// Cap stagger animation at 5 items for performance
const STAGGER_CAP = 5;

export function SearchOverlay({ visible, onClose, defaultScope = 'all', onSelectMember }: SearchOverlayProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { partners } = usePartners();
  const { getDisplayName } = useAdminLayout();
  const { flags } = useFlags();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>(defaultScope);
  const [activeCategory, setActiveCategory] = useState('All');

  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  const visiblePages = useMemo(() => {
    const list = SEARCHABLE_PAGES.filter((p) => isPageVisible(p.id, flags));
    return list.slice().sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  }, [flags]);

  const [memberResults, setMemberResults] = useState<SearchUserResult[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const memberSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setScope(defaultScope);
      setActiveCategory('All');
    }
  }, [visible, defaultScope]);

  // Reset category when scope changes
  useEffect(() => {
    setActiveCategory('All');
  }, [scope]);

  const q = query.trim().toLowerCase();

  // ── Fuse.js indexes (built once per data change) ──────────────────────────

  const partnerFuse = useMemo(() => new Fuse(partners, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'name',             weight: 0.5 },
      { name: 'category',         weight: 0.3 },
      { name: 'description',      weight: 0.1 },
      { name: 'location.address', weight: 0.05 },
      { name: 'about',            weight: 0.05 },
    ],
  }), [partners]);

  type PerkWithPartner = Perk & { partnerName: string };

  const perksWithPartnerName = useMemo<PerkWithPartner[]>(() =>
    MOCK_PERKS.map(perk => ({
      ...perk,
      partnerName: partners.find(p => p.id === perk.partnerId)?.name ?? '',
    })),
  [partners]);

  const perkFuse = useMemo(() => new Fuse(perksWithPartnerName, {
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'title',       weight: 0.6 },
      { name: 'description', weight: 0.3 },
      { name: 'partnerName', weight: 0.1 },
    ],
  }), [perksWithPartnerName]);

  const pageFuse = useMemo(() => new Fuse(visiblePages, {
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'title',       weight: 0.6 },
      { name: 'description', weight: 0.4 },
    ],
  }), [visiblePages]);

  // ── Smart-ranked partner results ──────────────────────────────────────────

  const rankedPartnerResults = useMemo(() => {
    if (!q) return partners.slice(0, 20);
    const raw = partnerFuse.search(q);
    return raw
      .map(r => ({
        ...r.item,
        _score: (1 - (r.score ?? 0.5)) * 100
          + (r.item.verified ? 20 : 0)
          + (r.item.tier === 'platinum' ? 15 : r.item.tier === 'gold' ? 10 : 0),
      }))
      .sort((a, b) => b._score - a._score);
  }, [q, partnerFuse, partners]);

  const partnerResults = useMemo(() => {
    if (activeCategory === 'All') return rankedPartnerResults;
    return rankedPartnerResults.filter(p => p.category === activeCategory);
  }, [rankedPartnerResults, activeCategory]);

  const perkResults = useMemo<PerkWithPartner[]>(() => {
    if (!q) return perksWithPartnerName.slice(0, 12);
    return perkFuse.search(q).map(r => r.item);
  }, [q, perkFuse, perksWithPartnerName]);

  const pageResults = useMemo(() => {
    if (!q) return visiblePages.slice(0, 12);
    return pageFuse.search(q).map(r => r.item);
  }, [q, pageFuse, visiblePages]);

  // ── Member search (debounced, Firestore) ─────────────────────────────────

  useEffect(() => {
    if (scope !== 'members' && scope !== 'all') {
      setMemberResults([]);
      return;
    }
    if (q.length < MIN_QUERY_LENGTH) {
      setMemberResults([]);
      return;
    }
    if (memberSearchTimeoutRef.current) clearTimeout(memberSearchTimeoutRef.current);
    memberSearchTimeoutRef.current = setTimeout(() => {
      memberSearchTimeoutRef.current = null;
      setMemberSearchLoading(true);
      searchDiscoverableUsers({ query: q, limit: 25 })
        .then(res => {
          if (res.success) setMemberResults(res.users);
          else setMemberResults([]);
        })
        .catch(() => setMemberResults([]))
        .finally(() => setMemberSearchLoading(false));
    }, MEMBER_SEARCH_DEBOUNCE_MS);
    return () => {
      if (memberSearchTimeoutRef.current) clearTimeout(memberSearchTimeoutRef.current);
    };
  }, [scope, q]);

  // ── Navigation helpers ────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (q.length >= 2) addToHistory(query.trim());
    onClose();
  }, [q, query, addToHistory, onClose]);

  const handleSelectPartner = (p: Partner) => {
    handleClose();
    router.push({ pathname: '/partner/[id]', params: { id: p.id } } as any);
  };

  const handleSelectMember = (user: SearchUserResult) => {
    handleClose();
    if (onSelectMember) {
      onSelectMember(user);
    } else {
      router.push({ pathname: '/people' } as any);
    }
  };

  const handleSelectPage = (page: SearchablePage) => {
    handleClose();
    router.push(page.route as any);
  };

  const handleSelectPerk = (perk: PerkWithPartner) => {
    handleClose();
    router.push({ pathname: '/perk/[id]', params: { id: perk.id } } as any);
  };

  const handleChipTap = (chip: string) => {
    setQuery(chip);
    inputRef.current?.focus();
  };

  // ── Scope + show flags ────────────────────────────────────────────────────

  const showPartners = scope === 'map' || scope === 'businesses' || scope === 'all';
  const showPerks    = scope === 'all' || scope === 'businesses';
  const showMembers  = scope === 'members' || scope === 'all';
  const showPages    = scope === 'pages' || scope === 'all';
  const showCategoryChips = showPartners && (scope === 'businesses' || scope === 'all');

  const hasQuery = q.length >= 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.fullScreen, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>

          {/* ── Header ── */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={22} color={colors.textSecondary} />
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text }]}
                placeholder="Search partners, perks, people…"
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* ── Scope pills ── */}
          <View style={[styles.scopeRow, { borderBottomColor: colors.border }]}>
            {SCOPES.map(({ key, label }) => {
              const isAll = key === 'all';
              const activeColor = isAll ? COLORS.neonBlue[0] : SCOPE_COLORS[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.scopePill,
                    scope === key
                      ? { backgroundColor: activeColor, borderColor: activeColor }
                      : { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                  ]}
                  onPress={() => setScope(key)}
                >
                  <Text style={[styles.scopePillText, { color: scope === key ? (key === 'all' ? '#000' : '#fff') : colors.text }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Category filter chips (businesses + all scopes) ── */}
          {showCategoryChips && (
            <Animated.View entering={FadeIn.duration(200)}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
                style={[styles.categoryScroll, { borderBottomColor: colors.border }]}
              >
                {BUSINESS_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      activeCategory === cat
                        ? { backgroundColor: SCOPE_COLORS.businesses, borderColor: SCOPE_COLORS.businesses }
                        : { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                    ]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, { color: activeCategory === cat ? '#fff' : colors.text }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {/* ═══════════════════════════════════════════════════════
                INITIAL STATE (no query) — Recent + Trending + Categories
                ═══════════════════════════════════════════════════════ */}
            {!hasQuery && (
              <>
                {/* Recent Searches */}
                {history.length > 0 && (
                  <View style={styles.discoverySection}>
                    <View style={styles.discoverySectionHeader}>
                      <Text style={[styles.discoverySectionTitle, { color: colors.text }]}>Recent</Text>
                      <TouchableOpacity onPress={clearHistory}>
                        <Text style={[styles.clearAllText, { color: colors.textSecondary }]}>Clear all</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                      {history.map(item => (
                        <View key={item} style={[styles.recentChipWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <TouchableOpacity onPress={() => handleChipTap(item)} style={styles.recentChipInner}>
                            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                            <Text style={[styles.chipText, { color: colors.text }]}>{item}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeFromHistory(item)} hitSlop={8} style={styles.recentChipX}>
                            <Ionicons name="close" size={12} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Trending */}
                <View style={styles.discoverySection}>
                  <Text style={[styles.discoverySectionTitle, { color: colors.text }]}>Trending</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {TRENDING_SEARCHES.map(term => (
                      <TouchableOpacity
                        key={term}
                        style={[styles.trendingChip, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
                        onPress={() => handleChipTap(term)}
                      >
                        <Ionicons name="trending-up" size={13} color={COLORS.neonBlue[0]} />
                        <Text style={[styles.chipText, { color: colors.text }]}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Quick Categories */}
                <View style={styles.discoverySection}>
                  <Text style={[styles.discoverySectionTitle, { color: colors.text }]}>Browse by Category</Text>
                  <View style={styles.quickCategoryGrid}>
                    {BUSINESS_CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.quickCategoryChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => {
                          setScope('businesses');
                          setActiveCategory(cat);
                          handleChipTap(cat);
                        }}
                      >
                        <Text style={[styles.quickCategoryText, { color: colors.text }]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════
                RESULTS STATE (has query)
                ═══════════════════════════════════════════════════════ */}
            {hasQuery && (
              <>
                {/* ── Businesses / Map ── */}
                {showPartners && (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={[styles.sectionLabel, { color: scope === 'map' ? SCOPE_COLORS.map : SCOPE_COLORS.businesses }]}>
                        {scope === 'map' ? 'ON MAP' : 'BUSINESSES'}
                        {partnerResults.length > 0 && ` (${Math.min(5, partnerResults.length)} of ${partnerResults.length})`}
                      </Text>
                      {scope === 'all' && partnerResults.length > 5 && (
                        <TouchableOpacity onPress={() => setScope('businesses')}>
                          <Text style={[styles.seeAllText, { color: SCOPE_COLORS.businesses }]}>See all {partnerResults.length} →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {partnerResults.length === 0 ? (
                      <Text style={[styles.emptyRow, { color: colors.textSecondary }]}>No matches</Text>
                    ) : (
                      (scope === 'all' ? partnerResults.slice(0, 5) : partnerResults.slice(0, 15)).map((p, index) => (
                        <Animated.View
                          key={p.id}
                          entering={index < STAGGER_CAP ? FadeInDown.duration(250).delay(index * 30) : undefined}
                        >
                          <TouchableOpacity
                            style={[styles.resultRow, { borderBottomColor: colors.border, borderLeftWidth: 3, borderLeftColor: TIER_LEFT_COLORS[p.tier] ?? SCOPE_COLORS.businesses }]}
                            onPress={() => handleSelectPartner(p)}
                          >
                            <Ionicons name="business-outline" size={20} color={SCOPE_COLORS.businesses} />
                            <View style={styles.resultTextWrap}>
                              <View style={styles.resultTitleRow}>
                                <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                                {p.verified && <Ionicons name="checkmark-circle" size={14} color="#3b82f6" style={styles.verifiedIcon} />}
                              </View>
                              <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>
                                {[p.category, p.location?.address].filter(Boolean).join(' · ') || '—'}
                              </Text>
                            </View>
                            <View style={[styles.tierBadge, { backgroundColor: TIER_LEFT_COLORS[p.tier] ?? '#64748b' }]}>
                              <Text style={styles.tierBadgeText}>{p.tier === 'platinum' ? 'P' : p.tier === 'gold' ? 'G' : 'S'}</Text>
                            </View>
                          </TouchableOpacity>
                        </Animated.View>
                      ))
                    )}
                  </>
                )}

                {/* ── Perks ── */}
                {showPerks && (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={[styles.sectionLabel, { color: '#16a34a' }]}>
                        PERKS
                        {perkResults.length > 0 && ` (${Math.min(4, perkResults.length)} of ${perkResults.length})`}
                      </Text>
                      {scope === 'all' && perkResults.length > 4 && (
                        <TouchableOpacity onPress={() => setScope('businesses')}>
                          <Text style={[styles.seeAllText, { color: '#16a34a' }]}>See all {perkResults.length} →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {perkResults.length === 0 ? (
                      <Text style={[styles.emptyRow, { color: colors.textSecondary }]}>No perks match</Text>
                    ) : (
                      (scope === 'all' ? perkResults.slice(0, 4) : perkResults.slice(0, 12)).map((perk, index) => (
                        <Animated.View
                          key={perk.id}
                          entering={index < STAGGER_CAP ? FadeInDown.duration(250).delay(index * 30) : undefined}
                        >
                          <TouchableOpacity
                            style={[styles.resultRow, { borderBottomColor: colors.border, borderLeftWidth: 3, borderLeftColor: '#16a34a' }]}
                            onPress={() => handleSelectPerk(perk)}
                          >
                            <Ionicons name="gift-outline" size={20} color="#16a34a" />
                            <View style={styles.resultTextWrap}>
                              <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{perk.title}</Text>
                              <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>
                                {[perk.partnerName, `${perk.cost} OT`, perk.cooldown].filter(Boolean).join(' · ')}
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </Animated.View>
                      ))
                    )}
                  </>
                )}

                {/* ── People ── */}
                {showMembers && (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={[styles.sectionLabel, { color: SCOPE_COLORS.members }]}>
                        PEOPLE
                        {memberResults.length > 0 && ` (${Math.min(3, memberResults.length)} of ${memberResults.length})`}
                      </Text>
                      {scope === 'all' && memberResults.length > 3 && (
                        <TouchableOpacity onPress={() => setScope('members')}>
                          <Text style={[styles.seeAllText, { color: SCOPE_COLORS.members }]}>See all {memberResults.length} →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {memberSearchLoading ? (
                      <View style={styles.memberLoading}>
                        <ActivityIndicator size="small" color={SCOPE_COLORS.members} />
                        <Text style={[styles.emptyRow, { color: colors.textSecondary, marginLeft: 8 }]}>Searching…</Text>
                      </View>
                    ) : q.length < MIN_QUERY_LENGTH ? (
                      <Text style={[styles.emptyRow, { color: colors.textSecondary }]}>Type a name or @handle to find people</Text>
                    ) : memberResults.length === 0 ? (
                      <Text style={[styles.emptyRow, { color: colors.textSecondary }]}>No one found. They may not be discoverable.</Text>
                    ) : (
                      (scope === 'all' ? memberResults.slice(0, 3) : memberResults).map((user, index) => (
                        <Animated.View
                          key={user.uid}
                          entering={index < STAGGER_CAP ? FadeInDown.duration(250).delay(index * 30) : undefined}
                        >
                          <TouchableOpacity
                            style={[styles.resultRow, { borderBottomColor: colors.border, borderLeftWidth: 3, borderLeftColor: SCOPE_COLORS.members }]}
                            onPress={() => handleSelectMember(user)}
                          >
                            <Ionicons name="person" size={20} color={SCOPE_COLORS.members} />
                            <View style={styles.resultTextWrap}>
                              <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                                {user.displayName || user.username || user.uid.slice(0, 12)}
                              </Text>
                              {user.username && (
                                <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>@{user.username}</Text>
                              )}
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </Animated.View>
                      ))
                    )}
                  </>
                )}

                {/* ── Pages ── */}
                {showPages && (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={[styles.sectionLabel, { color: SCOPE_COLORS.pages }]}>
                        PAGES
                        {pageResults.length > 0 && ` (${Math.min(3, pageResults.length)} of ${pageResults.length})`}
                      </Text>
                      {scope === 'all' && pageResults.length > 3 && (
                        <TouchableOpacity onPress={() => setScope('pages')}>
                          <Text style={[styles.seeAllText, { color: SCOPE_COLORS.pages }]}>See all {pageResults.length} →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {pageResults.length === 0 ? (
                      <Text style={[styles.emptyRow, { color: colors.textSecondary }]}>No matches</Text>
                    ) : (
                      (scope === 'all' ? pageResults.slice(0, 3) : pageResults).map((page, index) => (
                        <Animated.View
                          key={page.id}
                          entering={index < STAGGER_CAP ? FadeInDown.duration(250).delay(index * 30) : undefined}
                        >
                          <TouchableOpacity
                            style={[styles.resultRow, { borderBottomColor: colors.border, borderLeftWidth: 3, borderLeftColor: SCOPE_COLORS.pages }]}
                            onPress={() => handleSelectPage(page)}
                          >
                            <Ionicons name={page.icon} size={20} color={SCOPE_COLORS.pages} />
                            <View style={styles.resultTextWrap}>
                              <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                                {page.displayNameKey ? getDisplayName(page.displayNameKey, page.title) : page.title}
                              </Text>
                              <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>{page.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </Animated.View>
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  keyboard: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 1,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 4 },
  closeBtn: { padding: 4 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  scopePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  scopePillText: { fontSize: 12, fontWeight: '600' },
  categoryScroll: { borderBottomWidth: 1 },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  resultsScroll: { flex: 1 },
  resultsContent: { paddingBottom: 32 },

  // Discovery state
  discoverySection: { paddingTop: 20, paddingHorizontal: 16, marginBottom: 4 },
  discoverySectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  discoverySectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  clearAllText: { fontSize: 12 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  recentChipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 4,
  },
  recentChipInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recentChipX: { padding: 2 },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  quickCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  quickCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickCategoryText: { fontSize: 13, fontWeight: '500' },

  // Results
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  seeAllText: { fontSize: 12, fontWeight: '600' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  resultTextWrap: { flex: 1, minWidth: 0 },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultTitle: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  verifiedIcon: { flexShrink: 0 },
  resultSub: { fontSize: 12, marginTop: 2 },
  emptyRow: { fontSize: 14, paddingHorizontal: 16, paddingVertical: 16 },
  memberLoading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  tierBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tierBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
});
