import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, Platform, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import Mapbox from '@rnmapbox/maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Partner } from '../constants/MockData';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import type { PartnerTier } from '../constants/PartnerTiers';
import { GOLD_GRADIENT, PLATINUM_GRADIENT } from '../constants/PartnerTiers';
import { ORB_TIER_IMAGES } from '../constants/MapOrbAssets';
import { getMapPartnersFromList, getDemoPartners } from '../constants/demoOrbs';
import { usePartners } from '../context/PartnersContext';
import { useDemoDataEnabled } from '../hooks/useDemoDataEnabled';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useFlags } from '../components/FlagContext';
import { useReduceMotion } from '../hooks/useReduceMotion';
import * as Location from 'expo-location';
import { POCONOS_DEFAULT_CENTER, POCONOS_DEFAULT_ZOOM, MAP_CAMERA_STORAGE_KEY, MAP_TRAY_HEIGHT } from '../constants/MapConstants';
import { useUserLocation } from '../context/UserLocationContext';

const TAB_BAR_SAFE = 56;
const MAX_PULSE_PREMIUM_ORBS = 6;
const ORB_PIN_SIZE = 40;

/** Mapbox token from env or app config extra (so EAS/build and .env both work). */
function getMapboxToken(): string {
  const fromEnv = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_MAPBOX_TOKEN?.trim?.();
  if (fromEnv) return fromEnv;
  const fromExtra = Constants.expoConfig?.extra?.mapboxAccessToken;
  return (typeof fromExtra === 'string' && fromExtra.trim()) ? fromExtra.trim() : '';
}

const MAPBOX_TOKEN = getMapboxToken();
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

function OrbMarker({
  tier,
  selected,
  isPremium,
  isLegendary,
  isApex,
  tierColor,
  isMission,
  pulseEnabled,
  isHotSpot,
}: {
  tier: PartnerTier | string;
  selected: boolean;
  isPremium: boolean;
  isLegendary: boolean;
  isApex: boolean;
  tierColor: string;
  pulseEnabled?: boolean;
  isMission?: boolean;
  isHotSpot?: boolean;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const size = ORB_PIN_SIZE;
  const half = size / 2;
  const glowColor = isLegendary ? GOLD_GRADIENT.outer : isApex ? PLATINUM_GRADIENT.outer : null;
  const orbSource = ORB_TIER_IMAGES[tier as PartnerTier] ?? ORB_TIER_IMAGES.silver;

  const orbScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.35);
  const hotPulseScale = useSharedValue(1);
  const hotPulseOpacity = useSharedValue(0.7);

  useEffect(() => {
    if (reduceMotion) return;
    const breathDuration = 2200;
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: breathDuration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: breathDuration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [reduceMotion]);

  useEffect(() => {
    if (!pulseEnabled || reduceMotion || !glowColor) return;
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.45, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.12, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [pulseEnabled, reduceMotion, glowColor]);

  useEffect(() => {
    if (!isHotSpot || reduceMotion) return;
    hotPulseScale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );
    hotPulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(0.65, { duration: 900 })
      ),
      -1,
      true
    );
  }, [isHotSpot, reduceMotion]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));
  const hotPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hotPulseScale.value }],
    opacity: hotPulseOpacity.value,
  }));

  return (
    <View style={styles.orbMarkerWrap}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {pulseEnabled && !reduceMotion && glowColor && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: size,
                height: size,
                borderRadius: half,
                borderColor: glowColor,
                backgroundColor: 'transparent',
              },
              pulseStyle,
            ]}
          />
        )}
        {isHotSpot && !reduceMotion && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: size + 12,
                height: size + 12,
                borderRadius: (size + 12) / 2,
                borderColor: '#FFB347',
                borderWidth: 2.5,
                backgroundColor: 'transparent',
              },
              hotPulseStyle,
            ]}
          />
        )}
        {isHotSpot && (
          <View
            style={[
              styles.pulseRing,
              {
                width: size + 6,
                height: size + 6,
                borderRadius: (size + 6) / 2,
                borderColor: '#FFB347',
                borderWidth: 2,
                backgroundColor: 'transparent',
                opacity: 0.7,
              },
            ]}
          />
        )}
        <Animated.View
          style={[
            styles.orbPin,
            {
              width: size,
              height: size,
              borderRadius: half,
              overflow: 'hidden',
              borderWidth: selected ? 2.5 : isMission ? 2 : 0,
              borderColor: selected ? '#fff' : isMission ? '#fbbf24' : 'transparent',
              shadowColor: glowColor ?? tierColor,
              shadowOpacity: isPremium || isMission ? 0.5 : 0.35,
              shadowRadius: isPremium || isMission ? 8 : 6,
              transform: [{ scale: selected ? 1.3 : 1 }],
            },
            !reduceMotion && !selected && breathStyle,
          ]}
        >
          <Image
            source={orbSource}
            style={{ width: size, height: size }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

interface OrbTapMapProps {
  onSelectPartner: (p: Partner) => void;
  selectedId: string | null;
  /** Partner IDs that are part of today's missions — shown with mission highlight (e.g. flag style). */
  missionPartnerIds?: string[];
  /** Partner IDs currently running a Hot Spot (2× OT, pulsing gold ring). */
  hotSpotPartnerIds?: string[];
}

export const OrbTapMap: React.FC<OrbTapMapProps> = ({ onSelectPartner, selectedId, missionPartnerIds = [], hotSpotPartnerIds = [] }) => {
  const { isDark, colors } = useTheme();
  const { flags } = useFlags();
  const insets = useSafeAreaInsets();
  const { partners } = usePartners();
  const { demoDataEnabled } = useDemoDataEnabled();
  const mapPartners = React.useMemo(() => {
    const list = getMapPartnersFromList(partners, demoDataEnabled);
    const withLocation = list.filter((p) => p?.location);
    if (withLocation.length > 0) return list;
    return [...list, ...getDemoPartners(partners)];
  }, [partners, demoDataEnabled]);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const bottomOffset = Math.max(insets.bottom, 8) + TAB_BAR_SAFE + MAP_TRAY_HEIGHT;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webPlaceholder, { backgroundColor: colors.background }]}>
        <Text style={[styles.webPlaceholderTitle, { color: colors.text }]}>OrbTap Map</Text>
        <Text style={[styles.webPlaceholderSub, { color: colors.textSecondary }]}>
          The interactive map is available in the OrbTap mobile app. Download for iOS or Android to discover partners and earn points.
        </Text>
        <TouchableOpacity
          style={[styles.webPlaceholderBtn, { backgroundColor: colors.surface }]}
          onPress={() => typeof window !== 'undefined' && window.open('https://apps.apple.com/app/orbtap', '_blank')}
        >
          <Text style={[styles.webPlaceholderBtnText, { color: colors.text }]}>Get the app</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No token or Mapbox unavailable: throw so MapErrorBoundary can show react-native-maps fallback
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured');
  }

  const [initialCenter, setInitialCenter] = useState<[number, number]>(POCONOS_DEFAULT_CENTER);
  const [initialZoom, setInitialZoom] = useState(POCONOS_DEFAULT_ZOOM);
  const [lastZoom, setLastZoom] = useState(POCONOS_DEFAULT_ZOOM);
  const [locateMessage, setLocateMessage] = useState<string | null>(null);
  const { refreshLocation } = useUserLocation();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MAP_CAMERA_STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw) as { center?: [number, number]; zoom?: number };
          if (Array.isArray(data.center) && data.center.length >= 2 && typeof data.zoom === 'number') {
            setInitialCenter([data.center[0], data.center[1]]);
            setInitialZoom(data.zoom);
            setLastZoom(data.zoom);
          }
        }
      } catch {
        // use Poconos default
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch (e) {
        if (__DEV__) console.warn('Location permission error:', e);
      }
    })();
  }, []);

  const persistCamera = useCallback((center: GeoJSON.Position, zoom: number) => {
    AsyncStorage.setItem(
      MAP_CAMERA_STORAGE_KEY,
      JSON.stringify({ center, zoom, timestamp: Date.now() })
    ).catch(() => {});
  }, []);

  const handleMapIdle = useCallback(
    (arg: unknown) => {
      const state = (arg as { payload?: Mapbox.MapState })?.payload ?? (arg as Mapbox.MapState);
      const props = state?.properties;
      if (props?.center && typeof props?.zoom === 'number') {
        setLastZoom(props.zoom);
        persistCamera(props.center, props.zoom);
      }
    },
    [persistCamera]
  );

  const handleZoomIn = useCallback(() => {
    const next = Math.min(19, lastZoom + 1);
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 300, animationMode: 'easeTo' });
    setLastZoom(next);
  }, [lastZoom]);

  const handleZoomOut = useCallback(() => {
    const next = Math.max(10, lastZoom - 1);
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 300, animationMode: 'easeTo' });
    setLastZoom(next);
  }, [lastZoom]);

  const handleLocateMe = useCallback(async () => {
    setLocateMessage(null);
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          const isDenied = perm.status === 'denied';
          setLocateMessage(isDenied ? 'Open Settings to enable location' : 'Location permission required');
          setTimeout(() => setLocateMessage(null), 4000);
          if (isDenied) {
            try { await Linking.openSettings(); } catch { /* ignore */ }
          }
          return;
        }
      }
      const getPos = () => Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let loc: Location.LocationObject;
      try {
        loc = await getPos();
      } catch {
        await new Promise((r) => setTimeout(r, 800));
        try {
          loc = await getPos();
        } catch {
          setLocateMessage('Location unavailable');
          setTimeout(() => setLocateMessage(null), 3000);
          return;
        }
      }
      const { latitude, longitude } = loc.coords;
      refreshLocation();
      cameraRef.current?.flyTo([longitude, latitude], 800);
      cameraRef.current?.setCamera({ zoomLevel: 15, animationDuration: 800, animationMode: 'easeTo' });
    } catch {
      setLocateMessage('Location unavailable');
      setTimeout(() => setLocateMessage(null), 3000);
    }
  }, [refreshLocation]);

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL?.trim() || (isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light)}
        logoEnabled={true}
        attributionEnabled={false}
        scaleBarEnabled={false}
        pitchEnabled={true}
        rotateEnabled={true}
        onMapIdle={handleMapIdle}
      >
        <Mapbox.Atmosphere
          style={{
            starIntensity: isDark ? 0.2 : 0,
            color: isDark ? '#0a0a1a' : 'transparent',
            spaceColor: isDark ? '#0a0a1a' : '#f2f2f7',
          }}
        />
        <Mapbox.Camera
          ref={cameraRef}
          centerCoordinate={initialCenter}
          zoomLevel={initialZoom}
          pitch={50}
          heading={0}
          animationMode="flyTo"
          animationDuration={1200}
          followUserLocation={false}
          minZoomLevel={10}
          maxZoomLevel={19}
        />
        <Mapbox.LocationPuck
          visible={true}
          androidRenderMode="gps"
          puckBearingEnabled={true}
          puckBearing="heading"
          pulsing={{ isEnabled: true, color: '#3b82f6', radius: 30 }}
        />

        {(() => {
          const premiumIds = new Set(
            mapPartners
              .filter((p) => p.tier === 'gold' || p.tier === 'platinum')
              .slice(0, MAX_PULSE_PREMIUM_ORBS)
              .map((p) => p.id)
          );
          return mapPartners.map((partner) => {
            if (!partner?.location) return null;
            const tier = partner.tier;
            const tierColor = PARTNER_TIER_COLORS[tier as PartnerTier] || '#999';
            const selected = selectedId === partner.id;
            const isMission = missionPartnerIds.includes(partner.id);
            const isHotSpot = hotSpotPartnerIds.includes(partner.id);
            const isPremium = tier === 'gold' || tier === 'platinum';
            const isLegendary = tier === 'gold';
            const isApex = tier === 'platinum';
            const pulseEnabled = isPremium && premiumIds.has(partner.id);
            return (
              <Mapbox.PointAnnotation
                key={partner.id}
                id={partner.id}
                coordinate={[partner.location.lng, partner.location.lat]}
                onSelected={() => onSelectPartner(partner)}
              >
                <OrbMarker
                  tier={tier}
                  selected={selected}
                  isPremium={isPremium}
                  isLegendary={isLegendary}
                  isApex={isApex}
                  tierColor={tierColor}
                  pulseEnabled={pulseEnabled}
                  isMission={isMission}
                  isHotSpot={isHotSpot}
                />
              </Mapbox.PointAnnotation>
            );
          });
        })()}
      </Mapbox.MapView>

      {flags.isMapControlsEnabled && (
        <View style={[styles.controls, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)', bottom: bottomOffset, right: 12 }]}>
          <TouchableOpacity style={styles.controlBtn} onPress={handleZoomIn} accessibilityLabel="Zoom in">
            <Ionicons name="add" size={20} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={handleZoomOut} accessibilityLabel="Zoom out">
            <Ionicons name="remove" size={20} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={handleLocateMe} accessibilityLabel="Locate me">
            <Ionicons name="locate" size={18} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      )}

      {locateMessage && (
        <View style={[styles.toast, { bottom: bottomOffset + 56, backgroundColor: isDark ? '#333' : '#eee' }]}>
          <Text style={[styles.toastText, { color: isDark ? '#fff' : '#000' }]}>{locateMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  orbMarkerWrap: { alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  orbPin: {
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  controls: {
    position: 'absolute',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  controlBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  toastText: { fontSize: 14, fontWeight: '600' },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webPlaceholderTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  webPlaceholderSub: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 360, marginBottom: 24 },
  webPlaceholderBtn: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  webPlaceholderBtnText: { fontSize: 16, fontWeight: '700' },
});

export default OrbTapMap;
