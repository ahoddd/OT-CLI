import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../../hooks/useSocial';
import { useAuth } from '../../context/AuthContext';
import { useSphereChat } from '../../hooks/useSphereChat';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { SphereXpBar } from '../../components/SphereXpBar';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import type { SpherePost } from '../../hooks/useSocial';
import { useFlags } from '../../components/FlagContext';
import { useModerationLevel } from '../../hooks/useModerationLevel';
import { moderateContent } from '../../utils/moderation';
import { useOrbPlans } from '../../hooks/useOrbPlans';
import type { PlanSize, PlanMode, OrbPlan, PlanStep } from '../../constants/OrbPlans';
import { useWallet } from '../../hooks/useWallet';
import { LEDGER_REASON, DEFAULT_ORBINOMICS_POLICY } from '../../constants/OrbinomicsPolicy';
import QRCode from 'react-native-qrcode-svg';
import { sphereJoinUrl, ORBTAP_APP_LINK } from '../../constants/AppLinks';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { DEMO_SPHERE_LEADERBOARD_ID, DEMO_SPHERE_PROFILE, type PublicSphereProfileData } from '../../constants/DemoSphere';
import { getSphereTierForXp } from '../../constants/SphereLevels';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { USER_TIERS } from '../../constants/UserTiers';
import { useSphereInvites } from '../../hooks/useSphereInvites';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEED_IMAGE_WIDTH = SCREEN_WIDTH - 40;
const FEED_IMAGE_HEIGHT = Math.min(FEED_IMAGE_WIDTH * 1.1, 360);

const TAB_KEYS = ['feed', 'chat', 'members', 'pool'] as const;
type TabKey = typeof TAB_KEYS[number];
/** Partner IDs that are "Featured in Plans" (sponsorship hook). */
const FEATURED_IN_PLANS_PARTNER_IDS = new Set(['p1', 'p3']);

const HOLO_BORDER = 2;
const SHINE_OPACITY = 0.4;

function PublicSphereProfileView({
  profile,
  colors,
  router,
  safeHaptics,
}: {
  profile: PublicSphereProfileData;
  colors: { text: string; textSecondary: string; surface: string; border: string; background: string };
  router: ReturnType<typeof useRouter>;
  safeHaptics: { selectionAsync: () => void };
}) {
  const themeGold = COLORS.gold?.[0] ?? '#fbbf24';
  const typeAccent = profile.type === 'couple' ? '#EC4899' : profile.type === 'fami' ? '#F59E0B' : '#8B5CF6';
  const tierColor =
    profile.sphereTier === 'pro' || profile.sphereTier === 'premium'
      ? USER_TIERS.premium.color
      : USER_TIERS.free.color;
  const accent = profile.sphereTier ? tierColor : typeAccent;
  const xpTier = getSphereTierForXp(profile.sphereXp);
  const showStats = profile.showStatsPublic !== false;
  const showMembers = profile.showMembersPublic !== false;
  const showAchievements = profile.showAchievementsPublic !== false;
  const establishedDate =
    profile.createdAt != null
      ? new Date(profile.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.background, colors.surface, colors.background]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.publicSphereHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.publicSphereHeaderTitle, { color: colors.textSecondary }]}>SPHERE PROFILE</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.publicSphereScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.publicSphereHero, { backgroundColor: colors.surface + 'ee', borderColor: accent + '66' }]}>
            <View style={styles.publicSphereHeroTop}>
              <View style={[styles.publicSphereTypePill, { backgroundColor: accent + '28', borderColor: accent }]}>
                <Ionicons name={profile.type === 'couple' ? 'heart' : profile.type === 'fami' ? 'home' : 'people'} size={16} color={accent} />
                <Text style={[styles.publicSphereTypeText, { color: accent }]}>
                  {profile.type === 'couple' ? 'Couple' : profile.type === 'fami' ? 'Family' : 'Pals'}
                </Text>
              </View>
              <View style={[styles.publicSphereTierBadge, { backgroundColor: accent + '28', borderColor: accent }]}>
                <Ionicons name="ribbon" size={12} color={accent} />
                <Text style={[styles.publicSphereTierText, { color: accent }]}>
                  {profile.sphereTier ? (profile.sphereTier === 'pro' ? 'Pro' : profile.sphereTier === 'premium' ? 'Premium' : 'Free') : xpTier.title}
                </Text>
              </View>
            </View>
            <Text style={[styles.publicSphereName, { color: colors.text }]}>{profile.name}</Text>
            {establishedDate ? (
              <Text style={[styles.publicSphereEstablished, { color: colors.textSecondary }]}>
                Sphere established on {establishedDate}
              </Text>
            ) : null}
            {profile.tagline ? (
              <Text style={[styles.publicSphereTagline, { color: colors.textSecondary }]}>{profile.tagline}</Text>
            ) : null}
            <View style={styles.publicSphereXpWrap}>
              <SphereXpBar sphereXp={profile.sphereXp} showPerk />
            </View>
          </View>

          {showStats ? (
            <View style={[styles.publicSphereSection, { backgroundColor: colors.surface + 'f0', borderColor: colors.border }]}>
              <Text style={[styles.publicSphereSectionLabel, { color: colors.textSecondary }]}>STATS</Text>
              <View style={styles.publicSphereStatsRow}>
                <View style={styles.publicSphereStat}>
                  <Ionicons name="checkmark-circle" size={22} color={accent} />
                  <Text style={[styles.publicSphereStatVal, { color: colors.text }]}>{profile.verifiedVisitsCount}</Text>
                  <Text style={[styles.publicSphereStatLabel, { color: colors.textSecondary }]}>Verified visits</Text>
                </View>
                <View style={styles.publicSphereStat}>
                  <Ionicons name="flag" size={22} color={accent} />
                  <Text style={[styles.publicSphereStatVal, { color: colors.text }]}>{profile.missionsCompletedCount}</Text>
                  <Text style={[styles.publicSphereStatLabel, { color: colors.textSecondary }]}>Missions</Text>
                </View>
                <View style={styles.publicSphereStat}>
                  <OTPointsBadge amount={profile.totalPoints} size={16} label="pts" compact textColor={themeGold} />
                  <Text style={[styles.publicSphereStatLabel, { color: colors.textSecondary }]}>Total OT</Text>
                </View>
                <View style={styles.publicSphereStat}>
                  <Text style={[styles.publicSphereStatVal, { color: colors.text }]}>{profile.poolBalance}</Text>
                  <Text style={[styles.publicSphereStatLabel, { color: colors.textSecondary }]}>Pool</Text>
                </View>
              </View>
              {profile.leaderboardWins != null && profile.leaderboardWins > 0 ? (
                <View style={[styles.publicSphereLeaderboardWins, { borderTopColor: colors.border }]}>
                  <Ionicons name="podium" size={20} color={themeGold} />
                  <Text style={[styles.publicSphereLeaderboardWinsText, { color: colors.text }]}>
                    {profile.leaderboardWins} leaderboard win{profile.leaderboardWins !== 1 ? 's' : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {showAchievements ? (
            <View style={[styles.publicSphereSection, { backgroundColor: colors.surface + 'f0', borderColor: colors.border }]}>
              <Text style={[styles.publicSphereSectionLabel, { color: accent }]}>ACHIEVEMENTS</Text>
              <View style={[styles.publicSphereAchievementRow, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
                <Ionicons name="ribbon" size={24} color={accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.publicSphereAchievementTitle, { color: colors.text }]}>{xpTier.title}</Text>
                  <Text style={[styles.publicSphereAchievementSub, { color: colors.textSecondary }]}>{xpTier.perkShort}</Text>
                </View>
              </View>
              <Text style={[styles.publicSphereSectionHint, { color: colors.textSecondary }]}>
                Spheres level up with verified visits, missions, and pool contributions. Compete on the leaderboard.
              </Text>
            </View>
          ) : null}

          {showMembers && (profile.memberNames?.length ?? profile.memberCount) ? (
            <View style={[styles.publicSphereSection, { backgroundColor: colors.surface + 'f0', borderColor: colors.border }]}>
              <Text style={[styles.publicSphereSectionLabel, { color: colors.textSecondary }]}>MEMBERS</Text>
              <Text style={[styles.publicSphereMemberCount, { color: colors.text }]}>{profile.memberCount} member{profile.memberCount !== 1 ? 's' : ''}</Text>
              {profile.memberNames && profile.memberNames.length > 0 ? (
                <View style={styles.publicSphereMemberChips}>
                  {profile.memberNames.map((name, i) => (
                    <View key={i} style={[styles.publicSphereMemberChip, { backgroundColor: colors.border + '40' }]}>
                      <Ionicons name="person" size={14} color={colors.textSecondary} />
                      <Text style={[styles.publicSphereMemberChipText, { color: colors.text }]}>{name}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={[styles.publicSphereJoinSection, { borderColor: accent + '44' }]}>
            <Text style={[styles.publicSphereJoinTitle, { color: colors.text }]}>Want to join this sphere?</Text>
            <Text style={[styles.publicSphereJoinSub, { color: colors.textSecondary }]}>
              Get an invite code from a member to join. Pool OT Points, complete missions together, and climb the leaderboard.
            </Text>
            <TouchableOpacity
              style={[styles.publicSphereJoinBtn, { backgroundColor: colors.primary }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/spheres/join' as any); }}
              activeOpacity={0.9}
            >
              <Text style={styles.publicSphereJoinBtnText}>Join with invite code</Text>
              <Ionicons name="chevron-forward" size={18} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.publicSphereLeaderboardLink, { borderColor: colors.border }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/leaderboard' as any); }}
            >
              <Ionicons name="podium" size={18} color={themeGold} />
              <Text style={[styles.publicSphereLeaderboardLinkText, { color: colors.textSecondary }]}>View sphere leaderboard</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export default function SphereDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const moderationLevel = useModerationLevel();
  const { getCircle, addPost, togglePostLike, contributeToPool, updateCircleName, updateCirclePublicProfileVisibility, deleteCircle } = useSocial();
  const { getPendingByInviteCode, acceptInvite, denyInvite } = useSphereInvites();
  const { balance, addTransaction, history } = useWallet();
  const [blockedMembers, setBlockedMembers] = useState<string[]>([]);
  const blockUser = (memberName: string) => setBlockedMembers((prev) => (prev.includes(memberName) ? prev : [...prev, memberName]));
  const isBlocked = (memberName: string) => blockedMembers.includes(memberName);
  const [tab, setTab] = useState<TabKey>('feed');
  const [postText, setPostText] = useState('');
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [splitTarget, setSplitTarget] = useState<'perks' | 'missions' | 'shop' | null>(null);
  const { plans, getActivePlanForSphere, getPlansForSphere, generatePlanForSphere, markStepCompleted, cancelPlan } = useOrbPlans();
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [selectedPlanSize, setSelectedPlanSize] = useState<PlanSize>('STANDARD');
  const [tuneOpen, setTuneOpen] = useState(false);
  const [tuneRadius, setTuneRadius] = useState(10);
  const [tuneBudget, setTuneBudget] = useState<number | ''>('');
  const [tuneWeather, setTuneWeather] = useState<string>('');
  const [planSectionExpanded, setPlanSectionExpanded] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [publicProfileVisibilityModalVisible, setPublicProfileVisibilityModalVisible] = useState(false);
  const [fullScreenImageUri, setFullScreenImageUri] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);

  const openShareInviteSheet = (code: string, name: string) => {
    setSharePayload({
      message: `Join my OrbTap Sphere "${name}" — use invite code: ${code}. Pool OT Points, share experiences.`,
      url: sphereJoinUrl(code),
      title: 'Join my Sphere on OrbTap',
    });
    setShareSheetVisible(true);
  };

  const showSphereOptions = () => {
    if (!circle) return;
    safeHaptics.selectionAsync();
    alertDialog('Sphere options', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Edit name',
        onPress: () => {
          setEditNameValue(circle.name);
          setEditNameVisible(true);
        },
      },
      {
        text: 'Public profile visibility',
        onPress: () => setPublicProfileVisibilityModalVisible(true),
      },
      {
        text: 'Delete sphere',
        style: 'destructive',
        onPress: () => {
          alertDialog(
            'Delete sphere?',
            `"${circle.name}" will be permanently deleted. This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  if (deleteCircle(circle.id)) {
                    router.replace('/spheres' as any);
                  }
                },
              },
            ]
          );
        },
      },
    ]);
  };

  const handleSaveEditName = () => {
    if (!circle || !editNameValue.trim()) return;
    updateCircleName(circle.id, editNameValue.trim());
    setEditNameVisible(false);
    setEditNameValue('');
  };
  const planEarnDailyCap = DEFAULT_ORBINOMICS_POLICY.emissionCaps.planEarnDailyCap;
  const PLAN_COMPLETE_BONUS = 25;

  const circle = id ? getCircle(typeof id === 'string' ? id : id[0]) : undefined;
  const visibleMembers = circle ? circle.members.filter((m) => !isBlocked(m)) : [];
  const sphereId = circle?.id;
  const inviteCode = circle?.inviteCode ?? '';
  const { user } = useAuth();
  const { messages, loading: chatLoading, sending, error: chatError, sendMessage } = useSphereChat(sphereId, inviteCode);
  const [chatDraft, setChatDraft] = useState('');
  const chatScrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (messages.length > 0) chatScrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const showMemberActions = (memberName: string) => {
    alertDialog(memberName, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          blockUser(memberName);
          alertDialog('Blocked', 'You will no longer see this user.', [{ text: 'OK' }]);
        },
      },
    ]);
  };
  const activePlan = circle ? getActivePlanForSphere(circle.id) : undefined;
  const completedPlanForReceipt = circle
    ? getPlansForSphere(circle.id).filter((p) => p.status === 'COMPLETED').sort((a, b) => b.updatedAt - a.updatedAt)[0]
    : undefined;

  const isSameCalendarDay = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };
  const todayPlanEarn = history
    .filter(
      (t: any) =>
        t.type === 'earn' &&
        (t.reason === LEDGER_REASON.EMIT_PLAN_STEP_COMPLETE ||
          t.reason === LEDGER_REASON.EMIT_PLAN_COMPLETE_BONUS) &&
        isSameCalendarDay(t.createdAt)
    )
    .reduce((sum: number, t: any) => sum + (t.amount ?? 0), 0);
  const alreadyAwardedStep = (planId: string, stepId: string) =>
    history.some(
      (t: any) =>
        t.reason === LEDGER_REASON.EMIT_PLAN_STEP_COMPLETE &&
        t.ref?.planId === planId &&
        t.ref?.stepId === stepId
    );
  const alreadyAwardedPlanBonus = (planId: string) =>
    history.some(
      (t: any) =>
        t.type === 'earn' &&
        t.reason === LEDGER_REASON.EMIT_PLAN_COMPLETE_BONUS &&
        t.ref?.planId === planId
    );

  useEffect(() => {
    if (!circle || !flags.spheresPlansRewards) return;
    const spherePlans = getPlansForSphere(circle.id);
    const completed = spherePlans.filter((p) => p.status === 'COMPLETED');
    for (const plan of completed) {
      if (alreadyAwardedPlanBonus(plan.id)) continue;
      if (todayPlanEarn + PLAN_COMPLETE_BONUS <= planEarnDailyCap) {
        addTransaction({
          type: 'earn',
          amount: PLAN_COMPLETE_BONUS,
          reason: LEDGER_REASON.EMIT_PLAN_COMPLETE_BONUS,
          ref: { planId: plan.id },
        });
      }
      break;
    }
  }, [circle?.id, plans, history, flags.spheresPlansRewards, getPlansForSphere, addTransaction, todayPlanEarn, planEarnDailyCap]);

  const canShowPlans =
    !!circle &&
    flags.moduleSpheresPlans &&
    ((circle.type === 'couple' && flags.spheresPlansCouple) ||
      (circle.type === 'fami' && flags.spheresPlansFamily) ||
      (circle.type === 'pal' && (flags.spheresPlansPal || flags.spheresPlansSolo)));

  const handleGeneratePlan = (mode: PlanMode) => {
    if (!circle || !canShowPlans) return;
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingPlan(true);
    try {
      generatePlanForSphere({
        circle,
        sphereType:
          circle.type === 'couple'
            ? 'COUPLE'
            : circle.type === 'fami'
            ? 'FAMILY'
            : 'PAL',
        mode,
        size: selectedPlanSize,
        constraints: {
          radiusMiles: tuneRadius,
          budgetCentsMax: tuneBudget !== '' && Number(tuneBudget) >= 0 ? Number(tuneBudget) * 100 : undefined,
          weatherModeAtCreate: tuneWeather || undefined,
        },
      });
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleMarkStepDone = (plan: OrbPlan, step: PlanStep) => {
    markStepCompleted(plan.id, step.id);
    if (
      flags.spheresPlansRewards &&
      step.rewards?.otPointsEarnMax &&
      step.rewards.otPointsEarnMax > 0 &&
      !alreadyAwardedStep(plan.id, step.id) &&
      todayPlanEarn + step.rewards.otPointsEarnMax <= planEarnDailyCap
    ) {
      addTransaction({
        type: 'earn',
        amount: step.rewards.otPointsEarnMax,
        reason: LEDGER_REASON.EMIT_PLAN_STEP_COMPLETE,
        ref: { planId: plan.id, stepId: step.id },
      });
    }
  };


  const saveImageToCameraRoll = async (uri: string) => {
    setSavingImage(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showErrorAlert('Permission needed', 'Allow access to save photos to your device.');
        return;
      }
      let localUri = uri;
      if (uri.startsWith('http')) {
        const filename = `sphere_${Date.now()}.jpg`;
        const dest = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.downloadAsync(uri, dest);
        localUri = dest;
      }
      await MediaLibrary.saveToLibraryAsync(localUri);
      alertDialog('Saved', 'Photo saved to your camera roll.');
    } catch (e) {
      showErrorAlert('Could not save', e instanceof Error ? e.message : 'Failed to save photo.');
    } finally {
      setSavingImage(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showErrorAlert('Photo access needed', 'Allow photo library access in Settings to share images in your sphere.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPostImageUri(result.assets[0].uri);
      safeHaptics.selectionAsync();
    }
  };

  const handleAddPost = () => {
    if (!circle || (!postText.trim() && !postImageUri)) return;
    const text = postText.trim();
    if (text && moderationLevel !== 'none') {
      const result = moderateContent(text, moderationLevel);
      if (!result.passed) {
        showErrorAlert('Content not allowed', result.reason ?? "Your post contains content that can't be shared. Please edit and try again.");
        return;
      }
    }
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addPost(circle.id, 'You', text || undefined, postImageUri || undefined);
    setPostText('');
    setPostImageUri(null);
  };

  const handleLikePost = (post: SpherePost) => {
    if (!circle) return;
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePostLike(circle.id, post.id, 'You');
  };

  const handleSharePost = (post: SpherePost) => {
    safeHaptics.selectionAsync();
    const message = post.text
      ? `${post.author}: ${post.text.slice(0, 100)}${post.text.length > 100 ? '…' : ''} — OrbTap Sphere`
      : `${post.author} shared a photo — OrbTap Sphere`;
    setSharePayload({ message, title: 'OrbTap', url: ORBTAP_APP_LINK });
    setShareSheetVisible(true);
  };

  const handleContribute = async () => {
    if (!circle) return;
    const amount = parseInt(contributeAmount, 10);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      showErrorAlert('Invalid amount', "Enter a valid amount that doesn't exceed your current OT balance.");
      return;
    }
    await addTransaction({ type: 'spend', amount, reason: LEDGER_REASON.BURN_CIRCLE_BONUS_POOL });
    contributeToPool(circle.id, amount);
    setContributeAmount('');
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    alertDialog('Contributed', `${amount} OT Points added to the sphere pool.`, [{ text: 'OK' }]);
  };

  const handleSplitIntent = (target: 'perks' | 'missions' | 'shop') => {
    safeHaptics.selectionAsync();
    setSplitTarget(target);
    alertDialog(
      'Split pool',
      `Use pool for ${target === 'perks' ? 'perks' : target === 'missions' ? 'missions' : 'OrbTap shop'}? This will be available when we enable pool spending.`,
      [{ text: 'OK', onPress: () => setSplitTarget(null) }]
    );
  };

  if (!circle) {
    const sphereIdParam = typeof id === 'string' ? id : id?.[0];
    if (sphereIdParam === DEMO_SPHERE_LEADERBOARD_ID) {
      return (
        <PublicSphereProfileView
          profile={DEMO_SPHERE_PROFILE}
          colors={colors}
          router={router}
          safeHaptics={safeHaptics}
        />
      );
    }
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.nonMemberWrap}>
          <View style={[styles.nonMemberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={56} color={colors.textSecondary} />
            <Text style={[styles.nonMemberTitle, { color: colors.text }]}>You're not a member of this sphere</Text>
            <Text style={[styles.nonMemberBody, { color: colors.textSecondary }]}>
              Sphere feed, chat, pool, and plans are only visible to members. Join with an invite code from the sphere leader to see the full sphere and compete with the team.
            </Text>
            <TouchableOpacity
              style={[styles.nonMemberBtn, { backgroundColor: colors.primary }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/spheres/join' as any); }}
            >
              <Text style={styles.nonMemberBtnText}>Join with invite code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const typeAccent = circle.type === 'couple' ? '#EC4899' : circle.type === 'fami' ? '#F59E0B' : '#8B5CF6';
  const tierColor =
    circle.sphereTier === 'pro' || circle.sphereTier === 'premium'
      ? USER_TIERS.premium.color
      : USER_TIERS.free.color;
  const accent = circle.sphereTier ? tierColor : typeAccent;
  const sphereEstablishedDate =
    circle.createdAt != null
      ? new Date(circle.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.background, colors.surface, colors.background]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Compact hero: one block, minimal height */}
        <View style={[styles.heroCompact, { borderBottomColor: accent + '30' }]}>
          <View style={styles.heroCompactRow1}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.heroCompactTitleWrap}>
              <View style={[styles.heroCompactIconSmall, { backgroundColor: accent + '25' }]}>
                <Ionicons
                  name={circle.type === 'couple' ? 'heart' : circle.type === 'fami' ? 'home' : 'people'}
                  size={22}
                  color={accent}
                />
              </View>
              <Text style={[styles.heroCompactName, { color: colors.text }]} numberOfLines={1}>{circle.name}</Text>
              {sphereEstablishedDate ? (
                <Text style={[styles.heroCompactEstablished, { color: colors.textSecondary }]}>
                  Established {sphereEstablishedDate}
                </Text>
              ) : null}
            </View>
            <View style={styles.heroCompactHeaderActions}>
              <TouchableOpacity onPress={showSphereOptions} style={styles.headerOptionsBtn} accessibilityLabel="Sphere options" accessibilityRole="button">
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareInviteBtnCompact, { borderColor: colors.border }]}
                onPress={() => { safeHaptics.selectionAsync(); openShareInviteSheet(circle.inviteCode, circle.name); }}
              >
                <Ionicons name="share-outline" size={18} color={colors.text} />
                <Text style={[styles.shareInviteTextCompact, { color: colors.text }]}>Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.heroCompactRow2, { borderTopColor: colors.border }]}>
            <View style={styles.heroCompactStat}>
              <Text style={[styles.heroCompactStatVal, { color: colors.text }]}>{circle.verifiedVisitsCount ?? 0}</Text>
              <Text style={[styles.heroCompactStatLabel, { color: colors.textSecondary }]}>Verified</Text>
            </View>
            <View style={styles.heroCompactStat}>
              <Text style={[styles.heroCompactStatVal, { color: colors.text }]}>{circle.missionsCompletedCount ?? 0}</Text>
              <Text style={[styles.heroCompactStatLabel, { color: colors.textSecondary }]}>Missions</Text>
            </View>
            <View style={styles.heroCompactStat}>
              <OTPointsBadge amount={circle.totalPoints} size={16} label="pts" compact textColor={themeGold} />
              <Text style={[styles.heroCompactStatLabel, { color: colors.textSecondary }]}>OT</Text>
            </View>
            <View style={styles.heroCompactStat}>
              <Text style={[styles.heroCompactStatVal, { color: colors.text }]}>{circle.poolBalance}</Text>
              <Text style={[styles.heroCompactStatLabel, { color: colors.textSecondary }]}>Pool</Text>
            </View>
            <TouchableOpacity style={styles.heroCompactLeaderboard} onPress={() => router.push('/leaderboard' as any)}>
              <Ionicons name="trophy" size={14} color={themeGold} />
              <Text style={[styles.heroCompactLeaderboardText, { color: colors.textSecondary }]}>Leaderboard</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroCompactRow3}>
            <TouchableOpacity
              style={styles.heroCompactInviteRow}
              onPress={() => { safeHaptics.selectionAsync(); setQrModalVisible(true); }}
              activeOpacity={0.8}
            >
              <View style={[styles.heroCompactQrWrap, { backgroundColor: '#fff' }]}>
                <QRCode value={sphereJoinUrl(circle.inviteCode)} size={52} backgroundColor="#fff" color="#0a0a0d" />
              </View>
              <View>
                <Text style={[styles.heroCompactInvite, { color: colors.textSecondary }]}>Code: {circle.inviteCode}</Text>
                <Text style={[styles.heroCompactScanHint, { color: colors.textSecondary }]}>Tap QR to enlarge • Scan to join</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.heroCompactXp}>
              <SphereXpBar sphereXp={circle.sphereXp ?? 0} showPerk />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.heroMissionsCta, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/missions' as any); }}
            activeOpacity={0.85}
          >
            <Ionicons name="flag" size={18} color={colors.primary} />
            <Text style={[styles.heroMissionsCtaText, { color: colors.text }]}>
              Level up this Sphere — do missions together and drive traffic to partners
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Full-screen QR modal — share / print friendly */}
          <Modal visible={qrModalVisible} transparent animationType="fade">
            <Pressable style={styles.qrModalOverlay} onPress={() => setQrModalVisible(false)}>
              <Pressable style={[styles.qrModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => {}}>
                <View style={styles.qrModalHeader}>
                  <Text style={[styles.qrModalTitle, { color: colors.text }]} numberOfLines={1}>{circle.name}</Text>
                  <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.qrModalClose} hitSlop={12}>
                    <Ionicons name="close" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.qrModalSub, { color: colors.textSecondary }]}>Scan to join this Sphere. No app? Link opens store.</Text>
                <View style={[styles.qrModalQrWrap, { backgroundColor: '#fff' }]}>
                  <QRCode value={sphereJoinUrl(circle.inviteCode)} size={200} backgroundColor="#fff" color="#0a0a0d" />
                </View>
                <Text style={[styles.qrModalCode, { color: colors.text }]}>Code: {circle.inviteCode}</Text>
                <TouchableOpacity
                  style={[styles.qrModalShareBtn, { borderColor: accent }]}
                  onPress={() => {
                    safeHaptics.selectionAsync();
                    setQrModalVisible(false);
                    setSharePayload({
                      message: `Join "${circle.name}" on OrbTap — scan the QR or use code: ${circle.inviteCode}.`,
                      url: sphereJoinUrl(circle.inviteCode),
                      title: 'Join my Sphere',
                    });
                    setShareSheetVisible(true);
                  }}
                >
                  <Ionicons name="share-outline" size={20} color={accent} />
                  <Text style={[styles.qrModalShareText, { color: accent }]}>Share invite link</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          {/* Edit sphere name modal */}
          <Modal visible={editNameVisible} transparent animationType="fade">
            <Pressable style={styles.qrModalOverlay} onPress={() => setEditNameVisible(false)}>
              <Pressable style={[styles.editNameModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => {}}>
                <Text style={[styles.editNameModalTitle, { color: colors.text }]}>Edit sphere name</Text>
                <TextInput
                  style={[styles.editNameInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={editNameValue}
                  onChangeText={setEditNameValue}
                  placeholder="Sphere name"
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                />
                <View style={styles.editNameModalActions}>
                  <TouchableOpacity style={[styles.editNameCancelBtn, { borderColor: colors.border }]} onPress={() => { setEditNameVisible(false); setEditNameValue(''); }}>
                    <Text style={[styles.editNameCancelText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.editNameSaveBtn, { backgroundColor: accent }]} onPress={handleSaveEditName}>
                    <Text style={styles.editNameSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          {/* Full-screen image viewer (feed images) */}
          <Modal visible={fullScreenImageUri != null} transparent animationType="fade">
            <View style={styles.fullScreenImageBackdrop}>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setFullScreenImageUri(null)} />
              {fullScreenImageUri ? (
                <>
                  <Image source={{ uri: fullScreenImageUri }} style={styles.fullScreenImage} resizeMode="contain" />
                  <View style={styles.fullScreenImageActions}>
                    <TouchableOpacity style={[styles.fullScreenImageBtn, { backgroundColor: colors.surface }]} onPress={() => setFullScreenImageUri(null)}>
                      <Text style={[styles.fullScreenImageBtnText, { color: colors.text }]}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.fullScreenImageBtn, { backgroundColor: colors.primary }]}
                      onPress={() => fullScreenImageUri && saveImageToCameraRoll(fullScreenImageUri)}
                      disabled={savingImage}
                    >
                      <Text style={styles.fullScreenImageBtnTextPrimary}>{savingImage ? 'Saving…' : 'Save to Photos'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          </Modal>

          {/* Public profile visibility modal */}
          <Modal visible={publicProfileVisibilityModalVisible} transparent animationType="fade">
            <Pressable style={styles.qrModalOverlay} onPress={() => setPublicProfileVisibilityModalVisible(false)}>
              <Pressable style={[styles.editNameModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => {}}>
                <Text style={[styles.editNameModalTitle, { color: colors.text }]}>Public profile visibility</Text>
                <Text style={[styles.publicProfileVisibilitySub, { color: colors.textSecondary }]}>
                  When your sphere is public, choose what others see on the sphere profile.
                </Text>
                <View style={[styles.publicProfileVisibilityRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.publicProfileVisibilityLabel, { color: colors.text }]}>Show stats</Text>
                  <Switch
                    value={circle?.showStatsPublic !== false}
                    onValueChange={(v) => { safeHaptics.selectionAsync(); updateCirclePublicProfileVisibility(circle!.id, { showStatsPublic: v }); }}
                    trackColor={{ false: colors.border, true: accent }}
                  />
                </View>
                <View style={[styles.publicProfileVisibilityRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.publicProfileVisibilityLabel, { color: colors.text }]}>Show members</Text>
                  <Switch
                    value={circle?.showMembersPublic !== false}
                    onValueChange={(v) => { safeHaptics.selectionAsync(); updateCirclePublicProfileVisibility(circle!.id, { showMembersPublic: v }); }}
                    trackColor={{ false: colors.border, true: accent }}
                  />
                </View>
                <View style={[styles.publicProfileVisibilityRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.publicProfileVisibilityLabel, { color: colors.text }]}>Show achievements</Text>
                  <Switch
                    value={circle?.showAchievementsPublic !== false}
                    onValueChange={(v) => { safeHaptics.selectionAsync(); updateCirclePublicProfileVisibility(circle!.id, { showAchievementsPublic: v }); }}
                    trackColor={{ false: colors.border, true: accent }}
                  />
                </View>
                <TouchableOpacity style={[styles.editNameSaveBtn, { backgroundColor: accent, marginTop: 16 }]} onPress={() => setPublicProfileVisibilityModalVisible(false)}>
                  <Text style={styles.editNameSaveText}>Done</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        </View>

        {/* Partner invites to this sphere */}
        {circle && (() => {
          const pendingInvites = getPendingByInviteCode(circle.inviteCode);
          if (pendingInvites.length === 0) return null;
          return (
            <View style={[styles.sphereInvitesWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sphereInvitesTitle, { color: colors.textSecondary }]}>INVITES FROM PARTNERS</Text>
              {pendingInvites.map((inv) => (
                <View key={inv.id} style={[styles.sphereInviteCard, { borderColor: colors.border }]}>
                  <Text style={[styles.sphereInvitePartner, { color: colors.textSecondary }]}>{inv.partnerName}</Text>
                  <Text style={[styles.sphereInviteTitle, { color: colors.text }]}>{inv.title}</Text>
                  {inv.description ? (
                    <Text style={[styles.sphereInviteDesc, { color: colors.textSecondary }]}>{inv.description}</Text>
                  ) : null}
                  <Text style={[styles.sphereInviteCost, { color: accent }]}>
                    {inv.otCost > 0 ? `${inv.otCost} OT to accept` : 'Free'}
                  </Text>
                  <View style={styles.sphereInviteActions}>
                    <TouchableOpacity
                      style={[styles.sphereInviteDeny, { borderColor: colors.border }]}
                      onPress={async () => {
                        safeHaptics.selectionAsync();
                        await denyInvite(inv.id);
                      }}
                    >
                      <Text style={[styles.sphereInviteDenyText, { color: colors.textSecondary }]}>Deny</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sphereInviteAccept, { backgroundColor: accent }]}
                      onPress={async () => {
                        safeHaptics.selectionAsync();
                        const result = await acceptInvite(inv.id, 'You');
                        if (result.ok) {
                          alertDialog('Accepted', inv.otCost > 0 ? `${inv.otCost} OT paid. Visit ${inv.partnerName} and scan to redeem.` : `You're in. Visit ${inv.partnerName} to redeem.`, [{ text: 'OK' }]);
                        } else {
                          alertDialog('Could not accept', result.error ?? 'Try again.', [{ text: 'OK' }]);
                        }
                      }}
                    >
                      <Text style={styles.sphereInviteAcceptText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })()}

        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {TAB_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, tab === key && styles.tabActive]}
              onPress={() => { safeHaptics.selectionAsync(); setTab(key); }}
            >
              <Ionicons
                name={
                  key === 'feed' ? 'images' : key === 'chat' ? 'chatbubbles' : key === 'members' ? 'people' : 'wallet'
                }
                size={20}
                color={tab === key ? accent : colors.textSecondary}
              />
              <Text style={[styles.tabLabel, { color: tab === key ? accent : colors.textSecondary }]}>
                {key === 'feed' ? 'Feed' : key === 'chat' ? 'Chat' : key === 'members' ? 'Members' : 'Pool'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'feed' && (
            <>
              {/* OrbSwipe Meals — sphere-scoped meal discovery */}
              {flags['orbswipe.mealProposals'] && (
                <TouchableOpacity
                  style={[styles.planCollapseCard, { backgroundColor: colors.surface, borderColor: '#f59e0b' + '50' }]}
                  onPress={() => router.push(`/meal-mode?sphereId=${circle.id}&sphereName=${encodeURIComponent(circle.name)}&sphereType=${circle.type}` as any)}
                  activeOpacity={0.88}
                >
                  <View style={styles.planCollapseHeader}>
                    <Ionicons name="restaurant" size={18} color="#f59e0b" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.planCollapseTitle, { color: colors.text }]}>OrbSwipe Meals</Text>
                      <Text style={[styles.planCollapseSub, { color: colors.textSecondary }]}>Find meals together — swipe, vote, fuse</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              )}

              {/* Partner-Paid Group Mission Slot */}
              {(() => {
                const now = Date.now();
                // Mock active group mission — in production, loaded from Firestore by sphereId/partnerMissions collection
                const groupMission = {
                  id: 'gm_demo_1',
                  partnerName: 'The Rustic Table',
                  partnerTierColor: '#fbbf24',
                  title: 'Sphere Squad Night',
                  description: 'Bring your whole Sphere for dinner. Get a free dessert round + bonus OT for the table!',
                  endsAt: now + 2 * 60 * 60 * 1000, // 2 hours from now
                  otBonus: 150,
                  minMembers: 3,
                  checkedInCount: circle.members.filter((_, i) => i < 1).length, // simulate 1 checked in
                  totalMembers: visibleMembers.length,
                };
                const msLeft = groupMission.endsAt - now;
                const hLeft = Math.floor(msLeft / 3_600_000);
                const mLeft = Math.floor((msLeft % 3_600_000) / 60_000);
                const countdownLabel = hLeft > 0 ? `${hLeft}h ${mLeft}m left` : `${mLeft}m left`;
                const progressFraction = Math.min(1, groupMission.checkedInCount / groupMission.totalMembers);
                return (
                  <View style={[groupMissionStyles.card, { backgroundColor: colors.surface, borderColor: groupMission.partnerTierColor + '55' }]}>
                    <View style={groupMissionStyles.header}>
                      <View style={[groupMissionStyles.iconWrap, { backgroundColor: groupMission.partnerTierColor + '22' }]}>
                        <Ionicons name="flag" size={18} color={groupMission.partnerTierColor} />
                      </View>
                      <View style={groupMissionStyles.headerText}>
                        <Text style={[groupMissionStyles.label, { color: colors.textSecondary }]}>GROUP MISSION · PARTNER SPONSORED</Text>
                        <Text style={[groupMissionStyles.partner, { color: groupMission.partnerTierColor }]}>{groupMission.partnerName}</Text>
                      </View>
                      <View style={[groupMissionStyles.countdownBadge, { backgroundColor: COLORS.danger + '20', borderColor: COLORS.danger + '60' }]}>
                        <Ionicons name="time" size={12} color={COLORS.danger} />
                        <Text style={[groupMissionStyles.countdownText, { color: COLORS.danger }]}>{countdownLabel}</Text>
                      </View>
                    </View>
                    <Text style={[groupMissionStyles.title, { color: colors.text }]}>{groupMission.title}</Text>
                    <Text style={[groupMissionStyles.desc, { color: colors.textSecondary }]}>{groupMission.description}</Text>
                    {/* Progress: member check-ins */}
                    <View style={groupMissionStyles.progressRow}>
                      <Text style={[groupMissionStyles.progressLabel, { color: colors.textSecondary }]}>
                        {groupMission.checkedInCount}/{groupMission.totalMembers} members checked in
                      </Text>
                      <View style={[groupMissionStyles.progressTrack, { backgroundColor: colors.border }]}>
                        <View style={[groupMissionStyles.progressFill, { width: `${Math.round(progressFraction * 100)}%` as any, backgroundColor: groupMission.partnerTierColor }]} />
                      </View>
                    </View>
                    <View style={groupMissionStyles.footer}>
                      <View style={[groupMissionStyles.rewardBadge, { backgroundColor: '#fbbf24' + '22', borderColor: '#fbbf24' + '55' }]}>
                        <Ionicons name="flash" size={13} color="#fbbf24" />
                        <Text style={[groupMissionStyles.rewardText, { color: '#fbbf24' }]}>+{groupMission.otBonus} OT bonus for the table</Text>
                      </View>
                      <TouchableOpacity
                        style={[groupMissionStyles.checkInBtn, { backgroundColor: groupMission.partnerTierColor }]}
                        onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)/scan' as any); }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="qr-code" size={14} color="#000" />
                        <Text style={groupMissionStyles.checkInBtnText}>Scan QR</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[groupMissionStyles.minHint, { color: colors.textSecondary }]}>
                      Minimum {groupMission.minMembers} members required to unlock bonus
                    </Text>
                  </View>
                );
              })()}

              {/* Collapsible OrbPlans — one row when collapsed so feed gets maximum space */}
              {canShowPlans && (
                <View style={[styles.planCollapseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.planCollapseHeader}
                    onPress={() => { safeHaptics.selectionAsync(); setPlanSectionExpanded((e) => !e); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="list" size={20} color={accent} />
                    <View style={styles.planCollapseTitleWrap}>
                      <Text style={[styles.planCollapseTitle, { color: colors.text }]}>
                        {activePlan
                          ? `OrbPlans & Passport — ${activePlan.title} (${activePlan.progress.completedCount}/${activePlan.progress.totalCount})`
                          : completedPlanForReceipt
                          ? 'OrbPlans & Passport — Complete! Share receipt'
                          : 'OrbPlans & Passport — Generate a plan'}
                      </Text>
                      <Text style={[styles.planCollapseSub, { color: colors.textSecondary }]}>
                        {activePlan ? 'View steps & share passport' : completedPlanForReceipt ? 'Share your passport receipt' : 'Create tonight / day / weekend plan'}
                      </Text>
                    </View>
                    <Ionicons
                      name={planSectionExpanded ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  {planSectionExpanded && (
                    <View style={[styles.planCollapseBody, { borderTopColor: colors.border }]}>
                      {activePlan ? (
                        <View style={styles.planStepsWrap}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={[styles.planTimelineSub, { color: colors.textSecondary }]}>
                              {activePlan.progress.completedCount}/{activePlan.progress.totalCount} steps complete
                            </Text>
                            {user?.uid === activePlan.createdByUid && (
                              <TouchableOpacity
                                style={[styles.cancelPlanBtn, { borderColor: colors.border }]}
                                onPress={() => {
                                  alertDialog(
                                    'Cancel plan?',
                                    'This will end the OrbPlan/Passport for this sphere. You can create a new one anytime.',
                                    [
                                      { text: 'Keep plan', style: 'cancel' },
                                      { text: 'Cancel plan', style: 'destructive', onPress: () => cancelPlan(activePlan.id, user?.uid ?? undefined) },
                                    ]
                                  );
                                }}
                              >
                                <Text style={[styles.cancelPlanBtnText, { color: colors.textSecondary }]}>Cancel plan</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          {activePlan.steps.map((step) => {
                      const isCompleted = step.status === 'COMPLETED';
                      const isChecklist = step.type === 'CHECKLIST';
                      let ctaLabel = '';
                      if (step.type === 'DROP' && step.targetRef?.dropId) {
                        ctaLabel = 'Open drop';
                      } else if (step.type === 'VISIT') {
                        ctaLabel = 'Navigate';
                      } else if (step.type === 'QUEST') {
                        ctaLabel = 'View missions';
                      } else if (step.type === 'CHECKLIST') {
                        ctaLabel = 'Mark done';
                      }
                      return (
                        <View
                          key={step.id}
                          style={[
                            styles.planStepRow,
                            { borderColor: colors.border },
                            isCompleted && { backgroundColor: accent + '20', borderColor: accent + '60' },
                          ]}
                        >
                          <View style={styles.planStepLeft}>
                            <View style={styles.planStepTitleRow}>
                              <Text style={[styles.planStepTitle, { color: colors.text }]} numberOfLines={2}>
                                {step.title}
                              </Text>
                              {step.partnerId && FEATURED_IN_PLANS_PARTNER_IDS.has(step.partnerId) && flags.spheresPlansRewards && (
                                <View style={[styles.planStepFeaturedBadge, { backgroundColor: accent + '30' }]}>
                                  <Text style={[styles.planStepFeaturedText, { color: accent }]}>Featured</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.planStepDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                              {step.description}
                            </Text>
                          </View>
                          <View style={styles.planStepRight}>
                            <Text
                              style={[
                                styles.planStepStatus,
                                { color: isCompleted ? COLORS.success : colors.textSecondary },
                              ]}
                            >
                              {isCompleted ? 'Done' : step.verification.required ? 'Required' : 'Optional'}
                            </Text>
                            {!!ctaLabel && (
                              <TouchableOpacity
                                style={[styles.planStepCta, { borderColor: accent }]}
                                disabled={isCompleted}
                                onPress={() => {
                                  if (step.type === 'DROP' && step.targetRef?.dropId) {
                                    router.push(`/drop/${step.targetRef.dropId}` as any);
                                  } else if (step.type === 'VISIT') {
                                    router.push('/(tabs)' as any);
                                  } else if (step.type === 'QUEST') {
                                    router.push('/missions' as any);
                                  } else if (isChecklist) {
                                    handleMarkStepDone(activePlan, step);
                                  }
                                }}
                              >
                                <Text style={[styles.planStepCtaText, { color: accent }]}>
                                  {isCompleted && isChecklist ? 'Completed' : ctaLabel}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                          {activePlan?.status === 'COMPLETED' && flags.spheresPlansPassportShare && (
                      <TouchableOpacity
                        style={[styles.planShareReceiptBtn, { borderColor: accent }]}
                        onPress={() => {
                          if (!circle) return;
                          setSharePayload({
                            message: `I completed my Sphere Passport: ${activePlan.title} — ${activePlan.progress.completedCount}/${activePlan.progress.totalCount} steps. ${circle.name} on OrbTap.`,
                            title: 'Sphere Passport',
                            url: ORBTAP_APP_LINK,
                          });
                          setShareSheetVisible(true);
                        }}
                      >
                        <Ionicons name="share-social" size={18} color={accent} />
                        <Text style={[styles.planShareReceiptText, { color: accent }]}>Share Passport Receipt</Text>
                      </TouchableOpacity>
                          )}
                        </View>
                      ) : completedPlanForReceipt && !activePlan && flags.spheresPlansPassportShare ? (
                        <TouchableOpacity
                          style={[styles.planShareReceiptBtn, { borderColor: accent }]}
                          onPress={() => {
                            if (!circle) return;
                            setSharePayload({
                              message: `I completed my Sphere Passport: ${completedPlanForReceipt.title} — ${completedPlanForReceipt.progress.completedCount}/${completedPlanForReceipt.progress.totalCount} steps. ${circle.name} on OrbTap.`,
                              title: 'Sphere Passport',
                              url: ORBTAP_APP_LINK,
                            });
                            setShareSheetVisible(true);
                          }}
                        >
                          <Ionicons name="share-social" size={18} color={accent} />
                          <Text style={[styles.planShareReceiptText, { color: accent }]}>Share Passport Receipt</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <Text style={[styles.planCollapseBodyLabel, { color: colors.textSecondary }]}>Size</Text>
                          <View style={styles.planSizeRow}>
                            {(['MICRO', 'STANDARD', 'PASSPORT'] as PlanSize[]).map((size) => (
                              <TouchableOpacity
                                key={size}
                                style={[
                                  styles.planSizePill,
                                  selectedPlanSize === size && { borderColor: accent, backgroundColor: accent + '20' },
                                ]}
                                onPress={() => setSelectedPlanSize(size)}
                              >
                                <Text style={[styles.planSizeText, { color: selectedPlanSize === size ? accent : colors.textSecondary }]}>
                                  {size === 'MICRO' ? 'Micro' : size === 'STANDARD' ? 'Standard' : 'Passport'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <TouchableOpacity style={[styles.tuneToggle, { borderColor: colors.border }]} onPress={() => setTuneOpen((o) => !o)}>
                            <Ionicons name={tuneOpen ? 'chevron-up' : 'options-outline'} size={18} color={colors.textSecondary} />
                            <Text style={[styles.tuneToggleText, { color: colors.textSecondary }]}>Tune (radius, budget, weather)</Text>
                          </TouchableOpacity>
                          {tuneOpen && (
                            <View style={[styles.tunePanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                              <Text style={[styles.tuneLabel, { color: colors.textSecondary }]}>Radius (mi)</Text>
                              <View style={styles.tuneRow}>
                                {[5, 10, 15, 20, 25].map((r) => (
                                  <TouchableOpacity
                                    key={r}
                                    style={[styles.tuneChip, { borderColor: colors.border }, tuneRadius === r && { borderColor: accent, backgroundColor: accent + '20' }]}
                                    onPress={() => setTuneRadius(r)}
                                  >
                                    <Text style={[styles.tuneChipText, { color: tuneRadius === r ? accent : colors.text }]}>{r}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                              <Text style={[styles.tuneLabel, { color: colors.textSecondary }]}>Budget ($)</Text>
                              <TextInput
                                style={[styles.tuneInput, { borderColor: colors.border, color: colors.text }]}
                                value={tuneBudget === '' ? '' : String(tuneBudget)}
                                onChangeText={(v) => setTuneBudget(v === '' ? '' : parseInt(v, 10) >= 0 ? parseInt(v, 10) : tuneBudget)}
                                placeholder="Optional"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="number-pad"
                              />
                              <Text style={[styles.tuneLabel, { color: colors.textSecondary }]}>Weather</Text>
                              <View style={styles.tuneRow}>
                                {['', 'CLEAR', 'RAIN', 'SNOW'].map((w) => (
                                  <TouchableOpacity
                                    key={w || 'any'}
                                    style={[styles.tuneChip, { borderColor: colors.border }, tuneWeather === w && { borderColor: accent, backgroundColor: accent + '20' }]}
                                    onPress={() => setTuneWeather(w)}
                                  >
                                    <Text style={[styles.tuneChipText, { color: tuneWeather === w ? accent : colors.text }]}>{w || 'Any'}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}
                          <TouchableOpacity
                            style={[styles.planTemplateBtn, { borderColor: accent }]}
                            onPress={() => handleGeneratePlan('TONIGHT')}
                            disabled={generatingPlan}
                          >
                            <Ionicons name="sparkles" size={18} color={accent} />
                            <Text style={[styles.planTemplateText, { color: colors.text }]}>
                              {generatingPlan ? 'Generating…' : 'Generate tonight plan'}
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}

              <View style={styles.postComposer}>
                <View style={styles.composerRow}>
                  <TextInput
                    style={[styles.postInput, { borderColor: colors.border }]}
                    value={postText}
                    onChangeText={setPostText}
                    placeholder="Share an experience, a check-in, or a moment..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: accent }]} onPress={pickImage}>
                    <Ionicons name="image" size={24} color={accent} />
                    <Text style={[styles.addPhotoText, { color: accent }]}>Photo</Text>
                  </TouchableOpacity>
                </View>
                {postImageUri ? (
                  <View style={styles.composerPreviewWrap}>
                    <Image source={{ uri: postImageUri }} style={styles.composerPreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.removePreviewBtn} onPress={() => setPostImageUri(null)}>
                      <Ionicons name="close-circle" size={28} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[styles.postBtn, (!postText.trim() && !postImageUri) && styles.postBtnDisabled]}
                  onPress={handleAddPost}
                  disabled={!postText.trim() && !postImageUri}
                >
                  <LinearGradient colors={[accent, accent + 'dd']} style={StyleSheet.absoluteFill} />
                  <Text style={styles.postBtnText}>Post</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Recent</Text>
              {(!circle.posts || circle.posts.length === 0) ? (
                <View style={styles.emptyFeed}>
                  <Ionicons name="images-outline" size={40} color={colors.textSecondary} />
                  <Text style={[styles.emptyFeedText, { color: colors.textSecondary }]}>No posts yet. Share a photo or experience — your sphere will see it first.</Text>
                </View>
              ) : (
                circle.posts.map((post) => {
                  const likeCount = post.likeCount ?? (post.likedBy?.length ?? 0);
                  const isLiked = (post.likedBy ?? []).includes('You');
                  return (
                    <View key={post.id} style={[styles.feedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.feedCardTop}>
                        <View style={[styles.feedAvatar, { backgroundColor: accent + '40' }]}>
                          <Text style={[styles.feedAvatarText, { color: colors.text }]}>{post.author[0]}</Text>
                        </View>
                        <View style={styles.feedCardMeta}>
                          <Text style={[styles.feedAuthor, { color: colors.text }]}>{post.author}</Text>
                          <Text style={[styles.feedTime, { color: colors.textSecondary }]}>
                            {new Date(post.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                      {post.imageUri ? (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => setFullScreenImageUri(post.imageUri ?? null)}
                        >
                          <Image source={{ uri: post.imageUri }} style={styles.feedImageHero} resizeMode="cover" />
                        </TouchableOpacity>
                      ) : null}
                      {post.text ? <Text style={[styles.feedText, { color: colors.text }]}>{post.text}</Text> : null}
                      <View style={[styles.feedActions, { borderTopColor: colors.border }]}>
                        <TouchableOpacity style={styles.feedActionBtn} onPress={() => handleLikePost(post)}>
                          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? '#f43f5e' : colors.textSecondary} />
                          <Text style={[styles.feedActionText, { color: colors.textSecondary }]}>{likeCount > 0 ? likeCount : 'Like'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedActionBtn} onPress={() => handleSharePost(post)}>
                          <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
                          <Text style={[styles.feedActionText, { color: colors.textSecondary }]}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {tab === 'chat' && (
            <View style={styles.chatWrap}>
              {!user ? (
                <View style={styles.placeholder}>
                  <View style={[styles.placeholderIcon, { backgroundColor: accent + '20' }]}>
                    <Ionicons name="lock-closed" size={48} color={accent} />
                  </View>
                  <Text style={styles.placeholderTitle}>Sign in to chat</Text>
                  <Text style={styles.placeholderSub}>Group chat is private. Sign in to send and read messages.</Text>
                  <TouchableOpacity style={[styles.chatSignInBtn, { backgroundColor: accent }]} onPress={() => router.push('/auth/login' as any)}>
                    <Text style={styles.chatSignInBtnText}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {chatError ? <Text style={styles.chatError}>{chatError}</Text> : null}
                  {chatLoading ? (
                    <View style={styles.chatLoading}>
                      <ActivityIndicator size="small" color={accent} />
                      <Text style={[styles.chatLoadingText, { color: colors.textSecondary }]}>Loading messages…</Text>
                    </View>
                  ) : (
                    <ScrollView
                      ref={chatScrollRef}
                      style={styles.chatScroll}
                      contentContainerStyle={styles.chatScrollContent}
                      onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
                      keyboardShouldPersistTaps="handled"
                    >
                      {messages.length === 0 ? (
                        <Text style={styles.chatEmpty}>No messages yet. Say hi — only sphere members can read.</Text>
                      ) : (
                        messages.map((msg) => (
                          <View key={msg.id} style={[styles.chatBubble, msg.isFromMe ? styles.chatBubbleMe : styles.chatBubbleThem, msg.isFromMe && { backgroundColor: accent + '40', alignSelf: 'flex-end' }]}>
                            {!msg.isFromMe && <Text style={styles.chatBubbleSender}>{msg.senderDisplayName}</Text>}
                            <Text style={styles.chatBubbleText}>{msg.plaintext || '(message)'}</Text>
                            <Text style={styles.chatBubbleTime}>{new Date(msg.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  )}
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.chatInputRow, { borderTopColor: colors.border }]}>
                    <TextInput
                      style={[styles.chatInput, { backgroundColor: colors.surfaceHighlight, color: colors.text }]}
                      value={chatDraft}
                      onChangeText={setChatDraft}
                      placeholder="Message"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      maxLength={2000}
                      editable={!sending}
                    />
                    <TouchableOpacity
                      style={[styles.chatSendBtn, { backgroundColor: accent }]}
                      onPress={() => {
                        if (!chatDraft.trim() || sending) return;
                        if (moderationLevel !== 'none') {
                          const result = moderateContent(chatDraft.trim(), moderationLevel);
                          if (!result.passed) {
                            showErrorAlert('Message not allowed', result.reason ?? "Your message contains content that can't be sent. Please edit and try again.");
                            return;
                          }
                        }
                        safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        sendMessage(chatDraft.trim());
                        setChatDraft('');
                      }}
                      disabled={sending || !chatDraft.trim()}
                    >
                      {sending ? <ActivityIndicator size="small" color={colors.text} /> : <Ionicons name="send" size={20} color={colors.text} />}
                    </TouchableOpacity>
                  </KeyboardAvoidingView>
                </>
              )}
            </View>
          )}

          {tab === 'members' && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{visibleMembers.length} members</Text>
              {visibleMembers.map((m, idx) => (
                <TouchableOpacity
                  key={`${m}-${idx}`}
                  style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => showMemberActions(m)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: accent + '30' }]}>
                    <Text style={[styles.memberAvatarText, { color: colors.text }]}>{m[0]}</Text>
                  </View>
                  <Text style={[styles.memberName, { color: colors.text }]}>{m}</Text>
                  <Text style={[styles.memberRank, { color: accent }]}>#{idx + 1}</Text>
                  <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
              <View style={styles.inviteRow}>
                <Ionicons name="key" size={20} color={accent} />
                <Text style={[styles.inviteLabel, { color: colors.textSecondary }]}>Invite code</Text>
                <Text style={[styles.inviteCodeValue, { color: colors.text }]}>{circle.inviteCode}</Text>
                <TouchableOpacity
                  style={styles.copyInviteBtn}
                  onPress={() => {
                    safeHaptics.selectionAsync();
                    openShareInviteSheet(circle.inviteCode, circle.name);
                  }}
                >
                  <Text style={[styles.copyInviteText, { color: colors.text }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {tab === 'pool' && (
            <>
              <View style={[styles.poolCard, { borderColor: accent + '40' }]}>
                <LinearGradient
                  colors={[accent + '20', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.poolLabel, { color: colors.textSecondary }]}>Pool balance</Text>
                <OTPointsBadge amount={circle.poolBalance} size={28} label="pts" compact textColor={themeGold} />
                <Text style={[styles.poolSub, { color: colors.textSecondary }]}>Use for perks, missions, or future OrbTap shop.</Text>
              </View>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Contribute OT Points</Text>
              <View style={styles.contributeRow}>
                <TextInput
                  style={[styles.contributeInput, { backgroundColor: colors.surfaceHighlight, color: colors.text }]}
                  value={contributeAmount}
                  onChangeText={setContributeAmount}
                  placeholder="Amount"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={styles.contributeBtn} onPress={handleContribute} activeOpacity={0.9}>
                  <Text style={[styles.contributeBtnText, { color: colors.text }]}>Add to pool</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Split pool for</Text>
              <View style={styles.splitRow}>
                <TouchableOpacity
                  style={[styles.splitOption, { backgroundColor: colors.surfaceHighlight }, splitTarget === 'perks' && { borderColor: accent }]}
                  onPress={() => handleSplitIntent('perks')}
                >
                  <Ionicons name="gift" size={24} color={accent} />
                  <Text style={[styles.splitOptionText, { color: colors.text }]}>Perks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.splitOption, { backgroundColor: colors.surfaceHighlight }, splitTarget === 'missions' && { borderColor: accent }]}
                  onPress={() => handleSplitIntent('missions')}
                >
                  <Ionicons name="flag" size={24} color={accent} />
                  <Text style={[styles.splitOptionText, { color: colors.text }]}>Missions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.splitOption, { backgroundColor: colors.surfaceHighlight }, splitTarget === 'shop' && { borderColor: accent }]}
                  onPress={() => handleSplitIntent('shop')}
                >
                  <Ionicons name="cart" size={24} color={accent} />
                  <Text style={[styles.splitOptionText, { color: colors.text }]}>Shop</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.poolDisclaimer, { color: colors.textSecondary }]}>Pool spending will be enabled for perks, missions, and OrbTap shop in a future update.</Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share"
        />
      )}
    </View>
  );
}

const groupMissionStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  partner: { fontSize: 14, fontWeight: '800' },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countdownText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  progressRow: { gap: 6 },
  progressLabel: { fontSize: 11, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rewardBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rewardText: { fontSize: 12, fontWeight: '700' },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  checkInBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
  minHint: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0d' },
  safe: { flex: 1 },
  backBtn: { padding: 8 },
  notFound: { color: '#fff', fontSize: 16, padding: 20 },
  nonMemberWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  nonMemberCard: { maxWidth: 360, width: '100%', padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  nonMemberTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  nonMemberBody: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  nonMemberBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  nonMemberBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  nonMemberHint: { fontSize: 11, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
  publicSphereHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  publicSphereHeaderTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  publicSphereScrollContent: { padding: 16, paddingBottom: 24 },
  publicSphereHero: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16 },
  publicSphereHeroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  publicSphereTypePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  publicSphereTypeText: { fontSize: 12, fontWeight: '800' },
  publicSphereTierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  publicSphereTierText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  publicSphereName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  publicSphereEstablished: { fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  publicSphereTagline: { fontSize: 14, marginBottom: 12 },
  publicSphereXpWrap: { marginTop: 4 },
  publicSphereSection: { marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  publicSphereSectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  publicSphereStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  publicSphereStat: { alignItems: 'center', minWidth: 64 },
  publicSphereStatVal: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  publicSphereStatLabel: { fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  publicSphereLeaderboardWins: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  publicSphereLeaderboardWinsText: { fontSize: 14, fontWeight: '700' },
  publicSphereAchievementRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  publicSphereAchievementTitle: { fontSize: 16, fontWeight: '800' },
  publicSphereAchievementSub: { fontSize: 12, marginTop: 2 },
  publicSphereSectionHint: { fontSize: 12, lineHeight: 18 },
  publicSphereMemberCount: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  publicSphereMemberChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  publicSphereMemberChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  publicSphereMemberChipText: { fontSize: 13, fontWeight: '600' },
  publicSphereJoinSection: { padding: 18, borderRadius: 16, borderWidth: 1, backgroundColor: 'rgba(96,165,250,0.06)' },
  publicSphereJoinTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  publicSphereJoinSub: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  publicSphereJoinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, marginBottom: 12 },
  publicSphereJoinBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  publicSphereLeaderboardLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  publicSphereLeaderboardLinkText: { fontSize: 13, fontWeight: '700' },
  sphereInvitesWrap: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  sphereInvitesTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  sphereInviteCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  sphereInvitePartner: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  sphereInviteTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  sphereInviteDesc: { fontSize: 13, marginBottom: 8 },
  sphereInviteCost: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  sphereInviteActions: { flexDirection: 'row', gap: 10 },
  sphereInviteDeny: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  sphereInviteDenyText: { fontSize: 14, fontWeight: '700' },
  sphereInviteAccept: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  sphereInviteAcceptText: { fontSize: 14, fontWeight: '800', color: '#000' },
  headerBack: { padding: 8 },
  heroCompact: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1 },
  heroCompactRow1: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  heroCompactTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0, marginHorizontal: 12 },
  heroCompactIconSmall: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  heroCompactName: { fontSize: 18, fontWeight: '800', flex: 1 },
  heroCompactEstablished: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  heroCompactHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerOptionsBtn: { padding: 8 },
  shareInviteBtnCompact: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  shareInviteTextCompact: { fontSize: 12, fontWeight: '700' },
  heroCompactRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1 },
  heroCompactStat: { alignItems: 'center' },
  heroCompactStatVal: { fontSize: 14, fontWeight: '800' },
  heroCompactStatLabel: { fontSize: 9, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroCompactLeaderboard: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroCompactLeaderboardText: { fontSize: 11, fontWeight: '700' },
  heroCompactRow3: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  heroCompactInviteRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroCompactQrWrap: { padding: 4, borderRadius: 8 },
  heroCompactInvite: { fontSize: 11, letterSpacing: 1 },
  heroCompactScanHint: { fontSize: 9, marginTop: 2, opacity: 0.8 },
  heroCompactXp: { flex: 1, marginLeft: 12, maxWidth: 180 },
  heroMissionsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  heroMissionsCtaText: { flex: 1, fontSize: 14, fontWeight: '700' },
  qrModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  qrModalCard: { width: '100%', maxWidth: 320, borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center' },
  qrModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  qrModalTitle: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 12 },
  qrModalClose: { padding: 4 },
  qrModalSub: { fontSize: 12, textAlign: 'center', marginBottom: 20 },
  qrModalQrWrap: { padding: 16, borderRadius: 16, marginBottom: 12 },
  qrModalCode: { fontSize: 16, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  qrModalShareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 2 },
  qrModalShareText: { fontSize: 15, fontWeight: '700' },
  editNameModalCard: { width: '100%', maxWidth: 320, borderRadius: 20, borderWidth: 1, padding: 24 },
  editNameModalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  editNameInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 20 },
  editNameModalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  editNameCancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1 },
  editNameCancelText: { fontSize: 15, fontWeight: '700' },
  editNameSaveBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  editNameSaveText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  publicProfileVisibilitySub: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  publicProfileVisibilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  publicProfileVisibilityLabel: { fontSize: 15, fontWeight: '600' },
  planCollapseCard: { marginBottom: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  planCollapseHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  planCollapseTitleWrap: { flex: 1, minWidth: 0 },
  planCollapseTitle: { fontSize: 14, fontWeight: '700' },
  planCollapseSub: { fontSize: 11, marginTop: 2 },
  planCollapseBody: { padding: 14, paddingTop: 12 },
  planCollapseBodyLabel: { fontSize: 11, marginBottom: 6 },
  planStepsWrap: {},
  cancelPlanBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  cancelPlanBtnText: { fontSize: 13, fontWeight: '600' },
  fullScreenImageBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '80%' },
  fullScreenImageActions: { flexDirection: 'row', gap: 12, marginTop: 16, paddingHorizontal: 24 },
  fullScreenImageBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  fullScreenImageBtnText: { fontSize: 16, fontWeight: '700' },
  fullScreenImageBtnTextPrimary: { color: '#fff', fontSize: 16, fontWeight: '700' },
  planHeroCard: {
    marginTop: 10,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.9)',
  },
  planHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planHeroTitle: { fontSize: 14, fontWeight: '700' },
  planHeroStatus: { fontSize: 12, fontWeight: '600' },
  planHeroSubtitle: { fontSize: 12, marginBottom: 6 },
  planHeroStepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  planHeroStepPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.9)',
  },
  planHeroStepText: { fontSize: 11, maxWidth: 140 },
  planHeroMore: { fontSize: 11 },
  planHeroCta: {
    marginTop: 2,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  planHeroCtaText: { fontSize: 12, fontWeight: '600' },
  planSizeRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 4 },
  planSizePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
  },
  planSizeText: { fontSize: 11, fontWeight: '600' },
  planTemplateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2, marginBottom: 2 },
  planTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: 'rgba(15,23,42,0.8)',
  },
  planTemplateText: { fontSize: 12, fontWeight: '600' },
  planHint: { fontSize: 11, marginTop: 2 },
  tuneToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  tuneToggleText: { fontSize: 12 },
  tunePanel: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tuneLabel: { fontSize: 11, marginBottom: 4 },
  tuneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tuneChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tuneChipText: { fontSize: 12, fontWeight: '600' },
  tuneInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    marginBottom: 8,
  },
  planShareReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  planShareReceiptText: { fontSize: 13, fontWeight: '700' },
  planTimelineCard: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.95)',
  },
  planTimelineTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  planTimelineSub: { fontSize: 12, marginBottom: 10 },
  planStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  planStepLeft: { flex: 1 },
  planStepRight: { alignItems: 'flex-end', minWidth: 96 },
  planStepTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  planStepTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  planStepFeaturedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  planStepFeaturedText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  planStepDesc: { fontSize: 11, opacity: 0.8 },
  planStepStatus: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  planStepCta: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  planStepCtaText: { fontSize: 11, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#8B5CF6' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 12 },
  postComposer: { marginBottom: 20 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 12 },
  postInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#FFF',
    minHeight: 72,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  addPhotoBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  addPhotoText: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  composerPreviewWrap: { position: 'relative', marginBottom: 12, borderRadius: 14, overflow: 'hidden' },
  composerPreview: { width: FEED_IMAGE_WIDTH - 20, height: 160, borderRadius: 14 },
  removePreviewBtn: { position: 'absolute', top: 8, right: 8 },
  postBtn: { paddingVertical: 14, borderRadius: 14, overflow: 'hidden', alignItems: 'center' },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  emptyFeed: { alignItems: 'center', paddingVertical: 48 },
  emptyFeedIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyFeedTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  emptyFeedText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  feedCard: { marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 0, borderWidth: 1, overflow: 'hidden', borderColor: 'rgba(255,255,255,0.06)' },
  feedCardTop: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12 },
  feedAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  feedAvatarText: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  feedCardMeta: { flex: 1 },
  feedAuthor: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  feedTime: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  feedImageHero: { width: '100%', height: FEED_IMAGE_HEIGHT, backgroundColor: 'rgba(0,0,0,0.2)' },
  feedText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', lineHeight: 24, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  feedActions: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  feedActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedActionText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  placeholder: { alignItems: 'center', paddingVertical: 48 },
  placeholderIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  placeholderTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.04)', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberAvatarText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  memberName: { fontSize: 16, fontWeight: '700', color: '#FFF', flex: 1 },
  memberRank: { fontSize: 14, fontWeight: '700', color: '#8B5CF6', marginRight: 8 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, padding: 16, backgroundColor: 'rgba(139,92,246,0.12)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  inviteLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  inviteCodeValue: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 2 },
  copyInviteBtn: { marginLeft: 'auto', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#8B5CF6' },
  copyInviteText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  poolCard: { padding: 24, borderRadius: 18, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
  poolLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 8 },
  poolSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 12 },
  contributeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  contributeInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFF' },
  contributeBtn: { paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center', backgroundColor: '#8B5CF6' },
  contributeBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  splitRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  splitOption: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 2, borderColor: 'transparent' },
  splitOptionText: { fontSize: 13, fontWeight: '700', color: '#FFF', marginTop: 8 },
  poolDisclaimer: { fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },
  chatWrap: { flex: 1, minHeight: 280 },
  chatSignInBtn: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignSelf: 'center' },
  chatSignInBtnText: { fontSize: 15, fontWeight: '800', color: '#000' },
  chatError: { fontSize: 12, color: '#ef4444', paddingHorizontal: 16, marginBottom: 8 },
  chatLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  chatLoadingText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  chatScroll: { flex: 1, maxHeight: 320 },
  chatScrollContent: { paddingVertical: 12, paddingBottom: 24 },
  chatEmpty: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  chatBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginHorizontal: 16, marginBottom: 8 },
  chatBubbleMe: { alignSelf: 'flex-end' },
  chatBubbleThem: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)' },
  chatBubbleSender: { fontSize: 11, fontWeight: '700', color: '#8B5CF6', marginBottom: 4 },
  chatBubbleText: { fontSize: 15, color: '#FFF', lineHeight: 22 },
  chatBubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#FFF', maxHeight: 100 },
  chatSendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
