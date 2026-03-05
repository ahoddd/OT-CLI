/**
 * OrbTap Profile — Redesigned for pride, competition, and engagement.
 * Psychology: status (level, streak, badges), competition (rank vs others), collection (achievements), progress (next level), social proof (network).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useSocial } from '../../hooks/useSocial';
import { useWallet } from '../../hooks/useWallet';
import { usePartners } from '../../context/PartnersContext';
import { useStreak } from '../../hooks/useStreak';
import { useTheme } from '../../hooks/useTheme';
import { usePreferences } from '../../hooks/usePreferences';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { UserBadge, XpBar } from '../../components/GamificationUI';
import { Ionicons } from '@expo/vector-icons';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { COLORS } from '../../constants/Colors';
import { userInviteUrl, userProfileDeepLink } from '../../constants/AppLinks';
import { AmbassadorCard } from '../../components/AmbassadorCard';
import { EditProfileSheet, type EditProfileForm } from '../../components/EditProfileSheet';
import { GettingStartedUserChecklist } from '../../components/GettingStartedUserChecklist';
import { BadgePill } from '../../components/BadgePill';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../hooks/useFriends';
import { useBadges } from '../../hooks/useBadges';
import { useMissions, isMissionFullyComplete, completedStepsCount } from '../../context/MissionsContext';
import { useBookmarks } from '../../context/BookmarkContext';
import { useFlags } from '../../components/FlagContext';
import { useXP } from '../../hooks/useXP';
import { RITUAL_TIER_COLORS } from '../../constants/RitualBadges';
import type { RitualBadgeDef } from '../../constants/RitualBadges';
import type { BadgeDef } from '../../constants/Badges';
import { RitualBadgeDetailModal, LegacyBadgeDetailModal } from '../../components/BadgeDetailModal';
import { PremiumBadge } from '../../components/PremiumBadge';
import { PartnerProBadge } from '../../components/PartnerProBadge';
import { isAdminEmail } from '../../constants/Admin';
import { useI18n } from '../../context/I18nContext';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { userInviteSharePayload } from '../../utils/shareToSocial';
import { uploadProfileImage } from '../../services/uploadProfileImage';
import { updateProfile, signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { clearBiometricCreds } from '../../services/authStorage';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { confirm as confirmAlert } from '../../utils/alert';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { SPACE, RADIUS, MOTION, SECTION_TITLE } from '../../constants/DesignTokens';
import { BADGES } from '../../constants/Badges';
import { StreakMilestoneCard, isStreakMilestone } from '../../components/StreakMilestoneCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_MILESTONE_SHOWN_KEY = 'ORBTAP_STREAK_MILESTONE_SHOWN_';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PAD = SPACE.base;

/* ────────────────────────────────────────────────────────────
 * Sub-components — Sprint 12 redesign
 * ──────────────────────────────────────────────────────────── */

const HERO_GRADIENTS: Record<string, [string, string, string]> = {
  free:    ['#1a1a2e', '#16213e', '#0f3460'],
  premium: ['#1a0f00', '#2d1a00', '#3d2300'],
  pro:     ['#0f0a1e', '#1a0f2e', '#2d1545'],
};

function ProfileHero({
  displayName, username, tagline, avatar, tier, isPartner, isPremium,
  userTier, rank, streak, themeGold, colors,
  onEdit, onShare, onPartnerDash, onLeaderboard, onNotifications, onSettings, onAdmin, isAdmin,
  t,
}: {
  displayName: string; username: string; tagline: string; avatar: string | null;
  tier: 'free' | 'premium' | 'pro'; isPartner: boolean; isPremium: boolean; userTier: string;
  rank: any; streak: number; themeGold: string; colors: any;
  onEdit: () => void; onShare: () => void; onPartnerDash: () => void;
  onLeaderboard: () => void; onNotifications: () => void; onSettings: () => void;
  onAdmin: () => void; isAdmin: boolean;
  t: (key: string) => string;
}) {
  const tierColor = isPartner ? themeGold : (tier === 'pro' ? '#A78BFA' : tier === 'premium' ? '#FBBF24' : '#60A5FA');
  const gradients = (HERO_GRADIENTS[tier] ?? HERO_GRADIENTS.free) as [string, string, string];
  return (
    <View style={heroStyles.container}>
      <LinearGradient colors={gradients} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} />
      <View style={[heroStyles.tierBar, { backgroundColor: tierColor }]} />
      <SafeAreaView edges={['top']} style={heroStyles.inner}>
        <View style={heroStyles.topActions}>
          {isPartner && (
            <TouchableOpacity style={heroStyles.actionBtn} onPress={onPartnerDash}>
              <Ionicons name="bar-chart" size={20} color={themeGold} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={heroStyles.actionBtn} onPress={onLeaderboard}>
            <Ionicons name="trophy" size={20} color={themeGold} />
          </TouchableOpacity>
          <TouchableOpacity style={heroStyles.actionBtn} onPress={onNotifications}>
            <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <TouchableOpacity style={heroStyles.actionBtn} onPress={onSettings}>
            <Ionicons name="settings-sharp" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity style={[heroStyles.actionBtn, { backgroundColor: themeGold + '44' }]} onPress={onAdmin}>
              <Ionicons name="construct" size={18} color={themeGold} />
            </TouchableOpacity>
          )}
        </View>
        <View style={heroStyles.identityRow}>
          <TouchableOpacity onPress={onEdit} style={heroStyles.avatarWrap} activeOpacity={0.9}>
            {avatar ? (
              <View style={[heroStyles.avatarRing, { borderColor: tierColor }]}>
                <Image source={{ uri: avatar }} style={heroStyles.avatarImg} />
              </View>
            ) : (
              <View style={[heroStyles.avatarRing, { borderColor: tierColor }]}>
                <UserBadge level={rank.level} size={84} streak={streak} />
              </View>
            )}
            <View style={[heroStyles.editBadge, { backgroundColor: tierColor }]}>
              <Ionicons name="pencil" size={10} color="#000" />
            </View>
          </TouchableOpacity>
          <View style={heroStyles.nameBlock}>
            <Text style={heroStyles.displayName} numberOfLines={1}>{displayName}</Text>
            {username ? <Text style={heroStyles.handle}>@{username}</Text> : null}
            {tagline ? <Text style={heroStyles.taglineText} numberOfLines={1}>{tagline}</Text> : null}
            <View style={heroStyles.badgeRow}>
              {isPremium && !isPartner ? <PremiumBadge variant="compact" size={18} /> : null}
              {userTier === 'pro' ? <PartnerProBadge size="small" showIcon /> : null}
              {isPartner ? (
                <View style={[heroStyles.tierChip, { backgroundColor: themeGold + '33', borderColor: themeGold }]}>
                  <Text style={[heroStyles.tierChipText, { color: themeGold }]}>{t('profile.partner')}</Text>
                </View>
              ) : null}
              <View style={[heroStyles.levelChip, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={heroStyles.levelChipText}>Lv.{rank.level} — {rank.title}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={heroStyles.bottomActions}>
          <TouchableOpacity
            style={[heroStyles.actionPill, { borderColor: 'rgba(255,255,255,0.3)' }]}
            onPress={onShare} activeOpacity={0.88}
          >
            <Ionicons name="share-social" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={heroStyles.actionPillText}>{t('profile.shareProfile')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[heroStyles.actionPill, { backgroundColor: tierColor, borderColor: tierColor }]}
            onPress={onEdit} activeOpacity={0.88}
          >
            <Ionicons name="pencil" size={14} color="#000" />
            <Text style={[heroStyles.actionPillText, { color: '#000' }]}>{t('profile.editProfile')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden' },
  tierBar: { height: 4, width: '100%' },
  inner: { paddingHorizontal: 16, paddingBottom: 48 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 12 },
  actionBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  identityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
  avatarWrap: { position: 'relative' },
  avatarRing: { borderWidth: 3, borderRadius: 48, padding: 2 },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  editBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  nameBlock: { flex: 1, paddingTop: 4 },
  displayName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  handle: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  taglineText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tierChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  tierChipText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  levelChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  levelChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },
  bottomActions: { flexDirection: 'row', gap: 10 },
  actionPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 100, borderWidth: 1,
  },
  actionPillText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
});

function StatsTriptych({
  balance, streak, bestStreak, hasScannedToday, level, title,
  themeGold, colors, tier, isPartner, onBalance, onStreak, onLevel,
}: {
  balance: number; streak: number; bestStreak: number; hasScannedToday: boolean;
  level: number; title: string; themeGold: string; colors: any;
  tier: string; isPartner: boolean;
  onBalance: () => void; onStreak: () => void; onLevel: () => void;
}) {
  const { t } = useI18n();
  const tierColor = isPartner ? themeGold : (tier === 'pro' ? '#A78BFA' : tier === 'premium' ? '#FBBF24' : '#60A5FA');
  const hour = new Date().getHours();
  const isAtRisk = hour >= 18 && streak > 0 && !hasScannedToday;
  const streakColor = isAtRisk ? '#ef4444' : '#F97316';
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[triptychStyles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: tierColor }]}
    >
      <TouchableOpacity style={triptychStyles.col} onPress={onBalance} activeOpacity={0.85}>
        <Ionicons name="wallet" size={16} color={themeGold} style={{ marginBottom: 4 }} />
        <Text style={[triptychStyles.value, { color: themeGold }]}>{balance.toLocaleString()}</Text>
        <Text style={[triptychStyles.label, { color: colors.textSecondary }]}>{t('wallet.otPoints').toUpperCase()}</Text>
      </TouchableOpacity>
      <View style={[triptychStyles.divider, { backgroundColor: colors.border }]} />
      <TouchableOpacity style={triptychStyles.col} onPress={onStreak} activeOpacity={0.85}>
        <Ionicons name="flame" size={16} color={streakColor} style={{ marginBottom: 4 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[triptychStyles.value, { color: streakColor }]}>{streak}</Text>
          {isAtRisk && <Ionicons name="warning" size={12} color="#ef4444" />}
        </View>
        <Text style={[triptychStyles.label, { color: colors.textSecondary }]}>STREAK</Text>
        {bestStreak > streak && bestStreak > 0 && (
          <Text style={[triptychStyles.sub, { color: colors.textSecondary }]}>{t('profile.best')} {bestStreak}</Text>
        )}
      </TouchableOpacity>
      <View style={[triptychStyles.divider, { backgroundColor: colors.border }]} />
      <TouchableOpacity style={triptychStyles.col} onPress={onLevel} activeOpacity={0.85}>
        <Ionicons name="star" size={16} color={colors.primary} style={{ marginBottom: 4 }} />
        <Text style={[triptychStyles.value, { color: colors.primary }]}>Lv.{level}</Text>
        <Text style={[triptychStyles.label, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const triptychStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: -36,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  col: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  divider: { width: 1, marginVertical: 12 },
  value: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  sub: { fontSize: 9, marginTop: 1 },
});

/* ────────────────────────────────────────────────────────────
 * Sub-components — dopamine additions (original)
 * ──────────────────────────────────────────────────────────── */

function WeeklyWinsStrip({
  weekVisits,
  weekOT,
  colors,
  themeGold,
  onPress,
}: {
  weekVisits: number;
  weekOT: number;
  colors: any;
  themeGold: string;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(60).duration(MOTION.enter)} style={{ paddingHorizontal: CARD_PAD, marginBottom: SPACE.md }}>
      <TouchableOpacity
        style={[weeklyStyles.strip, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <View style={weeklyStyles.item}>
          <Text style={[weeklyStyles.value, { color: colors.text }]}>{weekVisits}</Text>
          <Text style={[weeklyStyles.label, { color: colors.textSecondary }]}>VISITS</Text>
        </View>
        <View style={[weeklyStyles.divider, { backgroundColor: colors.border }]} />
        <View style={weeklyStyles.item}>
          <Text style={[weeklyStyles.value, { color: themeGold }]}>+{weekOT.toLocaleString()}</Text>
          <Text style={[weeklyStyles.label, { color: colors.textSecondary }]}>OT THIS WEEK</Text>
        </View>
        <View style={[weeklyStyles.divider, { backgroundColor: colors.border }]} />
        <View style={weeklyStyles.itemLabel}>
          <Text style={[weeklyStyles.weekLabel, { color: colors.textSecondary }]}>Weekly</Text>
          <Text style={[weeklyStyles.weekSub, { color: colors.textSecondary }]}>Wins</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const weeklyStyles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14 },
  item: { flex: 1, alignItems: 'center' },
  itemLabel: { alignItems: 'center' },
  divider: { width: 1, height: 28, marginHorizontal: 10 },
  value: { fontSize: 20, fontWeight: '900' },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  weekLabel: { fontSize: 11, fontWeight: '700' },
  weekSub: { fontSize: 9, fontWeight: '600' },
});

function StreakHeroCard({
  streak,
  bestStreak,
  hasScannedToday,
  colors,
  themeGold,
  onPress,
}: {
  streak: number;
  bestStreak: number;
  hasScannedToday: boolean;
  colors: any;
  themeGold: string;
  onPress: () => void;
}) {
  // Determine if streak is at risk (after 6pm, no scan today, and streak > 0)
  const hour = new Date().getHours();
  const isAtRisk = hour >= 18 && streak > 0 && !hasScannedToday;
  const flamColor = isAtRisk ? '#ef4444' : themeGold;

  // Shake animation for danger state
  const shakeX = useSharedValue(0);
  useEffect(() => {
    if (isAtRisk) {
      shakeX.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(-3, { duration: 80 }),
            withTiming(3, { duration: 80 }),
            withTiming(-2, { duration: 60 }),
            withTiming(2, { duration: 60 }),
            withTiming(0, { duration: 60 }),
          ),
          3,
          false
        )
      );
    }
  }, [isAtRisk]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  if (streak === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(120).duration(MOTION.enter)} style={{ paddingHorizontal: CARD_PAD, marginBottom: SPACE.md }}>
      <TouchableOpacity
        style={[streakStyles.card, { backgroundColor: isAtRisk ? '#ef444415' : flamColor + '12', borderColor: isAtRisk ? '#ef444455' : flamColor + '55' }]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <Animated.View style={[streakStyles.flameWrap, shakeStyle]}>
          <Ionicons name="flame" size={52} color={flamColor} />
        </Animated.View>
        <View style={streakStyles.textBlock}>
          <Text style={[streakStyles.streakNumber, { color: flamColor }]}>{streak}</Text>
          <Text style={[streakStyles.streakLabel, { color: colors.text }]}>day streak</Text>
          {bestStreak > streak && (
            <Text style={[streakStyles.best, { color: colors.textSecondary }]}>Best: {bestStreak} days</Text>
          )}
          {isAtRisk && (
            <View style={streakStyles.riskRow}>
              <Ionicons name="warning" size={12} color="#ef4444" />
              <Text style={streakStyles.riskText}>STREAK AT RISK</Text>
            </View>
          )}
        </View>
        <View style={streakStyles.rightWrap}>
          <Text style={[streakStyles.multiplierHint, { color: colors.textSecondary }]}>
            {streak >= 30 ? `${Math.min(2, 1 + Math.floor(streak / 30) * 0.25).toFixed(2)}×` : 'Earn'}
          </Text>
          <Text style={[streakStyles.multiplierSub, { color: colors.textSecondary }]}>
            {streak >= 30 ? 'multiplier' : 'streak bonus'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const streakStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  flameWrap: { alignItems: 'center' },
  textBlock: { flex: 1 },
  streakNumber: { fontSize: 42, fontWeight: '900', lineHeight: 44 },
  streakLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  best: { fontSize: 11, marginTop: 2 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  riskText: { color: '#ef4444', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  rightWrap: { alignItems: 'center' },
  multiplierHint: { fontSize: 16, fontWeight: '800' },
  multiplierSub: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
});

const referralStripStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  text: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  sub: { fontSize: 11 },
});

/** Derive "ahead of X% of explorers" from level for competitive psychology. */
function getRankPercentile(level: number): number {
  const map: Record<number, number> = { 1: 75, 2: 55, 3: 35, 4: 20, 5: 10, 6: 4, 7: 1 };
  return map[level] ?? Math.max(1, 80 - level * 12);
}

/** Format time left until deadline for profile/missions. */
function formatDeadline(deadlineAt: number): string {
  const now = Date.now();
  const ms = deadlineAt - now;
  if (ms <= 0) return 'Ended';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  if (deadlineAt >= endOfDay.getTime() - 60 * 60 * 1000 && deadlineAt <= endOfDay.getTime() + 60000) return 'Ends tonight';
  if (hours >= 24) return `${Math.floor(hours / 24)}d left`;
  if (hours > 0) return `${hours}h left`;
  if (mins > 0) return `${mins}m left`;
  return 'Soon';
}

export default function ProfileScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { getFollowedPartners, getPublicCircles } = useSocial();
  const publicCircles = getPublicCircles();
  const { balance, verifiedActions } = useWallet();
  const { getPartner } = usePartners();
  const rank = useXP();
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const { isPremium, isPartner, tier: userTier } = useEffectiveTier();
  const { setMyProfile } = useFriends();
  const { streak: streakState } = useStreak();
  const { earnedBadges, ritualEarnedBadges, foundingStats, hasBadge } = useBadges();
  const { flags } = useFlags();
  const { todayMissions, totalMissionsCompletedCount } = useMissions();
  const { bookmarkedPartners, bookmarkedPerks } = useBookmarks();
  const followed = getFollowedPartners();

  const activeMissions = React.useMemo(() => {
    const now = Date.now();
    return todayMissions
      .filter((m) => !isMissionFullyComplete(m) && m.deadlineAt > now)
      .sort((a, b) => a.deadlineAt - b.deadlineAt);
  }, [todayMissions]);
  const [badgeDetail, setBadgeDetail] = useState<RitualBadgeDef | null>(null);
  const [legacyBadgeDetail, setLegacyBadgeDetail] = useState<BadgeDef | null>(null);

  const [editVisible, setEditVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [streakMilestoneVisible, setStreakMilestoneVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || 'Explorer');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('Exploring the grid, one orb at a time.');
  const [username, setUsername] = useState('');
  const [discoverable, setDiscoverable] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);

  const streak = streakState.currentStreak;
  const bestStreak = streakState.bestStreak;

  // VM2 — Streak milestone card: show once per milestone
  useEffect(() => {
    if (!isStreakMilestone(streak)) return;
    const storageKey = STREAK_MILESTONE_SHOWN_KEY + streak;
    AsyncStorage.getItem(storageKey).then((shown) => {
      if (!shown) {
        AsyncStorage.setItem(storageKey, '1');
        setTimeout(() => setStreakMilestoneVisible(true), 800);
      }
    });
  }, [streak]);
  const rankPercentile = getRankPercentile(rank.level);
  const totalLegacy = BADGES.length;
  const totalRitual = 40;
  const earnedLegacyCount = earnedBadges.length;
  const earnedRitualCount = ritualEarnedBadges.length;
  const featuredBadges = [...earnedBadges].sort((a, b) => a.order - b.order).slice(0, 8);

  useEffect(() => {
    if (!user?.uid) return;
    getDocFromServer(doc(db, 'users', user.uid))
      .then((snap) => {
        const d = snap.data();
        if (d) {
          setDisplayName((d.displayName as string) || user?.displayName || 'Explorer');
          setTagline((d.tagline as string) || '');
          setBio((d.bio as string) || '');
          setUsername((d.username as string) || '');
          setDiscoverable(d.discoverable !== false);
          const photo = (d.photoURL as string) || user?.photoURL;
          if (photo) setAvatar(photo);
        }
      })
      .catch(() => {
        getDoc(doc(db, 'users', user.uid)).then((snap) => {
          const d = snap.data();
          if (d) {
            setDisplayName((d.displayName as string) || user?.displayName || 'Explorer');
            setTagline((d.tagline as string) || '');
            setBio((d.bio as string) || '');
            setUsername((d.username as string) || '');
            setDiscoverable(d.discoverable !== false);
            const photo = (d.photoURL as string) || user?.photoURL;
            if (photo) setAvatar(photo);
          }
        }).catch(() => {});
      });
  }, [user?.uid]);

  // Sync streak to Firestore when it changes so public profile can show it
  const lastStreakRef = React.useRef({ current: 0, best: 0 });
  useEffect(() => {
    if (!user?.uid) return;
    const { currentStreak, bestStreak } = streakState;
    if (lastStreakRef.current.current === currentStreak && lastStreakRef.current.best === bestStreak) return;
    lastStreakRef.current = { current: currentStreak, best: bestStreak };
    setMyProfile({ currentStreak, bestStreak });
  }, [user?.uid, streakState.currentStreak, streakState.bestStreak]);

  const handleLogout = async () => {
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const ok = await confirmAlert('Logout?', 'Return to sign in?', { confirmText: 'Logout', cancelText: 'Cancel' });
    if (ok) {
      await clearBiometricCreds();
      await signOut(auth);
      router.replace('/auth/login');
    }
  };

  const handleSaveProfile = async (form: EditProfileForm) => {
    setDisplayName(form.name);
    setTagline(form.tagline ?? '');
    setBio(form.bio);
    setUsername(form.username);
    setDiscoverable(form.discoverable);
    let photoURL: string | null = null;
    if (form.image) {
      const isLocal = form.image.startsWith('file://') || form.image.startsWith('content://') || !form.image.startsWith('http');
      if (isLocal && user?.uid) {
        try {
          photoURL = await uploadProfileImage(form.image, user.uid);
          setAvatar(photoURL);
        } catch {
          setAvatar(form.image);
        }
      } else {
        photoURL = form.image;
        setAvatar(form.image);
      }
    }
    await setMyProfile({
      displayName: form.name,
      username: form.username || undefined,
      discoverable: form.discoverable,
      photoURL: photoURL ?? undefined,
      bio: form.bio || undefined,
      tagline: form.tagline || undefined,
    });
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: form.name,
          ...(photoURL !== null && { photoURL }),
        });
      } catch {}
    }
    try {
      const snap = await getDocFromServer(doc(db, 'users', user!.uid));
      const d = snap.data();
      if (d) {
        setDisplayName((d.displayName as string) || form.name);
        setUsername((d.username as string) ?? form.username);
        setDiscoverable(d.discoverable !== false);
        if (d.bio !== undefined) setBio((d.bio as string) || '');
        if (d.tagline !== undefined) setTagline((d.tagline as string) || '');
        if ((d.photoURL as string) || photoURL) setAvatar((d.photoURL as string) || photoURL || null);
      }
    } catch {}
  };

  const handleShareProfile = () => {
    const url = user?.uid ? userProfileDeepLink(user.uid) : '';
    setSharePayload({
      message: prefs.shareMessage || 'Check out my OrbTap profile — discover deals, earn points, redeem perks.',
      url,
      title: displayName,
    });
    setShareSheetVisible(true);
  };

  const profileContent = (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EditProfileSheet
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        currentName={displayName}
        currentTagline={tagline}
        currentBio={bio}
        currentUsername={username}
        currentDiscoverable={discoverable}
        currentImage={avatar || undefined}
        onSave={handleSaveProfile}
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 0 }]} showsVerticalScrollIndicator={false}>

        {/* ① Profile Hero — full-bleed gradient header */}
        <ProfileHero
          displayName={displayName}
          username={username}
          tagline={tagline}
          avatar={avatar}
          tier={userTier as any}
          isPartner={isPartner}
          isPremium={isPremium}
          userTier={userTier}
          rank={rank}
          streak={streak}
          themeGold={themeGold}
          colors={colors}
          onEdit={() => setEditVisible(true)}
          onShare={handleShareProfile}
          onPartnerDash={() => router.push('/partner/dashboard' as any)}
          onLeaderboard={() => router.push('/leaderboard' as any)}
          onNotifications={() => router.push('/notifications' as any)}
          onSettings={() => router.push('/settings' as any)}
          onAdmin={() => router.push('/admin' as any)}
          isAdmin={isAdminEmail(user?.email)}
          t={t}
        />

        {/* ② Floating Stats Triptych — overlaps hero by 36px */}
        <StatsTriptych
          balance={balance}
          streak={streak}
          bestStreak={bestStreak}
          hasScannedToday={streakState.lastCheckInDate === new Date().toISOString().split('T')[0]}
          level={rank.level}
          title={rank.title}
          themeGold={themeGold}
          colors={colors}
          tier={userTier}
          isPartner={isPartner}
          onBalance={() => router.push('/(tabs)/wallet' as any)}
          onStreak={() => router.push('/stats' as any)}
          onLevel={() => router.push('/stats' as any)}
        />

        {bio ? (
          <View style={{ paddingHorizontal: CARD_PAD, marginBottom: SPACE.md }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>{bio}</Text>
          </View>
        ) : null}

        {/* ③ XP + Missions + Achievements card */}
        <Animated.View
          entering={FadeInDown.duration(MOTION.smooth)}
          style={[
            styles.profileCard,
            { backgroundColor: colors.surface, borderColor: isPartner ? themeGold + '55' : colors.border },
            isPartner && styles.profileCardPartner,
          ]}
        >

          <View style={styles.xpSection}>
            <XpBar
              current={rank.xp}
              max={rank.isMaxLevel ? rank.xp : rank.nextLevelXp}
              label={rank.perkShort}
              levelTitle={rank.title}
              nextLevelTitle={rank.nextLevelTitle}
              nextLevelPerk={rank.nextLevelPerk ?? undefined}
              isMaxLevel={rank.isMaxLevel}
            />
          </View>
          {!rank.isMaxLevel && rank.nextLevelPerk && (
            <View style={[styles.nextLevelCard, { backgroundColor: colors.background, borderColor: colors.primary + '44' }]}>
              <Text style={[styles.nextLevelLabel, { color: colors.textSecondary }]}>NEXT UNLOCK</Text>
              <Text style={[styles.nextLevelPerk, { color: colors.text }]} numberOfLines={1}>{rank.nextLevelPerk}</Text>
              <Text style={[styles.nextLevelXp, { color: colors.primary }]}>{rank.xpToNextLevel.toLocaleString()} XP → Lv.{rank.level + 1}</Text>
            </View>
          )}

          {/* Active missions / to complete — main tile, deadline-driven */}
          {flags?.isOrbQuestEnabled !== false && (activeMissions.length > 0 ? (
            <View style={[styles.activeBlock, { borderTopColor: colors.border }]}>
              <View style={styles.activeBlockHead}>
                <Text style={[styles.activeBlockTitle, { color: colors.textSecondary }]}>TO COMPLETE</Text>
                <TouchableOpacity onPress={() => router.push('/missions' as any)} hitSlop={8}>
                  <Text style={[styles.sectionLink, { color: colors.primary }]}>Missions</Text>
                </TouchableOpacity>
              </View>
              {activeMissions.slice(0, 3).map((m) => {
                const stepsTotal = m.steps?.length ?? 1;
                const stepsDone = completedStepsCount(m);
                const progressLabel = stepsTotal > 1 ? `${stepsDone}/${stepsTotal} steps` : '1 step';
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.activeRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => router.push('/missions' as any)}
                    activeOpacity={0.88}
                  >
                    <View style={[styles.activeRowIconWrap, { backgroundColor: themeGold + '22' }]}>
                      <Ionicons name="flag" size={18} color={themeGold} />
                    </View>
                    <View style={styles.activeRowBody}>
                      <Text style={[styles.activeRowTitle, { color: colors.text }]} numberOfLines={1}>{m.title}</Text>
                      <View style={styles.activeRowMeta}>
                        <Text style={[styles.activeRowProgress, { color: colors.textSecondary }]}>{progressLabel}</Text>
                        <Text style={[styles.activeRowDeadline, { color: colors.textSecondary }]}>{formatDeadline(m.deadlineAt)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.activeRowPts, { color: themeGold }]}>+{m.rewardPoints}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
              {activeMissions.length > 3 && (
                <TouchableOpacity style={[styles.activeMore, { borderColor: colors.border }]} onPress={() => router.push('/missions' as any)}>
                  <Text style={[styles.activeMoreText, { color: colors.primary }]}>{activeMissions.length - 3} more</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.activeCta, { backgroundColor: colors.background, borderColor: themeGold + '55' }]}
              onPress={() => router.push('/missions' as any)}
              activeOpacity={0.88}
            >
              <Ionicons name="flag-outline" size={20} color={themeGold} />
              <View style={styles.activeCtaTextWrap}>
                <Text style={[styles.activeCtaText, { color: colors.text }]}>Start today's missions</Text>
                <Text style={[styles.activeCtaSub, { color: colors.textSecondary }]}>Earn OT & unlock rewards</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeGold} />
            </TouchableOpacity>
          ))}

          {/* Achievements — inside same card */}
          <View style={[styles.achievementsBlock, { borderTopColor: colors.border }]}>
            <View style={styles.achievementsBlockHead}>
              <Text style={[styles.achievementsBlockTitle, { color: colors.textSecondary }]}>ACHIEVEMENTS</Text>
              <TouchableOpacity onPress={() => router.push('/achievements' as any)}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>View all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.achievementsProgress}>
              <Text style={[styles.achievementsCount, { color: colors.text }]}>{earnedLegacyCount + earnedRitualCount} earned</Text>
              <Text style={[styles.achievementsDetail, { color: colors.textSecondary }]} numberOfLines={1}>{earnedLegacyCount}/{totalLegacy} legacy · {earnedRitualCount}/{totalRitual} ritual</Text>
            </View>
            {(featuredBadges.length > 0 || ritualEarnedBadges.length > 0) ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 16, paddingTop: 4, paddingBottom: 4 }}
              >
                {featuredBadges.map((b) => (
                  <TouchableOpacity key={b.id} onPress={() => setLegacyBadgeDetail(b)} activeOpacity={0.8}>
                    <BadgePill badge={b} earned size="small" showName={false} />
                  </TouchableOpacity>
                ))}
                {ritualEarnedBadges.slice(0, 8).map((b) => (
                  <TouchableOpacity
                    key={`r-${b.id}`}
                    style={[styles.ritualChip, { backgroundColor: RITUAL_TIER_COLORS[b.tier] + '22', borderColor: RITUAL_TIER_COLORS[b.tier] }]}
                    onPress={() => setBadgeDetail(b)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.ritualChipText, { color: colors.text }]} numberOfLines={1}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            {earnedLegacyCount === 0 && ritualEarnedBadges.length === 0 && (
              <View style={styles.achievementsEmpty}>
                <Ionicons name="medal-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.achievementsEmptyText, { color: colors.textSecondary }]} numberOfLines={2}>Earn badges via missions, scans & streak.</Text>
                <TouchableOpacity style={[styles.achievementsEmptyBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]} onPress={() => router.push('/missions' as any)}>
                  <Text style={[styles.achievementsEmptyBtnText, { color: colors.primary }]}>Missions</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        <GettingStartedUserChecklist
          hasScanned={verifiedActions.length > 0}
          hasCompleteProfile={!!(avatar && (tagline || bio))}
          hasCompletedMission={totalMissionsCompletedCount > 0}
          hasTriedOrbSwipe={false}
          hasJoinedSphere={publicCircles.length > 0}
          hasBookmark={bookmarkedPartners.length > 0 || bookmarkedPerks.length > 0}
          hasInvited={false}
        />

        <Animated.View entering={FadeInDown.delay(80).duration(MOTION.enter)}>
          <TouchableOpacity style={[styles.rankCard, { backgroundColor: themeGold + '18', borderColor: themeGold + '55' }]} onPress={() => router.push('/leaderboard' as any)} activeOpacity={0.9}>
            <View style={[styles.rankIconWrap, { backgroundColor: themeGold + '33' }]}>
              <Ionicons name="trophy" size={28} color={themeGold} />
            </View>
            <View style={styles.rankTextWrap}>
              <Text style={[styles.rankTitle, { color: colors.text }]} numberOfLines={1}>Ahead of {rankPercentile}% of explorers</Text>
              <Text style={[styles.rankSub, { color: colors.textSecondary }]} numberOfLines={1}>Leaderboard · Compete for top spot</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={themeGold} />
          </TouchableOpacity>
          {/* "Only X OT behind" loss aversion callout — drives next scan */}
          <TouchableOpacity
            style={[styles.behindCallout, { backgroundColor: COLORS.danger + '10', borderColor: COLORS.danger + '44' }]}
            onPress={() => router.push('/(tabs)/scan' as any)}
            activeOpacity={0.88}
          >
            <Ionicons name="arrow-up" size={16} color={COLORS.danger} />
            <Text style={[styles.behindCalloutText, { color: colors.text }]}>
              You're <Text style={{ color: COLORS.danger, fontWeight: '900' }}>only {Math.max(10, 150 - (rank.xp % 150))} OT</Text> behind the next rank — scan now to climb
            </Text>
            <Ionicons name="qr-code" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </Animated.View>

        {verifiedActions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(MOTION.enter)} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PLACES I'VE SCORED</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/wallet' as any)}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>History</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.partnerShowcaseHint, { color: colors.textSecondary }]} numberOfLines={2}>Your recent visits showcase partners — share your profile to give them visibility.</Text>
            <View style={styles.recentVisitsRow}>
              {verifiedActions.slice(0, 5).map((action, index) => {
                const partner = getPartner(action.partnerId);
                const partnerName = partner?.name ?? action.partnerId;
                const tierColor = partner ? PARTNER_TIER_COLORS[partner.tier] : colors.primary;
                return (
                  <TouchableOpacity key={`va-${action.id}-${index}`} style={[styles.recentVisitChip, { backgroundColor: tierColor + '18', borderColor: tierColor + '44' }]} onPress={() => router.push(`/partner/${action.partnerId}` as any)} activeOpacity={0.88}>
                    <View style={[styles.recentVisitDot, { backgroundColor: tierColor }]} />
                    <Text style={[styles.recentVisitName, { color: colors.text }]} numberOfLines={1}>{partnerName}</Text>
                    <Text style={[styles.recentVisitPts, { color: tierColor }]}>+{action.pointsAwarded}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Weekly wins strip ─── */}
        <WeeklyWinsStrip
          weekVisits={(() => {
            const now = Date.now();
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            return verifiedActions.filter((a) => (a.createdAt ?? 0) >= sevenDaysAgo).length;
          })()}
          weekOT={(() => {
            const now = Date.now();
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            return verifiedActions
              .filter((a) => (a.createdAt ?? 0) >= sevenDaysAgo)
              .reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);
          })()}
          colors={colors}
          themeGold={themeGold}
          onPress={() => router.push('/(tabs)/wallet' as any)}
        />

        {/* Quick actions: OrbTap Plans + Invite friends only ─── */}
        <Animated.View entering={FadeInDown.delay(200).duration(MOTION.enter)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: SPACE.sm }]}>QUICK ACTIONS</Text>
          <View style={styles.quickList}>
            {!isPremium && (
              <TouchableOpacity
                style={[styles.quickRow, { backgroundColor: themeGold + '18', borderColor: themeGold }]}
                onPress={() => router.push('/premium' as any)}
                activeOpacity={0.88}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: themeGold + '33' }]}>
                  <Ionicons name="diamond" size={20} color={themeGold} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text }]}>OrbTap Plans</Text>
                <Ionicons name="chevron-forward" size={18} color={themeGold} />
              </TouchableOpacity>
            )}
            {user?.uid && (
              <TouchableOpacity
                style={[styles.quickRow, { backgroundColor: themeGold + '18', borderColor: themeGold }]}
                onPress={() => {
                  setSharePayload(userInviteSharePayload(userInviteUrl(user.uid), prefs.shareMessage || 'Join me on OrbTap — discover deals, earn points.'));
                  setShareSheetVisible(true);
                }}
                activeOpacity={0.88}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: themeGold + '33' }]}>
                  <Ionicons name="gift" size={20} color={themeGold} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text }]}>Invite friends · You both get 50 OT</Text>
                <Ionicons name="share-social" size={18} color={themeGold} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <AmbassadorCard />

        {/* Partners I support — following list; partner visibility when profile is shared */}
        {(followed.length > 0 || publicCircles.length > 0) && (
          <Animated.View entering={FadeInDown.delay(240).duration(MOTION.enter)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: SPACE.xs }]}>PARTNERS I SUPPORT</Text>
            <Text style={[styles.partnerShowcaseHint, { color: colors.textSecondary, marginBottom: SPACE.sm }]}>
              Show off the places you love. They get visibility when you share your profile.
            </Text>
            {publicCircles.map((circle) => (
              <TouchableOpacity
                key={circle.id}
                style={[styles.networkRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/spheres/${circle.id}` as any)}
              >
                <View style={[styles.networkDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.networkName, { color: colors.text }]}>{circle.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
            {followed.slice(0, 5).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.networkRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/partner/${p.id}` as any)}
              >
                <View style={[styles.networkDot, { backgroundColor: PARTNER_TIER_COLORS[p.tier] }]} />
                <Text style={[styles.networkName, { color: colors.text }]}>{p.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
            {(followed.length > 5 || publicCircles.length > 0) && (
              <TouchableOpacity style={[styles.networkRow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/people' as any)}>
                <Text style={[styles.networkMore, { color: colors.primary }]}>See all</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}


        {/* Referral sticky strip ─── */}
        {user?.uid && (
          <Animated.View entering={FadeInDown.delay(300).duration(MOTION.enter)} style={{ paddingHorizontal: CARD_PAD, marginBottom: SPACE.lg }}>
            <TouchableOpacity
              style={[referralStripStyles.card, { borderColor: themeGold + '55', backgroundColor: themeGold + '0D' }]}
              onPress={() => {
                setSharePayload(userInviteSharePayload(userInviteUrl(user.uid), prefs.shareMessage || 'Join me on OrbTap — discover deals, earn points.'));
                setShareSheetVisible(true);
              }}
              activeOpacity={0.88}
            >
              <View style={[referralStripStyles.iconWrap, { backgroundColor: themeGold + '28' }]}>
                <Ionicons name="gift" size={22} color={themeGold} />
              </View>
              <View style={referralStripStyles.text}>
                <Text style={[referralStripStyles.title, { color: themeGold }]}>Invite friends — you both get 50 OT</Text>
                <Text style={[referralStripStyles.sub, { color: themeGold + 'CC' }]}>Tap to share your invite link</Text>
              </View>
              <Ionicons name="share-social" size={18} color={themeGold} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Account ─── */}
        <View style={styles.accountSection}>
          <TouchableOpacity style={[styles.logoutRow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleLogout} activeOpacity={0.88}>
            <View style={[styles.logoutIconWrap, { backgroundColor: COLORS.danger + '22' }]}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            </View>
            <Text style={[styles.logoutText, { color: COLORS.danger }]}>Log out</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {sharePayload && (
        <ShareToSocialSheet visible={shareSheetVisible} onClose={() => { setShareSheetVisible(false); setSharePayload(null); }} payload={sharePayload} label="Share" />
      )}
      <RitualBadgeDetailModal visible={!!badgeDetail} badge={badgeDetail} onClose={() => setBadgeDetail(null)} />
      <LegacyBadgeDetailModal visible={!!legacyBadgeDetail} badge={legacyBadgeDetail} onClose={() => setLegacyBadgeDetail(null)} />
      {/* VM2 — Streak milestone card */}
      <StreakMilestoneCard
        streak={streak}
        visible={streakMilestoneVisible}
        onClose={() => setStreakMilestoneVisible(false)}
      />
    </View>
  );

  return profileContent;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 20 },
  topBarWrap: { paddingHorizontal: CARD_PAD, paddingTop: SPACE.xs, paddingBottom: SPACE.md },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  topBarBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  topBarSpacer: { flex: 1 },
  profileCard: {
    marginHorizontal: CARD_PAD,
    padding: CARD_PAD,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACE.lg,
    overflow: 'hidden',
  },
  profileCardPartner: { borderWidth: 2 },
  accountTypeRow: { flexDirection: 'row', paddingBottom: SPACE.sm, marginBottom: SPACE.sm, borderBottomWidth: 1 },
  accountTypePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  accountTypeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  avatarSection: { flexDirection: 'row', marginBottom: SPACE.md },
  avatarRing: { borderWidth: 3, borderRadius: 48, padding: 2 },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  identityBlock: { flex: 1, marginLeft: SPACE.lg, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, flexWrap: 'wrap' },
  displayName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  premiumWrap: { justifyContent: 'center' },
  atHandle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  tagline: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginTop: SPACE.xs, flexWrap: 'wrap' },
  levelPill: { paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs, borderRadius: RADIUS.full, borderWidth: 1 },
  levelPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs, borderRadius: RADIUS.full, borderWidth: 1 },
  streakPillText: { fontSize: 11, fontWeight: '800' },
  bioText: { fontSize: 13, lineHeight: 18, marginTop: SPACE.sm },
  profileActions: { flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.md },
  profileCta: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md, borderRadius: RADIUS.sm, borderWidth: 1 },
  profileCtaText: { fontSize: 13, fontWeight: '700' },
  statusStrip: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: SPACE.md, marginTop: SPACE.sm },
  statusItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  statusValue: { fontSize: 17, fontWeight: '800' },
  statusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  statusStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusSub: { fontSize: 9, marginTop: 1 },
  statusDivider: { width: 1, height: 24 },
  xpSection: { marginTop: SPACE.md },
  nextLevelCard: { marginTop: SPACE.md, padding: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1 },
  nextLevelLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  nextLevelPerk: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  nextLevelXp: { fontSize: 12, fontWeight: '800' },
  activeBlock: { borderTopWidth: 1, paddingTop: SPACE.md, marginTop: SPACE.md },
  activeBlockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.sm },
  activeBlockTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACE.xs,
    gap: SPACE.sm,
  },
  activeRowIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  activeRowBody: { flex: 1, minWidth: 0 },
  activeRowTitle: { fontSize: 14, fontWeight: '700' },
  activeRowMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginTop: 2 },
  activeRowProgress: { fontSize: 11, fontWeight: '600' },
  activeRowDeadline: { fontSize: 11, fontWeight: '600' },
  activeRowPts: { fontSize: 12, fontWeight: '800' },
  activeMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACE.sm, borderTopWidth: 1, marginTop: SPACE.xs, gap: 4 },
  activeMoreText: { fontSize: 12, fontWeight: '700' },
  activeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACE.md,
    gap: SPACE.sm,
  },
  activeCtaTextWrap: { flex: 1, minWidth: 0 },
  activeCtaText: { fontSize: 14, fontWeight: '700' },
  activeCtaSub: { fontSize: 11, marginTop: 2 },
  achievementsBlock: { borderTopWidth: 1, paddingTop: SPACE.md, marginTop: SPACE.md },
  achievementsBlockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.sm },
  achievementsBlockTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  rankCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: CARD_PAD, marginBottom: SPACE.sm, padding: SPACE.base, borderRadius: RADIUS.base, borderWidth: 1, gap: SPACE.md },
  behindCallout: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginHorizontal: CARD_PAD, marginBottom: SPACE.lg, borderRadius: RADIUS.md, borderWidth: 1, padding: SPACE.md },
  behindCalloutText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  rankIconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  rankTextWrap: { flex: 1, minWidth: 0 },
  rankTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  rankSub: { fontSize: 12, fontWeight: '600' },
  section: { marginBottom: SPACE.lg, paddingHorizontal: CARD_PAD },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.sm },
  sectionTitle: { ...SECTION_TITLE, marginBottom: 0 },
  sectionLink: { fontSize: 12, fontWeight: '800' },
  achievementsProgress: { marginBottom: SPACE.sm },
  achievementsCount: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  achievementsDetail: { fontSize: 11, fontWeight: '600' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  badgeGridItem: { marginBottom: SPACE.xs },
  ritualLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: SPACE.sm, marginBottom: SPACE.xs },
  ritualRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs },
  ritualChip: { paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs, borderRadius: RADIUS.sm, borderWidth: 1 },
  ritualChipText: { fontSize: 11, fontWeight: '700' },
  achievementsEmpty: { alignItems: 'center', paddingVertical: SPACE.lg },
  achievementsEmptyText: { fontSize: 12, textAlign: 'center', marginTop: SPACE.sm, paddingHorizontal: SPACE.md },
  achievementsEmptyBtn: { marginTop: SPACE.sm, paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderRadius: RADIUS.sm, borderWidth: 1 },
  achievementsEmptyBtnText: { fontSize: 12, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: SPACE.sm, paddingHorizontal: CARD_PAD, marginBottom: SPACE.lg },
  statCard: { flex: 1, padding: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 4 },
  quickList: { paddingHorizontal: CARD_PAD, gap: SPACE.sm },
  quickRow: { flexDirection: 'row', alignItems: 'center', padding: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1, gap: SPACE.md },
  quickIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 15, fontWeight: '700', flex: 1 },
  partnerShowcaseHint: { fontSize: 11, lineHeight: 15, marginBottom: SPACE.sm },
  recentVisitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  recentVisitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: SPACE.xs,
    maxWidth: '100%',
  },
  recentVisitDot: { width: 8, height: 8, borderRadius: 4 },
  recentVisitName: { fontSize: 13, fontWeight: '700', maxWidth: 120 },
  recentVisitPts: { fontSize: 11, fontWeight: '800' },
  networkRow: { flexDirection: 'row', alignItems: 'center', padding: SPACE.md, marginBottom: SPACE.sm, borderRadius: RADIUS.md, borderWidth: 1, gap: SPACE.md },
  networkDot: { width: 8, height: 8, borderRadius: 4 },
  networkName: { fontSize: 14, fontWeight: '700', flex: 1 },
  networkMore: { fontSize: 14, fontWeight: '700', flex: 1 },
  accountSection: { paddingHorizontal: CARD_PAD, marginTop: SPACE.xl },
  logoutRow: { flexDirection: 'row', alignItems: 'center', padding: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1, gap: SPACE.md },
  logoutIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '800', flex: 1 },
});
