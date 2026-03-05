/**
 * Sponsored Ad Carousel — premium spot below featured partners.
 * Image or video (≤1 min), configurable auto-advance, up to 3 CTAs per ad.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import type { SponsoredAdDoc } from '../constants/sponsoredAds';
import { DEFAULT_SPONSORED_ADS_CONFIG } from '../constants/sponsoredAds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 140;
const CTA_MAX = 3;

interface SponsoredAdCarouselProps {
  ads: SponsoredAdDoc[];
  /** Seconds between slides (from config); default 60 */
  transitionSeconds?: number;
}

export function SponsoredAdCarousel({ ads, transitionSeconds }: SponsoredAdCarouselProps) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScrollingRef = useRef(false);

  const intervalMs = (transitionSeconds ?? DEFAULT_SPONSORED_ADS_CONFIG.carouselTransitionSeconds) * 1000;
  indexRef.current = index;

  const advance = useCallback(() => {
    if (ads.length <= 1) return;
    const next = (indexRef.current + 1) % ads.length;
    setIndex(next);
    isScrollingRef.current = true;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
  }, [ads.length]);

  const restartTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (ads.length <= 1) return;
    timerRef.current = setInterval(advance, intervalMs);
  }, [ads.length, intervalMs, advance]);

  useEffect(() => {
    if (ads.length <= 1) return;
    restartTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ads.length, restartTimer]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / CARD_WIDTH);
      const clamped = Math.max(0, Math.min(i, ads.length - 1));
      if (clamped !== indexRef.current) setIndex(clamped);
    },
    [ads.length]
  );

  const onMomentumScrollEnd = useCallback(() => {
    isScrollingRef.current = false;
    restartTimer();
  }, [restartTimer]);

  const onScrollBeginDrag = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, i: number) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * i, index: i }),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: SponsoredAdDoc }) => (
      <View style={[styles.slide, { width: CARD_WIDTH }]}>
        <View style={[styles.mediaWrap, { backgroundColor: colors.surfaceHighlight }]}>
          {item.type === 'image' ? (
            <Image source={{ uri: item.mediaUrl }} style={styles.media} resizeMode="cover" />
          ) : (
            <Video
              source={{ uri: item.mediaUrl }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isLooping={false}
              isMuted
              useNativeControls
            />
          )}
        </View>
        {item.ctas && item.ctas.length > 0 && (
          <View style={styles.ctaRow}>
            {item.ctas.slice(0, CTA_MAX).map((cta, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.ctaBtn, { backgroundColor: COLORS.neonBlue[0] + '22', borderColor: COLORS.neonBlue[0] }]}
                onPress={() => cta.url && Linking.openURL(cta.url)}
                activeOpacity={0.8}
              >
                <Text style={[styles.ctaLabel, { color: COLORS.neonBlue[0] }]} numberOfLines={1}>{cta.label || 'Learn more'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    ),
    [colors.surfaceHighlight]
  );

  if (ads.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { width: CARD_WIDTH, minHeight: CARD_HEIGHT }]}>
        <FlatList
          ref={flatListRef}
          data={ads}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
      {ads.length > 1 && (
        <View style={styles.dots}>
          {ads.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === index ? COLORS.neonBlue[0] : colors.border }]}
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
  slide: { minHeight: CARD_HEIGHT, justifyContent: 'flex-start' },
  mediaWrap: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  ctaBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  ctaLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
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
