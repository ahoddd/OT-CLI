import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

const SOP_STEPS = [
  { icon: 'print-outline', title: 'Print QR Sign', body: 'Download and print your unique OrbPilot QR sign from the Verify tab. Use A5 size, laminated preferred.' },
  { icon: 'location-outline', title: 'Place at Entry', body: 'Post the sign at eye level near your entrance or counter where staff can see it. Avoid windows with glare.' },
  { icon: 'people-outline', title: 'Brief Your Staff', body: 'Tell staff: "When a customer shows their OrbTap app, tell them the 6-digit PIN shown on the Verify screen."' },
  { icon: 'shield-checkmark-outline', title: 'Customer Scans', body: 'Customer scans the QR code with the OrbTap app, enters the PIN, and gets their OT Points within seconds.' },
  { icon: 'checkmark-circle-outline', title: 'You Get Credited', body: 'Each verified visit is logged. You only pay for verified outcomes — no shows cost nothing.' },
];

const STAFF_SCRIPT = `"Hi! Our OrbPilot QR is posted near the [entrance/counter].

When a customer scans it and asks for the PIN, just tell them the 6-digit code on our Verify screen — it changes every 45 seconds.

If they have trouble, the app shows a 'Troubleshoot' button that explains what to do."`;

const FAQ = [
  { q: 'What if the PIN expires?', a: 'The PIN rotates every 45 seconds automatically. Just read the current PIN shown on your Verify screen. There\u2019s a 10-second grace period after rotation.' },
  { q: 'What if a customer has trouble scanning?', a: 'They can tap "Troubleshoot" in the OrbTap app for camera/location help. You can also show them the QR code directly on your phone.' },
  { q: 'Can a user claim the reward twice?', a: 'No. The engine enforces per-user cooldowns and weekly caps. Each verified visit is logged with a unique slot ID.' },
  { q: 'What if GPS fails?', a: 'Verification requires GPS accuracy \u226450m. Poor indoor signal is the most common cause. Ask the customer to step outside briefly.' },
  { q: 'How do I dispute a visit I think was fraudulent?', a: 'Go to the Disputes tab and submit with the Visit ID. Admin reviews within 24\u201348h.' },
];

export default function VerificationHelpScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>Verification Guide</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Everything your team needs to run OrbPilot smoothly.
        </Text>

        {/* SOP Steps */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Setup SOP</Text>
        {SOP_STEPS.map((step, i) => (
          <View key={i} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.stepIconWrap}>
              <Ionicons name={step.icon as any} size={22} color="#7C3AED" />
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>{i + 1}. {step.title}</Text>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step.body}</Text>
            </View>
          </View>
        ))}

        {/* Staff Script */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>60-Second Staff Script</Text>
        <View style={[styles.scriptCard, { backgroundColor: '#7C3AED11', borderColor: '#7C3AED44' }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#7C3AED" style={{ marginBottom: 10 }} />
          <Text style={[styles.scriptText, { color: colors.text }]}>{STAFF_SCRIPT}</Text>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>FAQ</Text>
        {FAQ.map((item, i) => (
          <View key={i} style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.faqQ, { color: colors.text }]}>Q: {item.q}</Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>{item.a}</Text>
          </View>
        ))}

        {/* Support Link */}
        <TouchableOpacity
          style={styles.supportBtn}
          onPress={() => Linking.openURL('mailto:partners@orbtap.com?subject=OrbPilot%20Verification%20Help')}
        >
          <Ionicons name="mail-outline" size={16} color="#7C3AED" />
          <Text style={[styles.supportText, { color: '#7C3AED' }]}>Contact partner support</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  sectionHeader: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  stepCard: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 14, alignItems: 'flex-start' },
  stepIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED22', alignItems: 'center', justifyContent: 'center' },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  stepText: { fontSize: 13, lineHeight: 18 },
  scriptCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 8 },
  scriptText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  faqCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  faqQ: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  faqA: { fontSize: 13, lineHeight: 18 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, justifyContent: 'center', marginTop: 8 },
  supportText: { fontSize: 15, fontWeight: '600' },
});
