import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Partner, MOCK_PARTNERS, TIER_COLORS } from '../constants/MockData';
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

  // Center on NYC (Lower Manhattan) to match mock data
  const CENTER_COORD = [-74.0060, 40.7128]; 

  return (
    <View style={styles.container}>
      <Mapbox.MapView 
        style={styles.map} 
        styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <Mapbox.Camera
          zoomLevel={14}
          centerCoordinate={CENTER_COORD}
          animationMode="flyTo"
          animationDuration={2000}
        />
        
        <Mapbox.UserLocation visible={true} showsUserHeadingIndicator={true} />

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
    opacity: 0.95
  }
});
