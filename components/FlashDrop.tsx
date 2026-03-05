import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated as RNAnimated } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useRouter } from 'expo-router';
import { safeHaptics, Haptics } from '../utils/safeHaptics';

interface FlashDropProps {
  /** When true, render in document flow (no overlap); show close button. */
  inline?: boolean;
  onDismiss?: () => void;
  /** Partner ID for navigation — required for correct routing */
  partnerId?: string;
  /** Override for demo data */
  partnerName?: string;
  otAmount?: number;
  /** Total supply and remaining */
  totalSlots?: number;
  remainingSlots?: number;
  /** ISO string or epoch for expiry */
  expiresAt?: number;
}

function useCountdown(expiresAt?: number) {
  const [remaining, setRemaining] = useState<number>(
    expiresAt ? Math.max(0, expiresAt - Date.now()) : 12 * 60 * 1000 + 45000
  );
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        const next = expiresAt ? Math.max(0, expiresAt - Date.now()) : Math.max(0, r - 1000);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const FlashDrop = ({
  inline,
  onDismiss,
  partnerId,
  partnerName = 'CyberCafe 2077',
  otAmount = 75,
  totalSlots = 30,
  remainingSlots = 12,
  expiresAt,
}: FlashDropProps) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const remaining = useCountdown(expiresAt);
  const pulseDot = useSharedValue(1);

  useEffect(() => {
    pulseDot.value = withRepeat(withTiming(0.3, { duration: 700 }), -1, true);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulseDot.value }));

  const handlePress = () => {
    safeHaptics.selectionAsync();
    setExpanded((e) => !e);
  };

  const handleGoToPartner = () => {
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExpanded(false);
    router.push(partnerId ? `/partner/${partnerId}` : '/partner/p1');
  };

  const fraction = totalSlots > 0 ? (remainingSlots / totalSlots) : 1;
  const urgentColor = fraction < 0.3 ? '#ff4444' : COLORS.danger;

  const glassBg = isDark ? 'rgba(20,0,0,0.55)' : 'rgba(180,20,20,0.72)';
  const borderColor = 'rgba(239,68,68,0.5)';

  const content = (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[
        inline ? styles.containerInline : styles.container,
        expanded && (inline ? styles.containerInlineExpanded : styles.containerExpanded),
        { borderColor, borderWidth: 1 },
      ]}
    >
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: glassBg }]} />
        )}
        {/* Red tint overlay */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(239,68,68,0.35)' }]} pointerEvents="none" />
      </View>

      {/* Collapsed row */}
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Ionicons name="flame" size={expanded ? 22 : 18} color="#fff" />
        </View>
        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Animated.View style={[styles.pulseDot, dotStyle]} />
            <Text style={styles.title}>{expanded ? 'FLASH DROP' : 'Flash Drop'}</Text>
          </View>
          {!expanded && <Text style={styles.timerCompact}>{formatMs(remaining)} · EARN {otAmount} OT</Text>}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#fff"
          style={styles.chevron}
        />
        {inline && (
          <TouchableOpacity onPress={(e) => { e.stopPropagation(); safeHaptics.selectionAsync(); onDismiss?.(); }} style={styles.closeBtn}>
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded content */}
      {expanded && (
        <Animated.View entering={FadeInDown.duration(220)} style={styles.expandedContent}>
          {/* Large countdown */}
          <Text style={styles.bigTimer}>{formatMs(remaining)}</Text>
          <Text style={styles.timerLabel}>REMAINING</Text>

          <View style={styles.divider} />

          <Text style={styles.partnerName}>{partnerName}</Text>
          <Text style={styles.earnBadge}>EARN {otAmount} OT</Text>

          {/* Urgency depleting bar */}
          <View style={styles.slotRow}>
            <Text style={styles.slotText}>{remainingSlots} of {totalSlots} remaining</Text>
          </View>
          <View style={styles.slotBarBg}>
            <View style={[styles.slotBarFill, { width: `${Math.round(fraction * 100)}%` as any, backgroundColor: urgentColor }]} />
          </View>

          <TouchableOpacity style={styles.cta} onPress={handleGoToPartner} activeOpacity={0.85}>
            <Text style={styles.ctaText}>View & Redeem</Text>
            <Ionicons name="arrow-forward" size={16} color="#000" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </TouchableOpacity>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 76,
    borderRadius: 16,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 100,
    overflow: 'hidden',
  },
  containerExpanded: { right: 16 },
  containerInline: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  containerInlineExpanded: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textWrap: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4444',
  },
  title: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  timerCompact: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', marginTop: 2 },
  chevron: { marginLeft: 4 },
  closeBtn: { padding: 6, marginLeft: 4 },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bigTimer: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timerLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 12 },
  partnerName: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  earnBadge: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  slotText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },
  slotBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  slotBarFill: { height: '100%', borderRadius: 3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  ctaText: { color: '#000', fontSize: 14, fontWeight: '900' },
});
