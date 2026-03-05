import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../context/I18nContext';

const FALLBACK_COLORS = { background: '#0a0a0f', text: '#fff', textSecondary: '#888' };

export default function NotFoundScreen() {
  const { t } = useI18n();
  let colors = FALLBACK_COLORS;
  try {
    const theme = useTheme();
    colors = theme?.colors ?? FALLBACK_COLORS;
  } catch {
    // Outside theme provider or context failed; use fallback
  }
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('notFound.subtitle')}</Text>
        <Link href="/" style={styles.link} accessibilityRole="link" accessibilityLabel={t('notFound.goHome')}>
          <Text style={[styles.linkText, { color: colors.text }]}>{t('notFound.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
  },
});
