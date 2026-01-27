import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TIER_COLORS } from '../constants/MockData';

// LOGIC: Streak determines Ring Color
const getStreakColor = (streak: number) => {
  if (streak > 100) return TIER_COLORS.apex; // Red
  if (streak > 30) return TIER_COLORS.legendary; // Gold
  if (streak > 14) return TIER_COLORS.rare; // Blue
  if (streak > 3) return TIER_COLORS.common; // Green
  return 'transparent';
};

interface UserBadgeProps {
  level: number;
  size?: number;
  streak?: number; // New Prop
}

export const UserBadge = ({ level, size = 40, streak = 0 }: UserBadgeProps) => {
  const ringColor = getStreakColor(streak);
  const hasRing = streak > 3;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* STREAK RING */}
      {hasRing && (
        <LinearGradient
            colors={[ringColor, 'transparent', ringColor]}
            style={[styles.ring, { borderRadius: size }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />
      )}
      
      {/* AVATAR CORE */}
      <View style={[styles.core, { 
          width: hasRing ? size - 6 : size, 
          height: hasRing ? size - 6 : size,
          borderRadius: size,
          backgroundColor: '#222' 
      }]}>
        <Ionicons name="person" size={size * 0.5} color="#fff" />
      </View>

      {/* LEVEL BADGE */}
      <View style={[styles.badge, { backgroundColor: COLORS.neonBlue[0] }]}>
        <Text style={styles.levelText}>{level}</Text>
      </View>
    </View>
  );
};

export const PartnerBadge = ({ tier, size = 40 }: { tier: string, size?: number }) => (
    <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.core, { width: size, height: size, borderRadius: size/2, backgroundColor: TIER_COLORS[tier as keyof typeof TIER_COLORS] }]}>
            <Ionicons name="business" size={size * 0.5} color="#fff" />
        </View>
    </View>
);

export const XpBar = ({ current, max, label }: any) => {
    const percent = Math.min((current / max) * 100, 100);
    return (
        <View style={styles.xpContainer}>
            <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>{label || 'LEVEL PROGRESS'}</Text>
                <Text style={styles.xpVal}>{current} / {max} XP</Text>
            </View>
            <View style={styles.track}>
                <LinearGradient
                    colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
                    style={[styles.fill, { width: `${percent}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute', width: '100%', height: '100%', opacity: 0.8 },
  core: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  badge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  levelText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  
  xpContainer: { width: '100%' },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  xpVal: { color: '#fff', fontSize: 10, fontFamily: 'monospace' },
  track: { height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%' }
});
