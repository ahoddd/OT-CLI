/**
 * Web-only map component. Used instead of OrbTapMap.tsx when building for web
 * so we never import @rnmapbox/maps (which requires mapbox-gl.css and native code).
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { Partner } from '../constants/MockData';

interface OrbTapMapProps {
  onSelectPartner: (p: Partner) => void;
  selectedId: string | null;
  missionPartnerIds?: string[];
}

export const OrbTapMap: React.FC<OrbTapMapProps> = () => {
  const { colors } = useTheme();
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
};

const styles = StyleSheet.create({
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
