import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Partner } from '../constants/MockData';
import { COLORS } from '../constants/Colors';

// This component is now a placeholder since we removed the native SDK
// to fix the build error. The app now uses Apple/Google Maps by default.

interface OrbMapProps {
  onSelectPartner: (p: Partner | null) => void;
  selectedId: string | null;
}

export const OrbMap = ({ onSelectPartner, selectedId }: OrbMapProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mapbox SDK Not Installed.</Text>
      <Text style={styles.sub}>Switched to Native Maps.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.danger, fontWeight: 'bold', marginBottom: 8 },
  sub: { color: '#888' }
});
