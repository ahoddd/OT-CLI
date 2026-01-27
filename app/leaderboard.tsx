import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { LinearGradient } from 'expo-linear-gradient';

// MOCK DATA
const USERS = [
  { id: '1', name: 'Neo_Anderson', val: '154,200 XP', badge: 'The One' },
  { id: '2', name: 'Trinity_Prime', val: '142,500 XP', badge: 'Operator' },
  { id: '3', name: 'Morpheus_X', val: '128,900 XP', badge: 'Captain' },
];

const PARTNERS = [
  { id: 'p1', name: 'CyberCafe 2077', val: '12.5k Visits', tier: 'Apex' },
  { id: 'p2', name: 'The Void Club', val: '9.8k Visits', tier: 'Apex' },
];

const SPHERES = [
  { id: 's1', name: 'Neon Raiders', val: '1.2M XP', badge: 'Dominant' },
  { id: 's2', name: 'SoHo Elites', val: '980k XP', badge: 'Challenger' },
];

const STREAKS = [
  { id: 'st1', name: 'Daily_Grinder', val: '420 Days', badge: 'Immortal' },
  { id: 'st2', name: 'Consistency_King', val: '365 Days', badge: 'Legend' },
  { id: 'st3', name: 'Tap_Master', val: '200 Days', badge: 'Veteran' },
  { id: 'st4', name: 'New_Recruit', val: '45 Days', badge: 'Rising' },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [tab, setTab] = useState<'users' | 'partners' | 'spheres' | 'streaks'>('users');

  const getData = () => {
    switch(tab) {
        case 'users': return USERS;
        case 'partners': return PARTNERS;
        case 'spheres': return SPHERES;
        case 'streaks': return STREAKS;
    }
  };

  const getLabel = (t: string) => {
    if (t === 'users') return 'EXPLORERS';
    if (t === 'partners') return 'BUSINESS';
    if (t === 'spheres') return 'SPHERES';
    if (t === 'streaks') return 'STREAKS';
    return '';
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>LOCAL LEGENDS</Text>
            <View style={{ width: 40 }} />
        </View>

        {/* TABS */}
        <View style={styles.tabRow}>
            {['users', 'partners', 'spheres', 'streaks'].map((t) => (
                <TouchableOpacity 
                    key={t}
                    style={[styles.tab, tab === t && styles.activeTab]} 
                    onPress={() => setTab(t as any)}
                >
                    <Text style={[styles.tabText, { color: tab === t ? '#000' : colors.textSecondary }]}>
                        {getLabel(t)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
      </SafeAreaView>

      <LinearGradient 
        colors={isDark ? [COLORS.gold[0] + '20', 'transparent'] : [COLORS.gold[0] + '40', 'transparent']} 
        style={styles.glow} 
      />

      <FlatList
        data={getData() as any}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
            <LeaderboardRow 
                rank={index + 1}
                name={item.name}
                score={(item as any).val}
                subtext={tab === 'partners' ? (item as any).tier : (item as any).badge}
                isPartner={tab === 'partners'}
            />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  backBtn: { padding: 8 },
  
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 6 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(100,100,100,0.2)' },
  activeTab: { backgroundColor: COLORS.gold[0], borderColor: COLORS.gold[0] },
  tabText: { fontWeight: 'bold', fontSize: 9, letterSpacing: 0.5 },

  glow: { height: 20, width: '100%' },
  list: { padding: 16, paddingBottom: 100 }
});
