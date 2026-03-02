/**
 * QuickActionsBar — 4 tappable pill shortcuts on the Orb hub screen.
 * Scan | Map | Missions (with badge) | Wallet
 * Each pill has an accent color, icon, label, and spring press animation.
 * Scan has a pulsing live indicator. Missions shows active count badge.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { safeHaptics } from '../utils/safeHaptics';

const ACTIONS = [
  { id: 'scan',     label: 'Scan',     icon: 'qr-code', accent: '#4ADE80', route: '/(tabs)/scan',    pulsing: true },
  { id: 'map',      label: 'Map',      icon: 'map',     accent: '#60A5FA', route: '/(tabs)' },
  { id: 'missions', label: 'Missions', icon: 'flag',    accent: '#FBBF24', route: '/missions',        hasBadge: true },
  { id: 'wallet',   label: 'Wallet',   icon: 'wallet',  accent: '#A78BFA', route: '/(tabs)/wallet' },
] as const;

interface QuickActionsBarProps {
  onPress: (route: string) => void;
  missionCount: number;
  colors: any;
}

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[dotStyles.dot, { backgroundColor: color }, style]} />;
}

const dotStyles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

function ActionPill({
  action,
  missionCount,
  onPress,
  colors,
}: {
  action: (typeof ACTIONS)[number];
  missionCount: number;
  onPress: () => void;
  colors: any;
}) {
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.93, { damping: 12 }), withSpring(1, { damping: 12 }));
    safeHaptics.selectionAsync();
    onPress();
  };

  const showBadge = action.id === 'missions' && missionCount > 0;

  return (
    <Animated.View style={[pillStyles.wrapper, scaleStyle]}>
      <Pressable
        onPress={handlePress}
        style={[pillStyles.pill, { backgroundColor: colors.surface, borderColor: action.accent + '44' }]}
      >
        <View style={pillStyles.iconWrap}>
          <Ionicons name={action.icon as any} size={20} color={action.accent} />
          {action.id === 'scan' && <PulsingDot color={action.accent} />}
          {showBadge && (
            <View style={[pillStyles.badge, { backgroundColor: action.accent }]}>
              <Text style={pillStyles.badgeText}>{missionCount > 9 ? '9+' : missionCount}</Text>
            </View>
          )}
        </View>
        <Text style={[pillStyles.label, { color: action.accent }]}>{action.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function QuickActionsBar({ onPress, missionCount, colors }: QuickActionsBarProps) {
  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
        <ActionPill
          key={action.id}
          action={action}
          missionCount={missionCount}
          onPress={() => onPress(action.route)}
          colors={colors}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
});

const pillStyles = StyleSheet.create({
  wrapper: { flex: 1 },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 100,
    borderWidth: 1,
    gap: 5,
  },
  iconWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#000', fontSize: 9, fontWeight: '900' },
  label: { fontSize: 10, fontWeight: '800' },
});
