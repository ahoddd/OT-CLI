import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookmarks } from '../context/BookmarkContext';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../constants/PartnerTiers';
import { usePartners } from '../context/PartnersContext';
import type { BookmarkItem } from '../context/BookmarkContext';
import { useTheme } from '../hooks/useTheme';
import { useFlags } from '../components/FlagContext';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { PremiumPerkCard } from '../components/PremiumPerkCard';
import { safeHaptics } from '../utils/safeHaptics';
import { COLORS } from '../constants/Colors';
import { LIST_OPTIMIZATION } from '../constants/DesignTokens';
import { KitEmptyState } from '../components/ui/KitEmptyState';
import { useUserLocation } from '../context/UserLocationContext';
import { distanceToPartner, formatDistanceMi } from '../utils/location';
import { useI18n } from '../context/I18nContext';

export default function BookmarksScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { flags } = useFlags();
  const { getPartner, getPerk, getActivePerksForPartner } = usePartners();
  const { getItems, togglePartner, togglePerk, isPartnerBookmarked, isPerkBookmarked } = useBookmarks();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { isPremium } = useEffectiveTier();
  const { userLocation } = useUserLocation();
  const items = getItems();

  useEffect(() => {
    if (!flags.isBookmarksEnabled) router.back();
  }, [flags.isBookmarksEnabled, router]);
  if (!flags.isBookmarksEnabled) return null;

  const renderItem = ({ item }: { item: BookmarkItem }) => {
    if (item.type === 'partner') {
      const partner = getPartner(item.id);
      if (!partner) return null;
      const tierColor = PARTNER_TIER_COLORS[partner.tier];
      const perks = getActivePerksForPartner(partner.id);
      return (
        <View style={styles.partnerCardWrap}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: tierColor }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push(`/partner/${partner.id}` as any); }}
            activeOpacity={0.85}
          >
            <View style={styles.cardRow}>
              <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{partner.name}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{partner.category} · {PARTNER_TIER_LABELS[partner.tier]}</Text>
                {(() => {
                  const distMi = userLocation ? distanceToPartner(userLocation.latitude, userLocation.longitude, partner) : null;
                  const distLabel = distMi != null ? formatDistanceMi(distMi) + ' away' : null;
                  const addr = partner.location?.address ?? null;
                  if (!addr && !distLabel) return null;
                  return (
                    <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {[addr, distLabel].filter(Boolean).join(' · ')}
                    </Text>
                  );
                })()}
              </View>
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); safeHaptics.selectionAsync(); togglePartner(partner.id); }}
                style={styles.bookmarkBtn}
              >
                <Ionicons name="bookmark" size={22} color={PARTNER_TIER_COLORS[partner.tier]} />
              </TouchableOpacity>
            </View>
            {perks.length > 0 && (
              <View style={[styles.perkRow, { borderTopColor: colors.border }]}>
                {perks.slice(0, 2).map((pk) => (
                  <View key={pk.id} style={styles.perkChipWrap}>
                    <PremiumPerkCard perk={pk} partnerName={partner.name} variant="compact" />
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    const perk = getPerk(item.id);
    if (!perk) return null;
    const partner = getPartner(perk.partnerId);
    return (
      <View style={styles.perkBookmarkWrap}>
        <View style={styles.perkBookmarkCard}>
          <PremiumPerkCard perk={perk} partnerName={partner?.name} variant="row" />
        </View>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); safeHaptics.selectionAsync(); togglePerk(perk.id); }}
          style={styles.bookmarkBtnAbsolute}
        >
          <Ionicons name="bookmark" size={22} color={PARTNER_TIER_COLORS[perk.tier]} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('bookmarks.bookmarks')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('bookmarks.subtitle')}
        </Text>
        <View style={[styles.quickLinksStrip, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.quickLinkChip, { backgroundColor: colors.surface }]} onPress={() => { safeHaptics.selectionAsync(); router.push('/partners' as any); }}>
            <Ionicons name="business-outline" size={18} color={colors.text} />
            <Text style={[styles.quickLinkChipText, { color: colors.text }]}>{t('partners.partners')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickLinkChip, { backgroundColor: colors.surface }]} onPress={() => { safeHaptics.selectionAsync(); router.push('/knowledge' as any); }}>
            <Ionicons name="bulb-outline" size={18} color={colors.text} />
            <Text style={[styles.quickLinkChipText, { color: colors.text }]}>{t('knowledge.knowledge')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickLinkChip, { backgroundColor: colors.surface }]} onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)' as any); }}>
            <Ionicons name="map-outline" size={18} color={colors.text} />
            <Text style={[styles.quickLinkChipText, { color: colors.text }]}>{t('home.map')}</Text>
          </TouchableOpacity>
        </View>
        {!isPremium && (
          <TouchableOpacity
            style={[styles.premiumTeaser, { backgroundColor: themeGold + '14', borderColor: themeGold + '50' }]}
            onPress={() => router.push('/premium' as any)}
            activeOpacity={0.9}
          >
            <Ionicons name="diamond-outline" size={18} color={themeGold} />
            <Text style={[styles.premiumTeaserText, { color: colors.text }]}>{t('bookmarks.unlockUnlimitedFollows')}</Text>
            <Ionicons name="chevron-forward" size={18} color={themeGold} />
          </TouchableOpacity>
        )}
        {items.length === 0 ? (
          <View style={[styles.empty, { alignItems: 'center' }]}>
            <KitEmptyState
              title={t('bookmarks.savePartnersPerks')}
              subtitle={t('bookmarks.savePartnersPerksSub')}
            />
            <TouchableOpacity
              style={[styles.emptyCta, { backgroundColor: colors.primary }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)' as any); }}
            >
              <Text style={styles.emptyCtaText}>{t('bookmarks.exploreMap')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyCtaSecondary, { borderColor: colors.border }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/missions' as any); }}
            >
              <Ionicons name="flag" size={18} color={colors.text} />
              <Text style={[styles.emptyCtaSecondaryText, { color: colors.text }]}>{t('bookmarks.dailyMissions')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, paddingHorizontal: 20, marginBottom: 12 },
  quickLinksStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  quickLinkChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  quickLinkChipText: { fontSize: 12, fontWeight: '600' },
  premiumTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  premiumTeaserText: { fontSize: 13, fontWeight: '600', flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  partnerCardWrap: { marginBottom: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: 16,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tierDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  cardSub: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cardMeta: { fontSize: 11 },
  bookmarkBtn: { padding: 4 },
  perkRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  perkChipWrap: { flex: 1, minWidth: 0 },
  perkBookmarkWrap: { position: 'relative', marginBottom: 12 },
  perkBookmarkCard: { flex: 1 },
  bookmarkBtnAbsolute: { position: 'absolute', top: 12, right: 12, padding: 8, zIndex: 1 },
  empty: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  emptyCta: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginBottom: 10 },
  emptyCtaText: { color: '#000', fontSize: 15, fontWeight: '800' },
  emptyCtaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyCtaSecondaryText: { fontSize: 14, fontWeight: '700' },
});
