import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../context/I18nContext';

const HELP_SECTIONS = [
  {
    title: 'ACCOUNT',
    body: 'How do I reset my password?\nGo to the login screen and tap "Forgot Password".\n\nHow do I delete my account?\nGo to Settings → Danger Zone → Delete account. Submit your account email to request permanent deletion of your data. We will process the request within 30 days.',
  },
  {
    title: 'POINTS & REWARDS',
    body: 'My points didn\'t update.\nPull down on the Wallet screen to refresh. If the issue persists, contact support@orbtap.com.\n\nHow do I redeem?\nVisit a partner, scan their QR code or use the in-app redemption flow where available.',
  },
  {
    title: 'SUPPORT',
    body: 'Email: support@orbtap.com. For legal or privacy requests, see Terms of Service and Privacy Policy.',
  },
];

export default function HelpScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('legal.help')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {HELP_SECTIONS.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary ?? '#888' }]}>{sec.title}</Text>
            <Text style={[styles.body, { color: colors.text }]}>{sec.body}</Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 24, paddingBottom: 80 },
  body: { fontSize: 14, lineHeight: 24 },
  section: { borderBottomWidth: 1, borderBottomColor: 'rgba(100,100,100,0.1)', paddingBottom: 24, marginBottom: 24 },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
});
