/**
 * OrbPilot™ — PIN Entry: 6-digit PIN pad for staff-verified redemption.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { pilotVerifyComplete } from '../../services/orbPilot';
import { OrbPilotDefaults } from '../../constants/OrbPilot';
import { useI18n } from '../../context/I18nContext';

const PILOT_PURPLE = '#7C3AED';
const PIN_LENGTH = OrbPilotDefaults.pinLength;

const NUM_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
] as const;

export default function OrbPilotPin() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ attemptId: string; nonce: string; slotId: string; expiresISO: string; pinLength: string }>();
  const { attemptId, nonce, slotId, expiresISO, pinLength: pinLengthParam } = params;

  const effectivePinLength = pinLengthParam ? parseInt(pinLengthParam, 10) : PIN_LENGTH;

  const [digits, setDigits] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msLeft, setMsLeft] = useState<number>(() => {
    if (!expiresISO) return 5 * 60 * 1000;
    return Math.max(0, new Date(expiresISO).getTime() - Date.now());
  });
  const [expired, setExpired] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedOut, setLockedOut] = useState(false);

  // Shake animation for wrong PIN
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }, [shakeX]);

  // Countdown tick
  useEffect(() => {
    if (expired) return;
    const tick = setInterval(() => {
      const remaining = expiresISO
        ? Math.max(0, new Date(expiresISO).getTime() - Date.now())
        : 0;
      setMsLeft(remaining);
      if (remaining <= 0) {
        setExpired(true);
        clearInterval(tick);
      }
    }, 500);
    return () => clearInterval(tick);
  }, [expiresISO, expired]);

  // Auto-submit when all digits entered
  useEffect(() => {
    if (digits.length === effectivePinLength && !submitting && !expired && !lockedOut) {
      handleSubmit(digits.join(''));
    }
  }, [digits, effectivePinLength, submitting, expired, lockedOut]);

  const handleKey = useCallback((key: string) => {
    if (expired || lockedOut || submitting) return;
    if (key === 'del') {
      setDigits((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '') return;
    setDigits((prev) => {
      if (prev.length >= effectivePinLength) return prev;
      return [...prev, key];
    });
  }, [expired, lockedOut, submitting, effectivePinLength]);

  const handleSubmit = useCallback(async (pin: string) => {
    setSubmitting(true);

    let lat = 0;
    let lng = 0;
    let accuracyM = 999;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        accuracyM = loc.coords.accuracy ?? 999;
      }
    } catch {
      // Location optional
    }

    const res = await pilotVerifyComplete({
      attemptId,
      nonce,
      pin,
      lat,
      lng,
      accuracyM,
    });

    setSubmitting(false);

    if (res.success) {
      router.replace({
        pathname: '/orbpilot/result',
        params: {
          outcome: res.outcome,
          visitId: res.visitId,
          rewardPoints: String(res.rewardPoints),
          rejectionReason: '',
        },
      });
    } else {
      // Wrong PIN or other failure
      const reason = res.rejectionReason;

      if (reason === 'pin_brute_force') {
        setLockedOut(true);
        router.replace({
          pathname: '/orbpilot/result',
          params: {
            outcome: 'rejected',
            visitId: '',
            rewardPoints: '0',
            rejectionReason: 'pin_brute_force',
          },
        });
        return;
      }

      if (reason === 'attempt_expired' || reason === 'pin_expired') {
        setExpired(true);
        router.replace({
          pathname: '/orbpilot/result',
          params: {
            outcome: 'expired',
            visitId: '',
            rewardPoints: '0',
            rejectionReason: reason,
          },
        });
        return;
      }

      if (res.attemptsRemaining !== undefined) {
        setAttemptsRemaining(res.attemptsRemaining);
      }
      triggerShake();
      setDigits([]);
    }
  }, [attemptId, nonce, router, triggerShake]);

  const formatCountdown = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${s}s`;
  };

  const urgencyColor = msLeft < 30_000 ? '#EF4444' : msLeft < 60_000 ? '#FBBF24' : colors.textSecondary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Enter PIN</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        {/* Instruction */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.instructionWrap}>
          <Ionicons name="keypad-outline" size={32} color={PILOT_PURPLE} />
          <Text style={[styles.instruction, { color: colors.text }]}>Enter the PIN shown on staff screen</Text>
          {attemptsRemaining !== null && (
            <Text style={[styles.attemptsLeft, { color: '#EF4444' }]}>
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
            </Text>
          )}
          {lockedOut && (
            <Text style={[styles.lockedOut, { color: '#EF4444' }]}>Too many attempts — try again later</Text>
          )}
        </Animated.View>

        {/* Countdown */}
        {!expired && (
          <Animated.View entering={FadeInDown.duration(350).delay(60)} style={[styles.countdownWrap, { backgroundColor: colors.card }]}>
            <Ionicons name="time-outline" size={15} color={urgencyColor} />
            <Text style={[styles.countdownText, { color: urgencyColor }]}>
              {expired ? 'Expired' : `Attempt expires in ${formatCountdown(msLeft)}`}
            </Text>
          </Animated.View>
        )}

        {expired && (
          <View style={[styles.expiredBanner, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text style={[styles.expiredText, { color: '#EF4444' }]}>Attempt expired</Text>
          </View>
        )}

        {/* PIN dots */}
        <Animated.View entering={FadeInDown.duration(350).delay(120)} style={styles.dotsWrap}>
          <Animated.View style={[styles.dotsRow, shakeStyle]}>
            {Array.from({ length: effectivePinLength }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < digits.length
                    ? { backgroundColor: PILOT_PURPLE }
                    : { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
                ]}
              />
            ))}
          </Animated.View>
        </Animated.View>

        {/* Keypad */}
        <Animated.View entering={FadeInDown.duration(350).delay(200)} style={styles.keypad}>
          {NUM_KEYS.map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {row.map((key) => {
                if (key === '') return <View key={key} style={styles.keyEmpty} />;
                const isDelete = key === 'del';
                const isDisabled = expired || lockedOut || submitting;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.key,
                      { backgroundColor: isDelete ? 'transparent' : colors.card },
                      isDisabled && { opacity: 0.4 },
                    ]}
                    onPress={() => handleKey(key)}
                    disabled={isDisabled}
                    activeOpacity={0.7}
                  >
                    {isDelete ? (
                      <Ionicons name="backspace-outline" size={22} color={colors.text} />
                    ) : (
                      <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Animated.View>

        {/* Submitting indicator */}
        {submitting && (
          <View style={styles.submittingWrap}>
            <ActivityIndicator size="large" color={PILOT_PURPLE} />
            <Text style={[styles.submittingText, { color: colors.textSecondary }]}>Verifying...</Text>
          </View>
        )}
      </View>
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
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.lg,
    gap: 20,
    alignItems: 'center',
  },
  instructionWrap: { alignItems: 'center', gap: 10, paddingTop: 8 },
  instruction: { fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  attemptsLeft: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  lockedOut: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  countdownWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countdownText: { fontSize: 13, fontWeight: '600' },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  expiredText: { fontSize: 14, fontWeight: '700' },
  dotsWrap: { paddingVertical: 8 },
  dotsRow: { flexDirection: 'row', gap: 14 },
  dot: { width: 18, height: 18, borderRadius: 9 },
  keypad: { width: '100%', maxWidth: 320, gap: 12 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  key: {
    width: 80,
    height: 64,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: { width: 80, height: 64 },
  keyText: { fontSize: 24, fontWeight: '600' },
  submittingWrap: { alignItems: 'center', gap: 8, marginTop: 8 },
  submittingText: { fontSize: 14 },
});
