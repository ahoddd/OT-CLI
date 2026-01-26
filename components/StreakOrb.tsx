import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';

interface StreakOrbProps {
  active: boolean;
  onTap: () => void;
  streakCount: number;
}

export const StreakOrb = ({ active, onTap, streakCount }: StreakOrbProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 1000 }), withTiming(0.4, { duration: 1000 })),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0.2);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value * 1.2 }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, glowStyle, { backgroundColor: active ? '#eab308' : '#333' }]} />
      <TouchableOpacity onPress={onTap} activeOpacity={0.8} disabled={!active}>
        <Animated.View style={[styles.orb, animatedStyle, { backgroundColor: active ? '#fbbf24' : '#222' }]}>
          <Text style={[styles.count, { color: active ? '#000' : '#666' }]}>{streakCount}</Text>
          <Text style={[styles.label, { color: active ? '#000' : '#444' }]}>DAYS</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', height: 250 },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  orb: { 
    width: 180, 
    height: 180, 
    borderRadius: 90, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  count: { fontSize: 64, fontWeight: '900' },
  label: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginTop: -4 },
});
