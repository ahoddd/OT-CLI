import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withTiming,
  withRepeat,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';

interface NavOrbProps {
  focused: boolean;
  onPress: () => void;
}

export const NavOrb = ({ focused, onPress }: NavOrbProps) => {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const router = useRouter();
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Heartbeat / Breathing Animation
  useEffect(() => {
    // Continuous subtle pulse to show it's "alive"
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * 1.4 }],
    opacity: focused ? 0.6 : pulseOpacity.value, 
  }));

  const handlePressIn = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleLongPress = () => {
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSequence(withSpring(1.2), withSpring(1));
    router.push('/(tabs)/scan');
  };

  return (
    <Pressable
      onPress={() => {
        safeHaptics.selectionAsync();
        onPress();
      }}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={500}
      style={styles.container}
    >
      <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />
      
      <Animated.View style={[styles.orbWrapper, { shadowColor: themeGold }, animatedOrbStyle]}>
        <LinearGradient
          // Explicitly cast the fallback array to [string, string] to match the prop type
          colors={focused ? (COLORS.gold as any) : ['#333', '#111']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="flash" size={28} color={focused ? '#000' : '#666'} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
  },
  orbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  gradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.neonBlue[0],
    zIndex: -1,
  }
});
