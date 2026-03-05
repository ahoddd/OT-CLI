/**
 * OrbPilot™ — Claimed Offer Timer: countdown to claim expiry + QR scan instructions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useOrbPilotOffers } from '../../hooks/useOrbPilotOffers';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { useI18n } from '../../context/I18nContext';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const PILOT_PURPLE = '#7C3AED';

export default function OrbPilotClaimed() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ slotId: string; claimExpiresISO: string; partnerName: string }>();
  const { slotId, claimExpiresISO, partnerName } = params;
  const { cancel } = useOrbPilotOffers();

  const [msLeft, setMsLeft] = useState<number>(() => {
    if (!claimExpiresISO) return 30 * 60 * 1000;
    return Math.max(0, new Date(claimExpiresISO).getTime() - Date.now());
  });
  const [cancelling, setCancelling] = useState(false);
  const [expired, setExpired] = useState(false);

  // Pulsing animation on the shield icon
  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [pulseScale]);

  // Countdown tick
  useEffect(() => {
    if (expired) return;
    const tick = setInterval(() => {
      const remaining = claimExpiresISO
        ? Math.max(0, new Date(claimExpiresISO).getTime() - Date.now())
        : 0;
      setMsLeft(remaining);
      if (remaining <= 0) {
        setExpired(true);
        clearInterval(tick);
      }
    }, 500);
    return () => clearInterval(tick);
  }, [claimExpiresISO, expired]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Slot?',
      'Cancelling will free up the slot for another user. You won\'t earn OT Points.',
      [
        { text: 'Keep Slot', style: 'cancel' },
        {
          text: 'Cancel Slot',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            await cancel(slotId);
            setCancelling(false);
            router.replace('/orbpilot');
          },
        },
      ],
    );
  }, [cancel, slotId, router]);

  const urgencyColor = msLeft < 5 * 60 * 1000 ? '#EF4444' : msLeft < 10 * 60 * 1000 ? '#FBBF24' : '#22C55E';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/orbpilot')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Slot Claimed</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        {/* Animated shield */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroWrap}>
          <Animated.View style={[styles.shieldWrap, { backgroundColor: PILOT_PURPLE + '18', borderColor: PILOT_PURPLE + '40' }, pulseStyle]}>
            <Ionicons name="shield-checkmark" size={56} color={PILOT_PURPLE} />
          </Animated.View>
          <Text style={[styles.claimedLabel, { color: colors.text }]}>Your slot is reserved!</Text>
          {partnerName ? (
            <Text style={[styles.partnerLabel, { color: colors.textSecondary }]}>{partnerName}</Text>
          ) : null}
        </Animated.View>

        {/* Countdown */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={[styles.countdownCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.countdownLabel, { color: colors.textSecondary }]}>
            {expired ? 'Slot expired' : 'Time to get there'}
          </Text>
          <Text style={[styles.countdown, { color: expired ? '#EF4444' : urgencyColor }]}>
            {expired ? 'Expired' : formatCountdown(msLeft)}
          </Text>
          {!expired && msLeft < 5 * 60 * 1000 && (
            <Text style={[styles.urgencyHint, { color: '#EF4444' }]}>Head there now!</Text>
          )}
        </Animated.View>

        {/* Instruction card */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={[styles.instructionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.instructionTitle, { color: colors.text }]}>What to do next</Text>
          {[
            { icon: 'walk-outline' as const, text: `Go to ${partnerName || 'the partner venue'}` },
            { icon: 'qr-code-outline' as const, text: 'Find the OrbTap QR code at the counter' },
            { icon: 'phone-portrait-outline' as const, text: 'Tap "Scan Now" below and point your camera at it' },
            { icon: 'flash-outline' as const, text: 'OT Points are awarded instantly after verification' },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: PILOT_PURPLE + '20' }]}>
                <Ionicons name={step.icon} size={18} color={PILOT_PURPLE} />
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Footer CTAs */}
      <Animated.View entering={FadeInUp.duration(400).delay(240)} style={[styles.footer, { backgroundColor: colors.background }]}>
        {expired ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: PILOT_PURPLE }]}
            onPress={() => router.replace('/orbpilot')}
          >
            <Text style={styles.primaryBtnText}>Back to Offers</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: PILOT_PURPLE }]}
              onPress={() => router.push({ pathname: '/orbpilot/scan', params: { slotId } })}
            >
              <Ionicons name="qr-code-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Scan Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel Slot</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    paddingVertical: 12,
  },
  title: { fontSize: 17, fontWeight: '700' },
  body: {
    flex: 1,
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.lg,
    gap: 16,
  },
  heroWrap: { alignItems: 'center', gap: 10, paddingVertical: SPACE.lg },
  shieldWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  claimedLabel: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  partnerLabel: { fontSize: 14, textAlign: 'center' },
  countdownCard: {
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
    alignItems: 'center',
    gap: 4,
  },
  countdownLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  countdown: { fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  urgencyHint: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  instructionCard: {
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    gap: 14,
  },
  instructionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20, paddingTop: 7 },
  footer: {
    padding: SPACE.md,
    paddingBottom: 28,
    gap: 10,
  },
  primaryBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  cancelBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
});
