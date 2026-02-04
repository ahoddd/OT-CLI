import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookmarks } from '../context/BookmarkContext';
import { MOCK_PARTNERS, MOCK_PERKS, TIER_COLORS } from '../constants/MockData';
import type { BookmarkItem } from '../context/BookmarkContext';
import { useTheme } from '../hooks/useTheme';
import { PremiumPerkCard } from '../components/PremiumPerkCard';
import * as Haptics from 'expo-haptics';

export default function BookmarksScreen() {
  const router = useRouter();
  const { getItems, togglePartner, togglePerk, isPartnerBookmarked, isPerkBookmarked } = useBookmarks();
  const { colors, isDark } = useTheme();
  const items = getItems();

  const renderItem = ({ item }: { item: BookmarkItem }) => {
    if (item.type === 'partner') {
      const partner = MOCK_PARTNERS.find((p) => p.id === item.id);
      if (!partner) return null;
      const tierColor = TIER_COLORS[partner.tier];
      const perks = MOCK_PERKS.filter((p) => p.partnerId === partner.id);
      return (
        <View style={styles.partnerCardWrap}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: tierColor }]}
            onPress={() => { Haptics.selectionAsync(); router.push(`/partner/${partner.id}` as any); }}
            activeOpacity={0.85}
          >
            <View style={styles.cardRow}>
              <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{partner.name}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{partner.category} · {partner.tier}</Text>
                {partner.location?.address ? (
                  <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>{partner.location.address}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); Haptics.selectionAsync(); togglePartner(partner.id); }}
                style={styles.bookmarkBtn}
              >
                <Ionicons name="bookmark" size={22} color={TIER_COLORS[partner.tier]} />
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
    const perk = MOCK_PERKS.find((p) => p.id === item.id);
    if (!perk) return null;
    const partner = MOCK_PARTNERS.find((p) => p.id === perk.partnerId);
    return (
      <View style={styles.perkBookmarkWrap}>
        <View style={styles.perkBookmarkCard}>
          <PremiumPerkCard perk={perk} partnerName={partner?.name} variant="row" />
        </View>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); Haptics.selectionAsync(); togglePerk(perk.id); }}
          style={styles.bookmarkBtnAbsolute}
        >
          <Ionicons name="bookmark" size={22} color={TIER_COLORS[perk.tier]} />
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
          <Text style={[styles.title, { color: colors.text }]}>Bookmarks</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Saved partners and perks — tap to open, bookmark again to remove
        </Text>
        {items.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookmarks yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Tap the bookmark icon on any partner or perk to save it here
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
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
  subtitle: { fontSize: 13, paddingHorizontal: 20, marginBottom: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
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
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
