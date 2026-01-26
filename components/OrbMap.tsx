import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Partner, MOCK_PARTNERS } from '../constants/MockData';
import { OrbPin } from './OrbPin';
import { useFlags } from './FlagContext';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoidGVtcCIsImEiOiJjbHJsIn0.temp';
Mapbox.setAccessToken(MAPBOX_TOKEN);

interface OrbMapProps {
  onSelectPartner: (p: Partner) => void;
  selectedId: string | null;
}

export const OrbMap = ({ onSelectPartner, selectedId }: OrbMapProps) => {
  const { flags } = useFlags();

  if (!flags.isMapboxEnabled) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Map Disabled (Flag OFF)</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Dark}>
        <Mapbox.Camera
          zoomLevel={14}
          centerCoordinate={[-74.0060, 40.7128]}
          animationMode={'flyTo'}
          animationDuration={0}
        />
        <Mapbox.ShapeSource id="partners" shape={{
          type: 'FeatureCollection',
          features: MOCK_PARTNERS.map(p => ({
            type: 'Feature',
            id: p.id,
            geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
            properties: { ...p }
          }))
        }} onPress={(e: any) => {
           const id = e.features?.[0]?.id as string;
           const p = MOCK_PARTNERS.find(x => x.id === id);
           if (p) onSelectPartner(p);
        }}>
          <Mapbox.SymbolLayer id="partnerSymbols" style={{ iconImage: 'circle', iconSize: 0 }} />
        </Mapbox.ShapeSource>
        
        {MOCK_PARTNERS.map((p) => (
          <Mapbox.PointAnnotation
            key={p.id}
            id={p.id}
            coordinate={[p.lon, p.lat]}
            onSelected={() => onSelectPartner(p)}
          >
            <OrbPin tier={p.tier} selected={selectedId === p.id} />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  fallback: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  fallbackText: { color: '#666' }
});
