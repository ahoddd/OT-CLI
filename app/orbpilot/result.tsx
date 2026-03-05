/**
 * OrbPilot™ — Verification Result: success or failure with animated feedback.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn, useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { REJECTION_REASON_LABEL } from '../../constants/OrbPilot';
import type { RejectionReason, VerifyOutcome } from '../../constants/OrbPilot';
import { useI18n } from '../../context/I18nContext';

const PILOT_PURPLE = '#7C3AED';
const SUCCESS_GREEN = '#22C55E';
const FAIL_RED = '#EF4444';

/** Animated OT Points count-up on success. */
function PointsCountUp({ target, color }: { target: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (target <= 0) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setDisplayed(current);
      if (current >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <Text style={[styles.pointsCount, { color }]}>{displayed}</Text>
  );
}

export default function OrbPilotResult() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    outcome: string;
    visitId: string;
    rewardPoints: string;
    rejectionReason: string;
  }>();

  const outcome = (params.outcome ?? 'rejected') as VerifyOutcome;
  const visitId = params.visitId ?? '';
  const rewardPoints = parseInt(params.rewardPoints ?? '0', 10) || 0;
  const rejectionReason = (params.rejectionReason ?? '') as RejectionReason | '';

  const isVerified = outcome === 'verified';
  const isExpired = outcome === 'expired';

  // Spring scale for icon
  const iconScale = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  // Glow opacity for success
  const glowOpacity = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  useEffect(() => {
    iconScale.value = withDelay(100, withSpring(1, { damping: 10, stiffness: 200 }));
    if (isVerified) {
      glowOpacity.value = withDelay(300, withSpring(1, { damping: 12 }));
    }
  }, [iconScale, glowOpacity, isVerified]);

  const accentColor = isVerified ? SUCCESS_GREEN : FAIL_RED;
  const iconName = isVerified ? 'checkmark-circle' : isExpired ? 'time-outline' : 'close-circle';

  const rejectionLabel = rejectionReason && REJECTION_REASON_LABEL[rejectionReason as RejectionReason]
    ? REJECTION_REASON_LABEL[rejectionReason as RejectionReason]
    : 'Verification could not be completed.';

  const handleShare = () => {
    Alert.alert('Share', 'Sharing via native sheet coming soon!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.body}>
        {/* Glow backdrop for success */}
        {isVerified && (
          <Animated.View style={[styles.glow, glowStyle, { backgroundColor: SUCCESS_GREEN + '18' }]} pointerEvents="none" />
        )}

        {/* Icon */}
        <Animated.View style={[styles.iconWrap, iconStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
            <Ionicons name={iconName as any} size={72} color={accentColor} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.titleWrap}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {isVerified ? 'Visit Verified!' : isExpired ? 'Attempt Expired' : 'Verification Failed'}
          </Text>
          {isVerified ? (
            <Text style={[styles.resultSub, { color: colors.textSecondary }]}>
              OT Points have been added to your wallet
            </Text>
          ) : (
            <Text style={[styles.resultSub, { color: colors.textSecondary }]}>{rejectionLabel}</Text>
          )}
        </Animated.View>

        {/* Points count-up on success */}
        {isVerified && rewardPoints > 0 && (
          <Animated.View entering={ZoomIn.duration(500).delay(350)} style={[styles.pointsCard, { backgroundColor: SUCCESS_GREEN + '15', borderColor: SUCCESS_GREEN + '40' }]}>
            <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>You earned</Text>
            <PointsCountUp target={rewardPoints} color={SUCCESS_GREEN} />
            <Text style={[styles.pointsUnit, { color: SUCCESS_GREEN }]}>OT Points</Text>
          </Animated.View>
        )}

        {/* Failure detail card */}
        {!isVerified && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={[styles.failCard, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.failDetail, { color: colors.textSecondary }]}>
              {isExpired
                ? 'The verification window closed before it could complete. Claim a new slot and try again.'
                : 'Your OT Points were not awarded for this visit. If you believe this is an error, contact support.'}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Action buttons */}
      <Animated.View entering={FadeInUp.duration(400).delay(isVerified ? 600 : 350)} style={[styles.footer, { backgroundColor: colors.background }]}>
        {isVerified && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: PILOT_PURPLE }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Share</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push('/orbpilot/history')}
        >
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>View History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: colors.card }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Ionicons name="map-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Back to Map</Text>
        </TouchableOpacity>

        {!isVerified && (
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: PILOT_PURPLE }]}
            onPress={() => router.replace('/orbpilot')}
          >
            <Text style={[styles.outlineBtnText, { color: PILOT_PURPLE }]}>Find New Offers</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
    gap: 24,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  iconWrap: { alignItems: 'center' },
  iconCircle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  titleWrap: { alignItems: 'center', gap: 8 },
  resultTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  resultSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  pointsCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingHorizontal: 40,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
  },
  pointsLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  pointsCount: { fontSize: 56, fontWeight: '800', lineHeight: 64 },
  pointsUnit: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  failCard: {
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    maxWidth: 340,
  },
  failDetail: { flex: 1, fontSize: 14, lineHeight: 20 },
  footer: {
    padding: SPACE.md,
    paddingBottom: 28,
    gap: 10,
  },
  primaryBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
  outlineBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '700' },
});
