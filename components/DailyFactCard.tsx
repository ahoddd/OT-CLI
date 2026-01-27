import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { FUN_FACTS } from '../constants/FunFacts';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, ZoomIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export const DailyFactCard = () => {
  const { colors, isDark } = useTheme();
  const [factIndex, setFactIndex] = useState(0);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  
  // Animation for the refresh
  const scale = useSharedValue(1);

  const getRandomFact = () => {
    Haptics.selectionAsync();
    scale.value = withSpring(0.9, {}, () => {
        scale.value = withSpring(1);
    });
    
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * FUN_FACTS.length);
    } while (newIndex === factIndex);
    
    setFactIndex(newIndex);
    setVote(null); // Reset vote
  };

  const handleVote = (type: 'up' | 'down') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVote(type);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Did you know? ${FUN_FACTS[factIndex]} - via OrbTap` });
    } catch (e) { console.log(e); }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#000'] : ['#fff', '#f0f0f5']}
        style={[styles.card, { borderColor: colors.border }]}
      >
        <View style={styles.header}>
            <View style={styles.badge}>
                <Ionicons name="bulb" size={14} color={COLORS.gold[0]} />
                <Text style={styles.badgeText}>DAILY INTEL</Text>
            </View>
            <TouchableOpacity onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>

        <Text style={[styles.factText, { color: colors.text }]}>
            "{FUN_FACTS[factIndex]}"
        </Text>

        <View style={styles.footer}>
            <View style={styles.voteRow}>
                <TouchableOpacity onPress={() => handleVote('up')} style={styles.voteBtn}>
                    <Ionicons name={vote === 'up' ? "thumbs-up" : "thumbs-up-outline"} size={20} color={vote === 'up' ? COLORS.success : colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleVote('down')} style={styles.voteBtn}>
                    <Ionicons name={vote === 'down' ? "thumbs-down" : "thumbs-down-outline"} size={20} color={vote === 'down' ? COLORS.danger : colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.nextBtn, { borderColor: colors.border }]} onPress={getRandomFact}>
                <Text style={[styles.nextText, { color: colors.text }]}>NEXT SIGNAL</Text>
                <Ionicons name="refresh" size={14} color={colors.text} />
            </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  card: { borderRadius: 20, padding: 20, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.gold[0], letterSpacing: 1 },
  factText: { fontSize: 18, fontWeight: 'bold', lineHeight: 26, marginBottom: 20, fontStyle: 'italic' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voteRow: { flexDirection: 'row', gap: 16 },
  voteBtn: { padding: 4 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  nextText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});
