import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

const COLORS = ['#00FFFF', '#FF00FF', '#FFFFFF', '#00FFFF', '#FF00FF', '#FFFFFF'] as const;
const PARTICLE_SIZE = 6;
const EXPLODE_DIST = 22;
const DURATION_MS = 500;

// 6 particles at 60° intervals
const ANGLES = [0, 60, 120, 180, 240, 300].map((deg) => (deg * Math.PI) / 180);

const PARTICLE_DATA = ANGLES.map((angle, i) => ({
  dx: EXPLODE_DIST * Math.cos(angle),
  dy: EXPLODE_DIST * Math.sin(angle),
  color: COLORS[i],
}));

function Particle({
  progress,
  dx,
  dy,
  color,
}: {
  progress: SharedValue<number>;
  dx: number;
  dy: number;
  color: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
    ],
    opacity: 1 - progress.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: PARTICLE_SIZE,
          height: PARTICLE_SIZE,
          backgroundColor: color,
          left: EXPLODE_DIST - PARTICLE_SIZE / 2,
          top: EXPLODE_DIST - PARTICLE_SIZE / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

interface TapParticlesProps {
  x: number;
  y: number;
}

export function TapParticles({ x, y }: TapParticlesProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  return (
    <View
      style={[
        styles.container,
        {
          left: x - EXPLODE_DIST - PARTICLE_SIZE / 2,
          top: y - EXPLODE_DIST - PARTICLE_SIZE / 2,
          width: (EXPLODE_DIST + PARTICLE_SIZE) * 2,
          height: (EXPLODE_DIST + PARTICLE_SIZE) * 2,
        },
      ]}
      pointerEvents="none"
    >
      {PARTICLE_DATA.map((p, i) => (
        <Particle
          key={i}
          progress={progress}
          dx={p.dx}
          dy={p.dy}
          color={p.color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  particle: {
    position: 'absolute',
    borderRadius: 1,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
    elevation: 4,
  },
});
