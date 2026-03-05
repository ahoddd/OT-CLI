/**
 * Stamp Cards™ — Almost full-screen modal with horizontal carousel of stamp cards.
 * Single entry point from wallet and partner page: pass cards[] and initialIndex.
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import type { StampCardWithProgram } from '../hooks/useStampCards';
import type { StampActiveReward } from '../constants/StampCards';
import { buildStampQrPayload } from '../constants/StampCards';
import { StampCardCarouselCard } from './StampCardCarouselCard';
import type { PartnerTier } from '../constants/PartnerTiers';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';

export interface StampCardModalProps {
  visible: boolean;
  cards: StampCardWithProgram[];
  initialIndex: number;
  onClose: () => void;
  onRedeem?: (stateId: string) => void;
  /** Map partnerId -> logoUrl for filled stamp slots. Built by wallet/partner page. */
  partnerLogoMap?: Record<string, string | null | undefined>;
  /** Optional map partnerId -> tier for tier badge on card. */
  partnerTierMap?: Record<string, PartnerTier | undefined>;
}

export function StampCardModal({
  visible,
  cards,
  initialIndex,
  onClose,
  onRedeem,
  partnerLogoMap = {},
  partnerTierMap = {},
}: StampCardModalProps) {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const modalHeight = Math.round(winHeight * 0.92);
  const carouselHeight = Math.min(winHeight * 0.52, 420);
  const headerPaddingTop = Math.max(insets.top, SPACE.lg);
  const cardWidth = Math.min(winWidth - 24, 420);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, Math.min(initialIndex, cards.length - 1)));
  const [qrExpanded, setQrExpanded] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.trim().toLowerCase();
    return cards.filter(
      (c) =>
        c.program?.name?.toLowerCase().includes(q) ||
        c.program?.partnerId?.toLowerCase().includes(q)
    );
  }, [cards, searchQuery]);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setQrExpanded(false);
      return;
    }
    if (cards.length === 0) return;
    const idx = Math.max(0, Math.min(initialIndex, cards.length - 1));
    setCurrentIndex(idx);
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: idx, animated: false });
    }, 50);
  }, [visible, initialIndex, cards.length]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setCurrentIndex(0);
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: false }), 0);
    }
  }, [searchQuery]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / cardWidth);
      const len = filteredCards.length;
      const clamped = Math.max(0, Math.min(i, len - 1));
      if (clamped !== indexRef.current) setCurrentIndex(clamped);
    },
    [filteredCards.length, cardWidth]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: cardWidth,
      offset: cardWidth * index,
      index,
    }),
    [cardWidth]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: StampCardWithProgram; index: number }) => {
      const partnerId = item.program?.partnerId ?? '';
      const logoUrl = partnerLogoMap[partnerId] ?? null;
      const tier = partnerTierMap[partnerId];
      return (
        <View style={{ width: cardWidth, paddingHorizontal: SPACE.base }}>
          <StampCardCarouselCard card={item} partnerLogoUrl={logoUrl} partnerTier={tier} />
        </View>
      );
    },
    [partnerLogoMap, partnerTierMap, cardWidth]
  );

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredCards.length - 1));
  const currentCard = filteredCards[safeIndex];
  const reward = currentCard?.state?.activeReward as StampActiveReward | null;
  const hasEarnedReward = reward?.status === 'EARNED';
  const currentTier = currentCard?.program?.partnerId ? partnerTierMap[currentCard.program.partnerId] : undefined;
  const redeemTierColor = currentTier ? PARTNER_TIER_COLORS[currentTier] : colors.primary;

  const showSearch = cards.length > 3;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: headerPaddingTop, paddingBottom: insets.bottom }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {cards.length === 0 ? 'Stamp Cards' : currentCard?.program?.name ?? 'Stamp Cards'}
          </Text>
          <View style={styles.closeBtn} />
        </View>

        {showSearch && cards.length > 0 && (
          <View style={[styles.searchWrap, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              placeholder="Search by program or partner..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              accessibilityLabel="Search stamp cards"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {cards.length === 0 ? (
          <View style={[styles.emptyWrap, { minHeight: modalHeight - 120 }]}>
            <Ionicons name="card-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No stamp cards</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Your stamp cards will appear here.</Text>
            <TouchableOpacity style={[styles.emptyClose, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={styles.emptyCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : filteredCards.length === 0 ? (
          <View style={[styles.emptyWrap, { minHeight: modalHeight - 200 }]}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No matching cards</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try a different search term.</Text>
            <TouchableOpacity style={[styles.emptyClose, { backgroundColor: colors.primary }]} onPress={() => setSearchQuery('')}>
              <Text style={styles.emptyCloseText}>Clear search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {filteredCards.length > 1 && (
              <View style={styles.swipeHint}>
                <Ionicons name="chevron-back" size={14} color={colors.textSecondary} />
                <Text style={[styles.swipeHintText, { color: colors.textSecondary }]}>
                  Swipe to browse {filteredCards.length} cards
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
              </View>
            )}
            <FlatList
              ref={flatListRef}
              data={filteredCards}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={onScroll}
              onMomentumScrollEnd={onScroll}
              scrollEventThrottle={16}
              getItemLayout={getItemLayout}
              keyExtractor={(item) => item.state.id}
              renderItem={renderItem}
              windowSize={3}
              maxToRenderPerBatch={2}
              accessibilityLabel="Stamp cards carousel"
              style={{ height: carouselHeight }}
            />
            <ScrollView
              contentContainerStyle={styles.belowCarousel}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCards.length > 1 && (
                <View style={styles.dots}>
                  {filteredCards.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: i === safeIndex ? colors.primary : colors.border,
                          width: i === safeIndex ? 10 : 6,
                          borderRadius: i === safeIndex ? 5 : 3,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* QR block — collapsible so stamp cards get more space */}
              {currentCard?.program?.partnerId && currentCard?.program?.id && (
                <View style={[styles.qrBlock, { borderColor: colors.border, backgroundColor: colors.surface, borderWidth: 1.5 }]}>
                  <TouchableOpacity
                    style={styles.qrHeaderRow}
                    onPress={() => setQrExpanded((e) => !e)}
                    activeOpacity={0.8}
                    accessibilityLabel={qrExpanded ? 'Hide QR code' : 'Show QR code'}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.qrTitle, { color: colors.text }]}>Scan to add stamp</Text>
                    <Ionicons name={qrExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {qrExpanded && (
                    <>
                      <Text style={[styles.qrSub, { color: colors.textSecondary }]}>Staff or customer scans to add a stamp</Text>
                      <View style={[styles.qrWrap, { backgroundColor: '#fff' }]}>
                        <QRCode
                          value={buildStampQrPayload(currentCard.program.partnerId, currentCard.program.id)}
                          size={100}
                          backgroundColor="#fff"
                          color="#0a0a0d"
                        />
                      </View>
                    </>
                  )}
                </View>
              )}

              {hasEarnedReward && currentCard && (
                <TouchableOpacity
                  style={[
                    styles.redeemCta,
                    {
                      backgroundColor: redeemTierColor,
                      ...(Platform.OS !== 'web' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 } : {}),
                    },
                  ]}
                  onPress={() => onRedeem?.(currentCard.state.id)}
                  accessibilityLabel="Redeem reward"
                  accessibilityRole="button"
                >
                  <Ionicons name="gift" size={22} color="#fff" />
                  <Text style={styles.redeemCtaText}>Redeem now</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.lg,
    borderBottomWidth: 1,
    minHeight: 56,
    gap: SPACE.md,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: SPACE.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACE.base,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  searchClear: {
    marginLeft: SPACE.sm,
    padding: SPACE.xs,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: SPACE.lg,
  },
  emptySub: {
    fontSize: 14,
    marginTop: SPACE.xs,
  },
  emptyClose: {
    marginTop: SPACE.xl,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.base,
    borderRadius: RADIUS.md,
  },
  emptyCloseText: {
    color: '#fff',
    fontWeight: '600',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.base,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  belowCarousel: { paddingBottom: SPACE.xl },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACE.base,
  },
  dot: {
    height: 6,
  },
  qrBlock: {
    marginHorizontal: SPACE.lg,
    marginTop: SPACE.base,
    padding: SPACE.base,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: SPACE.xs,
  },
  qrTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  qrSub: {
    fontSize: 12,
    marginBottom: SPACE.sm,
    marginTop: 4,
  },
  qrWrap: {
    padding: 12,
    borderRadius: RADIUS.sm,
  },
  redeemCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: SPACE.lg,
    marginTop: SPACE.base,
    marginBottom: SPACE.xl,
    paddingVertical: SPACE.base,
    borderRadius: RADIUS.md,
  },
  redeemCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
