/**
 * OrbPilot™ Partner Verify — Rotating PIN display for staff.
 * Auto-refreshes every 45s. Large PIN display, countdown ring.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/useTheme';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { pilotPinCurrent, pilotPinRotate, pilotPartnerActivity } from '../../../services/orbPilot';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import { useI18n } from '../../../context/I18nContext';

const ROTATION_SECONDS = 45;

export default function OrbPilotVerify() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { myPartnerId } = useMyPartner();
  const [pin, setPin] = useState<string | null>(null);
  const [expiresISO, setExpiresISO] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(ROTATION_SECONDS);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [pendingAttempts, setPendingAttempts] = useState<unknown[]>([]);
  const [activeTab, setActiveTab] = useState<'pin' | 'approvals'>('pin');

  const ringProgress = useSharedValue(1);
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringProgress.value * 360}deg` }],
  }));

  const handleRotate = useCallback(async () => {
    if (!myPartnerId) return;
    setRotating(true);
    const res = await pilotPinRotate(myPartnerId);
    if (res.success) {
      setPin(res.pin);
      setExpiresISO(res.expiresISO);
      setSecondsLeft(ROTATION_SECONDS);
      ringProgress.value = 1;
      ringProgress.value = withTiming(0, {
        duration: ROTATION_SECONDS * 1000,
        easing: Easing.linear,
      });
    } else {
      Alert.alert('Error', res.message ?? 'Could not rotate PIN');
    }
    setRotating(false);
  }, [myPartnerId]);

  const loadPin = useCallback(async () => {
    if (!myPartnerId) return;
    setLoading(true);
    const res = await pilotPinCurrent(myPartnerId);
    if (res.success) {
      setPin(res.pin);
      setExpiresISO(res.expiresISO);
      const secs = Math.max(
        0,
        Math.round((new Date(res.expiresISO).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(secs);
      ringProgress.value = withTiming(secs / ROTATION_SECONDS, { duration: 500 });
    } else {
      // Auto-rotate if none exists
      await handleRotate();
    }
    setLoading(false);
  }, [myPartnerId, handleRotate]);

  const loadActivity = useCallback(async () => {
    if (!myPartnerId) return;
    const res = await pilotPartnerActivity(myPartnerId, 20);
    if (res.success) {
      setPendingAttempts(
        (res.attempts as unknown[]).filter((a: any) => a.outcome === 'pending'),
      );
    }
  }, [myPartnerId]);

  useFocusEffect(
    useCallback(() => {
      loadPin();
      loadActivity();
    }, [loadPin, loadActivity]),
  );

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleRotate();
          return ROTATION_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleRotate]);

  const urgencyColor =
    secondsLeft > 20 ? '#22C55E' : secondsLeft > 10 ? '#F59E0B' : '#EF4444';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Verify Screen</Text>
        <TouchableOpacity
          onPress={() => { loadPin(); loadActivity(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
        {(['pin', 'approvals'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? '#7C3AED' : colors.textSecondary },
              ]}
            >
              {tab === 'pin'
                ? 'PIN Display'
                : `Approvals${pendingAttempts.length > 0 ? ` (${pendingAttempts.length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'pin' ? (
        <View style={styles.pinView}>
          {loading ? (
            <ActivityIndicator size="large" color="#7C3AED" />
          ) : (
            <>
              {/* Countdown ring */}
              <View style={styles.ringWrap}>
                <View
                  style={[
                    styles.ringOuter,
                    { borderColor: urgencyColor + '30' },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.ringIndicator,
                    ringStyle,
                    { backgroundColor: urgencyColor },
                  ]}
                />
                <Text style={[styles.secondsText, { color: urgencyColor }]}>
                  {secondsLeft}s
                </Text>
              </View>

              {/* PIN Display */}
              <Text style={[styles.pinLabel, { color: colors.textSecondary }]}>
                Current PIN
              </Text>
              <View style={styles.pinRow}>
                {(pin ?? '------').split('').map((d, i) => (
                  <View
                    key={i}
                    style={[
                      styles.pinDigitBox,
                      {
                        backgroundColor: urgencyColor + '15',
                        borderColor: urgencyColor + '40',
                      },
                    ]}
                  >
                    <Text style={[styles.pinDigit, { color: urgencyColor }]}>{d}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.pinInstr, { color: colors.textSecondary }]}>
                Show this PIN to customers at the counter
              </Text>

              {expiresISO && (
                <Text style={[styles.expiresText, { color: colors.textSecondary }]}>
                  Expires at {new Date(expiresISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
              )}

              {/* Rotate button */}
              <TouchableOpacity
                style={[styles.rotateBtn, { borderColor: '#7C3AED40' }, rotating && { opacity: 0.6 }]}
                onPress={handleRotate}
                disabled={rotating}
              >
                {rotating ? (
                  <ActivityIndicator size="small" color="#7C3AED" />
                ) : (
                  <Ionicons name="refresh" size={16} color="#7C3AED" />
                )}
                <Text style={{ color: '#7C3AED', fontWeight: '700', marginLeft: 6 }}>
                  Rotate Now
                </Text>
              </TouchableOpacity>

              {/* Instructions card */}
              <View style={[styles.instrCard, { backgroundColor: colors.card }]}>
                <View style={styles.instrRow}>
                  <View style={[styles.instrStep, { backgroundColor: '#7C3AED20' }]}>
                    <Text style={{ color: '#7C3AED', fontWeight: '800', fontSize: 13 }}>1</Text>
                  </View>
                  <Text style={[styles.instrText, { color: colors.textSecondary }]}>
                    Customer claims a slot in the OrbTap app
                  </Text>
                </View>
                <View style={styles.instrRow}>
                  <View style={[styles.instrStep, { backgroundColor: '#7C3AED20' }]}>
                    <Text style={{ color: '#7C3AED', fontWeight: '800', fontSize: 13 }}>2</Text>
                  </View>
                  <Text style={[styles.instrText, { color: colors.textSecondary }]}>
                    They come to your venue and tap &quot;Verify Visit&quot;
                  </Text>
                </View>
                <View style={styles.instrRow}>
                  <View style={[styles.instrStep, { backgroundColor: '#7C3AED20' }]}>
                    <Text style={{ color: '#7C3AED', fontWeight: '800', fontSize: 13 }}>3</Text>
                  </View>
                  <Text style={[styles.instrText, { color: colors.textSecondary }]}>
                    Show them this PIN — they enter it to receive their OT Points
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACE.base, gap: 12 }}>
          <View style={styles.approvalsHeader}>
            <Text style={[styles.approvalsTitle, { color: colors.text }]}>Pending Approvals</Text>
            <TouchableOpacity onPress={loadActivity}>
              <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {pendingAttempts.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>No pending approvals</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                Verification attempts will appear here when customers initiate a visit
              </Text>
            </View>
          ) : (
            pendingAttempts.map((a: any, i) => (
              <View
                key={i}
                style={[styles.approvalCard, { backgroundColor: colors.card }]}
              >
                <View style={[styles.approvalBadge, { backgroundColor: '#F59E0B20' }]}>
                  <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 12 }}>Pending</Text>
                </View>
                <Text style={[styles.approvalUser, { color: colors.text }]}>
                  User: {typeof a.userId === 'string' ? a.userId.slice(0, 8) + '…' : '—'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  Initiated: {a.initiatedISO ? new Date(a.initiatedISO).toLocaleTimeString() : '—'}
                </Text>
                {a.requiresPin && (
                  <Text style={{ color: '#A78BFA', fontSize: 12, marginTop: 4 }}>
                    PIN entry required
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.base,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontWeight: '700', fontSize: 13 },
  pinView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: SPACE.base,
  },
  ringWrap: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
  },
  ringIndicator: {
    position: 'absolute',
    top: 0,
    left: 56,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  secondsText: { fontSize: 28, fontWeight: '800' },
  pinLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinRow: { flexDirection: 'row', gap: 8 },
  pinDigitBox: {
    width: 44,
    height: 56,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pinDigit: { fontSize: 28, fontWeight: '800' },
  pinInstr: { fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 18 },
  expiresText: { fontSize: 11, textAlign: 'center' },
  rotateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  instrCard: { borderRadius: RADIUS.md, padding: SPACE.base, gap: 12, width: '100%', maxWidth: 320 },
  instrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  instrStep: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  instrText: { flex: 1, fontSize: 13, lineHeight: 18, marginTop: 3 },
  approvalsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  approvalsTitle: { fontSize: 15, fontWeight: '700' },
  approvalCard: { borderRadius: RADIUS.md, padding: 14, gap: 4 },
  approvalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  approvalUser: { fontSize: 14, fontWeight: '700' },
});
