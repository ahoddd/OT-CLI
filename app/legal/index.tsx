import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../context/I18nContext';

const LEGAL_ROUTES: { key: string; route: string }[] = [
  { key: 'acceptableUse', route: '/legal/acceptable-use' },
  { key: 'guidelines', route: '/legal/guidelines' },
  { key: 'help', route: '/legal/help' },
  { key: 'privacy', route: '/legal/privacy' },
  { key: 'terms', route: '/legal/terms' },
];

export default function LegalDirectoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('legal.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('legal.policiesAndGuidelines')}</Text>
        {LEGAL_ROUTES.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => router.push(item.route as never)}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t('legal.' + item.key)}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  subtitle: { fontSize: 12, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rowLabel: { fontSize: 16, fontWeight: '600' },
});
