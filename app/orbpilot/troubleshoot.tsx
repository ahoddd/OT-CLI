import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const ISSUES = [
  {
    icon: 'location-outline',
    title: 'GPS Accuracy Too Low',
    body: 'Move closer to a window or step outside. Avoid basements. GPS needs clear sky view. Wait 10–15 seconds for signal to lock.',
    color: '#FBBF24',
  },
  {
    icon: 'qr-code-outline',
    title: 'QR Code Won\'t Scan',
    body: 'Ensure good lighting. Hold steady 10–20cm from the code. Clean your camera lens. Try landscape orientation.',
    color: '#7C3AED',
  },
  {
    icon: 'key-outline',
    title: 'Wrong PIN / PIN Expired',
    body: 'Ask the partner staff for the current PIN shown on their Verify screen. PINs rotate every 45 seconds — make sure it\'s the latest one.',
    color: '#EF4444',
  },
  {
    icon: 'timer-outline',
    title: 'Slot Expired Before Scanning',
    body: 'Claim slots expire after 30 minutes. Go back to the offer feed and check if new slots are available.',
    color: '#F97316',
  },
  {
    icon: 'map-outline',
    title: 'Geo Too Far',
    body: 'The system detected you more than 150m from the partner. Make sure you are inside or directly outside the venue.',
    color: '#22C55E',
  },
  {
    icon: 'hourglass-outline',
    title: 'Cooldown Active',
    body: 'Trust tier cooldowns apply between visits. Bronze: 24h, Silver: 12h, Gold: 6h, Platinum: 1h. Complete more successful visits to level up.',
    color: '#C0C0C0',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Weekly Limit Reached',
    body: 'Free users can complete 3 verified visits per week. Upgrade to Premium (6/week) or Pro (10/week) for more.',
    color: '#7C3AED',
  },
  {
    icon: 'wifi-outline',
    title: 'No Internet Connection',
    body: 'OrbPilot requires an active internet connection. Connect to Wi-Fi or cellular data before scanning.',
    color: '#6B7280',
  },
];

export default function TroubleshootScreen() {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>Verification Help</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Having trouble completing your visit? Find your issue below.
        </Text>

        {ISSUES.map((issue, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.issueCard, { backgroundColor: colors.card, borderColor: expanded === i ? issue.color + '66' : colors.border }]}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.issueHeader}>
              <View style={[styles.issueIcon, { backgroundColor: issue.color + '22' }]}>
                <Ionicons name={issue.icon as any} size={18} color={issue.color} />
              </View>
              <Text style={[styles.issueTitle, { color: colors.text }]}>{issue.title}</Text>
              <Ionicons
                name={expanded === i ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </View>
            {expanded === i && (
              <Text style={[styles.issueBody, { color: colors.textSecondary }]}>{issue.body}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Contact support */}
        <View style={[styles.supportSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="headset-outline" size={24} color="#7C3AED" />
          <Text style={[styles.supportTitle, { color: colors.text }]}>Still stuck?</Text>
          <Text style={[styles.supportBody, { color: colors.textSecondary }]}>
            If none of the above helps, contact support with your Visit ID or Attempt ID from the result screen.
          </Text>
          <TouchableOpacity
            style={[styles.supportBtn, { backgroundColor: '#7C3AED' }]}
            onPress={() => Linking.openURL('mailto:support@orbtap.com?subject=OrbPilot%20Verification%20Issue')}
          >
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  issueCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  issueHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  issueIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  issueTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  issueBody: { fontSize: 13, lineHeight: 19, marginTop: 12, paddingLeft: 48 },
  supportSection: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', marginTop: 8, gap: 10 },
  supportTitle: { fontSize: 18, fontWeight: '700' },
  supportBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  supportBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },
  supportBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
