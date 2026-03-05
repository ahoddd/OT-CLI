/**
 * OrbScope™ — Daily Vibe card (one per day).
 * One card, "Do it" primary CTA, "Share Vibe" secondary. No new tab; uses existing layout/tokens.
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { ORBTAP_APP_LINK } from '../constants/AppLinks';
import { getOrbScopeActionRoute } from '../hooks/useOrbScope';
import type { OrbScopeDaily, OrbScopeStreak, OrbScopeActionType } from '../constants/OrbScope';
import { ShareToSocialSheet } from './ShareToSocialSheet';

export interface OrbScopeCardProps {
  daily: OrbScopeDaily;
  streak?: OrbScopeStreak;
  onDoIt: () => void;
  onView?: () => void;
  shareCardEnabled?: boolean;
  streakEnabled?: boolean;
  /** Compact layout for Orb hub (smaller padding, fonts). */
  compact?: boolean;
}

export function OrbScopeCard({
  daily,
  streak,
  onDoIt,
  onView,
  shareCardEnabled = true,
  streakEnabled = false,
  compact = false,
}: OrbScopeCardProps) {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];

  function formatActionTypeLabel(type: OrbScopeActionType): string {
    const labels: Record<OrbScopeActionType, string> = {
      DROP: 'Drop',
      QUEST: 'Quest',
      PULSE: 'Pulse',
      CIRCLE: 'Circle',
      FIRST_PROOF: 'First proof',
    };
    return labels[type] ?? type;
  }
  const viewShotRef = useRef<ViewShot>(null);
  const cardStyles = compact ? compactStyles : styles;
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; title?: string; imageUri?: string; url?: string } | null>(null);

  const handleDoIt = useCallback(() => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDoIt();
  }, [onDoIt]);

  const handleShare = useCallback(async () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = `${daily.vibeText}\n\n${daily.actionPrompt}\n\nOpen OrbTap.`;
    let imageUri: string | undefined;
    if (shareCardEnabled && viewShotRef.current?.capture && Platform.OS !== 'web') {
      try {
        imageUri = await viewShotRef.current.capture();
      } catch {}
    }
    setSharePayload({ message, title: 'OrbScope — Daily Vibe', imageUri, url: ORBTAP_APP_LINK });
    setShareSheetVisible(true);
  }, [daily, shareCardEnabled]);

  React.useEffect(() => {
    onView?.();
  }, [onView]);

  return (
    <View style={cardStyles.wrap}>
      <View style={[cardStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <LinearGradient
          colors={[themeGold + '18', COLORS.neonBlue[0] + '08']}
          style={StyleSheet.absoluteFill}
        />
        <View style={cardStyles.header}>
          <View style={[cardStyles.pill, { backgroundColor: themeGold + '22' }]}>
            <Ionicons name="sparkles" size={compact ? 10 : 14} color={themeGold} />
            <Text style={[cardStyles.pillText, { color: themeGold }]}>ORBSCOPE</Text>
          </View>
          {compact && (
            <Text style={[cardStyles.actionTypeTag, { color: colors.textSecondary }]} numberOfLines={1}>
              {formatActionTypeLabel(daily.actionType)}
              {streakEnabled && streak && streak.currentStreakCount > 0 ? ` · ${streak.currentStreakCount}d` : ''}
            </Text>
          )}
          {!compact && streakEnabled && streak && streak.currentStreakCount > 0 && (
            <Text style={[cardStyles.streakText, { color: colors.textSecondary }]}>
              {streak.currentStreakCount} day streak
            </Text>
          )}
        </View>
        <Text style={[cardStyles.title, { color: colors.text }]} numberOfLines={1}>{compact ? "Today's pick" : "Today's Vibe"}</Text>
        {compact && (
          <Text style={[cardStyles.whatsThis, { color: colors.textSecondary }]} numberOfLines={1}>One action to earn or discover — tap Do it to go.</Text>
        )}
        <Text style={[cardStyles.vibeText, { color: colors.text }]} numberOfLines={compact ? 1 : 3} ellipsizeMode="tail">{daily.vibeText}</Text>
        <Text style={[cardStyles.promptText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{daily.actionPrompt}</Text>
        <View style={cardStyles.actions}>
          <TouchableOpacity style={cardStyles.doItBtn} onPress={handleDoIt} activeOpacity={0.9}>
            <LinearGradient
              colors={[themeGold, COLORS.gold[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={cardStyles.doItText}>Do it</Text>
            <Ionicons name="arrow-forward" size={compact ? 14 : 18} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardStyles.shareBtn, { borderColor: colors.border }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={compact ? 12 : 16} color={colors.textSecondary} />
            <Text style={[cardStyles.shareText, { color: colors.textSecondary }]}>Share Vibe</Text>
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
          <OrbScopeShareCardView daily={daily} themeGold={themeGold} />
        </ViewShot>
      )}
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share Vibe"
        />
      )}
    </View>
  );
}

/** Premium share card view — OrbTap visual language; no spammy watermark. */
function OrbScopeShareCardView({ daily, themeGold }: { daily: OrbScopeDaily; themeGold: string }) {
  return (
    <View style={shareCardStyles.card}>
      <LinearGradient
        colors={['#0a0a12', '#111118', '#0d0d14']}
        style={StyleSheet.absoluteFill}
      />
      <View style={shareCardStyles.borderGlow} />
      <Text style={[shareCardStyles.brand, { color: themeGold }]}>OrbScope — Daily Vibe</Text>
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
  actionTypeTag: { fontSize: 11, fontWeight: '600', flex: 1, minWidth: 0, textAlign: 'right' },
  streakText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  whatsThis: { fontSize: 12, fontWeight: '500', marginBottom: 4, opacity: 0.9 },
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

const compactStyles = StyleSheet.create({
  wrap: { marginBottom: 0, minWidth: 0 },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    overflow: 'hidden',
    position: 'relative',
    minWidth: 0,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3, gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  pillText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.4 },
  actionTypeTag: { fontSize: 9, fontWeight: '600', flex: 1, minWidth: 0, textAlign: 'right' },
  streakText: { fontSize: 9, fontWeight: '600' },
  title: { fontSize: 10, fontWeight: '800', marginBottom: 1 },
  whatsThis: { fontSize: 9, fontWeight: '500', marginBottom: 3, opacity: 0.9 },
  vibeText: { fontSize: 10, fontWeight: '600', lineHeight: 13, marginBottom: 2 },
  promptText: { fontSize: 9, fontWeight: '500', marginBottom: 5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doItBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  doItText: { fontSize: 10, fontWeight: '800', color: '#000' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  shareText: { fontSize: 9, fontWeight: '600' },
  hiddenShot: styles.hiddenShot,
});
