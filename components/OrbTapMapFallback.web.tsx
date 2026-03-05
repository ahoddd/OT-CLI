/**
 * Web-only fallback: no react-native-maps. Renders placeholder so the map tab works on web.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { Partner } from '../constants/MockData';

export interface OrbTapMapFallbackProps {
  onSelectPartner: (p: Partner) => void;
  selectedId: string | null;
  missionPartnerIds?: string[];
}

export function OrbTapMapFallback(_props: OrbTapMapFallbackProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>OrbTap Map</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        The interactive map is available in the OrbTap mobile app. Download for iOS or Android to discover partners and earn points.
      </Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.surface }]}
        onPress={() => typeof window !== 'undefined' && window.open('https://apps.apple.com/app/orbtap', '_blank')}
      >
        <Text style={[styles.btnText, { color: colors.text }]}>Get the app</Text>
      </TouchableOpacity>
    </View>
  );
}

export default OrbTapMapFallback;

const styles = StyleSheet.create({
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  sub: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 360, marginBottom: 24 },
  btn: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  btnText: { fontSize: 16, fontWeight: '700' },
});
