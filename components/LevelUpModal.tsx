/**
 * Level-up celebration modal — dismissible, exciting, haptic.
 * Shown when user crosses a level threshold so they feel rewarded and want to keep leveling.
 */

import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/Colors';
import { safeHaptics, Haptics } from '../utils/safeHaptics';

const { width } = Dimensions.get('window');
const CARD_MAX = Math.min(width - 40, 360);

export interface LevelUpInfo {
  level: number;
  title: string;
  perk: string;
  perkShort: string;
}

interface LevelUpModalProps {
  visible: boolean;
  info: LevelUpInfo | null;
  onDismiss: () => void;
}

export function LevelUpModal({ visible, info, onDismiss }: LevelUpModalProps) {
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && info) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible, info?.level]);

  if (!visible || !info) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.center, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrap}>
            <LinearGradient
              colors={[(COLORS.neonBlue?.[0] ?? '#60a5fa') + '30', themeGold + '18', 'transparent']}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerRow}>
                <View style={[styles.levelBadge, { backgroundColor: themeGold }]}>
                  <Ionicons name="trophy" size={28} color="#fff" />
                </View>
                <TouchableOpacity
                  hitSlop={16}
                  onPress={onDismiss}
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.celebrationTitle, { color: colors.text }]}>Level up!</Text>
              <View style={styles.levelRow}>
                <Text style={[styles.levelNum, { color: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}>Level {info.level}</Text>
                <Text style={[styles.levelTitle, { color: colors.text }]}>{info.title}</Text>
              </View>
              <View style={[styles.perkBox, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                <Text style={[styles.perkLabel, { color: colors.textSecondary }]}>You unlocked</Text>
                <Text style={[styles.perkText, { color: colors.text }]}>{info.perk}</Text>
              </View>
              <Text style={[styles.subline, { color: colors.textSecondary }]}>
                Keep earning OT to reach the next level — missions, scans & perks all count.
              </Text>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}
                onPress={onDismiss}
                activeOpacity={0.85}
                accessibilityLabel="Done"
                accessibilityRole="button"
              >
                <Text style={styles.doneBtnText}>Awesome!</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  cardWrap: { width: '100%', maxWidth: CARD_MAX },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  levelBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  celebrationTitle: { fontSize: 28, fontWeight: '900', marginBottom: 4, letterSpacing: 0.5 },
  levelRow: { alignItems: 'center', marginBottom: 16 },
  levelNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  levelTitle: { fontSize: 18, fontWeight: '700' },
  perkBox: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  perkLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  perkText: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  subline: { fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  doneBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
