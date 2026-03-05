/**
 * Do next / suggested action strip: "Scan at [Partner]" or "Complete mission at [Partner]".
 * Used on Orb hub and Map for engagement.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';

export interface DoNextStripProps {
  type: 'scan' | 'mission';
  partnerName: string;
  distanceLabel?: string;
  onPress: () => void;
}

export function DoNextStrip({ type, partnerName, distanceLabel, onPress }: DoNextStripProps) {
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const isMission = type === 'mission';

  return (
    <TouchableOpacity
      style={[styles.strip, styles.stripGlass, { borderColor: themeGold + '50' }]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityLabel={isMission ? `Complete mission at ${partnerName}` : `Scan at ${partnerName}`}
      accessibilityRole="button"
    >
      {Platform.OS !== 'web' && (
        <BlurView intensity={isDark ? 48 : 52} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      )}
      {Platform.OS === 'web' && <View style={[StyleSheet.absoluteFill, { backgroundColor: themeGold + '18' }]} />}
      <View style={[styles.iconWrap, { backgroundColor: themeGold + '35' }]}>
        <Ionicons name={isMission ? 'flag' : 'qr-code'} size={18} color={themeGold} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {isMission ? `Complete mission at ${partnerName}` : `Scan at ${partnerName}`}
        </Text>
        {distanceLabel && (
          <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
            {distanceLabel} away
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={themeGold} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  stripGlass: { overflow: 'hidden', position: 'relative' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
