/**
 * User Getting Started checklist — 7 steps to onboard new users.
 * Persisted to AsyncStorage with ORBTAP_USER_GETTING_STARTED_V1.
 * Auto-collapse on 100% completion.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics } from '../utils/safeHaptics';

const STORAGE_KEY = 'ORBTAP_USER_GETTING_STARTED_V1';

interface ChecklistState {
  dismissed: boolean;
  scan: boolean;
  profile: boolean;
  mission: boolean;
  orbswipe: boolean;
  sphere: boolean;
  bookmark: boolean;
  invite: boolean;
}

export interface GettingStartedUserChecklistProps {
  /** Whether user has completed first scan (verified action). */
  hasScanned: boolean;
  /** Whether profile is complete (avatar + tagline + bio). */
  hasCompleteProfile: boolean;
  /** Whether user has completed at least one mission. */
  hasCompletedMission: boolean;
  /** Whether user has tried OrbSwipe. */
  hasTriedOrbSwipe: boolean;
  /** Whether user is in at least one sphere. */
  hasJoinedSphere: boolean;
  /** Whether user has at least one bookmark. */
  hasBookmark: boolean;
  /** Whether user has shared invite. */
  hasInvited: boolean;
}

const defaultState: ChecklistState = {
  dismissed: false,
  scan: false,
  profile: false,
  mission: false,
  orbswipe: false,
  sphere: false,
  bookmark: false,
  invite: false,
};

export function GettingStartedUserChecklist({
  hasScanned,
  hasCompleteProfile,
  hasCompletedMission,
  hasTriedOrbSwipe,
  hasJoinedSphere,
  hasBookmark,
  hasInvited,
}: GettingStartedUserChecklistProps) {
  const [state, setState] = useState<ChecklistState | null>(null);
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? '#F59E0B';

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setState({ ...defaultState, ...parsed });
        } catch {
          setState(defaultState);
        }
      } else {
        setState(defaultState);
      }
    });
  }, []);

  const save = (next: ChecklistState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const step1 = hasScanned;
  const step2 = hasCompleteProfile;
  const step3 = hasCompletedMission;
  const step4 = hasTriedOrbSwipe;
  const step5 = hasJoinedSphere;
  const step6 = hasBookmark;
  const step7 = hasInvited;

  const done = [step1, step2, step3, step4, step5, step6, step7].filter(Boolean).length;

  useEffect(() => {
    if (state && !state.dismissed && done === 7) {
      save({ ...state, dismissed: true });
    }
  }, [state, done]);

  if (!state || state.dismissed) return null;

  const pct = done / 7;

  const steps = [
    {
      label: 'Scan your first QR at a local partner',
      done: step1,
      onPress: () => router.push('/(tabs)/scan' as any),
    },
    {
      label: 'Complete your profile (avatar + tagline + bio)',
      done: step2,
      onPress: () => router.push('/(tabs)/profile' as any),
    },
    {
      label: 'Do your first Daily Mission',
      done: step3,
      onPress: () => router.push('/missions' as any),
    },
    {
      label: 'Try OrbSwipe to plan your night',
      done: step4,
      onPress: () => router.push('/orbswipe' as any),
    },
    {
      label: 'Join or create a Sphere',
      done: step5,
      onPress: () => router.push('/spheres' as any),
    },
    {
      label: 'Bookmark a partner you love',
      done: step6,
      onPress: () => router.push('/(tabs)' as any),
    },
    {
      label: 'Invite a friend — earn 50 OT each',
      done: step7,
      onPress: () => router.push('/invite' as any),
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: themeGold + '40' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Getting Started</Text>
        <Text style={[styles.count, { color: themeGold }]}>{done}/7</Text>
        <TouchableOpacity onPress={() => save({ ...state, dismissed: true })} hitSlop={12}>
          <Ionicons name="close" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: themeGold, width: `${Math.round(pct * 100)}%` as any }]} />
      </View>
      {steps.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.row}
          onPress={item.done ? undefined : item.onPress}
          activeOpacity={item.done ? 1 : 0.85}
          disabled={item.done || !item.onPress}
        >
          <Ionicons
            name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
            size={18}
            color={item.done ? themeGold : colors.textSecondary}
          />
          <Text style={[styles.rowLabel, { color: item.done ? colors.textSecondary : colors.text, textDecorationLine: item.done ? 'line-through' : 'none' }]}>
            {item.label}
          </Text>
          {!item.done && item.onPress && <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const STEP_ROUTES: (() => string)[] = [
  () => '/(tabs)/scan',
  () => '/(tabs)/profile',
  () => '/missions',
  () => '/orbswipe',
  () => '/spheres',
  () => '/(tabs)',
  () => '/invite',
];

export const MAP_GET_STARTED_DISMISSED_KEY = 'ORBTAP_MAP_GET_STARTED_STRIP_DISMISSED_V1';

/** Compact strip showing the first incomplete Getting Started step. For home DoNextStrip when no active mission. */
export function GettingStartedFirstStepStrip(props: GettingStartedUserChecklistProps & {
  /** When true, show a close button and allow dismissing; call onDismiss when closed. */
  dismissable?: boolean;
  /** Called when user taps close (only when dismissable). Persist in parent if needed. */
  onDismiss?: () => void;
  /** When true, strip is collapsed (user dismissed it). Parent should persist and pass back. */
  dismissed?: boolean;
}) {
  const {
    hasScanned,
    hasCompleteProfile,
    hasCompletedMission,
    hasTriedOrbSwipe,
    hasJoinedSphere,
    hasBookmark,
    hasInvited,
    dismissable,
    onDismiss,
    dismissed,
  } = props;
  const router = useRouter();
  const steps = [
    { done: hasScanned, label: 'Scan your first QR at a local partner', icon: 'qr-code' as const, route: STEP_ROUTES[0] },
    { done: hasCompleteProfile, label: 'Complete your profile (avatar + tagline + bio)', icon: 'person' as const, route: STEP_ROUTES[1] },
    { done: hasCompletedMission, label: 'Do your first Daily Mission', icon: 'flag' as const, route: STEP_ROUTES[2] },
    { done: hasTriedOrbSwipe, label: 'Try OrbSwipe to plan your night', icon: 'swap-horizontal' as const, route: STEP_ROUTES[3] },
    { done: hasJoinedSphere, label: 'Join or create a Sphere', icon: 'people' as const, route: STEP_ROUTES[4] },
    { done: hasBookmark, label: 'Bookmark a partner you love', icon: 'bookmark' as const, route: STEP_ROUTES[5] },
    { done: hasInvited, label: 'Invite a friend — earn 50 OT each', icon: 'gift' as const, route: STEP_ROUTES[6] },
  ];
  const first = steps.find((s) => !s.done);
  if (!first || dismissed) return null;
  const { colors } = useTheme();
  const themeGold = colors.gold ?? '#F59E0B';
  return (
    <View style={[stripStyles.strip, { backgroundColor: themeGold + '22', borderColor: themeGold + '50' }]}>
      <TouchableOpacity
        style={stripStyles.stripTouch}
        onPress={() => router.push(first.route() as any)}
        activeOpacity={0.88}
      >
        <View style={[stripStyles.iconWrap, { backgroundColor: themeGold + '35' }]}>
          <Ionicons name={first.icon} size={16} color={themeGold} />
        </View>
        <View style={stripStyles.textWrap}>
          <Text style={[stripStyles.title, { color: colors.text }]} numberOfLines={1}>
            Get started: {first.label}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeGold} />
      </TouchableOpacity>
      {dismissable && onDismiss && (
        <TouchableOpacity
          style={stripStyles.closeBtn}
          onPress={() => { safeHaptics.selectionAsync(); onDismiss(); }}
          hitSlop={8}
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const stripStyles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  stripTouch: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 12, fontWeight: '700' },
  closeBtn: { padding: 4 },
});

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  title: { fontSize: 14, fontWeight: '800', flex: 1 },
  count: { fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 4, borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rowLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
});
