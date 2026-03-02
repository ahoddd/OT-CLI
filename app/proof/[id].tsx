import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { SPACE, RADIUS, TAP_TARGET_MIN } from '../../constants/DesignTokens';
import { proofDeepLink, ORBTAP_APP_LINK } from '../../constants/AppLinks';
import { logPartnerAttribution } from '../../services/partnerAttribution';
import { OrbTapLogoMark } from '../../components/OrbTapLogoMark';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { proofSharePayload } from '../../utils/shareToSocial';
import QRCode from 'react-native-qrcode-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const STORY_W = Math.min(SCREEN_W - 48, 360);
const STORY_H = Math.round(STORY_W * (16 / 9));

const PARTNER_TIER_OPTIONS: PartnerTier[] = ['silver', 'gold', 'platinum'];

function getTierColor(tier: string): string {
  const t = PARTNER_TIER_OPTIONS.includes(tier as PartnerTier) ? (tier as PartnerTier) : 'gold';
  return PARTNER_TIER_COLORS[t];
}

function getTierLabel(tier: string): string {
  return PARTNER_TIER_OPTIONS.includes(tier as PartnerTier) ? PARTNER_TIER_LABELS[tier as PartnerTier] : tier.toUpperCase();
}

function partialId(id: string): string {
  if (!id || id.length <= 8) return id;
  return id.slice(-8).toUpperCase();
}

function formatTimestamp(createdAt: string): string {
  const n = parseInt(createdAt, 10);
  if (Number.isNaN(n)) return new Date().toLocaleString();
  return new Date(n).toLocaleString();
}

export default function ProofScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { isPremium } = useEffectiveTier();
  const cardRef = useRef<ViewShot>(null);
  const storyRef = useRef<ViewShot>(null);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string; imageUri?: string } | null>(null);
  const [showStoryCard, setShowStoryCard] = useState(false);
  const params = useLocalSearchParams<{
    id?: string;
    proofId?: string;
    partner?: string;
    partnerId?: string;
    points?: string;
    tier?: string;
    createdAt?: string;
    summaryLine?: string;
    from?: string;
    fromStamp?: string;
    source?: string;
  }>();

  const proofId = params.id ?? params.proofId ?? '';
  const partner = params.partner ?? 'Partner';
  const points = params.points ?? '0';
  const tier = params.tier ?? 'gold';
  const createdAt = params.createdAt ?? String(Date.now());
  const summaryLine = params.summaryLine ?? '';
  const fromShare = params.from === 'share';
  const partnerId = params.partnerId ?? '';
  const isStampCardProof = params.fromStamp === 'true' || params.source === 'stamp';

  useEffect(() => {
    if (fromShare && proofId && partnerId) {
      logPartnerAttribution({ type: 'proof_view_from_share', partnerId, proofId });
    }
  }, [fromShare, proofId, partnerId]);

  const isJobProofReceipt = Boolean(summaryLine);
  const tierColor = getTierColor(tier);

  const handleShare = async () => {
    try {
      let imageUri: string | undefined;
      if (cardRef.current?.capture && Platform.OS !== 'web') {
        imageUri = await cardRef.current.capture();
      }
      const link = proofDeepLink(proofId);
      const payload = proofSharePayload(partner, points, proofId, link);
      setSharePayload({ ...payload, imageUri });
      setShareSheetVisible(true);
    } catch {
      // Capture or state update failed
    }
  };

  const handleShareStory = async () => {
    try {
      setShowStoryCard(true);
      await new Promise((r) => setTimeout(r, 80));
      let imageUri: string | undefined;
      if (storyRef.current?.capture && Platform.OS !== 'web') {
        imageUri = await storyRef.current.capture();
      }
      const link = proofDeepLink(proofId);
      const payload = proofSharePayload(partner, points, proofId, link);
      setSharePayload({ ...payload, imageUri, title: `I just visited ${partner} 🔥 Join OrbTap free` });
      setShareSheetVisible(true);
    } catch {
      // Capture or state update failed
    } finally {
      setShowStoryCard(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topBarLogoWrap}>
          <OrbTapLogoMark variant="small" width={36} height={31} />
        </View>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Proof</Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400).springify()}>
      <ViewShot
        ref={cardRef}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        style={styles.shotWrap}
      >
        {/* Card is always dark so it's readable in light/dark and shares look official. */}
        <View style={[styles.card, { borderColor: tierColor + '66' }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.03)', 'transparent', 'rgba(0,0,0,0.2)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.securityPattern]} pointerEvents="none" />
          <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
          <View style={styles.cardHeader}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={22} color="#22C55E" />
              <Text style={styles.headerTitle}>VERIFIED</Text>
              {isStampCardProof && (
                <View style={[styles.tierPill, { backgroundColor: 'rgba(13,148,136,0.3)', borderColor: '#0d9488', marginLeft: 8 }]}>
                  <Text style={[styles.tierPillText, { color: '#0d9488' }]}>Stamp Card</Text>
                </View>
              )}
            </View>
            <View style={[styles.tierPill, { backgroundColor: tierColor + '30', borderColor: tierColor }]}>
              <Text style={[styles.tierPillText, { color: tierColor }]}>{getTierLabel(tier)}</Text>
            </View>
          </View>
          <Text style={styles.partnerName}>{partner}</Text>
          {isJobProofReceipt && summaryLine ? (
            <Text style={styles.summaryLine}>{summaryLine}</Text>
          ) : null}
          <View style={styles.earnedRow}>
            <Text style={styles.earnedLabel}>Earned </Text>
            <OTPointsBadge amount={points} size={28} label="pts" compact textColor="#FFF" />
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(createdAt)}</Text>
          <View style={styles.footer}>
            <Text style={styles.orbIdLabel}>PROOF ID</Text>
            <Text style={styles.orbIdValue}>{partialId(proofId) || '—'}</Text>
            <Text style={styles.verifyHint}>Verify at orbtap.com</Text>
          </View>
          <View style={styles.cardLogoWrap}>
            <OrbTapLogoMark variant="small" width={48} height={41} />
          </View>
        </View>
      </ViewShot>
      </Animated.View>

      {/* 9:16 Instagram Story card — hidden off-screen, captured to image */}
      {showStoryCard && (
        <ViewShot
          ref={storyRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          style={[styles.storyShot, { position: 'absolute', left: -9999, top: 0 }]}
        >
          <View style={[styles.storyCard, { borderColor: tierColor + '66' }]}>
            <LinearGradient
              colors={[tierColor + '33', '#0d0d10', '#0d0d10', tierColor + '22']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.storyTierBar, { backgroundColor: tierColor }]} />
            <View style={styles.storyHeader}>
              <OrbTapLogoMark variant="small" width={52} height={45} />
              <View style={{ flex: 1 }}>
                <Text style={styles.storyAppName}>OrbTap</Text>
                <Text style={styles.storyAppSub}>Tap. Earn. Flex.</Text>
              </View>
              <View style={[styles.storyVerifiedBadge, { borderColor: '#22C55E' + '55', backgroundColor: '#22C55E' + '15' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
                <Text style={styles.storyVerifiedText}>VERIFIED</Text>
              </View>
            </View>
            <View style={styles.storyBody}>
              <Text style={styles.storyVisitedLabel}>I visited</Text>
              <Text style={styles.storyPartnerName} numberOfLines={2}>{partner}</Text>
              <View style={styles.storyEarnedRow}>
                <Text style={styles.storyAndLabel}>and earned</Text>
                <OTPointsBadge amount={points} size={44} label="pts" compact textColor="#FFF" />
              </View>
              <Text style={styles.storyOTLabel}>OT Points</Text>
            </View>
            <View style={styles.storyDivider} />
            <View style={styles.storyFooter}>
              <View style={styles.storyQrWrap}>
                <QRCode value={proofDeepLink(proofId) || ORBTAP_APP_LINK} size={80} backgroundColor="#fff" color="#0a0a0d" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.storyJoinTitle}>Join free →</Text>
                <Text style={styles.storyJoinSub}>Scan to earn OT Points at real places</Text>
                <Text style={styles.storyJoinUrl}>orbtap.com</Text>
              </View>
            </View>
          </View>
        </ViewShot>
      )}

      <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#22C55E' }]} onPress={handleShare} activeOpacity={0.8}>
        <Ionicons name="share-social" size={22} color="#000" />
        <Text style={styles.shareBtnText}>Share Proof</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.shareBtn, { backgroundColor: tierColor, marginTop: 8 }]} onPress={handleShareStory} activeOpacity={0.8}>
        <Ionicons name="images" size={22} color="#000" />
        <Text style={styles.shareBtnText}>Share as Story</Text>
      </TouchableOpacity>
      <Text style={[styles.shareHint, { color: colors.textSecondary }]}>Show friends where you scored</Text>
      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: colors.border }]}
        onPress={() => router.replace('/(tabs)' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="map" size={18} color={colors.text} />
        <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Find another orb</Text>
      </TouchableOpacity>
      {!isPremium && (
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.gold ?? '#FBBF24' }]}
          onPress={() => router.push('/premium' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="diamond-outline" size={18} color={colors.gold ?? '#FBBF24'} />
          <Text style={[styles.secondaryBtnText, { color: colors.gold ?? '#FBBF24', fontWeight: '700' }]}>Share with Premium badge</Text>
        </TouchableOpacity>
      )}
      {params.from === 'wallet' && (
        <TouchableOpacity onPress={() => router.back()} style={styles.backToWalletLink}>
          <Ionicons name="arrow-back" size={14} color={colors.textSecondary} />
          <Text style={[styles.backToWalletText, { color: colors.textSecondary }]}>Back to Wallet</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>Close</Text>
      </TouchableOpacity>
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share proof"
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 8 },
  topBarLogoWrap: { width: 36, height: 30, justifyContent: 'center', alignItems: 'center' },
  topBarTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  shotWrap: { marginHorizontal: 24, marginTop: 24, marginBottom: 24 },
  card: {
    backgroundColor: '#0d0d10',
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    overflow: 'hidden',
  },
  securityPattern: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    pointerEvents: 'none',
  },
  tierBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1.2 },
  tierPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tierPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  partnerName: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  summaryLine: { color: 'rgba(255,255,255,0.88)', fontSize: 14, marginBottom: 8, maxWidth: '90%' },
  earnedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  earnedLabel: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  timestamp: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 18, fontVariant: ['tabular-nums'] },
  footer: { paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  orbIdLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  orbIdValue: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontVariant: ['tabular-nums'] },
  verifyHint: { color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 6, letterSpacing: 0.5 },
  cardLogoWrap: { position: 'absolute', bottom: 20, right: 20 },
  cardLogo: { width: 48, height: 40 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.md,
    paddingVertical: SPACE.base,
    paddingHorizontal: SPACE.xl,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACE.xl,
    marginBottom: SPACE.md,
    minHeight: TAP_TARGET_MIN,
  },
  shareBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  shareHint: { fontSize: 12, textAlign: 'center', marginTop: SPACE.sm },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginHorizontal: SPACE.xl,
    marginTop: SPACE.sm,
    minHeight: TAP_TARGET_MIN,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600' },
  closeBtn: { paddingVertical: SPACE.lg, alignItems: 'center', minHeight: TAP_TARGET_MIN, justifyContent: 'center' },
  closeBtnText: { fontSize: 16 },
  backToWalletLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  backToWalletText: { fontSize: 14 },
  // Instagram Story 9:16 card
  storyShot: { width: STORY_W, height: STORY_H },
  storyCard: {
    width: STORY_W,
    height: STORY_H,
    backgroundColor: '#0d0d10',
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    padding: 24,
    justifyContent: 'space-between',
  },
  storyTierBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 5 },
  storyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  storyAppName: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  storyAppSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' },
  storyVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  storyVerifiedText: { color: '#22C55E', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  storyBody: { alignItems: 'flex-start', gap: 6 },
  storyVisitedLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '500' },
  storyPartnerName: { color: '#FFF', fontSize: 36, fontWeight: '900', lineHeight: 40 },
  storyEarnedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyAndLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '500' },
  storyOTLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '500', marginTop: -4 },
  storyDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  storyFooter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  storyQrWrap: { borderRadius: 10, overflow: 'hidden', padding: 6, backgroundColor: '#fff' },
  storyJoinTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  storyJoinSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '400', marginTop: 4 },
  storyJoinUrl: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '500', marginTop: 6 },
});
