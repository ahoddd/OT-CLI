/**
 * Orb Signal — How odds are calculated (explainer).
 * Linked from orbsignal index "How are odds calculated?"
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../context/I18nContext';

export default function HowOddsCalculatedScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>How odds are calculated</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Orb Signal odds reflect the current distribution of forecasts (votes) placed by the community. When more people forecast one outcome, that outcome’s implied likelihood goes up.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Odds are for entertainment only. They are not financial advice and do not guarantee outcomes. OT Points have no cash value.
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          You can vote with OT Points to back an outcome. Your vote affects the displayed odds for everyone.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
});
