import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';

export default function PartnerApplyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Featured & Sponsored</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient
              colors={[COLORS.neonBlue[0] + '30', COLORS.gold[0] + '20']}
              style={styles.heroGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="megaphone" size={48} color={COLORS.neonBlue[0]} />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Get prime placement</Text>
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                Featured (slot 1) and Sponsored (slot 2) perks appear first on the grid. More eyes, more visits.
              </Text>
            </LinearGradient>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HOW IT WORKS</Text>
          <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: COLORS.neonBlue[0] }]}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>Apply as a partner in the app</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: COLORS.neonBlue[0] }]}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>Complete guided tutorials (logo, perk photos, terms)</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: COLORS.gold[0] }]}>
                <Text style={[styles.stepNumText, { color: '#000' }]}>3</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>Request Featured or Sponsored placement</Text>
            </View>
          </View>
          <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>
            Partner applications and guided tutorials are coming soon. We’ll use AI to tailor perks and missions to users—and to help partners stand out.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.neonBlue[0] }]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryBtnText}>Back to grid</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 20, paddingBottom: 100 },
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  heroGrad: { padding: 24, alignItems: 'center' },
  heroTitle: { fontSize: 20, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  stepCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stepNum: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  comingSoon: { fontSize: 13, lineHeight: 20, marginBottom: 24, fontStyle: 'italic' },
  primaryBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
