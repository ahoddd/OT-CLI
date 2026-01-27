import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrbMap } from './OrbMap'; // The Mapbox Component
import { NativeMap } from './NativeMap'; // The Apple/Google Wrapper
import { useFlags } from './FlagContext';
import { Partner } from '../constants/MockData';
import { useTheme } from '../hooks/useTheme';

interface OrbTapMapProps {
  onSelectPartner: (p: Partner | null) => void;
  selectedId: string | null;
}

export const OrbTapMap = ({ onSelectPartner, selectedId }: OrbTapMapProps) => {
  const { flags } = useFlags();
  const { colors } = useTheme();

  // LOGIC SWITCH
  switch (flags.mapProvider) {
    case 'mapbox':
      return <OrbMap onSelectPartner={onSelectPartner} selectedId={selectedId} />;
    
    case 'native':
      return <NativeMap onSelectPartner={(p) => onSelectPartner(p)} />;
    
    case 'none':
    default:
      return (
        <View style={[styles.fallback, { backgroundColor: colors.background }]}>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Map System Disabled (Grid View Only)
          </Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 12, fontWeight: 'bold' }
});
