/**
 * OrbScope™ — Daily Vibe card (one per day).
 * One card, "Do it" primary CTA, "Share Vibe" secondary. No new tab; uses existing layout/tokens.
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { ORBTAP_APP_LINK } from '../constants/AppLinks';
import { getOrbScopeActionRoute } from '../hooks/useOrbScope';
import type { OrbScopeDaily, OrbScopeStreak } from '../constants/OrbScope';

export interface OrbScopeCardProps {
  daily: OrbScopeDaily;
  streak?: OrbScopeStreak;
  onDoIt: () => void;
  onView?: () => void;
  shareCardEnabled?: boolean;
  streakEnabled?: boolean;
}

export function OrbScopeCard({
  daily,
  streak,
  onDoIt,
  onView,
  shareCardEnabled = true,
  streakEnabled = false,
}: OrbScopeCardProps) {
  const { colors } = useTheme();
  const viewShotRef = useRef<ViewShot>(null);

  const handleDoIt = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDoIt();
  }, [onDoIt]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = `${daily.vibeText}\n\n${daily.actionPrompt}\n\nOpen OrbTap — ${ORBTAP_APP_LINK}`;
    try {
      if (shareCardEnabled && viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        if (uri && Platform.OS !== 'web') {
          await Share.share({ message, url: uri, title: "OrbScope — Daily Vibe" });
          return;
        }
      }
      await Share.share({ message, title: "OrbScope — Daily Vibe" });
    } catch {}
  }, [daily, shareCardEnabled]);

  React.useEffect(() => {
    onView?.();
  }, [onView]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <LinearGradient
          colors={[COLORS.gold[0] + '18', COLORS.neonBlue[0] + '08']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.header}>
          <View style={[styles.pill, { backgroundColor: COLORS.gold[0] + '22' }]}>
            <Ionicons name="sparkles" size={14} color={COLORS.gold[0]} />
            <Text style={[styles.pillText, { color: COLORS.gold[0] }]}>ORBSCOPE</Text>
          </View>
          {streakEnabled && streak && streak.currentStreakCount > 0 && (
            <Text style={[styles.streakText, { color: colors.textSecondary }]}>
              {streak.currentStreakCount} day streak
            </Text>
          )}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Today's Vibe</Text>
        <Text style={[styles.vibeText, { color: colors.text }]}>{daily.vibeText}</Text>
        <Text style={[styles.promptText, { color: colors.textSecondary }]}>{daily.actionPrompt}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.doItBtn} onPress={handleDoIt} activeOpacity={0.9}>
            <LinearGradient
              colors={[COLORS.gold[0], COLORS.gold[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.doItText}>Do it</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: colors.border }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.shareText, { color: colors.textSecondary }]}>Share Vibe</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hidden share card for capture (same content, premium graphic) */}
      {shareCardEnabled && (
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', result: 'tmpfile', width: 400, height: 280 }}
          style={styles.hiddenShot}
        >
          <OrbScopeShareCardView daily={daily} />
        </ViewShot>
      )}
    </View>
  );
}

/** Premium share card view — OrbTap visual language; no spammy watermark. */
function OrbScopeShareCardView({ daily }: { daily: OrbScopeDaily }) {
  return (
    <View style={shareCardStyles.card}>
      <LinearGradient
        colors={['#0a0a12', '#111118', '#0d0d14']}
        style={StyleSheet.absoluteFill}
      />
      <View style={shareCardStyles.borderGlow} />
      <Text style={shareCardStyles.brand}>OrbScope — Daily Vibe</Text>
      <Text style={shareCardStyles.vibeText}>{daily.vibeText}</Text>
      <Text style={shareCardStyles.promptText}>{daily.actionPrompt}</Text>
      <View style={shareCardStyles.footer}>
        <Text style={shareCardStyles.openLabel}>Open OrbTap</Text>
      </View>
    </View>
  );
}

const shareCardStyles = StyleSheet.create({
  card: {
    width: 400,
    height: 280,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  brand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.gold[0],
    marginBottom: 16,
  },
  vibeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 26,
    marginBottom: 12,
  },
  promptText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
  },
  openLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  streakText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  vibeText: { fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 8 },
  promptText: { fontSize: 13, fontWeight: '500', marginBottom: 16 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doItBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  doItText: { fontSize: 15, fontWeight: '800', color: '#000' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareText: { fontSize: 12, fontWeight: '600' },
  hiddenShot: {
    position: 'absolute',
    left: -2000,
    opacity: 0,
    pointerEvents: 'none',
  },
});
