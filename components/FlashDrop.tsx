import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export const FlashDrop = () => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }]
  }));

  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In a real app, this would route to the specific drop location
    router.push('/partner/p1'); 
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={handlePress}
      style={styles.container}
    >
      <LinearGradient
        colors={[COLORS.danger, '#b91c1c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.left}>
            <Animated.View style={[styles.iconBox, animatedStyle]}>
                <Ionicons name="flame" size={18} color="#fff" />
            </Animated.View>
            <View>
                <Text style={styles.title}>FLASH DROP DETECTED</Text>
                <Text style={styles.sub}>CyberCafe • 5000 XP • <Text style={styles.timer}>12m 45s left</Text></Text>
            </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 70, // Leave room for the toggle button
    borderRadius: 16,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold' },
  timer: { color: '#fff', fontWeight: '900' }
});
