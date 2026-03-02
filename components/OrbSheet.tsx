import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Alert } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Partner, isDemoPartner, DEMO_HOURS } from '../constants/MockData';
import { usePartners } from '../context/PartnersContext';
import { PARTNER_TIER_COLORS, getPartnerTierShadowAll } from '../constants/PartnerTiers';
import { VerifiedBadge } from './VerifiedBadge';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useSocial } from '../hooks/useSocial';
import { useBookmarks } from '../context/BookmarkContext';
import { useReviews } from '../hooks/useReviews';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { promptAndOpenDirections } from '../utils/openDirections';
import { recordPartnerView } from '../services/partnerAnalytics';
import { useUserLocation } from '../context/UserLocationContext';
import { distanceToPartner, formatDistanceMi } from '../utils/location';
import { useFlags } from './FlagContext';
import { useStampStateForPartner } from '../hooks/useStampCards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 20;
const CARD_WIDTH = SCREEN_WIDTH;

interface OrbSheetProps {
  partner: Partner;
  onClose: () => void;
  onSelectPartner: (p: Partner) => void;
  /** Optional list for swipe-between (current partner should be in list) */
  swipePartners?: Partner[];
  /** This partner is a stop on one of today's missions — show Missions CTA */
  isMissionPartner?: boolean;
}

export const OrbSheet = ({ partner, onClose, onSelectPartner, swipePartners, isMissionPartner }: OrbSheetProps) => {
  const router = useRouter();
  const { getActivePerksForPartner, partners } = usePartners();
  const { getPartnerReviews } = useReviews();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['48%', '75%', '100%'], []);
  const { colors, isDark } = useTheme();
  const { isFollowing, toggleFollow } = useSocial();
  const { isPartnerBookmarked, togglePartner: toggleBookmark } = useBookmarks();
  const { userLocation } = useUserLocation();
  const { flags } = useFlags();
  const stampCardsEnabled = Boolean(flags?.moduleStampCards && flags?.stampCardsUserWallet);
  const { program: stampProgram, state: stampState, loading: stampLoading } = useStampStateForPartner(currentPartner?.id, stampCardsEnabled);

  const nearby = partners.filter((p) => p.id !== partner.id).slice(0, 6);
  const list = swipePartners ?? [partner, ...nearby];
  const currentIndex = Math.max(0, list.findIndex((p) => p.id === partner.id));
  const currentPartner = list[currentIndex];
  const flatListRef = useRef<FlatList<Partner>>(null);
  const lastPagerIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!partner) {
      bottomSheetRef.current?.close();
    } else {
      bottomSheetRef.current?.snapToIndex(1); // 75% — perks visible immediately
      recordPartnerView(partner.id).catch(() => {});
    }
  }, [partner]);

  useEffect(() => {
    if (list.length === 0 || currentIndex < 0) return;
    if (lastPagerIndexRef.current === currentIndex) {
      lastPagerIndexRef.current = -1;
      return;
    }
    flatListRef.current?.scrollToIndex({ index: currentIndex, animated: true });
  }, [partner?.id, list.length]);

  /** Single card content for the current partner — rendered inside BottomSheetScrollView so the sheet scrolls. */
  const renderCardContent = (p: Partner, index: number) => {
    const cardColor = PARTNER_TIER_COLORS[p.tier];
    const pPerks = getActivePerksForPartner(p.id);
    const pFollowing = isFollowing(p.id);
    const pBookmarked = isPartnerBookmarked(p.id);
    const pNearby = partners.filter((x) => x.id !== p.id).slice(0, 6);
    const showMissionCta = p.id === partner.id && isMissionPartner;
    const canGoPrev = index > 0;
    const canGoNext = index < list.length - 1;

    return (
      <>
          {/* Compact nav: 1 of N + arrows — no overlap with content below */}
          {list.length > 1 && (
            <View style={[styles.swipeNavRow, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.swipeBtn, !canGoPrev && styles.swipeBtnDisabled]}
                onPress={() => canGoPrev && (safeHaptics.selectionAsync(), onSelectPartner(list[index - 1]))}
                disabled={!canGoPrev}
              >
                <Ionicons name="chevron-back" size={22} color={canGoPrev ? colors.text : colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.swipeNavLabel, { color: colors.textSecondary }]}>{index + 1} of {list.length}</Text>
              <TouchableOpacity
                style={[styles.swipeBtn, !canGoNext && styles.swipeBtnDisabled]}
                onPress={() => canGoNext && (safeHaptics.selectionAsync(), onSelectPartner(list[index + 1]))}
                disabled={!canGoNext}
              >
                <Ionicons name="chevron-forward" size={22} color={canGoNext ? colors.text : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Hero — tappable name (go to partner page); badge + bookmark right-aligned so name never cut off */}
          <View style={[styles.heroStrip, { backgroundColor: cardColor + '22' }]}>
            <View style={[styles.tierBar, { backgroundColor: cardColor }]} />
            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <View style={styles.titleRow}>
                  <TouchableOpacity
                    style={styles.partnerNameWrap}
                    onPress={() => { safeHaptics.selectionAsync(); onClose(); router.push(`/partner/${p.id}` as any); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{p.name}</Text>
                  </TouchableOpacity>
                  <View style={styles.heroIconsRight}>
                    {p.verified && <VerifiedBadge size={18} tier={p.tier} />}
                    <TouchableOpacity
                      style={styles.bookmarkBtn}
                      onPress={() => { safeHaptics.selectionAsync(); toggleBookmark(p.id); }}
                      hitSlop={8}
                    >
                      <Ionicons name={pBookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={pBookmarked ? cardColor : colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {p.tier.charAt(0).toUpperCase() + p.tier.slice(1)} · {p.category}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.openProfileBtn, { backgroundColor: cardColor }]}
                onPress={() => { safeHaptics.selectionAsync(); onClose(); router.push(`/partner/${p.id}` as any); }}
              >
                <Text style={styles.openProfileText}>View</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mission CTA */}
          {showMissionCta && (
            <TouchableOpacity
              style={[styles.missionCta, { backgroundColor: '#fbbf2425', borderColor: '#fbbf24' }]}
              onPress={() => { onClose(); router.push('/missions' as any); }}
            >
              <Ionicons name="flag" size={20} color="#fbbf24" />
              <View style={styles.missionCtaTextWrap}>
                <Text style={[styles.missionCtaTitle, { color: colors.text }]}>Part of your mission</Text>
                <Text style={[styles.missionCtaSub, { color: colors.textSecondary }]}>Complete the step in Missions to earn OT + Sphere XP</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Stamp card progress — drive foot traffic when user has a card for this partner */}
          {!stampLoading && stampProgram && stampState && (
            <TouchableOpacity
              style={[styles.missionCta, styles.stampCta, { backgroundColor: (cardColor || '#3b82f6') + '22', borderColor: cardColor || '#3b82f6' }]}
              onPress={() => { safeHaptics.selectionAsync(); onClose(); router.push({ pathname: '/stamp-cards', params: { focusPartnerId: p.id } } as any); }}
              activeOpacity={0.88}
            >
              <Ionicons name="pricetag" size={20} color={cardColor || '#3b82f6'} />
              <View style={styles.missionCtaTextWrap}>
                <Text style={[styles.missionCtaTitle, { color: colors.text }]} numberOfLines={1}>{stampProgram.name}</Text>
                <Text style={[styles.missionCtaSub, { color: colors.textSecondary }]}>
                  {stampState.activeReward?.status === 'EARNED'
                    ? 'Reward ready — Show QR at counter'
                    : stampState.lastStampAt && stampProgram.cooldownHours
                      ? (() => {
                          const nextEligible = stampState.lastStampAt + stampProgram.cooldownHours * 60 * 60 * 1000;
                          const canStamp = Date.now() >= nextEligible;
                          return canStamp ? `${stampState.stampCount}/${stampProgram.stampsRequired} stamps · Ready to stamp` : `Next stamp in ${Math.ceil((nextEligible - Date.now()) / (60 * 60 * 1000))}h`;
                        })()
                      : `${stampState.stampCount}/${stampProgram.stampsRequired} stamps · Ready to stamp`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Redeem at venue */}
          {pPerks.length > 0 && (() => {
            const topPerk = pPerks[0];
            return (
              <TouchableOpacity
                style={[styles.redeemAtVenueCta, { backgroundColor: cardColor + '28', borderColor: cardColor }]}
                onPress={() => { safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); router.push('/(tabs)/scan' as any); }}
                activeOpacity={0.88}
              >
                <Ionicons name="qr-code" size={22} color={cardColor} />
                <View style={styles.redeemAtVenueTextWrap}>
                  <Text style={[styles.redeemAtVenueTitle, { color: colors.text }]} numberOfLines={1}>Visit & show QR — {topPerk.title}</Text>
                  <Text style={[styles.redeemAtVenueSub, { color: cardColor }]}>{topPerk.cost} pts · Earn OT when you redeem</Text>
                </View>
                <Ionicons name="open-outline" size={20} color={cardColor} />
              </TouchableOpacity>
            );
          })()}

          {/* Primary CTAs — Follow first (retention), Redeem (North Star), Directions (exits app) */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.ctaBtn, pFollowing ? { backgroundColor: cardColor + '30', borderColor: cardColor } : { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                safeHaptics.selectionAsync();
                const result = toggleFollow(p.id);
                if (result?.error === 'limit_reached') {
                  Alert.alert('Follow limit reached', 'Free accounts can follow up to 3 partners. Upgrade to Premium for unlimited follows.', [{ text: 'OK', style: 'cancel' }]);
                }
              }}
            >
              <Ionicons name={pFollowing ? 'heart' : 'heart-outline'} size={20} color={pFollowing ? cardColor : colors.textSecondary} />
              <Text style={[styles.ctaLabel, { color: pFollowing ? cardColor : colors.text }]}>{pFollowing ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/scan' as any)}
            >
              <Ionicons name="qr-code" size={20} color={cardColor} />
              <Text style={[styles.ctaLabel, { color: colors.text }]}>Redeem</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { if (p.location) { safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); promptAndOpenDirections(p.location.lat, p.location.lng); } }}
            >
              <Ionicons name="navigate" size={20} color={cardColor} />
              <Text style={[styles.ctaLabel, { color: colors.text }]}>Directions</Text>
            </TouchableOpacity>
          </View>

          {/* Address + hours + distance */}
          <View style={[styles.infoBlock, { borderBottomColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <View style={styles.addressWrap}>
                <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={2}>{p.location?.address ?? '—'}</Text>
                {userLocation && (() => {
                  const mi = distanceToPartner(userLocation.latitude, userLocation.longitude, p);
                  return mi != null ? <Text style={[styles.distanceAway, { color: colors.textSecondary }]}>{formatDistanceMi(mi)} away</Text> : null;
                })()}
              </View>
            </View>
            {(p.hours || (isDemoPartner(p) && DEMO_HOURS)) ? (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color={colors.textSecondary} />
                <Text style={[styles.hours, { color: colors.textSecondary }]} numberOfLines={1}>
                  {isDemoPartner(p) ? `Demo hours: ${p.hours || DEMO_HOURS}` : p.hours}
                </Text>
              </View>
            ) : null}
            {p.termsShort ? <Text style={[styles.termsHint, { color: colors.textSecondary }]} numberOfLines={2}>{p.termsShort}</Text> : null}
          </View>

          {/* Reviews peek + See All Reviews */}
          {(() => {
            const partnerReviews = getPartnerReviews(p.id).filter((r) => r.verified).slice(0, 3);
            const totalReviews = getPartnerReviews(p.id).length;
            return (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VERIFIED REVIEWS</Text>
                {partnerReviews.length > 0 ? (
                  <View style={[styles.reviewsPeek, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {partnerReviews.map((r, idx) => (
                      <View key={r.id} style={[styles.reviewPeekRow, { borderBottomColor: colors.border }, idx === partnerReviews.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={styles.reviewPeekStars}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Ionicons key={i} name={i <= r.rating ? 'star' : 'star-outline'} size={12} color="#fbbf24" />
                          ))}
                        </View>
                        <Text style={[styles.reviewPeekText, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">{r.text}</Text>
                        <Text style={[styles.reviewPeekAuthor, { color: colors.textSecondary }]}>{r.userName}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.reviewPeekAuthor, { color: colors.textSecondary, marginBottom: 8 }]}>No verified reviews yet.</Text>
                )}
                <TouchableOpacity
                  style={[styles.seeAllReviewsBtn, { borderColor: colors.border }]}
                  onPress={() => { safeHaptics.selectionAsync(); router.push(`/partner/reviews/${p.id}` as any); }}
                >
                  <Text style={[styles.seeAllReviewsText, { color: cardColor }]}>See All Reviews</Text>
                  {totalReviews > 0 && <Text style={[styles.seeAllReviewsCount, { color: colors.textSecondary }]}>({totalReviews})</Text>}
                  <Ionicons name="chevron-forward" size={16} color={cardColor} />
                </TouchableOpacity>
              </>
            );
          })()}

          {/* Deals & Perks */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PERKS YOU CAN REDEEM</Text>
          {pPerks.length > 0 ? (
            <View style={styles.perkSheetList}>
              {pPerks.map((perk) => {
                const perkShadow = getPartnerTierShadowAll(perk.tier);
                return (
                  <TouchableOpacity
                    key={perk.id}
                    style={[styles.perkSheetCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: PARTNER_TIER_COLORS[perk.tier] }, perkShadow]}
                    onPress={() => { safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/perk/${perk.id}` as any); }}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.perkSheetTierBar, { backgroundColor: PARTNER_TIER_COLORS[perk.tier] }]} />
                    <View style={styles.perkSheetBody}>
                      <Text style={[styles.perkSheetTitle, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">{perk.title}</Text>
                      <Text style={[styles.perkSheetDesc, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{perk.description}</Text>
                      <View style={styles.perkSheetMeta}>
                        {typeof perk.stock?.remaining === 'number' && <Text style={[styles.perkSheetRemaining, { color: PARTNER_TIER_COLORS[perk.tier] }]}>{perk.stock.remaining} left</Text>}
                        <View style={[styles.perkSheetPts, { backgroundColor: PARTNER_TIER_COLORS[perk.tier] + '22' }]}>
                          <Text style={[styles.perkSheetPtsText, { color: PARTNER_TIER_COLORS[perk.tier] }]}>{perk.cost} pts</Text>
                        </View>
                        <Text style={[styles.perkSheetCooldown, { color: colors.textSecondary }]}>{perk.cooldown}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={styles.perkSheetChevron} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyPerks, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="gift-outline" size={24} color={colors.textSecondary} />
              <Text style={[styles.emptyPerksText, { color: colors.textSecondary }]}>No active perks right now. Check back later.</Text>
            </View>
          )}

          {/* Nearby */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NEARBY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScroll}>
            {pNearby.map((near) => (
              <TouchableOpacity
                key={near.id}
                style={[styles.nearbyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => onSelectPartner(near)}
                activeOpacity={0.8}
              >
                <View style={[styles.nearbyDot, { backgroundColor: PARTNER_TIER_COLORS[near.tier] }]} />
                <Text style={[styles.nearbyName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{near.name}</Text>
                <Text style={[styles.nearbyCat, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{near.category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
      </>
    );
  };

  if (!currentPartner) return null;

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    const clamped = Math.max(0, Math.min(index, list.length - 1));
    if (clamped !== currentIndex && list[clamped]) {
      lastPagerIndexRef.current = clamped;
      safeHaptics.selectionAsync();
      onSelectPartner(list[clamped]);
    }
  };

  const getItemLayout = (_: unknown, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  if (list.length > 1) {
    return (
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableOverDrag
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
        <BottomSheetView style={styles.pagerWrap}>
          <FlatList
            ref={flatListRef}
            data={list}
            keyExtractor={(p) => p.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
            getItemLayout={getItemLayout}
            initialScrollIndex={Math.min(currentIndex, Math.max(0, list.length - 1))}
            onScrollToIndexFailed={() => {}}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            renderItem={({ item: p, index }) => (
              <View style={styles.pagerPage}>
                <ScrollView
                  style={styles.pagerScroll}
                  contentContainerStyle={[styles.fullCardContent, { paddingBottom: 80 }]}
                  showsVerticalScrollIndicator={true}
                >
                  {renderCardContent(p, index)}
                </ScrollView>
              </View>
            )}
          />
        </BottomSheetView>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: isDark ? 'rgba(10,10,14,0.92)' : 'rgba(248,248,252,0.94)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: isDark ? 0.5 : 0.1,
        shadowRadius: 20,
      }}
      handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)', width: 40 }}
    >
      <BottomSheetScrollView
        style={styles.sheetContainer}
        contentContainerStyle={[styles.fullCardContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={true}
      >
        {renderCardContent(currentPartner, currentIndex)}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContainer: { flex: 1, paddingHorizontal: 0 },
  pagerWrap: { flex: 1, width: SCREEN_WIDTH },
  pagerPage: { width: SCREEN_WIDTH, flex: 1 },
  pagerScroll: { flex: 1 },
  fullCardContent: { paddingHorizontal: CARD_PADDING, paddingTop: 8 },
  swipeNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 4, borderBottomWidth: 1 },
  swipeNavLabel: { fontSize: 12, fontWeight: '600' },
  swipeBtn: { padding: 8 },
  swipeBtnDisabled: { opacity: 0.4 },
  bookmarkBtn: { padding: 4 },
  heroStrip: {
    borderRadius: 16,
    paddingTop: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tierBar: { height: 4, width: '100%', marginBottom: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  heroLeft: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, minWidth: 0, gap: 4 },
  partnerNameWrap: { flex: 1, minWidth: 0, justifyContent: 'center', paddingVertical: 4 },
  heroIconsRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 6, marginLeft: 8 },
  partnerName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  meta: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  openProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexShrink: 0,
  },
  openProfileText: { fontSize: 13, fontWeight: '800', color: '#000' },
  reviewsPeek: { borderRadius: 14, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  reviewPeekRow: { padding: 12, borderBottomWidth: 1 },
  reviewPeekStars: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  reviewPeekText: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  reviewPeekAuthor: { fontSize: 11, fontWeight: '600' },
  seeAllReviewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  seeAllReviewsText: { fontSize: 14, fontWeight: '800' },
  seeAllReviewsCount: { fontSize: 13, fontWeight: '600' },
  missionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    gap: 12,
  },
  missionCtaTextWrap: { flex: 1 },
  missionCtaTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  missionCtaSub: { fontSize: 12, fontWeight: '500' },
  stampCta: {},
  redeemAtVenueCta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    gap: 12,
  },
  redeemAtVenueTextWrap: { flex: 1, minWidth: 0 },
  redeemAtVenueTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  redeemAtVenueSub: { fontSize: 12, fontWeight: '700' },
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
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  addressWrap: { flex: 1, flexShrink: 1 },
  address: { fontSize: 14 },
  distanceAway: { fontSize: 12, marginTop: 2, fontWeight: '600', opacity: 0.9 },
  hours: { fontSize: 14, flex: 1, flexShrink: 1 },
  termsHint: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  perkSheetList: { gap: 10, marginBottom: 12 },
  perkSheetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  perkSheetTierBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  perkSheetBody: { flex: 1, minWidth: 0, paddingVertical: 12, paddingLeft: 14, paddingRight: 8 },
  perkSheetTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  perkSheetDesc: { fontSize: 12, opacity: 0.9 },
  perkSheetMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  perkSheetRemaining: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  perkSheetPts: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  perkSheetPtsText: { fontSize: 12, fontWeight: '800' },
  perkSheetCooldown: { fontSize: 11, fontWeight: '600' },
  perkSheetChevron: { marginRight: 12 },
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
