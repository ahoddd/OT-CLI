/**
 * MapNearbyTray — left-edge drawer: collapsed handle, expand to show nearby partners.
 * Tap handle or drag right to open; tap outside or drag left to close.
 * Keeps map controls and map area uncluttered.
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics } from '../utils/safeHaptics';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { COLORS } from '../constants/Colors';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import type { Partner } from '../constants/MockData';
import type { PartnerTier } from '../constants/PartnerTiers';
import { useUserLocation } from '../context/UserLocationContext';
import { distanceToPartner, formatDistanceMi } from '../utils/location';
import { MAP_TRAY_COLLAPSED_WIDTH, MAP_TRAY_EXPANDED_MAX_WIDTH, MAP_TRAY_STRIP_HEIGHT } from '../constants/MapConstants';

const TAB_BAR_SAFE = 56;

interface MapNearbyTrayProps {
  partners: Partner[];
  selectedId: string | null;
  onSelectPartner: (p: Partner) => void;
}

interface TrayChipProps {
  partner: Partner;
  distanceLabel: string | undefined;
  selected: boolean;
  onPress: () => void;
}

function TrayChip({ partner, distanceLabel, selected, onPress }: TrayChipProps) {
  const { colors, isDark } = useTheme();
  const tierColor = PARTNER_TIER_COLORS[partner.tier as PartnerTier] ?? '#94a3b8';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? COLORS.neonBlue[0] + '28'
            : isDark
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(255,255,255,0.9)',
          borderColor: selected
            ? COLORS.neonBlue[0]
            : isDark
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(0,0,0,0.1)',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${partner.name}, ${distanceLabel ?? 'nearby'}`}
    >
      <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
      <View style={styles.chipText}>
        <Text
          style={[styles.chipName, { color: selected ? COLORS.neonBlue[0] : colors.text }]}
          numberOfLines={1}
        >
          {partner.name}
        </Text>
        {distanceLabel && (
          <Text style={[styles.chipDist, { color: colors.textSecondary }]}>{distanceLabel}</Text>
        )}
      </View>
      {selected && (
        <Ionicons name="chevron-up" size={12} color={COLORS.neonBlue[0]} style={styles.chevron} />
      )}
    </TouchableOpacity>
  );
}

export function MapNearbyTray({ partners, selectedId, onSelectPartner }: MapNearbyTrayProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { userLocation } = useUserLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerWidth = useSharedValue(MAP_TRAY_COLLAPSED_WIDTH);
  const expandedWidth = Math.min(Math.floor(screenWidth * 0.65), MAP_TRAY_EXPANDED_MAX_WIDTH);

  const trayBottom = TAB_BAR_SAFE + Math.max(insets.bottom, 0);
  const topInset = insets.top + 8;
  const availableHeight = screenHeight - topInset - trayBottom;
  const trayTop = topInset + Math.max(0, (availableHeight - MAP_TRAY_STRIP_HEIGHT) / 2);

  const sortedPartners = useMemo(() => {
    if (!userLocation) return partners.slice(0, 10);
    return [...partners]
      .sort((a, b) => {
        const dA = distanceToPartner(userLocation.latitude, userLocation.longitude, a) ?? 99999;
        const dB = distanceToPartner(userLocation.latitude, userLocation.longitude, b) ?? 99999;
        return dA - dB;
      })
      .slice(0, 10);
  }, [partners, userLocation]);

  const getDistance = (p: Partner): string | undefined => {
    if (!userLocation) return undefined;
    const mi = distanceToPartner(userLocation.latitude, userLocation.longitude, p);
    return mi !== null ? formatDistanceMi(mi) : undefined;
  };

  const openDrawer = useCallback(() => {
    safeHaptics.selectionAsync();
    setDrawerOpen(true);
    drawerWidth.value = withTiming(expandedWidth, { duration: 220 });
  }, [expandedWidth, drawerWidth]);

  const closeDrawer = useCallback(() => {
    safeHaptics.selectionAsync();
    setDrawerOpen(false);
    drawerWidth.value = withTiming(MAP_TRAY_COLLAPSED_WIDTH, { duration: 200 });
  }, [drawerWidth]);

  const toggleDrawer = useCallback(() => {
    if (drawerOpen) closeDrawer();
    else openDrawer();
  }, [drawerOpen, openDrawer, closeDrawer]);

  const gestureStartWidth = useRef(MAP_TRAY_COLLAPSED_WIDTH);
  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureStartWidth.current = drawerWidth.value;
    })
    .onUpdate((e) => {
      const next = gestureStartWidth.current + e.translationX;
      drawerWidth.value = Math.max(MAP_TRAY_COLLAPSED_WIDTH, Math.min(expandedWidth, next));
    })
    .onEnd((e) => {
      const threshold = (MAP_TRAY_COLLAPSED_WIDTH + expandedWidth) / 2;
      const velocity = e.velocityX;
      const shouldOpen = velocity > 80 || (velocity >= -80 && drawerWidth.value > threshold);
      if (shouldOpen) {
        drawerWidth.value = withTiming(expandedWidth, { duration: 180 });
        runOnJS(setDrawerOpen)(true);
      } else {
        drawerWidth.value = withTiming(MAP_TRAY_COLLAPSED_WIDTH, { duration: 180 });
        runOnJS(setDrawerOpen)(false);
      }
    });

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    width: drawerWidth.value,
  }));

  if (sortedPartners.length === 0) return null;

  const trayContent = (
    <View style={styles.inner}>
      <FlatList
        data={sortedPartners}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TrayChip
            partner={item}
            distanceLabel={getDistance(item)}
            selected={selectedId === item.id}
            onPress={() => {
              safeHaptics.selectionAsync();
              onSelectPartner(item);
            }}
          />
        )}
      />
    </View>
  );

  const blurBg = (
    <>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={isDark ? 60 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
          {drawerOpen ? trayContent : null}
        </BlurView>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)' },
          ]}
        >
          {drawerOpen ? trayContent : null}
        </View>
      )}
    </>
  );

  return (
    <>
      {drawerOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeDrawer}
          accessibilityLabel="Close partners drawer"
        />
      )}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.container,
            animatedDrawerStyle,
            {
              top: trayTop,
              height: MAP_TRAY_STRIP_HEIGHT,
              borderRightColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.handle}
            onPress={toggleDrawer}
            activeOpacity={0.9}
            accessibilityLabel={drawerOpen ? 'Close partners' : 'Open nearby partners'}
          >
            <View style={[styles.handleInner, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.textSecondary}
                style={drawerOpen ? styles.handleIconOpen : styles.handleIcon}
              />
              {!drawerOpen && (
                <Text style={[styles.handleLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  Partners
                </Text>
              )}
            </View>
          </TouchableOpacity>
          {blurBg}
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    borderRightWidth: 1,
    overflow: 'hidden',
    borderRadius: 0,
  },
  handle: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MAP_TRAY_COLLAPSED_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  handleInner: {
    width: 36,
    minHeight: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACE.xs,
  },
  handleIcon: {
    transform: [{ rotate: '0deg' }],
  },
  handleIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  handleLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: MAP_TRAY_COLLAPSED_WIDTH,
    paddingRight: SPACE.sm,
    paddingVertical: 6,
  },
  listContent: {
    paddingVertical: 0,
    gap: SPACE.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    maxWidth: 140,
    minHeight: 36,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  chipText: {
    flex: 1,
    minWidth: 0,
  },
  chipName: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  chipDist: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
  },
  chevron: {
    flexShrink: 0,
  },
});

export default MapNearbyTray;
