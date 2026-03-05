import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const BOX_SIZE = 260;
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 68 : 56;

export type GpsLockState = 'searching' | 'locked' | 'unavailable';

interface ScannerHUDProps {
  gpsState?: GpsLockState;
  /** OT range to display as earning estimate while scanning */
  earningRange?: string;
}

export const ScannerHUD = ({ gpsState = 'searching', earningRange = '30–80 OT' }: ScannerHUDProps) => {
  const insets = useSafeAreaInsets();
  const scanLine = useSharedValue(0);

  // Sweep ring rotation
  const ringRotate = useSharedValue(0);

  // GPS pulse animation
  const gpsPulse = useSharedValue(0.5);

  const contentTop = insets.top;
  const contentBottom = height - insets.bottom;
  const contentHeight = contentBottom - contentTop;
  const reticleTop = contentTop + (contentHeight - BOX_SIZE) / 2;
  const reticleLeft = (width - BOX_SIZE) / 2;

  useEffect(() => {
    // Laser sweep
    scanLine.value = withRepeat(
      withTiming(BOX_SIZE, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );
    // Corner ring pulse
    ringRotate.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, false);
    // GPS pulse
    gpsPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 }),
      ),
      -1,
      true
    );
  }, []);

  const animatedLine = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value }],
  }));

  const gpsOpacityStyle = useAnimatedStyle(() => ({
    opacity: gpsState === 'searching' ? gpsPulse.value : 1,
  }));

  const gpsColor =
    gpsState === 'locked' ? '#22c55e' :
    gpsState === 'unavailable' ? '#f87171' :
    '#fbbf24';

  const gpsIcon =
    gpsState === 'locked' ? 'navigate' :
    gpsState === 'unavailable' ? 'navigate-outline' :
    'navigate-circle-outline';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Darkened masks — leave the reticle area clear */}
      <View style={[styles.maskTop, { height: reticleTop }]} />
      <View style={[styles.maskBottom, { top: reticleTop + BOX_SIZE, height: contentBottom - (reticleTop + BOX_SIZE) }]} />
      <View style={[styles.maskLeft, { top: reticleTop, left: 0, width: reticleLeft, height: BOX_SIZE }]} />
      <View style={[styles.maskRight, { top: reticleTop, right: 0, width: width - reticleLeft - BOX_SIZE, height: BOX_SIZE }]} />

      {/* Center Reticle */}
      <View style={[styles.reticleBox, { top: reticleTop, left: reticleLeft }]}>
        {/* Corner brackets */}
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />

        {/* Laser sweep */}
        <Animated.View style={[styles.laser, animatedLine]}>
          <LinearGradient
            colors={['transparent', COLORS.neonBlue[0], 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.laserGradient}
          />
        </Animated.View>

        <Text style={styles.status}>Align QR in frame</Text>
      </View>

      {/* GPS lock indicator — top-right corner of reticle */}
      <Animated.View style={[styles.gpsIndicator, { top: reticleTop - 32, left: reticleLeft + BOX_SIZE - 44 }, gpsOpacityStyle]}>
        <Ionicons name={gpsIcon} size={14} color={gpsColor} />
        <Text style={[styles.gpsText, { color: gpsColor }]}>
          {gpsState === 'locked' ? 'GPS' : gpsState === 'unavailable' ? 'No GPS' : 'GPS...'}
        </Text>
      </Animated.View>

      {/* Earning estimate badge — below reticle */}
      <View style={[styles.earningBadge, { top: reticleTop + BOX_SIZE + 32 }]}>
        <Text style={styles.earningBadgeText}>Earn {earningRange}</Text>
      </View>

      <View style={[styles.footer, { bottom: insets.bottom + 24 + TAB_BAR_HEIGHT }]}>
        <Text style={styles.instruction}>Scan partner QR to redeem & earn OT Points</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  maskTop: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskBottom: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskLeft: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)' },
  maskRight: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)' },
  reticleBox: {
    position: 'absolute',
    width: BOX_SIZE,
    height: BOX_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: COLORS.neonBlue[0], borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  laser: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    shadowColor: COLORS.neonBlue[0],
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  laserGradient: { width: '100%', height: 2 },
  status: {
    color: COLORS.neonBlue[0],
    fontSize: 11,
    position: 'absolute',
    bottom: -28,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  gpsIndicator: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gpsText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  earningBadge: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  earningBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    overflow: 'hidden',
  },
  footer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  instruction: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});
