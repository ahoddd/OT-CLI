/**
 * Tutorials list — replay any guided tutorial. Linked from Settings.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { TUTORIALS } from '../../constants/Tutorials';
import { GuidedTutorialOverlay } from '../../components/GuidedTutorialOverlay';
import { useI18n } from '../../context/I18nContext';

export default function TutorialsListScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const [replayId, setReplayId] = useState<string | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Tutorials</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Learn how to use OrbTap. Tap any topic to start a short guided tutorial.
        </Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {TUTORIALS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setReplayId(t.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.surfaceHighlight }]}>
                <Ionicons name="school-outline" size={22} color={colors.text} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{t.title}</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {t.shortDescription}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <GuidedTutorialOverlay
        visible={replayId !== null}
        tutorialId={replayId ?? ''}
        onClose={() => setReplayId(null)}
        replayMode
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  placeholder: { width: 40 },
  subtitle: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowContent: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  rowSub: { fontSize: 13 },
});
