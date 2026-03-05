import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { OrbTapLogoMark } from '../../components/OrbTapLogoMark';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { useXP } from '../../hooks/useXP';
import { useSphereInvites } from '../../hooks/useSphereInvites';
import { COLORS } from '../../constants/Colors';
import { SPACE, RADIUS, MOTION, TAP_TARGET_MIN } from '../../constants/DesignTokens';
import { SCAN_SUCCESS_SHARE_HINT, TONIGHT_RECAP_SHARE_HOOK } from '../../constants/ViralCopy';
import { INVITE_EARN_50_OT } from '../../constants/ConversionCopy';
import { consumeOrbSwipePendingWinIfMatch } from '../../services/orbswipeOrigin';
import { logOrbSwipeEvent } from '../../services/orbswipeAnalytics';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { orbswipeDeepLink, userInviteUrl, USER_INVITE_MESSAGE } from '../../constants/AppLinks';
import { userInviteSharePayload } from '../../utils/shareToSocial';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../hooks/usePreferences';
import { FriendPassOffer } from '../../components/FriendPassOffer';
import { useFlags } from '../../components/FlagContext';
import { useMissions, isMissionFullyComplete } from '../../context/MissionsContext';
import { markIntentCompleted } from '../../services/savedIntents';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { showRatingPromptIfDelight } from '../../utils/delightRatingPrompt';
import { useI18n } from '../../context/I18nContext';
import { logScanVerified, logProofShared } from '../../services/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_SCAN_KEY = 'ORBTAP_FIRST_SCAN_SHARED';

// Animated integer counter hook
function useCountUp(target: number, durationMs = 1200, delayMs = 300) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delayMs, withTiming(1, { duration: durationMs, easing: Easing.out(Easing.cubic) }));
  }, [target]);
  return progress;
}

export default function ScanSuccessScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { isPremium } = useEffectiveTier();
  const { level, title } = useXP();
  const { getStakedInviteForPartner, clearStake } = useSphereInvites();
  const [orbswipeWinBanner, setOrbswipeWinBanner] = useState(false);
  const [recapShareVisible, setRecapShareVisible] = useState(false);
  const [friendPassDismissed, setFriendPassDismissed] = useState(false);
  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
  const [invitePayload, setInvitePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const [showReferral, setShowReferral] = useState(false);
  // VM1 — First-scan mandatory share sheet
  const [firstScanShareVisible, setFirstScanShareVisible] = useState(false);
  const [firstScanPayload, setFirstScanPayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const { user } = useAuth();
  const prefs = usePreferences();
  const { flags } = useFlags();
  const { todayMissions } = useMissions();
  const nextMission = todayMissions.find((m) => !isMissionFullyComplete(m));

  const params = useLocalSearchParams<{
    points?: string;
    partner?: string;
    partnerId?: string;
    proofId?: string;
    tier?: string;
    createdAt?: string;
    jackpot?: string;
  }>();
  const points = parseInt(params.points ?? '0', 10);
  const partner = params.partner ?? 'Partner';
  const partnerId = params.partnerId ?? '';
  const proofId = params.proofId;
  const tier = (params.tier ?? 'gold') as PartnerTier;
  const createdAt = params.createdAt;
  const isJackpot = params.jackpot === '1';

  // Tier color
  const tierColor = PARTNER_TIER_COLORS[tier] ?? COLORS.success;

  // ─── Animations ──────────────────────────────────────────
  // Checkmark scale spring
  const checkScale = useSharedValue(0);
  const checkGlow = useSharedValue(0);
  // OT Points badge pulse
  const otScale = useSharedValue(1);

  // OT count-up
  const countProgress = useCountUp(points, 1100, 400);

  // Jackpot slot animation state
  const [jackpotDone, setJackpotDone] = useState(!isJackpot);
  const jackpotOpacity = useSharedValue(isJackpot ? 1 : 0);
  const jackpotSlot = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => showRatingPromptIfDelight('first_scan'), 3500);
    return () => clearTimeout(t);
  }, []);

  // Log scan_verified analytics event
  useEffect(() => {
    if (points > 0 && partnerId) {
      logScanVerified({ partner_id: partnerId, points, tier, is_first_scan: false });
    }
  }, []);

  // VM1 — First-scan share sheet: shows automatically on the user's very first verified visit.
  useEffect(() => {
    (async () => {
      const alreadyShared = await AsyncStorage.getItem(FIRST_SCAN_KEY);
      if (!alreadyShared && partner && points > 0) {
        await AsyncStorage.setItem(FIRST_SCAN_KEY, '1');
        const msg = `Just got my first verified visit at ${partner} on OrbTap — earned ${points} OT Points 🔮 Download the app: https://orbtap.com`;
        setFirstScanPayload({ message: msg, title: 'Share your first win!', url: 'https://orbtap.com' });
        // Delay so celebration animations play first
        setTimeout(() => setFirstScanShareVisible(true), 2500);
      }
    })();
  }, []);

  useEffect(() => {
    // Trigger success haptic + checkmark spring
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 180 }));
    // OT Points pulse: scale 1 → 1.15 → 1
    otScale.value = withDelay(500, withSequence(
      withSpring(1.15, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 180 }),
    ));
    checkGlow.value = withDelay(200, withRepeat(withSequence(
      withTiming(1, { duration: 600 }),
      withTiming(0.4, { duration: 600 }),
    ), 3, true));

    // Show referral CTA after celebration
    const t = setTimeout(() => setShowReferral(true), 2000);

    // Jackpot animation sequence
    if (isJackpot) {
      jackpotSlot.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.8, { duration: 200 }),
        withTiming(1, { duration: 200 }),
        withTiming(0.85, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      );
      setTimeout(() => {
        jackpotOpacity.value = withTiming(0, { duration: 400 });
        setTimeout(() => runOnJS(setJackpotDone)(true), 420);
      }, 1800);
    }
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (partnerId) {
      consumeOrbSwipePendingWinIfMatch(partnerId).then((matched) => {
        if (matched) {
          setOrbswipeWinBanner(true);
          logOrbSwipeEvent({ type: 'verified_win', partnerId });
        }
      });
      if (flags.isOrbSwipeSavedIntentsEnabled) {
        markIntentCompleted(partnerId, user?.uid ?? 'anon');
      }
    }
  }, [partnerId, flags.isOrbSwipeSavedIntentsEnabled]);

  useEffect(() => {
    const staked = getStakedInviteForPartner(partner);
    if (staked) clearStake(staked.id);
  }, [partner, getStakedInviteForPartner, clearStake]);

  const openProofCard = () => {
    if (!proofId) return;
    router.push({
      pathname: '/proof/[id]',
      params: { id: proofId, partner, points: String(points), tier, createdAt: createdAt ?? String(Date.now()) },
    } as any);
  };

  // Animated styles
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    shadowOpacity: interpolate(checkGlow.value, [0, 1], [0.2, 0.7]),
    shadowRadius: interpolate(checkGlow.value, [0, 1], [8, 28]),
  }));

  const jackpotStyle = useAnimatedStyle(() => ({
    opacity: jackpotOpacity.value,
    transform: [{ scale: jackpotSlot.value }],
  }));

  const otPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: otScale.value }],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#040408' : '#f6f6fa' }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <OrbTapLogoMark variant="small" width={36} height={31} />
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Verified ✓</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Jackpot overlay */}
        {isJackpot && !jackpotDone && (
          <Animated.View style={[styles.jackpotOverlay, jackpotStyle]}>
            <Text style={styles.jackpotEmoji}>🎰</Text>
            <Text style={styles.jackpotLabel}>LUCKY ORB JACKPOT!</Text>
            <Text style={[styles.jackpotAmount, { color: themeGold }]}>3× MULTIPLIER</Text>
          </Animated.View>
        )}

        {/* Animated checkmark */}
        <Animated.View
          style={[
            styles.iconCircle,
            {
              borderColor: tierColor + '80',
              backgroundColor: tierColor + '15',
              shadowColor: tierColor,
            },
            checkStyle,
          ]}
        >
          <Ionicons name="checkmark-circle" size={80} color={tierColor} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(150).duration(350)} style={[styles.title, { color: colors.text }]}>
          {isJackpot ? '🎉 Jackpot Scan!' : 'Verified!'}
        </Animated.Text>

        {/* OT count-up */}
        <Animated.View entering={FadeIn.delay(300).duration(400)} style={[styles.otRow, otPulseStyle]}>
          <Ionicons name="ellipse" size={18} color={tierColor} />
          <Animated.Text style={[styles.otAmount, { color: tierColor }]}>
            {/* Static display since animated text needs useAnimatedProps — keep it simple */}
            +{points}
          </Animated.Text>
          <Text style={[styles.otLabel, { color: colors.textSecondary }]}>OT POINTS</Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(400).duration(300)} style={[styles.partnerLabel, { color: colors.textSecondary }]}>
          Earned at <Text style={[styles.partnerName, { color: colors.text }]}>{partner}</Text>
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(480).duration(300)} style={[styles.xpHint, { color: colors.textSecondary }]}>
          Level {level} {title} — keep visiting to level up.
        </Animated.Text>

        {/* OrbSwipe win banner */}
        {orbswipeWinBanner && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.orbswipeBanner, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
            <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
            <Text style={[styles.orbswipeBannerText, { color: colors.text }]}>OrbSwipe Win</Text>
            <TouchableOpacity
              style={[styles.orbswipeShareBtn, { borderColor: colors.primary }]}
              onPress={() => setRecapShareVisible(true)}
            >
              <Text style={[styles.orbswipeShareBtnText, { color: colors.primary }]}>Share your night</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Friend Pass after OrbSwipe win */}
        {orbswipeWinBanner && flags.isOrbSwipeFriendPassesEnabled && !friendPassDismissed && partnerId && (
          <FriendPassOffer
            creatorUid={user?.uid ?? 'anon'}
            partnerId={partnerId}
            partnerName={partner}
            onDismiss={() => setFriendPassDismissed(true)}
          />
        )}

        {/* Referral prompt — appears after 2s */}
        {showReferral && (
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.referralCard, { borderColor: themeGold + '60', backgroundColor: themeGold + '0C' }]}>
            <Ionicons name="gift" size={22} color={themeGold} />
            <View style={styles.referralText}>
              <Text style={[styles.referralTitle, { color: colors.text }]}>Share the win!</Text>
              <Text style={[styles.referralSub, { color: colors.textSecondary }]}>{INVITE_EARN_50_OT}</Text>
            </View>
            <TouchableOpacity
              style={[styles.referralBtn, { backgroundColor: themeGold }]}
              onPress={() => {
                if (user?.uid) {
                  const url = userInviteUrl(user.uid);
                  setInvitePayload(userInviteSharePayload(url, prefs?.prefs?.shareMessage ?? USER_INVITE_MESSAGE));
                  setInviteSheetVisible(true);
                } else {
                  router.push('/invite' as any);
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.referralBtnText}>Invite</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* What's next strip */}
        <Animated.View entering={FadeInDown.delay(550).duration(350)} style={styles.whatsNextStrip}>
          <Text style={[styles.whatsNextLabel, { color: colors.textSecondary }]}>What's next?</Text>
          {flags.isOrbQuestEnabled && nextMission && (
            <TouchableOpacity
              style={[styles.nextMissionChip, { backgroundColor: tierColor + '20', borderColor: tierColor + '60' }]}
              onPress={() => router.push('/missions' as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="flag" size={14} color={tierColor} />
              <Text style={[styles.nextMissionText, { color: tierColor }]} numberOfLines={1}>▶ {nextMission.title}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Action buttons */}
        <Animated.View entering={FadeInDown.delay(600).duration(350)} style={styles.buttons}>
          {proofId ? (
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: tierColor }]}
              onPress={() => {
                if (proofId) logProofShared({ proof_id: proofId, partner_id: partnerId || undefined, channel: 'scan_success' });
                openProofCard();
              }}
              activeOpacity={0.88}
            >
              <Ionicons name="share-social" size={20} color="#000" />
              <Text style={styles.btnPrimaryText}>Share Proof Card</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: COLORS.neonBlue[0] }]}
            onPress={() => router.push('/(tabs)' as any)}
            activeOpacity={0.88}
          >
            <Ionicons name="map" size={20} color="#000" />
            <Text style={styles.btnPrimaryText}>Find another orb</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSecondary, styles.btnSecondaryFull, { borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/wallet' as any)}
            activeOpacity={0.88}
          >
            <Ionicons name="wallet" size={18} color={colors.text} />
            <Text style={[styles.btnSecondaryText, { color: colors.text }]}>View Wallet</Text>
          </TouchableOpacity>
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: colors.border }]}
              onPress={() => router.push('/missions' as any)}
              activeOpacity={0.88}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.text }]}>Missions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: colors.border }]}
              onPress={() => router.push('/pulse' as any)}
              activeOpacity={0.88}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.text }]}>Pulse</Text>
            </TouchableOpacity>
          </View>
          {!isPremium && (
            <TouchableOpacity
              style={[styles.btnSecondary, styles.btnSecondaryFull, { borderColor: themeGold, borderWidth: 1.5 }]}
              onPress={() => router.push('/premium' as any)}
              activeOpacity={0.88}
            >
              <Text style={[styles.btnSecondaryText, { color: themeGold, fontWeight: '700' }]}>
                Earn more with Premium
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btnSecondary, styles.btnSecondaryFull, { borderColor: colors.border }]}
            onPress={() => router.replace('/(tabs)' as any)}
            activeOpacity={0.88}
          >
            <Text style={[styles.btnSecondaryText, { color: colors.textSecondary }]}>Back to Map</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <ShareToSocialSheet
        visible={recapShareVisible}
        onClose={() => setRecapShareVisible(false)}
        payload={{
          message: TONIGHT_RECAP_SHARE_HOOK,
          url: orbswipeDeepLink(),
          title: 'OrbTap Tonight',
        }}
      />
      {invitePayload && (
        <ShareToSocialSheet
          visible={inviteSheetVisible}
          onClose={() => { setInviteSheetVisible(false); setInvitePayload(null); }}
          payload={invitePayload}
          label="Invite friends"
        />
      )}
      {/* VM1 — First-scan mandatory share sheet */}
      {firstScanPayload && (
        <ShareToSocialSheet
          visible={firstScanShareVisible}
          onClose={() => setFirstScanShareVisible(false)}
          payload={firstScanPayload}
          label="Share your first win!"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
    gap: SPACE.md,
    minHeight: 56,
  },
  backBtn: { padding: SPACE.sm },
  topBarTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    padding: SPACE.xl,
    paddingTop: 32,
    gap: 0,
  },
  jackpotOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 40,
    zIndex: 10,
  },
  jackpotEmoji: { fontSize: 60, marginBottom: 8 },
  jackpotLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  jackpotAmount: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  otRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  otAmount: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
  },
  otLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  partnerLabel: { fontSize: 15, marginBottom: 6, textAlign: 'center' },
  partnerName: { fontWeight: '800' },
  xpHint: { fontSize: 12, textAlign: 'center', marginBottom: 16, paddingHorizontal: SPACE.base, lineHeight: 18 },
  orbswipeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACE.md,
    maxWidth: 320,
    width: '100%',
  },
  orbswipeBannerText: { fontSize: 14, fontWeight: '600', flex: 1 },
  orbswipeShareBtn: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderRadius: RADIUS.sm, borderWidth: 1 },
  orbswipeShareBtnText: { fontSize: 13, fontWeight: '600' },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 320,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  referralText: { flex: 1, minWidth: 0 },
  referralTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  referralSub: { fontSize: 12 },
  referralBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  referralBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
  whatsNextStrip: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginTop: SPACE.md,
    marginBottom: SPACE.xs,
  },
  whatsNextLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  nextMissionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    maxWidth: 280,
  },
  nextMissionText: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  buttons: { width: '100%', maxWidth: 320, gap: SPACE.sm, marginTop: 4 },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.base,
    paddingHorizontal: SPACE.xl,
    borderRadius: RADIUS.base,
    width: '100%',
    minHeight: TAP_TARGET_MIN,
  },
  btnPrimaryText: { color: '#000', fontSize: 16, fontWeight: '800' },
  secondaryRow: { flexDirection: 'row', gap: SPACE.sm },
  btnSecondary: {
    flex: 1,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: TAP_TARGET_MIN,
  },
  btnSecondaryFull: { flex: undefined, width: '100%' },
  btnSecondaryText: { fontSize: 14, fontWeight: '600' },
});
