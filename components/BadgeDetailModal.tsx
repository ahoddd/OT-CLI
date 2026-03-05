/**
 * Badge detail modal — next-level, competitive, share-worthy.
 * OrbTap puns and status copy so badges feel enviable and fun.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { BlurView } from 'expo-blur';
import type { RitualBadgeDef } from '../constants/RitualBadges';
import { RITUAL_TIER_COLORS } from '../constants/RitualBadges';
import type { BadgeDef } from '../constants/Badges';

const RITUAL_PUNS: Record<string, string> = {
  COMMON: "Your friends will be jelly. Keep orb-ing.",
  RARE: "Rare air. You're in the top tier.",
  LEGENDARY: "Legend status unlocked. Flex responsibly.",
  APEX: "Apex achieved. The orb chose you.",
};

const LEGACY_CATEGORY_PUNS: Record<string, string> = {
  founding: "You were here from the start. Respect.",
  missions: "Mission-driven. The grid rewards the grind.",
  reviews: "Your voice moves the grid. Keep it real.",
  streak: "Don't break the chain. You're on fire.",
  one_time: "One shot. You nailed it.",
  partner: "Partners in the orb. Power user.",
};

function getRitualTagline(tier: string): string {
  return RITUAL_PUNS[tier] ?? "Earned. Worn. Respected.";
}

function getLegacyTagline(category: string): string {
  return LEGACY_CATEGORY_PUNS[category] ?? "Achievement unlocked. Own it.";
}

interface RitualBadgeModalProps {
  visible: boolean;
  badge: RitualBadgeDef | null;
  onClose: () => void;
}

export function RitualBadgeDetailModal({ visible, badge, onClose }: RitualBadgeModalProps) {
  const { colors, isDark } = useTheme();
  if (!visible || !badge) return null;
  const tierColor = RITUAL_TIER_COLORS[badge.tier];
  const tagline = getRitualTagline(badge.tier);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <Pressable onPress={(e) => e.stopPropagation()} style={[styles.card, { backgroundColor: colors.surface, borderColor: tierColor + '66' }]}>
          <LinearGradient
            colors={[tierColor + '35', tierColor + '12', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={[styles.iconWrap, { backgroundColor: tierColor + '28', borderColor: tierColor }]}>
            <Text style={[styles.tierLabel, { color: tierColor }]}>{badge.tier}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{badge.name}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{badge.description}</Text>
          <View style={[styles.taglineBox, { backgroundColor: colors.background + 'cc', borderColor: tierColor + '44' }]}>
            <Ionicons name="flash" size={14} color={tierColor} />
            <Text style={[styles.tagline, { color: colors.text }]}>{tagline}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.doneBtn, { backgroundColor: tierColor }]} activeOpacity={0.9}>
            <Text style={styles.doneBtnText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface LegacyBadgeModalProps {
  visible: boolean;
  badge: BadgeDef | null;
  onClose: () => void;
}

export function LegacyBadgeDetailModal({ visible, badge, onClose }: LegacyBadgeModalProps) {
  const { colors, isDark } = useTheme();
  if (!visible || !badge) return null;
  const tagline = getLegacyTagline(badge.category);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <Pressable onPress={(e) => e.stopPropagation()} style={[styles.card, { backgroundColor: colors.surface, borderColor: badge.color + '66' }]}>
          <LinearGradient
            colors={[badge.color + '35', badge.color + '12', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={[styles.iconWrap, { backgroundColor: badge.color + '28', borderColor: badge.color }]}>
            <Ionicons name={badge.icon as any} size={36} color={badge.color} />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{badge.name}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{badge.description}</Text>
          <Text style={[styles.howEarnedLabel, { color: colors.textSecondary }]}>How it was earned</Text>
          <Text style={[styles.howEarnedText, { color: colors.text }]}>{badge.howItWasEarned}</Text>
          <View style={[styles.taglineBox, { backgroundColor: colors.background + 'cc', borderColor: badge.color + '44' }]}>
            <Ionicons name="trophy" size={14} color={badge.color} />
            <Text style={[styles.tagline, { color: colors.text }]}>{tagline}</Text>
          </View>
          <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>{badge.category}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.doneBtn, { backgroundColor: badge.color }]} activeOpacity={0.9}>
            <Text style={styles.doneBtnText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 2,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  howEarnedLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  howEarnedText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  taglineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    flex: 1,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  doneBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    minWidth: 140,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
});
