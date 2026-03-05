/**
 * OrbBankTile — Wallet tab tile showing active jar progress + Top up CTA.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import type { OrbBankJar } from '../../services/orbBank';

interface OrbBankTileProps {
  activeJar?: OrbBankJar;
  onTopUp: () => void;
  onViewJars: () => void;
}

export function OrbBankTile({ activeJar, onTopUp, onViewJars }: OrbBankTileProps) {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];

  const progress = activeJar
    ? Math.min(activeJar.currentOT / activeJar.targetOT, 1)
    : 0;

  const progressWidth = useSharedValue(0);
  React.useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 1000 });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as `${number}%`,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <LinearGradient
        colors={[themeGold + '11', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.icon, { backgroundColor: themeGold + '22' }]}>
            <Text style={{ fontSize: 16 }}>🏦</Text>
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>OrbBank™</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {activeJar ? `${activeJar.emoji} ${activeJar.label}` : 'Goal jar savings'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.topUpBtn, { backgroundColor: themeGold }]}
          onPress={onTopUp}
          activeOpacity={0.85}
        >
          <Text style={styles.topUpText}>Top up</Text>
        </TouchableOpacity>
      </View>

      {activeJar ? (
        <View style={styles.progressSection}>
          <View style={styles.progressMeta}>
            <Text style={[styles.progressCurrent, { color: themeGold }]}>
              {activeJar.currentOT.toLocaleString()} OT
            </Text>
            <Text style={[styles.progressTarget, { color: colors.textSecondary }]}>
              {' '}/ {activeJar.targetOT.toLocaleString()} OT goal
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <Animated.View style={[styles.progressFill, { backgroundColor: themeGold }, progressStyle]} />
          </View>
          <Text style={[styles.progressPct, { color: colors.textSecondary }]}>
            {Math.round(progress * 100)}% saved
          </Text>
        </View>
      ) : (
        <TouchableOpacity onPress={onViewJars} style={styles.emptyState} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={18} color={themeGold} />
          <Text style={[styles.emptyText, { color: themeGold }]}>Create your first goal jar</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 1 },
  topUpBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  topUpText: { fontSize: 13, fontWeight: '700', color: '#000' },
  progressSection: { gap: 6 },
  progressMeta: { flexDirection: 'row', alignItems: 'baseline' },
  progressCurrent: { fontSize: 20, fontWeight: '800' },
  progressTarget: { fontSize: 13 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { fontSize: 11, textAlign: 'right' },
  emptyState: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
