import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useStreak } from '../hooks/useStreak';
import { useSocial } from '../hooks/useSocial';
import { getSphereTierForXp } from '../constants/SphereLevels';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { OrbTapLogoImage } from '../components/AppLogos';
import * as Haptics from 'expo-haptics';

const USERS = [
  { id: '1', name: 'Neo_Anderson', val: '154,200 XP', badge: 'The One' },
  { id: '2', name: 'Trinity_Prime', val: '142,500 XP', badge: 'Operator' },
  { id: '3', name: 'Morpheus_X', val: '128,900 XP', badge: 'Captain' },
];

const PARTNERS = [
  { id: 'p1', name: 'CyberCafe 2077', val: '12.5k Visits', tier: 'Apex' },
  { id: 'p2', name: 'The Void Club', val: '9.8k Visits', tier: 'Apex' },
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
  const { streak } = useStreak();
  const { circles } = useSocial();
  const [tab, setTab] = useState<'users' | 'partners' | 'spheres' | 'streaks'>('users');

  const sphereLeaderboard = useMemo(() => {
    const publicCircles = circles.filter((c) => c.isPublic !== false);
    return [...publicCircles]
      .sort((a, b) => (b.sphereXp ?? 0) - (a.sphereXp ?? 0))
      .map((c) => {
        const tier = getSphereTierForXp(c.sphereXp ?? 0);
        const val = (c.sphereXp ?? 0) >= 1000
          ? `${((c.sphereXp ?? 0) / 1000).toFixed(1)}k XP`
          : `${c.sphereXp ?? 0} XP`;
        return { id: c.id, name: c.name, val, badge: tier.title };
      });
  }, [circles]);

  const getData = () => {
    switch (tab) {
      case 'users': return USERS;
      case 'partners': return PARTNERS;
      case 'spheres': return sphereLeaderboard;
      case 'streaks': return STREAKS;
    }
  };

  const getLabel = (t: string) => {
    if (t === 'users') return 'EXPLORERS';
    if (t === 'partners') return 'BUSINESS';
    if (t === 'spheres') return 'SPHERES';
    if (t === 'streaks') return 'STREAKS';
    return '';
  };

  const handleShareRank = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `I'm on the OrbTap Local Legends leaderboard — ${streak.currentStreak} day streak. Join the grid.`,
        title: 'OrbTap Legends',
      });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Legends</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero: logo variant + psychology copy */}
        <View style={[styles.hero, { backgroundColor: isDark ? '#0a0a0a' : '#f8f8f8' }]}>
          <LinearGradient
            colors={[COLORS.gold[0] + '25', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.heroLogoWrap}>
            <OrbTapLogoImage width={72} height={54} />
            <View style={[styles.trophyBadge, { backgroundColor: COLORS.gold[0] + '30', borderColor: COLORS.gold[0] }]}>
              <Ionicons name="trophy" size={28} color={COLORS.gold[0]} />
            </View>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>LOCAL LEGENDS</Text>
          <Text style={[styles.heroTagline, { color: colors.textSecondary }]}>
            Where the best in your city rise
          </Text>
          <Text style={[styles.heroProof, { color: colors.textSecondary }]}>
            Join 12k+ explorers on the leaderboard
          </Text>
          <View style={[styles.yourStreak, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flame" size={18} color={COLORS.gold[0]} />
            <Text style={[styles.yourStreakText, { color: colors.text }]}>Your streak: {streak.currentStreak} days</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {['users', 'partners', 'spheres', 'streaks'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && { backgroundColor: COLORS.gold[0], borderColor: COLORS.gold[0] }, { borderColor: colors.border }]}
              onPress={() => { Haptics.selectionAsync(); setTab(t as any); }}
            >
              <Text style={[styles.tabText, { color: tab === t ? '#000' : colors.textSecondary }]}>
                {getLabel(t)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      <FlatList
        data={getData() as any}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          tab === 'spheres' ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => { Haptics.selectionAsync(); router.push(`/spheres/${item.id}` as any); }}
            >
              <LeaderboardRow
                rank={index + 1}
                name={item.name}
                score={(item as any).val}
                subtext={(item as any).badge}
                isPartner={false}
              />
            </TouchableOpacity>
          ) : (
            <LeaderboardRow
              rank={index + 1}
              name={item.name}
              score={(item as any).val}
              subtext={tab === 'partners' ? (item as any).tier : (item as any).badge}
              isPartner={tab === 'partners'}
            />
          )
        )}
      />

      {/* Subtle share CTA — psychology: make it feel like their idea */}
      <View style={[styles.shareWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sharePrompt, { color: colors.textSecondary }]}>Proud of your rank?</Text>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: COLORS.gold[0] + '25', borderColor: COLORS.gold[0] }]} onPress={handleShareRank}>
          <Ionicons name="share-outline" size={18} color={COLORS.gold[0]} />
          <Text style={[styles.shareBtnText, { color: COLORS.gold[0] }]}>Share your streak</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  backBtn: { padding: 8 },
  hero: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  heroLogoWrap: { position: 'relative', marginBottom: 12 },
  trophyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  heroTagline: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  heroProof: { fontSize: 12, fontWeight: '500', marginBottom: 12 },
  yourStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  yourStreakText: { fontSize: 14, fontWeight: '700' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1 },
  tabText: { fontWeight: 'bold', fontSize: 9, letterSpacing: 0.5 },
  list: { padding: 16, paddingBottom: 120 },
  shareWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  sharePrompt: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  shareBtnText: { fontSize: 14, fontWeight: '700' },
});
