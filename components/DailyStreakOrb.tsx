import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withRepeat,
  withSequence,
  Layout,
  FadeIn
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useWallet } from '../hooks/useWallet'; // IMPORT WALLET
import * as Haptics from 'expo-haptics';

const ORB_SIZE = 140;

export const DailyStreakOrb = () => {
  const { colors } = useTheme();
  const { addTransaction } = useWallet(); // GET ACTION
  const [status, setStatus] = useState<'idle' | 'revealing' | 'complete'>('idle');
  const [reward, setReward] = useState<string>('');
  const [streak, setStreak] = useState(14); 

  const pulse = useSharedValue(1);
  const shiftOpacity = useSharedValue(0);

  useEffect(() => {
    if (status === 'idle') {
      pulse.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 2500 }), withTiming(1, { duration: 2500 })),
        -1, true
      );
      shiftOpacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 3000 }), withTiming(0, { duration: 3000 })),
        -1, true
      );
    }
  }, [status]);

  const handleTap = () => {
    if (status !== 'idle') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setStatus('revealing');
    pulse.value = withSequence(withTiming(0.9, { duration: 100 }), withSpring(1.1));
    
    // PAYOUT LOGIC
    const prizes = [
        { label: "+50 PTS", amount: 50 },
        { label: "+25 PTS", amount: 25 },
        { label: "+100 PTS", amount: 100 }, // Rare
        { label: "+10 PTS", amount: 10 }
    ];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    setReward(prize.label);
    
    // Add to Wallet immediately
    addTransaction(prize.amount, `Daily Streak Reward (${streak + 1})`);

    setTimeout(() => { 
        setStreak(s => s + 1); 
        setStatus('complete'); 
    }, 2500);
  };

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const shiftStyle = useAnimatedStyle(() => ({ opacity: shiftOpacity.value }));

  if (status === 'complete') {
    return (
      <Animated.View entering={FadeIn} layout={Layout.springify()} style={[styles.minBar, { backgroundColor: colors.surface, borderColor: COLORS.gold[0] }]}>
        <View style={styles.minLeft}>
            <LinearGradient colors={[COLORS.gold[0], '#b45309']} style={styles.fireBadge}>
                <Ionicons name="flame" size={16} color="#fff" />
            </LinearGradient>
            <View>
                <Text style={[styles.minTitle, { color: colors.text }]}>{streak} DAY STREAK</Text>
                <Text style={[styles.minSub, { color: COLORS.success }]}>{reward} Collected</Text>
            </View>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
      </Animated.View>
    );
  }

  return (
    <Animated.View layout={Layout.springify()} style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleTap} style={styles.touchable}>
        <Animated.View style={[styles.orb, orbStyle]}>
            <LinearGradient colors={[COLORS.gold[0], '#d97706']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Animated.View style={[StyleSheet.absoluteFill, shiftStyle]}>
                <LinearGradient colors={[COLORS.neonBlue[0], '#8b5cf6']} style={StyleSheet.absoluteFill} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} />
            </Animated.View>
            <LinearGradient colors={['rgba(255,255,255,0.6)', 'transparent']} style={styles.shine} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} />
            <View style={styles.content}>
                {status === 'revealing' ? (
                    <>
                        <Ionicons name="gift" size={40} color="#fff" />
                        <Text style={styles.rewardText}>{reward}</Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="finger-print" size={48} color="rgba(0,0,0,0.4)" />
                        <Text style={styles.tapText}>TAP</Text>
                    </>
                )}
            </View>
        </Animated.View>
      </TouchableOpacity>
      {status === 'idle' && (
          <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>STREAK: {streak}</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  touchable: { borderRadius: 100, shadowColor: COLORS.gold[0], shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10 },
  orb: { width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  shine: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  content: { alignItems: 'center', gap: 4, zIndex: 10 },
  tapText: { fontSize: 12, fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: 2 },
  rewardText: { fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'center' },
  streakLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 12, opacity: 0.7 },
  minBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, marginBottom: 20, borderWidth: 1, width: '100%' },
  minLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fireBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  minTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  minSub: { fontSize: 10, fontWeight: 'bold' }
});
