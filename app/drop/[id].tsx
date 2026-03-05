/**
 * OrbDrop™ — Drop detail: reserve (with optional fee) and redeem.
 * Classic UI: section headers, tier-accent cards, clear CTAs. Matches orb/partner app style.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDrops } from '../../hooks/useDrops';
import { useWallet } from '../../hooks/useWallet';
import { DEFAULT_ORBINOMICS_POLICY, LEDGER_REASON } from '../../constants/OrbinomicsPolicy';
import { PARTNER_TIER_COLORS, PARTNER_TIER_BADGE_LABELS } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { COLORS } from '../../constants/Colors';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { useTheme } from '../../hooks/useTheme';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { logPartnerAttribution } from '../../services/partnerAttribution';
import { logVerifiedWin } from '../../services/analytics';
import { OTPointsBalanceLink } from '../../components/OTPointsBalanceLink';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { ORBSWIPE_PLACEHOLDER_IMAGES } from '../../constants/Drops';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { safeHaptics } from '../../utils/safeHaptics';
import { useI18n } from '../../context/I18nContext';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 200;

export default function DropDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold?.[0];
  const { drops, reserve, redeem, getReservationForDrop } = useDrops();
  const { createVerifiedAction, balance, spend } = useWallet();
  const { isPremium } = useEffectiveTier();
  const [reserving, setReserving] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const drop = drops.find((d) => d.id === id);

  useEffect(() => {
    if (drop) logPartnerAttribution({ type: 'view', partnerId: drop.partnerId, dropId: drop.id });
  }, [drop?.id]);
  const reservation = drop ? getReservationForDrop(drop.id) : null;
  const canReserve =
    drop &&
    drop.qtyRemaining > 0 &&
    Date.now() >= drop.startAt &&
    Date.now() <= drop.endAt &&
    (!reservation || reservation.status !== 'reserved');
  const canRedeem = reservation && reservation.status === 'reserved' && Date.now() <= reservation.expiresAt;

  const handleReserve = async () => {
    if (!drop || !canReserve) return;
    const fee = drop.reserveFeePoints ?? 0;
    if (fee > 0) {
      if (balance < fee) {
        showErrorAlert('Insufficient balance', `This reservation requires ${fee} OT Points. Earn more or reduce the fee.`);
        return;
      }
      const result = await spend({
        productKey: 'drop_reserve_fee',
        refType: 'drop',
        refId: drop.id,
        amountExpected: fee,
      });
      if (!result.success) {
        showErrorAlert("Reservation didn't complete", result.reason ?? "We couldn't reserve. Please try again.");
        return;
      }
    }
    setReserving(true);
    try {
      const res = await reserve(drop.id, fee);
      if (res) {
        logPartnerAttribution({ type: 'reserve', partnerId: drop.partnerId, dropId: drop.id });
        alertDialog('Reserved', `You have until ${new Date(res.expiresAt).toLocaleTimeString()} to redeem at the venue.`, [{ text: 'OK' }]);
      } else {
        showErrorAlert('Unavailable', 'This drop is full or has expired. Try another drop.');
      }
    } finally {
      setReserving(false);
    }
  };

  const handleRedeem = async () => {
    if (!reservation || reservation.status !== 'reserved' || !drop) return;
    setRedeeming(true);
    try {
      const result = await redeem(reservation.id);
      if (!result.success) {
        showErrorAlert("Redeem didn't complete", result.error ?? "We couldn't complete the redemption. Please try again.");
        setRedeeming(false);
        return;
      }
      const points = DEFAULT_ORBINOMICS_POLICY.emissionRates.dropRedeem;
      const record = await createVerifiedAction(drop.partnerId, drop.perkId ?? drop.id, points, {
        ledgerReason: LEDGER_REASON.EMIT_DROP_REDEEM,
        actionType: 'DROP_REDEEM',
      });
      logVerifiedWin({ partner_id: drop.partnerId, perk_id: drop.perkId ?? drop.id, points });
      logPartnerAttribution({ type: 'redeem', partnerId: drop.partnerId, dropId: drop.id });
      router.replace({
        pathname: '/scan/success',
        params: {
          points: String(points),
          partner: drop.partnerName,
          partnerId: drop.partnerId,
          proofId: record.id,
          tier: drop.tier,
          createdAt: String(record.createdAt),
        },
      } as any);
    } catch (e) {
      showErrorAlert("Redemption didn't complete", "Something went wrong. Please check your connection and try again.");
    } finally {
      setRedeeming(false);
    }
  };

  if (!drop) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>OrbDrop™</Text>
          </View>
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Drop not found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const tierColor = (PARTNER_TIER_COLORS as Record<string, string>)[drop.tier as PartnerTier] ?? PARTNER_TIER_COLORS.gold;
  const minLeft = Math.max(0, Math.floor((drop.endAt - Date.now()) / 60000));
  const heroImageUrl = drop.imageUrl ?? ORBSWIPE_PLACEHOLDER_IMAGES[drop.category];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero — same pattern as partner/detail */}
          <View style={styles.heroWrap}>
            <Image source={{ uri: heroImageUrl }} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.35)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
              style={styles.heroGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={[styles.heroHeader, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }]}>
              <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.back(); }} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <OTPointsBalanceLink amount={balance} size={20} label="pts" compact textColor="#fff" />
            </View>
            <View style={styles.heroCaption}>
              <View style={[styles.tierPill, { backgroundColor: tierColor }]}>
                <Text style={styles.tierPillText}>{PARTNER_TIER_BADGE_LABELS[drop.tier as PartnerTier] ?? drop.tier}</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>{drop.title}</Text>
              <Text style={styles.heroPartner}>{drop.partnerName}</Text>
            </View>
          </View>

          {/* Section: DETAILS — classic app section head */}
          <View style={styles.block}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionAccent, { backgroundColor: tierColor }]} />
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DETAILS</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: tierColor + '44' }]}>
              <View style={styles.metaRow}>
                <View style={[styles.metaPill, { backgroundColor: tierColor + '22' }]}>
                  <Ionicons name="pricetag" size={14} color={tierColor} />
                  <Text style={[styles.metaText, { color: colors.text }]}>{drop.qtyRemaining} left</Text>
                </View>
                <View style={[styles.metaPill, { backgroundColor: colors.surfaceHighlight }]}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{minLeft}m left</Text>
                </View>
              </View>
              <Text style={[styles.desc, { color: colors.text }]}>{drop.description}</Text>
              {drop.reserveFeePoints > 0 && (
                <View style={[styles.feeRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Reserve fee</Text>
                  <OTPointsBadge amount={drop.reserveFeePoints} size={18} label="pts" compact textColor={tierColor} />
                </View>
              )}
            </View>
          </View>

          {/* Section: ACTIONS — View partner + Reserve/Redeem */}
          <View style={styles.block}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionAccent, { backgroundColor: tierColor }]} />
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACTIONS</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: tierColor + '50' }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push(`/partner/${drop.partnerId}` as any); }}
              activeOpacity={0.88}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: tierColor + '22' }]}>
                <Ionicons name="business" size={22} color={tierColor} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>View partner page</Text>
                <Text style={[styles.actionHint, { color: colors.textSecondary }]}>{drop.partnerName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={tierColor} />
            </TouchableOpacity>

            {!isPremium && (canReserve || canRedeem) && (
              <TouchableOpacity
                style={[styles.earlyTeaser, { backgroundColor: themeGold + '14', borderColor: themeGold + '50' }]}
                onPress={() => { safeHaptics.selectionAsync(); router.push('/premium' as any); }}
                activeOpacity={0.9}
              >
                <Ionicons name="diamond-outline" size={18} color={themeGold} />
                <Text style={[styles.earlyTeaserText, { color: colors.text }]}>Members get early access to drops</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            {canRedeem && (
              <TouchableOpacity
                style={[styles.cta, styles.ctaRedeem, { backgroundColor: COLORS.success }]}
                onPress={handleRedeem}
                disabled={redeeming}
              >
                {redeeming ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#000" />
                    <Text style={[styles.ctaText, { color: '#000' }]}>Redeem at venue · Get proof</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {canReserve && !canRedeem && (
              <TouchableOpacity
                style={[styles.cta, { borderColor: tierColor, backgroundColor: tierColor + '22' }]}
                onPress={handleReserve}
                disabled={reserving}
              >
                {reserving ? (
                  <ActivityIndicator color={tierColor} />
                ) : (
                  <>
                    <Ionicons name="bookmark" size={22} color={tierColor} />
                    <Text style={[styles.ctaText, { color: tierColor }]}>
                      Reserve {drop.reserveFeePoints > 0 ? ` · ${drop.reserveFeePoints} OT` : ' (free)'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {reservation?.status === 'reserved' && !canRedeem && (
              <Text style={[styles.expiredHint, { color: colors.textSecondary }]}>Reservation expired. Reserve again if slots remain.</Text>
            )}
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: SPACE.sm },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACE.base, paddingBottom: SPACE.xxl + 24 },
  block: { marginBottom: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionAccent: { width: 4, height: 14, borderRadius: 2, marginRight: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heroWrap: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    marginHorizontal: -SPACE.base,
    marginBottom: SPACE.lg,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingTop: SPACE.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACE.base,
    paddingBottom: SPACE.base,
    paddingTop: SPACE.xl,
  },
  tierPill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  tierPillText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroPartner: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginBottom: SPACE.base,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
  metaText: { fontSize: 13, fontWeight: '700' },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: SPACE.base,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACE.base,
    borderTopWidth: 1,
  },
  feeLabel: { fontSize: 14, fontWeight: '600' },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: { flex: 1, minWidth: 0 },
  actionLabel: { fontSize: 15, fontWeight: '700' },
  actionHint: { fontSize: 12, marginTop: 2, opacity: 0.85 },
  earlyTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: SPACE.base,
    paddingHorizontal: SPACE.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  earlyTeaserText: { fontSize: 13, fontWeight: '600', flex: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: SPACE.base,
    paddingHorizontal: SPACE.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    marginBottom: 8,
  },
  ctaRedeem: { marginTop: 4 },
  ctaText: { fontSize: 16, fontWeight: '800' },
  bottomPad: { height: 24 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACE.xl },
  emptyText: { fontSize: 16 },
  expiredHint: { fontSize: 13, marginTop: SPACE.base, textAlign: 'center' },
});
