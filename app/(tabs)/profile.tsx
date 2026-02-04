import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocial } from '../../hooks/useSocial';
import { useWallet } from '../../hooks/useWallet';
import { useGamification } from '../../hooks/useGamification';
import { useStreak } from '../../hooks/useStreak';
import { useTheme } from '../../hooks/useTheme';
import { usePreferences } from '../../hooks/usePreferences';
import { UserBadge, XpBar } from '../../components/GamificationUI';
import { Ionicons } from '@expo/vector-icons';
import { TIER_COLORS } from '../../constants/MockData';
import { COLORS } from '../../constants/Colors';
import { AmbassadorCard } from '../../components/AmbassadorCard';
import { EditProfileSheet } from '../../components/EditProfileSheet';
import { BadgePill } from '../../components/BadgePill';
import { useAuth } from '../../context/AuthContext';
import { useBadges } from '../../hooks/useBadges';
import { PremiumBadge } from '../../components/PremiumBadge';
import { LinearGradient } from 'expo-linear-gradient';
import { isAdminEmail } from '../../constants/Admin';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { getFollowedPartners, getPublicCircles } = useSocial();
  const publicCircles = getPublicCircles();
  const { balance } = useWallet();
  const { rank } = useGamification();
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const { streak: streakState } = useStreak();
  const { earnedBadges, foundingStats, hasBadge } = useBadges();
  const followed = getFollowedPartners();

  const founding500Left = Math.max(0, foundingStats.founding500SpotsLeft);
  const showFoundingUrgency = founding500Left > 0 && founding500Left <= 500;

  const [editVisible, setEditVisible] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "Explorer One");
  const [bio, setBio] = useState("Exploring the grid, one orb at a time.");
  const [avatar, setAvatar] = useState<string | null>(null);

  const streak = streakState.currentStreak; 

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EditProfileSheet 
        visible={editVisible} 
        onClose={() => setEditVisible(false)}
        currentName={displayName}
        currentBio={bio}
        currentImage={avatar || undefined}
        onSave={(n, b, img) => { setDisplayName(n); setBio(b); if(img) setAvatar(img); }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.coverContainer}>
            <LinearGradient colors={[COLORS.neonBlue[0], 'transparent']} style={styles.coverGradient} />
            <SafeAreaView edges={['top']} style={styles.topBar}>
                 {prefs.partnerMode && (
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: COLORS.gold[0], marginRight: 'auto' }]} onPress={() => router.push('/partner/dashboard' as any)}>
                        <Ionicons name="bar-chart" size={20} color="#000" />
                    </TouchableOpacity>
                 )}
                 <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => router.push('/leaderboard' as any)}>
                    <Ionicons name="trophy" size={20} color={COLORS.gold[0]} />
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => setEditVisible(true)}>
                    <Ionicons name="pencil" size={20} color={colors.text} />
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => router.push('/settings' as any)}>
                    <Ionicons name="settings-sharp" size={20} color={colors.text} />
                 </TouchableOpacity>
                 {isAdminEmail(user?.email) && (
                   <TouchableOpacity style={[styles.iconBtn, { backgroundColor: COLORS.gold[0] }]} onPress={() => router.push('/admin' as any)}>
                     <Ionicons name="construct" size={20} color="#000" />
                   </TouchableOpacity>
                 )}
            </SafeAreaView>
        </View>

        <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
                <TouchableOpacity onPress={() => setEditVisible(true)}>
                    {avatar ? (
                        <View style={{ borderWidth: 2, borderColor: COLORS.gold[0], borderRadius: 44, padding: 2 }}>
                             <Image source={{ uri: avatar }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                        </View>
                    ) : (
                        <UserBadge level={rank.level} size={80} streak={streak} />
                    )}
                </TouchableOpacity>
                <View style={styles.identityText}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.username, { color: colors.text }]}>{displayName}</Text>
                      {(prefs.premiumMember ?? false) && (
                        <View style={styles.premiumBadgeWrap}>
                          <PremiumBadge variant="compact" size={18} />
                        </View>
                      )}
                    </View>
                    <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
                        <Text style={[styles.rankTitle, { color: COLORS.neonBlue[0] }]}>{rank.title.toUpperCase()}</Text>
                        <View style={{backgroundColor: COLORS.gold[0], paddingHorizontal: 6, borderRadius: 4}}>
                            <Text style={{fontSize: 9, fontWeight:'bold'}}>{streak} DAY STREAK</Text>
                        </View>
                    </View>
                    <Text style={[styles.bio, { color: colors.textSecondary }]}>{bio}</Text>
                </View>
            </View>
            
            <View style={styles.xpWrapper}>
                <XpBar
                  current={rank.xp}
                  max={rank.nextLevelXp}
                  label={rank.perkShort}
                  levelTitle={rank.title}
                  nextLevelTitle={rank.nextLevelTitle}
                  nextLevelPerk={rank.nextLevelPerk ?? undefined}
                  isMaxLevel={rank.isMaxLevel}
                />
            </View>
            {!rank.isMaxLevel && rank.nextLevelPerk && (
              <View style={[styles.nextLevelCard, { backgroundColor: colors.surface, borderColor: COLORS.neonBlue[0] }]}>
                <Text style={[styles.nextLevelLabel, { color: colors.textSecondary }]}>UPGRADE TO UNLOCK</Text>
                <Text style={[styles.nextLevelPerk, { color: colors.text }]}>{rank.nextLevelPerk}</Text>
                <Text style={[styles.nextLevelXp, { color: COLORS.neonBlue[0] }]}>{rank.xpToNextLevel.toLocaleString()} XP to Level {rank.level + 1}</Text>
              </View>
            )}

            <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statVal, { color: colors.text }]}>{balance}</Text>
                    <Text style={styles.statLabel}>NET WORTH</Text>
                </View>
                <TouchableOpacity
                    style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => router.push('/people' as any)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.statVal, { color: colors.text }]}>{followed.length}</Text>
                    <Text style={styles.statLabel}>NETWORK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => router.push('/spheres' as any)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.statVal, { color: colors.text }]}>{publicCircles.length}</Text>
                    <Text style={styles.statLabel}>SPHERES</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.viewStatsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/stats' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="stats-chart" size={20} color={COLORS.neonBlue[0]} />
              <Text style={[styles.viewStatsText, { color: colors.text }]}>View full stats</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {isAdminEmail(user?.email) && (
              <TouchableOpacity
                style={[styles.viewStatsRow, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}
                onPress={() => router.push('/admin' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="construct" size={20} color={COLORS.gold[0]} />
                <Text style={[styles.viewStatsText, { color: colors.text }]}>Admin Hub</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
        </View>

        <AmbassadorCard />

        {publicCircles.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MY SPHERES</Text>
            </View>
            {publicCircles.map((circle) => (
              <TouchableOpacity
                key={circle.id}
                style={[styles.partnerRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => router.push(`/spheres/${circle.id}` as any)}
              >
                <View style={[styles.dot, { backgroundColor: COLORS.neonBlue[0] }]} />
                <Text style={[styles.partnerName, { color: colors.text }]}>{circle.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SIGNAL NETWORK</Text>
        </View>
        
        {followed.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>No signals acquired yet.</Text>
        ) : (
          followed.map(p => (
            <TouchableOpacity 
              key={p.id} 
              style={[styles.partnerRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => router.push(`/partner/${p.id}` as any)}
            >
              <View style={[styles.dot, { backgroundColor: TIER_COLORS[p.tier] }]} />
              <Text style={[styles.partnerName, { color: colors.text }]}>{p.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  coverContainer: { height: 150, backgroundColor: '#000', marginBottom: -40 },
  coverGradient: { position: 'absolute', width: '100%', height: '100%', opacity: 0.4 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  profileCard: { paddingHorizontal: 20 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  identityText: { marginLeft: 20, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  username: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  premiumBadgeWrap: { justifyContent: 'center' },
  rankTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  bio: { fontSize: 12, lineHeight: 18 },
  xpWrapper: { marginBottom: 12 },
  nextLevelCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  nextLevelLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  nextLevelPerk: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  nextLevelXp: { fontSize: 12, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  statVal: { fontWeight: '900', fontSize: 18 },
  statLabel: { color: '#888', fontSize: 9, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
  viewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 12,
  },
  viewStatsText: { fontSize: 14, fontWeight: '700', flex: 1 },
  foundingBanner: { marginHorizontal: 20, marginBottom: 16, padding: 14, borderRadius: 14, borderWidth: 1 },
  foundingBannerTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  foundingBannerSub: { fontSize: 12 },
  badgesSection: { marginHorizontal: 20, marginBottom: 20, padding: 16, borderRadius: 14, borderWidth: 1 },
  badgesSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgesSectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  badgesSectionLink: { fontSize: 13, fontWeight: '700' },
  badgeStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  badgeEmpty: { fontSize: 13, fontStyle: 'italic' },
  sectionHeader: { marginTop: 24, marginBottom: 12, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  partnerRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, marginHorizontal: 20, marginBottom: 8, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  partnerName: { fontSize: 14, fontWeight: 'bold', flex: 1 },
  empty: { paddingHorizontal: 20, fontStyle: 'italic' }
});
