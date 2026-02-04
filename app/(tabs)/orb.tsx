import { useState } from 'react';
import MasterDirectory from '../../components/MasterDirectory';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { DailyFactCard } from '../../components/DailyFactCard';
import { DailyStreakOrb } from '../../components/DailyStreakOrb';
import { FeaturedPartnerCard } from '../../components/FeaturedPartnerCard';
import { getFeaturedPartner } from '../../constants/MockData';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function OrbHubScreen() {
  const [dirVisible, setDirVisible] = useState(false);

  const router = useRouter();
  const { colors, isDark } = useTheme();
  const featuredPartner = getFeaturedPartner();

  const handleNav = (route: string) => {
    Haptics.selectionAsync();
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Master Directory Overlay */}
      <MasterDirectory visible={dirVisible} onClose={() => setDirVisible(false)} />
      
      {/* Temp Trigger Button */}
      <TouchableOpacity 
        onPress={() => setDirVisible(true)}
        style={{ position: 'absolute', top: 60, right: 20, zIndex: 9999, backgroundColor: '#222', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#444' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>MENU</Text>
      </TouchableOpacity>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* HEADER */}
            <View style={styles.header}>
                <Image source={require('../../assets/images/icon.png')} style={styles.headerLogo} resizeMode="contain" />
                <View>
                  <Text style={[styles.welcome, { color: colors.textSecondary }]}>WELCOME BACK</Text>
                  <Text style={[styles.title, { color: colors.text }]}>COMMAND CENTER</Text>
                </View>
            </View>

            {/* THE DAILY RITUAL (Streak Orb) */}
            <DailyStreakOrb />

            {/* FEATURED PARTNER — prime ad spot; drives foot traffic; businesses pay for this placement */}
            {featuredPartner && (
              <View style={styles.featuredSection}>
                <Text style={[styles.featuredLabel, { color: colors.textSecondary }]}>FEATURED PARTNER</Text>
                <FeaturedPartnerCard partner={featuredPartner} />
              </View>
            )}

            {/* QUICK ACTIONS GRID */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUICK ACTIONS</Text>
            <View style={styles.grid}>
                <TouchableOpacity 
                    style={[styles.gridItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleNav('/missions')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                        <Ionicons name="flag" size={24} color={COLORS.gold[0]} />
                    </View>
                    <Text style={[styles.gridLabel, { color: colors.text }]}>Missions</Text>
                    <Text style={[styles.gridSub, { color: colors.textSecondary }]}>Earn OT Points</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.gridItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleNav('/vote')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(96, 165, 250, 0.1)' }]}>
                        <Ionicons name="stats-chart" size={24} color={COLORS.neonBlue[0]} />
                    </View>
                    <Text style={[styles.gridLabel, { color: colors.text }]}>OrbVote</Text>
                    <Text style={[styles.gridSub, { color: colors.textSecondary }]}>Earn XP</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.gridItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleNav('/leaderboard')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                        <Ionicons name="trophy" size={24} color={COLORS.gold[0]} />
                    </View>
                    <Text style={[styles.gridLabel, { color: colors.text }]}>Legends</Text>
                    <Text style={[styles.gridSub, { color: colors.textSecondary }]}>Rankings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.gridItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => router.push('/(tabs)/scan')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                        <Ionicons name="qr-code" size={24} color={COLORS.success} />
                    </View>
                    <Text style={[styles.gridLabel, { color: colors.text }]}>Scan</Text>
                    <Text style={[styles.gridSub, { color: colors.textSecondary }]}>Redeem</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.gridItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => router.push('/(tabs)/wallet')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                        <Ionicons name="wallet" size={24} color={COLORS.danger} />
                    </View>
                    <Text style={[styles.gridLabel, { color: colors.text }]}>Vault</Text>
                    <Text style={[styles.gridSub, { color: colors.textSecondary }]}>Assets</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.gridItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleNav('/spheres')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                        <Ionicons name="people" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.gridLabel, { color: colors.text }]}>Spheres</Text>
                    <Text style={[styles.gridSub, { color: colors.textSecondary }]}>Groups & pool</Text>
                </TouchableOpacity>
            </View>

            {/* DAILY FACT */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>KNOWLEDGE BASE</Text>
            <DailyFactCard />

            {/* SPHERES — invite-only groups, pool & share */}
            <TouchableOpacity style={[styles.teaser, { borderColor: colors.border }]} onPress={() => handleNav('/spheres')} activeOpacity={0.9}>
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.teaserGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Ionicons name="people" size={24} color="#fff" />
                    <View>
                        <Text style={styles.teaserTitle}>SPHERES</Text>
                        <Text style={styles.teaserSub}>Invite-only groups. Pool OT Points. Share experiences.</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  headerLogo: { width: 44, height: 36 },
  welcome: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12, marginTop: 12 },
  featuredSection: { marginTop: 20, marginBottom: 4 },
  featuredLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  gridSub: { fontSize: 10 },

  teaser: { marginTop: 24, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  teaserGrad: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  teaserTitle: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  teaserSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold' }
});
