import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

const REASONS = [
  { icon: 'location-outline', text: 'Verify you are physically at the partner location' },
  { icon: 'shield-checkmark-outline', text: 'Prevent abuse and ensure verified-visit integrity' },
  { icon: 'gift-outline', text: 'Make sure your OT Points reward is properly credited' },
];

export default function LocationGateScreen() {
  const { colors } = useTheme();

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={[styles.iconRing, { borderColor: '#7C3AED44', backgroundColor: '#7C3AED11' }]}>
          <Ionicons name="location" size={52} color="#7C3AED" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Location Required</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          OrbPilot needs your precise location to verify you are at the partner.
          Without it, visits cannot be verified and rewards cannot be granted.
        </Text>

        {/* Reasons */}
        {REASONS.map((r, i) => (
          <View key={i} style={styles.reasonRow}>
            <Ionicons name={r.icon as any} size={18} color="#7C3AED" />
            <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{r.text}</Text>
          </View>
        ))}

        {/* Accuracy note */}
        <View style={[styles.note, { backgroundColor: '#FBBF2411', borderColor: '#FBBF2433' }]}>
          <Ionicons name="information-circle-outline" size={16} color="#FBBF24" />
          <Text style={[styles.noteText, { color: '#FBBF24' }]}>
            For best results, go outside or near a window. GPS requires line-of-sight accuracy ≤50m.
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#7C3AED' }]} onPress={openSettings}>
          <Ionicons name="settings-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Open Location Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  iconRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14, width: '100%' },
  reasonText: { fontSize: 14, lineHeight: 20, flex: 1 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 28, width: '100%' },
  noteText: { fontSize: 13, flex: 1, lineHeight: 18 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16, width: '100%', justifyContent: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 12 },
  secondaryBtnText: { fontSize: 15, fontWeight: '500' },
});
