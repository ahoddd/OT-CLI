import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Mock Data for Analytics
const STATS = [
  { label: 'Verified Visits', value: '1,204', change: '+12%', positive: true },
  { label: 'Perk Redemptions', value: '856', change: '+8%', positive: true },
  { label: 'Avg. Rating', value: '4.9', change: '+0.1', positive: true },
  { label: 'Revenue Est.', value: '$12k', change: '+15%', positive: true },
];

const CHART_DATA = [40, 65, 50, 80, 95, 70, 85]; // Simple visual representation

export default function PartnerDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>PARTNER COMMAND</Text>
            <TouchableOpacity>
                 <Ionicons name="download-outline" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* PREMIUM BANNER */}
        <LinearGradient
            colors={[COLORS.gold[0], COLORS.gold[1]]}
            style={styles.banner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <View>
                <Text style={styles.bannerTitle}>PREMIUM TIER ACTIVE</Text>
                <Text style={styles.bannerSub}>You have access to advanced insights.</Text>
            </View>
            <Ionicons name="diamond" size={32} color="#000" />
        </LinearGradient>

        {/* STATS GRID */}
        <View style={styles.grid}>
            {STATS.map((stat, index) => (
                <View key={index} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                    <View style={styles.changeRow}>
                         <Ionicons name={stat.positive ? "arrow-up" : "arrow-down"} size={12} color={stat.positive ? COLORS.success : COLORS.danger} />
                         <Text style={{ color: stat.positive ? COLORS.success : COLORS.danger, fontSize: 12, fontWeight: 'bold' }}>{stat.change}</Text>
                    </View>
                </View>
            ))}
        </View>

        {/* VISITS CHART (Visual Only) */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>TRAFFIC VOLUME</Text>
                <View style={styles.periodBadge}>
                    <Text style={styles.periodText}>This Week</Text>
                </View>
            </View>
            
            <View style={styles.barChart}>
                {CHART_DATA.map((h, i) => (
                    <View key={i} style={styles.barColumn}>
                        <View style={[styles.barFill, { height: h, backgroundColor: i === 4 ? COLORS.neonBlue[0] : colors.border }]} />
                        <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{['M','T','W','T','F','S','S'][i]}</Text>
                    </View>
                ))}
            </View>
        </View>

        {/* RECENT VERIFIED REVIEWS */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LATEST VERIFIED INTEL</Text>
        <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.reviewHeader}>
                 <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.verifiedText}>VERIFIED VISIT</Text>
                 </View>
                 <Text style={[styles.date, { color: colors.textSecondary }]}>2m ago</Text>
            </View>
            <Text style={[styles.reviewBody, { color: colors.text }]}>"Absolutely insane atmosphere. The new layout is genius. Definitely coming back for the midnight drop."</Text>
            <View style={styles.reviewerRow}>
                <View style={styles.avatar} />
                <Text style={[styles.reviewerName, { color: colors.text }]}>Explorer_X9</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="star" size={14} color={COLORS.gold[0]} />
                <Text style={[styles.rating, { color: colors.text }]}>5.0</Text>
            </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20 },
  banner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 20 },
  bannerTitle: { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1 },
  bannerSub: { fontSize: 12, color: '#333', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: (width - 50) / 2, padding: 16, borderRadius: 16, borderWidth: 1 },
  statLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '900' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  
  chartCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  periodBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8 },
  periodText: { fontSize: 10, fontWeight: 'bold', color: '#888' },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  barColumn: { alignItems: 'center', gap: 8 },
  barFill: { width: 8, borderRadius: 4 },
  barLabel: { fontSize: 10, fontWeight: 'bold' },

  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  reviewCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74, 222, 128, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedText: { color: COLORS.success, fontSize: 10, fontWeight: 'bold' },
  date: { fontSize: 10 },
  reviewBody: { fontSize: 14, fontStyle: 'italic', marginBottom: 16, lineHeight: 20 },
  reviewerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#333' },
  reviewerName: { fontSize: 12, fontWeight: 'bold' },
  rating: { fontSize: 12, fontWeight: 'bold' }
});
