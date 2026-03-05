/**
 * Fallback map when Mapbox fails to load or is unavailable.
 * Uses react-native-maps (Apple Maps / Google Maps) with the same features:
 * partner markers, zoom/locate controls, camera persistence, mission orbs.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, Platform, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Partner } from '../constants/MockData';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import type { PartnerTier } from '../constants/PartnerTiers';
import { ORB_TIER_IMAGES } from '../constants/MapOrbAssets';
import { getMapPartnersFromList } from '../constants/demoOrbs';
import { usePartners } from '../context/PartnersContext';
import { useDemoDataEnabled } from '../hooks/useDemoDataEnabled';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useFlags } from '../components/FlagContext';
import * as Location from 'expo-location';
import { POCONOS_DEFAULT_CENTER, POCONOS_DEFAULT_ZOOM, MAP_CAMERA_STORAGE_KEY, MAP_TRAY_HEIGHT } from '../constants/MapConstants';
import { useUserLocation } from '../context/UserLocationContext';
import { useReduceMotion } from '../hooks/useReduceMotion';

const TAB_BAR_SAFE = 56;

/** [lng, lat] -> { latitude, longitude } */
function toLatLng(center: [number, number]) {
  return { latitude: center[1], longitude: center[0] };
}

const ORB_PIN_SIZE = 40;

function FallbackOrbMarker({
  tier,
  selected,
  isMission,
  tierColor,
}: {
  tier: PartnerTier | string;
  selected: boolean;
  isMission: boolean;
  tierColor: string;
}) {
  const reduceMotion = useReduceMotion();
  const size = ORB_PIN_SIZE;
  const orbSource = ORB_TIER_IMAGES[tier as PartnerTier] ?? ORB_TIER_IMAGES.silver;
  const breathScale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [reduceMotion]);
  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));
  return (
    <Animated.View
      style={[
        styles.fallbackPin,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          borderWidth: selected ? 2.5 : isMission ? 2 : 0,
          borderColor: selected ? '#fff' : isMission ? '#fbbf24' : 'transparent',
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
  );
}

interface OrbTapMapFallbackProps {
  onSelectPartner: (p: Partner) => void;
  selectedId: string | null;
  missionPartnerIds?: string[];
}

export function OrbTapMapFallback({ onSelectPartner, selectedId, missionPartnerIds = [] }: OrbTapMapFallbackProps) {
  const { colors, isDark } = useTheme();
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
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef({
    ...toLatLng(POCONOS_DEFAULT_CENTER),
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const bottomOffset = Math.max(insets.bottom, 8) + TAB_BAR_SAFE + MAP_TRAY_HEIGHT;

  const [locateMessage, setLocateMessage] = useState<string | null>(null);
  const [initialRegion, setInitialRegion] = useState(regionRef.current);
  const { refreshLocation } = useUserLocation();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MAP_CAMERA_STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw) as { center?: [number, number]; zoom?: number };
          if (Array.isArray(data.center) && data.center.length >= 2 && typeof data.zoom === 'number') {
            const lat = data.center[1];
            const lng = data.center[0];
            const delta = Math.pow(2, -data.zoom) * 0.5;
            const r = {
              latitude: lat,
              longitude: lng,
              latitudeDelta: delta,
              longitudeDelta: delta,
            };
            regionRef.current = r;
            setInitialRegion(r);
          }
        }
      } catch {
        // use defaults
      }
    })();
  }, []);

  const persistCamera = useCallback((center: [number, number], zoom: number) => {
    AsyncStorage.setItem(
      MAP_CAMERA_STORAGE_KEY,
      JSON.stringify({ center, zoom, timestamp: Date.now() })
    ).catch(() => {});
  }, []);

  const handleRegionChangeComplete = useCallback(
    (r: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => {
      regionRef.current = r;
      const center: [number, number] = [r.longitude, r.latitude];
      const zoom = Math.round(Math.log2(0.5 / Math.max(r.latitudeDelta, r.longitudeDelta)));
      persistCamera(center, zoom);
    },
    [persistCamera]
  );

  const handleZoomIn = useCallback(() => {
    const prev = regionRef.current;
    const factor = 0.5;
    const next = {
      ...prev,
      latitudeDelta: Math.max(0.001, prev.latitudeDelta * factor),
      longitudeDelta: Math.max(0.001, prev.longitudeDelta * factor),
    };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 300);
  }, []);

  const handleZoomOut = useCallback(() => {
    const prev = regionRef.current;
    const factor = 2;
    const maxDelta = 0.5;
    const next = {
      ...prev,
      latitudeDelta: Math.min(maxDelta, prev.latitudeDelta * factor),
      longitudeDelta: Math.min(maxDelta, prev.longitudeDelta * factor),
    };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 300);
  }, []);

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
      const getPos = () => Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch {
      setLocateMessage('Location unavailable');
      setTimeout(() => setLocateMessage(null), 3000);
    }
  }, [refreshLocation]);

  const defaultRegion = {
    ...toLatLng(POCONOS_DEFAULT_CENTER),
    latitudeDelta: Math.pow(2, -POCONOS_DEFAULT_ZOOM) * 0.5,
    longitudeDelta: Math.pow(2, -POCONOS_DEFAULT_ZOOM) * 0.5,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion.latitudeDelta ? initialRegion : defaultRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        onRegionChange={(r) => { regionRef.current = r; }}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {mapPartners.map((partner) => {
          if (!partner?.location) return null;
          const tier = partner.tier;
          const tierColor = PARTNER_TIER_COLORS[tier as PartnerTier] || '#999';
          const selected = selectedId === partner.id;
          const isMission = missionPartnerIds.includes(partner.id);
          return (
            <Marker
              key={partner.id}
              coordinate={{ latitude: partner.location.lat, longitude: partner.location.lng }}
              onPress={() => onSelectPartner(partner)}
              tracksViewChanges={false}
            >
              <FallbackOrbMarker
                tier={tier}
                selected={selected}
                isMission={isMission}
                tierColor={tierColor}
              />
            </Marker>
          );
        })}
      </MapView>

      {flags.isMapControlsEnabled && (
        <View
          style={[
            styles.controls,
            {
              backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)',
              bottom: bottomOffset,
              right: 12,
            },
          ]}
        >
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
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: '100%', height: '100%' },
  fallbackPin: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
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
});

export default OrbTapMapFallback;
