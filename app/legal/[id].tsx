import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  ACCEPTABLE_USE,
  COMMUNITY_GUIDELINES,
  type LegalSection,
} from '../../constants/LegalContent';
import { useI18n } from '../../context/I18nContext';

function LegalSections({ sections, colors }: { sections: LegalSection[]; colors: { text: string; textSecondary: string } }) {
  return (
    <>
      {sections.map((sec, i) => (
        <View key={i} style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{sec.title}</Text>
          <Text style={[styles.body, { color: colors.text }]}>{sec.body}</Text>
        </View>
      ))}
    </>
  );
}

export default function LegalPage() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const getTitle = () => {
    switch (id) {
      case 'tos': return 'Terms of Service';
      case 'privacy': return 'Privacy Policy';
      case 'help': return 'Help Center';
      case 'acceptable-use': return 'Acceptable Use Policy';
      case 'guidelines': return 'Community Guidelines';
      default: return 'Document';
    }
  };

  const getContent = () => {
    if (id === 'tos') return <LegalSections sections={TERMS_OF_SERVICE} colors={colors} />;
    if (id === 'privacy') return <LegalSections sections={PRIVACY_POLICY} colors={colors} />;
    if (id === 'acceptable-use') return <LegalSections sections={ACCEPTABLE_USE} colors={colors} />;
    if (id === 'guidelines') return <LegalSections sections={COMMUNITY_GUIDELINES} colors={colors} />;
    if (id === 'help') {
      return (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ACCOUNT</Text>
            <Text style={[styles.body, { color: colors.text }]}>
              <Text style={{ fontWeight: 'bold' }}>How do I reset my password?</Text>{'\n'}
              Go to the login screen and tap "Forgot Password".{'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>How do I delete my account?</Text>{'\n'}
              Go to Settings → Danger Zone → Delete account. Submit your account email to request permanent deletion of your data. We will process the request within 30 days.
            </Text>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>POINTS & REWARDS</Text>
            <Text style={[styles.body, { color: colors.text }]}>
              <Text style={{ fontWeight: 'bold' }}>My points didn't update.</Text>{'\n'}
              Pull down on the Wallet screen to refresh. If the issue persists, contact support@orbtap.com.{'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>How do I redeem?</Text>{'\n'}
              Visit a partner, scan their QR code or use the in-app redemption flow where available.
            </Text>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>SUPPORT</Text>
            <Text style={[styles.body, { color: colors.text }]}>
              Email: support@orbtap.com. For legal or privacy requests, see Terms of Service and Privacy Policy.
            </Text>
          </View>
        </>
      );
    }
    return (
      <View style={styles.section}>
        <Text style={[styles.body, { color: colors.text }]}>Select a document from Legal in Settings.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getTitle().toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {getContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  backBtn: { padding: 8 },
  content: { padding: 24 },
  body: { fontSize: 14, lineHeight: 24 },
  section: { borderBottomWidth: 1, borderBottomColor: 'rgba(100,100,100,0.1)', paddingBottom: 24, marginBottom: 24 },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
});
