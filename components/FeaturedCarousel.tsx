/**
 * Orb hub featured section: up to 4 partners (config or demo).
 * Horizontal FlatList so swipe works reliably; 2s auto-advance.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { FeaturedPartnerCard } from './FeaturedPartnerCard';
import { useTheme } from '../hooks/useTheme';
import type { FeaturedSlide } from '../hooks/useFeaturedPartners';

const AUTO_ADVANCE_MS = 5000;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 120;

interface FeaturedCarouselProps {
  slides: FeaturedSlide[];
}

export function FeaturedCarousel({ slides }: FeaturedCarouselProps) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScrollingRef = useRef(false);

  indexRef.current = index;

  const advance = useCallback(() => {
    if (slides.length <= 1) return;
    const next = (indexRef.current + 1) % slides.length;
    setIndex(next);
    isScrollingRef.current = true;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
  }, [slides.length]);

  const restartTimer = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (slides.length <= 1) return;
    autoTimerRef.current = setInterval(() => advance(), AUTO_ADVANCE_MS);
  }, [slides.length, advance]);

  useEffect(() => {
    if (slides.length <= 1) return;
    restartTimer();
    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [slides.length, restartTimer]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / CARD_WIDTH);
      const clamped = Math.max(0, Math.min(i, slides.length - 1));
      if (clamped !== indexRef.current) setIndex(clamped);
    },
    [slides.length]
  );

  const onMomentumScrollEnd = useCallback(() => {
    isScrollingRef.current = false;
    restartTimer();
  }, [restartTimer]);

  const onScrollBeginDrag = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, i: number) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * i, index: i }),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: FeaturedSlide }) => (
      <View style={[styles.slide, { width: CARD_WIDTH }]}>
        <FeaturedPartnerCard
          partner={item.partner}
          customImageUrl={item.customImageUrl}
          badgeLabel={item.badgeLabel}
        />
      </View>
    ),
    []
  );

  if (slides.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          keyExtractor={(item) => item.partner.id + (item.isWildcard ? '-w' : '')}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH}
          snapToAlignment="start"
          contentContainerStyle={styles.listContent}
          onScroll={onScroll}
          scrollEventThrottle={32}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollBeginDrag={onScrollBeginDrag}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 100);
          }}
        />
      </View>
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === index ? colors.primary : colors.border }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  track: { overflow: 'hidden', borderRadius: 18 },
  listContent: { paddingRight: 0 },
  slide: { height: CARD_HEIGHT, justifyContent: 'center' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
