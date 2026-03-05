import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { usePartners } from '../../context/PartnersContext';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { PremiumPerkCard } from '../../components/PremiumPerkCard';
import { useTheme } from '../../hooks/useTheme';
import { useWallet } from '../../hooks/useWallet';
import { useBookmarks } from '../../context/BookmarkContext';
import { OTPointsBalanceLink } from '../../components/OTPointsBalanceLink';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { promptAndOpenDirections } from '../../utils/openDirections';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { createPerkRedeemToken } from '../../services/verifyApi';
import { redeemTokenDeepLink } from '../../constants/AppLinks';
import { showErrorAlert } from '../../utils/alert';
import { recordPartnerView } from '../../services/partnerAnalytics';
import { useI18n } from '../../context/I18nContext';

export default function PerkScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isPerkBookmarked, togglePerk } = useBookmarks();

  const { getPerk, getPartner } = usePartners();
  const { balance, canRedeem } = useWallet();
  const perk = getPerk(id ?? '');
  const partner = perk ? getPartner(perk.partnerId) : null;

  // Track perk view for partner analytics funnel (view → redeem conversion)
  useEffect(() => {
    if (perk?.partnerId) {
      recordPartnerView(perk.partnerId).catch(() => {});
    }
  }, [perk?.partnerId]);

  if (!perk || !partner) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.text }]}>Perk not found</Text>
      </View>
    );
  }

  const color = PARTNER_TIER_COLORS[perk.tier];
  const address = partner.location?.address ?? '—';
  const isBookmarked = isPerkBookmarked(perk.id);
  const [showRedeemQR, setShowRedeemQR] = useState(false);
  const [redeemToken, setRedeemToken] = useState<string | null>(null);
  const [redeemExpiresAt, setRedeemExpiresAt] = useState<number>(0);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const { width } = useWindowDimensions();
  const qrSize = Math.min(width * 0.5, 220);

  const closeRedeemModal = useCallback(() => {
    setShowRedeemQR(false);
    setRedeemToken(null);
    setRedeemExpiresAt(0);
  }, []);

  useEffect(() => {
    if (!showRedeemQR || !redeemExpiresAt) return;
    const interval = setInterval(() => {
      if (Date.now() / 1000 >= redeemExpiresAt) closeRedeemModal();
    }, 1000);
    return () => clearInterval(interval);
  }, [showRedeemQR, redeemExpiresAt, closeRedeemModal]);

  const handleDirections = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (partner.location) promptAndOpenDirections(partner.location.lat, partner.location.lng);
  };

  const handleRedeem = async () => {
    safeHaptics.selectionAsync();
    const check = canRedeem(perk.id);
    if (!check.allowed) {
      showErrorAlert('Redemption not available', check.reason ?? 'This perk can\'t be redeemed right now.');
      return;
    }
    setRedeemLoading(true);
    try {
      const res = await createPerkRedeemToken({
        partnerId: partner.id,
        perkId: perk.id,
        points: typeof perk.cost === 'number' ? perk.cost : undefined,
      });
      if (res.success && res.token != null && res.expiresAt != null) {
        setRedeemToken(res.token);
        setRedeemExpiresAt(res.expiresAt);
        setRedeemPoints(res.points);
        setShowRedeemQR(true);
      } else {
        showErrorAlert('Could not create code', res.message ?? 'Try again later.');
      }
    } catch {
      showErrorAlert('Something went wrong', 'Please check your connection and try again.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleViewPartner = () => {
    safeHaptics.selectionAsync();
    router.push(`/partner/${partner.id}` as any);
  };

  const handleBookmark = () => {
    safeHaptics.selectionAsync();
    togglePerk(perk.id);
  };

  return (
    <ScreenWrapper
      title="Deal"
      headerLeft={
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      }
      headerRight={
        <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkBtn} hitSlop={12}>
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color={isBookmarked ? color : colors.text} />
        </TouchableOpacity>
      }
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCardWrap}>
          <PremiumPerkCard perk={perk} partnerName={partner.name} variant="hero" onPress={handleViewPartner} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={[styles.infoBlock, { borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>YOUR BALANCE</Text>
            <OTPointsBalanceLink amount={balance} size={22} label="pts" compact textColor={colors.text} />
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>LOCATION</Text>
            <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={3} ellipsizeMode="tail">{address}</Text>
          </View>
          <Text style={[styles.cooldownHint, { color: colors.textSecondary }]}>Fair use: once per {perk.cooldown} (daily caps apply)</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <TouchableOpacity
            style={[styles.redeemBtn, { backgroundColor: color }]}
            onPress={handleRedeem}
            disabled={redeemLoading}
            activeOpacity={0.88}
          >
            {redeemLoading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Ionicons name="qr-code" size={24} color="#000" />
            )}
            <View style={styles.redeemBtnTextWrap}>
              <Text style={styles.redeemText}>Redeem at venue — {perk.cost} pts</Text>
              <Text style={styles.redeemSub}>Show this QR to staff at {partner.name} to claim & earn OT Points</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.6)" />
          </TouchableOpacity>

          <Modal visible={showRedeemQR} transparent animationType="fade">
            <TouchableOpacity style={styles.redeemModalBackdrop} activeOpacity={1} onPress={closeRedeemModal}>
              <View style={[styles.redeemModalBox, { backgroundColor: colors.background }]} onStartShouldSetResponder={() => true}>
                <View style={[styles.redeemModalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.redeemModalTitle, { color: colors.text }]}>Your redemption code</Text>
                  <TouchableOpacity onPress={closeRedeemModal} hitSlop={12} style={styles.redeemModalClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.redeemModalBody}>
                  <Text style={[styles.redeemModalPerkTitle, { color: colors.text }]} numberOfLines={2}>{perk.title}</Text>
                  <Text style={[styles.redeemModalPartner, { color: colors.textSecondary }]}>{partner.name}</Text>
                  {redeemToken ? (
                    <View style={[styles.redeemQrWrap, { backgroundColor: '#fff' }]}>
                      <QRCode value={redeemTokenDeepLink(redeemToken)} size={qrSize} backgroundColor="#fff" color="#0a0a0d" />
                    </View>
                  ) : null}
                  <Text style={[styles.redeemModalHint, { color: colors.textSecondary }]}>
                    Show this screen to staff. They scan it in the Scan tab to verify and credit you {redeemPoints} OT Points. Code expires in 10 minutes.
                  </Text>
                  {redeemExpiresAt > 0 ? (
                    <Text style={[styles.redeemModalExpiry, { color: colors.textSecondary }]}>
                      Expires {new Date(redeemExpiresAt * 1000).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                    </Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          </Modal>

          <TouchableOpacity
            style={[styles.directionsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleDirections}
            activeOpacity={0.88}
          >
            <Ionicons name="navigate" size={22} color={color} />
            <Text style={[styles.directionsText, { color: colors.text }]}>Get Directions</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { padding: SPACE.base, fontSize: 16 },
  closeBtn: { padding: SPACE.sm },
  bookmarkBtn: { padding: SPACE.sm, borderRadius: RADIUS.full },
  content: { padding: SPACE.base },
  heroCardWrap: { marginBottom: SPACE.base },
  infoBlock: { padding: SPACE.base, borderRadius: RADIUS.base, borderWidth: 1, marginBottom: SPACE.lg },
  infoRow: { marginBottom: SPACE.sm },
  infoLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  infoText: { fontSize: 15, fontWeight: '500' },
  cooldownHint: { fontSize: 12, fontWeight: '600', marginTop: SPACE.sm },

  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    padding: SPACE.lg,
    borderRadius: RADIUS.base,
    marginBottom: SPACE.md,
  },
  redeemBtnTextWrap: { flex: 1, minWidth: 0 },
  redeemText: { color: '#000', fontSize: 18, fontWeight: '800' },
  redeemSub: { color: 'rgba(0,0,0,0.65)', fontSize: 13, marginTop: 2 },

  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.md,
    padding: SPACE.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  directionsText: { fontSize: 16, fontWeight: '700' },

  redeemModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  redeemModalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
  },
  redeemModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  redeemModalTitle: { fontSize: 18, fontWeight: '700' },
  redeemModalClose: { padding: 4 },
  redeemModalBody: { padding: 20, alignItems: 'center' },
  redeemModalPerkTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  redeemModalPartner: { fontSize: 13, marginBottom: 16 },
  redeemQrWrap: { padding: 12, borderRadius: 12, marginBottom: 12 },
  redeemModalHint: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  redeemModalExpiry: { fontSize: 11, marginTop: 8 },
});
