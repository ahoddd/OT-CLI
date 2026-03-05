import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { usePartners } from '../context/PartnersContext';
import { FEATURED_PERK_PARTNER_ID, ORBTAP_UNIVERSE_PARTNER_ID, type Partner } from '../constants/MockData';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../constants/PartnerTiers';
import type { PartnerTier } from '../constants/PartnerTiers';
import { OrbTapLogoMark } from '../components/OrbTapLogoMark';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { SponsoredAdSlot } from '../components/SponsoredAdSlot';
import { MoreSection } from '../components/MoreSection';
import { COLORS } from '../constants/Colors';
import { useUserLocation } from '../context/UserLocationContext';
import { distanceToPartner, formatDistanceMi } from '../utils/location';
import { useI18n } from '../context/I18nContext';

const PARTNER_TIERS: (PartnerTier | 'all')[] = ['all', 'silver', 'gold', 'platinum'];
const PARTNER_TIER_LABELS_AND_ALL: Record<PartnerTier | 'all', string> = { all: 'All', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

export default function PartnersListScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { partners, loading, getActivePerksForPartner } = usePartners();
  const { userLocation, refreshLocation, requestPermission } = useUserLocation();

  useEffect(() => {
    requestPermission().then((ok) => { if (ok) refreshLocation(); });
  }, [requestPermission, refreshLocation]);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<PartnerTier | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    partners.forEach((p) => {
      const c = (p.category ?? '').trim();
      if (!c) return;
      const key = c.toLowerCase();
      const display = key.charAt(0).toUpperCase() + key.slice(1);
      if (!map.has(key)) map.set(key, display);
    });
    return ['all', ...Array.from(map.values()).sort()];
  }, [partners]);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (tierFilter !== 'all' && p.tier !== tierFilter) return false;
      if (categoryFilter !== 'all' && (p.category ?? '').trim().toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.category ?? '').toLowerCase().includes(q) && !(p.description ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [partners, tierFilter, categoryFilter, search]);

  const orderedPartners = useMemo(() => {
    const featured = filtered.find((p) => p.id === FEATURED_PERK_PARTNER_ID);
    let rest = filtered.filter((p) => p.id !== FEATURED_PERK_PARTNER_ID);
    if (userLocation) {
      rest = [...rest].sort((a, b) => {
        const miA = distanceToPartner(userLocation.latitude, userLocation.longitude, a) ?? 999;
        const miB = distanceToPartner(userLocation.latitude, userLocation.longitude, b) ?? 999;
        return miA - miB;
      });
    }
    return featured ? [featured, ...rest] : rest;
  }, [filtered, userLocation]);

  const cardWidth = width - 32;
  const imageHeight = Math.min(160, cardWidth * 0.5);

  const renderPartner = ({ item, index }: { item: Partner; index: number }) => {
    const isFeaturedSpot = index === 0 && item.id === FEATURED_PERK_PARTNER_ID;
    const perkCount = getActivePerksForPartner(item.id).length;
    const tierColor = PARTNER_TIER_COLORS[item.tier];
    const imageUrl = item.featuredImageUrl ?? item.logoUrl ?? null;
    const isOrbTapUniverse = item.id === ORBTAP_UNIVERSE_PARTNER_ID;
    const distanceMi = userLocation ? distanceToPartner(userLocation.latitude, userLocation.longitude, item) : null;
    const distanceLabel = distanceMi != null ? formatDistanceMi(distanceMi) : '';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/partner/${item.id}`)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.cardImageWrap, { height: imageHeight, backgroundColor: isOrbTapUniverse ? '#020617' : colors.surfaceHighlight }]}>
          {isOrbTapUniverse ? (
            <View style={styles.cardLogoWrap}>
              <OrbTapLogoMark variant="small" width={96} height={82} />
            </View>
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImagePlaceholder, { backgroundColor: tierColor + '25' }]}>
              <Ionicons name="business" size={48} color={tierColor} />
            </View>
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.cardGradient} />
          {isFeaturedSpot && (
            <View style={styles.featuredSpotBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.featuredSpotText}>Featured spot</Text>
            </View>
          )}
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierBadgeText}>{item.tier}</Text>
          </View>
          {item.verified && (
            <View style={styles.verifiedWrap}>
              <VerifiedBadge size={20} tier={item.tier} />
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>{item.category}</Text>
          {item.description ? (
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <View style={styles.cardMeta}>
            {(item.location?.address || distanceLabel) ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {[item.location?.address, distanceLabel].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ) : null}
            {perkCount > 0 && (
              <Text style={[styles.perkCount, { color: tierColor }]}>{perkCount} perk{perkCount !== 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text }]}>OrbTap Partners</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Discover every spot — tap to see perks & redeem</Text>
        </View>
      </View>

      <View style={[styles.filtersBlock, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchWrap, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, category..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chipSection}>
          <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>Tier</Text>
          <FlatList
            horizontal
            data={PARTNER_TIERS}
            keyExtractor={(t) => t}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setTierFilter(item)}
                style={[styles.chip, item !== 'all' && { borderColor: PARTNER_TIER_COLORS[item] }, tierFilter === item && (item === 'all' ? { backgroundColor: colors.surfaceHighlight } : { backgroundColor: PARTNER_TIER_COLORS[item] + '30' })]}
              >
                <Text style={[styles.chipText, { color: tierFilter === item && item !== 'all' ? PARTNER_TIER_COLORS[item] : colors.text }]}>{PARTNER_TIER_LABELS_AND_ALL[item]}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={styles.chipSection}>
          <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>Category</Text>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(c) => c}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setCategoryFilter(item)}
                style={[styles.chip, { borderColor: colors.border }, categoryFilter === item && { backgroundColor: colors.primary + '20' }]}
              >
                <Text style={[styles.chipText, { color: categoryFilter === item ? colors.primary : colors.text }]}>{item === 'all' ? 'All' : item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading partners...</Text>
        </View>
      ) : (
        <FlatList
          data={orderedPartners}
          keyExtractor={(p) => p.id}
          renderItem={renderPartner}
          contentContainerStyle={[styles.listContent, { paddingBottom: 24 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={56} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No partners match</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try changing filters or search.</Text>
            </View>
          }
          ListHeaderComponent={
            <>
              <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                <SponsoredAdSlot placement="orb_carousel" sectionTitle="SPONSORED" />
              </View>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {orderedPartners.length} {orderedPartners.length === 1 ? 'partner' : 'partners'}
              </Text>
            </>
          }
          ListFooterComponent={
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}>
              <MoreSection
                title="More"
                variant="rows"
                links={[
                  { label: 'OrbPulse', route: '/pulse', icon: 'pulse' },
                  { label: 'OrbVote', route: '/vote', icon: 'stats-chart' },
                  { label: 'Leaderboard', route: '/leaderboard', icon: 'trophy' },
                  { label: 'Stats', route: '/stats', icon: 'stats-chart' },
                ]}
              />
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  headerCenter: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 2 },
  filtersBlock: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, paddingVertical: 0 },
  chipSection: { marginTop: 10 },
  chipLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, marginHorizontal: 0 },
  chipRow: { paddingHorizontal: 0, gap: 6, flexDirection: 'row', paddingBottom: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingTop: 10 },
  resultCount: { fontSize: 12, marginBottom: 10 },
  moreSection: {
    marginTop: 24,
    paddingTop: 14,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  moreLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  moreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  morePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  morePillText: { fontSize: 11, fontWeight: '600' },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  cardImageWrap: { width: '100%', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardLogoWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  cardLogoImage: { width: 96, height: 96, maxWidth: '60%', maxHeight: '80%' },
  cardImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  featuredSpotBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  featuredSpotText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  tierBadge: { position: 'absolute', bottom: 10, left: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tierBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  verifiedWrap: { position: 'absolute', top: 10, right: 10 },
  cardBody: { padding: 14 },
  cardName: { fontSize: 18, fontWeight: '700' },
  cardCategory: { fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  cardDesc: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  cardMeta: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  metaText: { fontSize: 12, marginLeft: 4, flex: 1 },
  perkCount: { fontSize: 12, fontWeight: '600' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptySub: { fontSize: 14, marginTop: 4 },
});
