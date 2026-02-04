import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Partner, TIER_COLORS, MOCK_PERKS, MOCK_PARTNERS } from '../constants/MockData';
import { VerifiedBadge } from './VerifiedBadge';
import { PremiumPerkCard } from './PremiumPerkCard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useSocial } from '../hooks/useSocial';
import { useBookmarks } from '../context/BookmarkContext';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OrbSheetProps {
  partner: Partner;
  onClose: () => void;
  onSelectPartner: (p: Partner) => void;
  /** Optional list for swipe-between (current partner should be in list) */
  swipePartners?: Partner[];
}

function openDirections(lat: number, lng: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  Linking.openURL(url).catch(() => {});
}

export const OrbSheet = ({ partner, onClose, onSelectPartner, swipePartners }: OrbSheetProps) => {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '78%', '95%'], []);
  const perks = MOCK_PERKS.filter((p) => p.partnerId === partner.id);
  const color = TIER_COLORS[partner.tier];
  const { colors, isDark } = useTheme();
  const { isFollowing, toggleFollow } = useSocial();
  const { isPartnerBookmarked, togglePartner: toggleBookmark } = useBookmarks();
  const following = isFollowing(partner.id);
  const bookmarked = isPartnerBookmarked(partner.id);

  const nearby = MOCK_PARTNERS.filter((p) => p.id !== partner.id).slice(0, 6);
  const list = swipePartners ?? [partner, ...nearby];
  const currentIndex = list.findIndex((p) => p.id === partner.id);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < list.length - 1;

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onEnd((e) => {
          if (e.velocityX < -200 && canGoNext) {
            Haptics.selectionAsync();
            onSelectPartner(list[currentIndex + 1]);
          } else if (e.velocityX > 200 && canGoPrev) {
            Haptics.selectionAsync();
            onSelectPartner(list[currentIndex - 1]);
          }
        }),
    [currentIndex, canGoPrev, canGoNext, list, onSelectPartner]
  );

  useEffect(() => {
    if (!partner) {
      bottomSheetRef.current?.close();
    } else {
      bottomSheetRef.current?.expand();
    }
  }, [partner]);

  const handleFollow = () => {
    Haptics.selectionAsync();
    toggleFollow(partner.id);
  };

  const handleOpenProfile = () => {
    Haptics.selectionAsync();
    onClose();
    router.push(`/partner/${partner.id}` as any);
  };

  const handleDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (partner.location) openDirections(partner.location.lat, partner.location.lng);
  };

  const handleBookmark = () => {
    Haptics.selectionAsync();
    toggleBookmark(partner.id);
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: isDark ? '#0a0a0a' : '#f8f8f8',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? '#1a1a1a' : '#e5e5ea',
      }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#444' : '#999', width: 40 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <GestureDetector gesture={panGesture}>
          <View>
            {/* Swipe hint + prev/next */}
            {list.length > 1 && (
              <View style={[styles.swipeRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.swipeBtn, !canGoPrev && styles.swipeBtnDisabled]}
                  onPress={() => canGoPrev && (Haptics.selectionAsync(), onSelectPartner(list[currentIndex - 1]))}
                  disabled={!canGoPrev}
                >
                  <Ionicons name="chevron-back" size={24} color={canGoPrev ? colors.text : colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.swipeHint, { color: colors.textSecondary }]}>
                  {currentIndex + 1} of {list.length} · swipe to switch
                </Text>
                <TouchableOpacity
                  style={[styles.swipeBtn, !canGoNext && styles.swipeBtnDisabled]}
                  onPress={() => canGoNext && (Haptics.selectionAsync(), onSelectPartner(list[currentIndex + 1]))}
                  disabled={!canGoNext}
                >
                  <Ionicons name="chevron-forward" size={24} color={canGoNext ? colors.text : colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            {/* Hero strip: tier bar + name + verified + bookmark */}
            <View style={[styles.heroStrip, { backgroundColor: color + '22' }]}>
              <View style={[styles.tierBar, { backgroundColor: color }]} />
              <View style={styles.heroRow}>
                <View style={styles.heroLeft}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>
                      {partner.name}
                    </Text>
                    {partner.verified && <VerifiedBadge size={18} />}
                    <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkBtn} hitSlop={8}>
                      <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? color : colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {partner.tier.toUpperCase()} · {partner.category}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.openProfileBtn, { backgroundColor: color }]}
                  onPress={handleOpenProfile}
                >
                  <Text style={styles.openProfileText}>View</Text>
                  <Ionicons name="arrow-forward" size={16} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </GestureDetector>

        {/* Primary CTAs */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleDirections}
          >
            <Ionicons name="navigate" size={20} color={color} />
            <Text style={[styles.ctaLabel, { color: colors.text }]}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <Ionicons name="qr-code" size={20} color={color} />
            <Text style={[styles.ctaLabel, { color: colors.text }]}>Redeem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              following ? { backgroundColor: color + '30', borderColor: color } : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={handleFollow}
          >
            <Ionicons name={following ? 'heart' : 'heart-outline'} size={20} color={following ? color : colors.textSecondary} />
            <Text style={[styles.ctaLabel, { color: following ? color : colors.text }]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Address + hours */}
        <View style={[styles.infoBlock, { borderBottomColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={colors.textSecondary} />
            <Text style={[styles.address, { color: colors.textSecondary }]}>{partner.location?.address ?? '—'}</Text>
          </View>
          {partner.hours ? (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={[styles.hours, { color: colors.textSecondary }]}>{partner.hours}</Text>
            </View>
          ) : null}
          {partner.termsShort ? (
            <Text style={[styles.termsHint, { color: colors.textSecondary }]}>{partner.termsShort}</Text>
          ) : null}
        </View>

        {/* Perks / Deals */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DEALS & PERKS</Text>
        {perks.length > 0 ? (
          perks.map((perk) => (
            <TouchableOpacity
              key={perk.id}
              style={[styles.perkCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: TIER_COLORS[perk.tier] }]}
              onPress={() => router.push(`/perk/${perk.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.perkMain}>
                <Text style={[styles.perkTitle, { color: colors.text }]}>{perk.title}</Text>
                <Text style={[styles.perkDesc, { color: colors.textSecondary }]} numberOfLines={2}>{perk.description}</Text>
                <View style={styles.perkMeta}>
                  <View style={[styles.perkPts, { backgroundColor: TIER_COLORS[perk.tier] + '25' }]}>
                    <Text style={[styles.perkPtsText, { color: TIER_COLORS[perk.tier] }]}>{perk.cost} pts</Text>
                  </View>
                  <Text style={[styles.cooldown, { color: colors.textSecondary }]}>{perk.cooldown} cooldown</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyPerks, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="gift-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.emptyPerksText, { color: colors.textSecondary }]}>No active perks right now. Check back later.</Text>
          </View>
        )}

        {/* Nearby */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NEARBY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearbyScroll}
        >
          {nearby.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.nearbyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onSelectPartner(p)}
              activeOpacity={0.8}
            >
              <View style={[styles.nearbyDot, { backgroundColor: TIER_COLORS[p.tier] }]} />
              <Text style={[styles.nearbyName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
              <Text style={[styles.nearbyCat, { color: colors.textSecondary }]} numberOfLines={1}>{p.category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  swipeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 8, borderBottomWidth: 1 },
  swipeBtn: { padding: 8 },
  swipeBtnDisabled: { opacity: 0.4 },
  swipeHint: { fontSize: 11, fontWeight: '600' },
  bookmarkBtn: { padding: 4 },
  heroStrip: {
    borderRadius: 16,
    paddingTop: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tierBar: { height: 4, width: '100%', marginBottom: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  heroLeft: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  partnerName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  meta: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  openProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  openProfileText: { fontSize: 13, fontWeight: '800', color: '#000' },
  ctaRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ctaLabel: { fontSize: 12, fontWeight: '700' },
  infoBlock: { paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  address: { fontSize: 14, flex: 1 },
  hours: { fontSize: 14, flex: 1 },
  termsHint: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  perkCardWrap: { marginBottom: 12 },
  emptyPerks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyPerksText: { fontSize: 13, flex: 1 },
  nearbyScroll: { gap: 12, paddingBottom: 8 },
  nearbyCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  nearbyDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  nearbyName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  nearbyCat: { fontSize: 11 },
});
