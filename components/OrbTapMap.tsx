import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Partner, MOCK_PARTNERS, MOCK_MISSIONS, TIER_COLORS } from '../constants/MockData';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Location from 'expo-location';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

interface OrbTapMapProps {
  onSelectPartner: (p: Partner) => void;
  selectedId: string | null;
}

export const OrbTapMap: React.FC<OrbTapMapProps> = ({ onSelectPartner, selectedId }) => {
  const { isDark } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch (e) {
        console.warn("Location permission error:", e);
      }
    })();
  }, []);

  // Default: Poconos / Tannersville — Crossings Premium Outlets & waterparks area
  const CENTER_COORD: [number, number] = [-75.309, 41.044]; 

  return (
    <View style={styles.container}>
      <Mapbox.MapView 
        style={styles.map} 
        styleURL={process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL || (isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light)}
        logoEnabled={true}
        attributionEnabled={false}
        scaleBarEnabled={false}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        <Mapbox.Atmosphere
          style={{
            starIntensity: 0.2,
            color: '#0a0a1a',
            spaceColor: '#0a0a1a',
          }}
        />
        <Mapbox.Camera
          centerCoordinate={CENTER_COORD}
          zoomLevel={17}
          pitch={50}
          heading={0}
          animationMode="flyTo"
          animationDuration={2000}
          followUserLocation={true}
          followUserMode={Mapbox.UserTrackingMode.FollowWithCourse}
          followPitch={50}
          minZoomLevel={10}
          maxZoomLevel={19}
        />
        <Mapbox.LocationPuck
          visible={true}
          androidRenderMode="gps"
          puckBearingEnabled={true}
          puckBearing="heading"
          pulsing={{
            isEnabled: true,
            color: '#3b82f6',
            radius: 30,
          }}
        />

        {MOCK_PARTNERS.map((partner) => {
          // Safety check
          if (!partner || !partner.location) return null;
          
          return (
            <Mapbox.PointAnnotation
              key={partner.id}
              id={partner.id}
              coordinate={[partner.location.lng, partner.location.lat]}
              onSelected={() => onSelectPartner(partner)}
            >
              <View style={[
                styles.orbPin, 
                { 
                  backgroundColor: TIER_COLORS[partner.tier] || '#999',
                  shadowColor: TIER_COLORS[partner.tier] || '#999',
                  borderWidth: selectedId === partner.id ? 2 : 0,
                  transform: [{ scale: selectedId === partner.id ? 1.3 : 1 }]
                }
              ]}>
                <View style={styles.core} />
              </View>
            </Mapbox.PointAnnotation>
          );
        })}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  orbPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  core: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    opacity: 0.95,
  },
  missionPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
