/**
 * Public user profile — viewable when user is discoverable.
 * Shows achievements, stats, bio with glass/holographic styling.
 * Member vs Partner visually distinct. Respects publicProfileVisibility toggles.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import { userProfileDeepLink } from '../../constants/AppLinks';
import { USER_TIERS, type UserTierKey } from '../../constants/UserTiers';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { useAuth } from '../../context/AuthContext';
import {
  DEFAULT_PUBLIC_PROFILE_VISIBILITY,
  mergeVisibility,
  type PublicProfileVisibility,
} from '../../constants/PublicProfileVisibility';
import { getBadge, BADGES, type BadgeDef } from '../../constants/Badges';
import { useI18n } from '../../context/I18nContext';

const ACHIEVEMENT_CATEGORIES: { key: string; label: string }[] = [
  { key: 'founding', label: 'FOUNDING' },
  { key: 'missions', label: 'MISSIONS' },
  { key: 'reviews', label: 'REVIEWS' },
  { key: 'streak', label: 'STREAKS' },
  { key: 'scans', label: 'CHECK-INS' },
  { key: 'one_time', label: 'MILESTONES' },
  { key: 'partner', label: 'PARTNERS' },
];

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  website?: string;
}

interface PublicUserData {
  displayName: string;
  username: string;
  photoURL: string | null;
  tagline: string;
  bio: string;
  discoverable: boolean;
  partnerMode?: boolean;
  tier?: UserTierKey;
  badges?: string[];
  publicProfileVisibility?: Partial<PublicProfileVisibility>;
  currentStreak?: number;
  bestStreak?: number;
  displayPhotoURL?: string | null;
  socialLinks?: SocialLinks;
  showSpheresOnProfile?: boolean;
  missionsCompleted?: number;
  reviewsCount?: number;
  leaderboardWins?: number;
}

export default function PublicUserProfileScreen() {
  const { t } = useI18n();
  const { id: uid } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<PublicUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getDoc(doc(db, 'users', uid))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }
        const d = snap.data() as Record<string, unknown>;
        const discoverable = d.discoverable !== false;
        const visibility = mergeVisibility(
          d.publicProfileVisibility as Partial<PublicProfileVisibility> | undefined,
          undefined
        );
        const socialLinks = d.socialLinks as SocialLinks | undefined;
        setProfile({
          displayName: (d.displayName as string) || 'Explorer',
          username: (d.username as string) || '',
          photoURL: (d.photoURL as string) || null,
          tagline: (d.tagline as string) || '',
          bio: (d.bio as string) || '',
          discoverable,
          partnerMode: d.partnerMode === true,
          tier: (d.tier as UserTierKey) || (d.partnerMode ? 'pro' : 'free'),
          badges: Array.isArray(d.badges) ? (d.badges as string[]) : [],
          publicProfileVisibility: visibility,
          currentStreak: typeof d.currentStreak === 'number' ? d.currentStreak : undefined,
          bestStreak: typeof d.bestStreak === 'number' ? d.bestStreak : undefined,
          displayPhotoURL: (d.displayPhotoURL as string) || null,
          socialLinks: socialLinks && typeof socialLinks === 'object' ? socialLinks : undefined,
          showSpheresOnProfile: d.showSpheresOnProfile !== false,
          missionsCompleted: typeof d.missionsCompleted === 'number' ? d.missionsCompleted : undefined,
          reviewsCount: typeof d.reviewsCount === 'number' ? d.reviewsCount : undefined,
          leaderboardWins: typeof d.leaderboardWins === 'number' ? d.leaderboardWins : undefined,
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const handleShare = () => {
    if (!uid || !profile?.discoverable) return;
    const url = userProfileDeepLink(uid);
    setSharePayload({
      message: `Check out ${profile.displayName} on OrbTap — ${profile.tagline || 'Exploring the grid.'}`,
      url,
      title: profile.displayName,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.neonBlue[0]} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile…</Text>
      </View>
    );
  }

  if (!profile || !uid) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </SafeAreaView>
        <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.privateTitle, { color: colors.text }]}>Profile unavailable</Text>
        <Text style={[styles.privateSub, { color: colors.textSecondary }]}>
          This profile doesn't exist or has been removed.
        </Text>
      </View>
    );
  }

  if (!profile.discoverable) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={[styles.privateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
          <Text style={[styles.privateTitle, { color: colors.text }]}>This profile is private</Text>
          <Text style={[styles.privateSub, { color: colors.textSecondary }]}>
            They've chosen not to share their profile publicly. You can still compete with them on the leaderboard.
          </Text>
        </View>
      </View>
    );
  }

  const visibility = profile.publicProfileVisibility ?? DEFAULT_PUBLIC_PROFILE_VISIBILITY;
  const tierDef = USER_TIERS[profile.tier ?? 'free'];
  const isPartner = profile.partnerMode === true;
  const accent = isPartner ? themeGold : COLORS.neonBlue[0];
  const accentSecondary = isPartner ? COLORS.gold[1] ?? themeGold : COLORS.neonBlue[1] ?? COLORS.neonBlue[0];

  // Earned badge defs from profile.badges
  const earnedBadgeDefs = (profile.badges || [])
    .map((id) => getBadge(id))
    .filter((b): b is BadgeDef => b != null)
    .sort((a, b) => a.order - b.order);
  const earnedByCategory = ACHIEVEMENT_CATEGORIES.map(({ key }) => ({
    key,
    label: ACHIEVEMENT_CATEGORIES.find((c) => c.key === key)!.label,
    badges: earnedBadgeDefs.filter((b) => b.category === key),
  })).filter((s) => s.badges.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: display photo banner + glass */}
        <View style={styles.heroWrap}>
          {profile.displayPhotoURL ? (
            <Image source={{ uri: profile.displayPhotoURL }} style={styles.displayPhotoBanner} resizeMode="cover" />
          ) : null}
          <LinearGradient
            colors={
              isPartner
                ? [accent + '50', accent + '20', 'transparent']
                : [accent + '40', accentSecondary + '25', 'transparent']
            }
            style={StyleSheet.absoluteFill}
          />
          {Platform.OS === 'ios' ? (
            <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, styles.heroBlur]} />
          ) : null}
          <SafeAreaView edges={['top']} style={[styles.heroSafe, { backgroundColor: 'transparent' }]}>
            <View style={[styles.header, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                Profile
              </Text>
              {me?.uid !== uid ? (
                <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                  <Ionicons name="share-outline" size={22} color={colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerSpacer} />
              )}
            </View>

            <View style={[styles.heroCard, { borderColor: accent + '66', backgroundColor: colors.surface + 'ee' }]}>
              <View style={styles.heroTopRow}>
                <View style={[styles.typePill, { backgroundColor: accent + '28', borderColor: accent }]}>
                  <Ionicons name={isPartner ? 'business' : 'person'} size={14} color={accent} />
                  <Text style={[styles.typePillText, { color: accent }]}>
                    {isPartner ? 'Partner' : tierDef.label}
                  </Text>
                </View>
                <View style={[styles.tierBadgeSmall, { backgroundColor: accent + '28', borderColor: accent }]}>
                  <Ionicons name="ribbon" size={12} color={accent} />
                </View>
              </View>

              <View style={styles.avatarRow}>
                {profile.photoURL ? (
                  <View style={[styles.avatarRing, { borderColor: accent }]}>
                    <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
                  </View>
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceHighlight, borderColor: accent }]}>
                    <Ionicons name="person" size={40} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.identity}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
                      {profile.displayName}
                    </Text>
                    <View style={[styles.tierBadgeNextToName, { backgroundColor: accent + '22', borderColor: accent }]}>
                      <Ionicons name="ribbon" size={12} color={accent} />
                      <Text style={[styles.tierBadgeLabel, { color: accent }]}>{tierDef.shortLabel}</Text>
                    </View>
                  </View>
                  {profile.username ? (
                    <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
                      @{profile.username}
                    </Text>
                  ) : null}
                  {visibility.showTagline && profile.tagline ? (
                    <Text style={[styles.tagline, { color: colors.textSecondary }]} numberOfLines={2}>
                      {profile.tagline}
                    </Text>
                  ) : null}
                </View>
              </View>

              {(visibility.showStreak || visibility.showStats) && (profile.currentStreak != null || profile.bestStreak != null || profile.missionsCompleted != null || profile.reviewsCount != null || (profile.leaderboardWins != null && profile.leaderboardWins > 0)) ? (
                <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                  {profile.currentStreak != null && (
                    <View style={styles.statItem}>
                      <Ionicons name="flame" size={20} color={accent} />
                      <Text style={[styles.statVal, { color: colors.text }]}>{profile.currentStreak}d</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>streak</Text>
                    </View>
                  )}
                  {profile.bestStreak != null && (
                    <View style={styles.statItem}>
                      <Ionicons name="trophy" size={20} color={accent} />
                      <Text style={[styles.statVal, { color: colors.text }]}>{profile.bestStreak}d</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>best</Text>
                    </View>
                  )}
                  {profile.missionsCompleted != null && (
                    <View style={styles.statItem}>
                      <Ionicons name="flag" size={20} color={accent} />
                      <Text style={[styles.statVal, { color: colors.text }]}>{profile.missionsCompleted}</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>missions</Text>
                    </View>
                  )}
                  {profile.reviewsCount != null && (
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={20} color={accent} />
                      <Text style={[styles.statVal, { color: colors.text }]}>{profile.reviewsCount}</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>reviews</Text>
                    </View>
                  )}
                  {profile.leaderboardWins != null && profile.leaderboardWins > 0 && (
                    <View style={styles.statItem}>
                      <Ionicons name="podium" size={20} color={accent} />
                      <Text style={[styles.statVal, { color: colors.text }]}>{profile.leaderboardWins}</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>wins</Text>
                    </View>
                  )}
                </View>
              ) : null}

              {profile.socialLinks && (profile.socialLinks.twitter || profile.socialLinks.instagram || profile.socialLinks.website) ? (
                <View style={[styles.socialRow, { borderTopColor: colors.border }]}>
                  {profile.socialLinks.twitter ? (
                    <TouchableOpacity onPress={() => Linking.openURL(profile.socialLinks!.twitter!.startsWith('http') ? profile.socialLinks!.twitter! : 'https://twitter.com/' + profile.socialLinks!.twitter!.replace(/^@/, ''))} style={[styles.socialIconBtn, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="logo-twitter" size={20} color={colors.text} />
                    </TouchableOpacity>
                  ) : null}
                  {profile.socialLinks.instagram ? (
                    <TouchableOpacity onPress={() => Linking.openURL(profile.socialLinks!.instagram!.startsWith('http') ? profile.socialLinks!.instagram! : 'https://instagram.com/' + profile.socialLinks!.instagram!.replace(/^@/, ''))} style={[styles.socialIconBtn, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="logo-instagram" size={20} color={colors.text} />
                    </TouchableOpacity>
                  ) : null}
                  {profile.socialLinks.website ? (
                    <TouchableOpacity onPress={() => Linking.openURL(profile.socialLinks!.website!.startsWith('http') ? profile.socialLinks!.website! : 'https://' + profile.socialLinks!.website!)} style={[styles.socialIconBtn, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="globe-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>
          </SafeAreaView>
        </View>

        {/* Bio — more space for expression */}
        {visibility.showBio ? (
          <View style={[styles.section, styles.bioSection, { backgroundColor: colors.surface + 'f0', borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ABOUT</Text>
            <Text style={[styles.bio, { color: colors.text }]}>{profile.bio || (me?.uid === uid ? 'Add a bio in Settings → Public Profile.' : '—')}</Text>
          </View>
        ) : null}

        {/* Spheres & leaderboard (when visible) */}
        {profile.showSpheresOnProfile !== false ? (
          <View style={[styles.section, { backgroundColor: colors.surface + 'f0', borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: accent }]}>SPHERES & LEADERBOARD</Text>
            {(profile.leaderboardWins != null && profile.leaderboardWins > 0) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="podium" size={20} color={accent} />
                <Text style={[styles.bio, { color: colors.text }]}>{profile.leaderboardWins} leaderboard win{profile.leaderboardWins !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
            <Text style={[styles.bio, { color: colors.textSecondary }]}>Spheres and more achievements appear here when available.</Text>
          </View>
        ) : null}

        {/* Achievements */}
        {visibility.showBadges && earnedByCategory.length > 0 ? (
          <View style={[styles.section, { backgroundColor: colors.surface + 'f0', borderColor: colors.border }]}>
            <View style={styles.achievementsHeader}>
              <Ionicons name="medal" size={22} color={accent} />
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                ACHIEVEMENTS — {earnedBadgeDefs.length} of {BADGES.length}
              </Text>
            </View>
            {earnedByCategory.map(({ key, label, badges }) => (
              <View key={key} style={styles.badgeCategory}>
                <Text style={[styles.categoryLabel, { color: accent }]}>{label}</Text>
                <View style={styles.badgeGrid}>
                  {badges.map((badge) => (
                    <TouchableOpacity
                      key={badge.id}
                      activeOpacity={0.85}
                      onPress={() => setSelectedBadge(badge)}
                      style={[
                        styles.badgeChip,
                        {
                          backgroundColor: badge.color + '18',
                          borderColor: badge.color + '99',
                          shadowColor: badge.color,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 3,
                        },
                      ]}
                    >
                      <View style={[styles.badgeChipIconWrap, { backgroundColor: badge.color + '35' }]}>
                        <Ionicons name={badge.icon as any} size={20} color={badge.color} />
                      </View>
                      <Text style={[styles.badgeChipName, { color: colors.text }]} numberOfLines={1}>
                        {badge.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.tierBlock, { backgroundColor: colors.background }]}>
          <Text style={[styles.tierTagline, { color: colors.textSecondary }]}>{tierDef.tagline}</Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {sharePayload && (
        <ShareToSocialSheet
          visible={!!sharePayload}
          onClose={() => setSharePayload(null)}
          payload={sharePayload}
          label="Share profile"
        />
      )}

      <Modal visible={!!selectedBadge} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.badgeModalOverlay}
          onPress={() => setSelectedBadge(null)}
        >
          {selectedBadge && (
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={[styles.badgeModalCard, { backgroundColor: colors.surface, borderColor: selectedBadge.color + '99', shadowColor: selectedBadge.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }]}>
              <View style={[styles.badgeModalIconWrap, { backgroundColor: selectedBadge.color + '22', borderColor: selectedBadge.color }]}>
                <Ionicons name={selectedBadge.icon as any} size={40} color={selectedBadge.color} />
              </View>
              <Text style={[styles.badgeModalName, { color: colors.text }]}>{selectedBadge.name}</Text>
              <Text style={[styles.badgeModalDesc, { color: colors.textSecondary }]}>{selectedBadge.description}</Text>
              <Text style={[styles.badgeModalHow, { color: colors.textSecondary }]}>How it was earned</Text>
              <Text style={[styles.badgeModalHowText, { color: colors.text }]}>
                {selectedBadge.howItWasEarned ?? selectedBadge.description}
              </Text>
              <TouchableOpacity onPress={() => setSelectedBadge(null)} style={[styles.badgeModalCloseBtn, { backgroundColor: selectedBadge.color }]}>
                <Text style={styles.badgeModalCloseText}>Close</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  safe: { paddingHorizontal: SPACE.base },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  backBtn: { padding: SPACE.sm },
  loadingText: { marginTop: SPACE.md, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.sm, borderBottomWidth: 1 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  shareBtn: { padding: SPACE.sm },
  headerSpacer: { width: 40 },
  privateCard: {
    marginHorizontal: SPACE.base,
    padding: SPACE.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
    maxWidth: 320,
  },
  privateTitle: { fontSize: 18, fontWeight: '800', marginTop: SPACE.md },
  privateSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    lineHeight: 20,
  },
  heroWrap: { marginBottom: SPACE.lg, overflow: 'hidden' },
  heroBlur: { borderRadius: 0 },
  heroSafe: { paddingHorizontal: SPACE.base, paddingBottom: SPACE.lg },
  heroCard: {
    marginTop: SPACE.md,
    padding: SPACE.base,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    overflow: 'hidden',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: SPACE.md,
  },
  typePillText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 82, height: 82, borderRadius: 41 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identity: { flex: 1, marginLeft: SPACE.base, minWidth: 0 },
  displayName: { fontSize: 22, fontWeight: '800' },
  username: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  tagline: { fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 24,
    marginTop: SPACE.md,
    paddingTop: SPACE.md,
    borderTopWidth: 1,
  },
  statItem: { alignItems: 'center', minWidth: 56 },
  statVal: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 10, marginTop: 2, textTransform: 'uppercase' },
  section: {
    marginHorizontal: SPACE.base,
    marginBottom: SPACE.lg,
    padding: SPACE.base,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  bioSection: { minHeight: 80 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: SPACE.sm },
  bio: { fontSize: 14, lineHeight: 22 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.md },
  tierBadgeSmall: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  tierBadgeNextToName: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1 },
  tierBadgeLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  displayPhotoBanner: { position: 'absolute', top: 0, left: 0, right: 0, height: 140, width: '100%' },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: SPACE.md, paddingTop: SPACE.md, borderTopWidth: 1 },
  socialIconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  achievementsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACE.sm },
  badgeCategory: { marginTop: SPACE.lg },
  categoryLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    maxWidth: '100%',
  },
  badgeChipIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  badgeChipName: { fontSize: 13, fontWeight: '800', flex: 1 },
  tierBlock: { marginHorizontal: SPACE.base, padding: SPACE.md, borderRadius: RADIUS.md },
  tierTagline: { fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  badgeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24 },
  badgeModalCard: { borderRadius: RADIUS.xl, borderWidth: 2, padding: SPACE.xl, alignItems: 'center', maxWidth: 340, alignSelf: 'center' },
  badgeModalIconWrap: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.md },
  badgeModalName: { fontSize: 20, fontWeight: '800', marginBottom: 6, textAlign: 'center', letterSpacing: 0.3 },
  badgeModalDesc: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: SPACE.md },
  badgeModalHow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6, textAlign: 'center' },
  badgeModalHowText: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: SPACE.lg, paddingHorizontal: 4 },
  badgeModalCloseBtn: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: RADIUS.lg },
  badgeModalCloseText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
