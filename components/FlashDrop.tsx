import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
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
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    Haptics.selectionAsync();
    setExpanded((e) => !e);
  };

  const handleGoToPartner = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExpanded(false);
    router.push('/partner/p1');
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.container, expanded && styles.containerExpanded]}
    >
      <LinearGradient
        colors={[COLORS.danger, '#b91c1c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, expanded && styles.gradientExpanded]}
      >
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Ionicons name="flame" size={expanded ? 22 : 16} color="#fff" />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.title, expanded && { fontSize: 10 }]}>{expanded ? 'FLASH DROP DETECTED' : 'Flash Drop'}</Text>
            {expanded ? (
              <Animated.View entering={FadeInDown.duration(200)}>
                <Text style={styles.sub}>CyberCafe 2077 • 5000 XP</Text>
                <Text style={styles.timer}>12m 45s left</Text>
                <TouchableOpacity
                  style={styles.cta}
                  onPress={handleGoToPartner}
                  activeOpacity={0.85}
                >
                  <Text style={styles.ctaText}>View & Redeem</Text>
                  <Ionicons name="arrow-forward" size={16} color="#000" />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Text style={styles.timerCompact}>12m left</Text>
            )}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#fff"
            style={styles.chevron}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 76,
    borderRadius: 12,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
  containerExpanded: { right: 16 },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gradientExpanded: { paddingVertical: 14, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  sub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  timer: { color: '#fff', fontWeight: '800', fontSize: 11, marginTop: 2 },
  timerCompact: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700' },
  chevron: { marginLeft: 4 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ctaText: { color: '#000', fontSize: 12, fontWeight: '800' },
});
