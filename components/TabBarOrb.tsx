import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/Colors';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  cancelAnimation
} from 'react-native-reanimated';
import { OrbIcon } from './AppLogos'; // USING NEW BRAND KIT

export const TabBarOrb = () => {
  const router = useRouter();
  const scale = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(scale);
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/orb');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handlePress}
        style={styles.touchable}
      >
        <Animated.View style={[styles.glow, animatedStyle]}>
           <LinearGradient
              colors={['#111', '#000']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
           >
              {/* THE NEW LOGO ICON */}
              <OrbIcon size={40} />
           </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { top: -20, alignItems: 'center', justifyContent: 'center' },
  touchable: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  glow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: COLORS.neonBlue[0],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: '#000'
  },
  gradient: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  }
});
