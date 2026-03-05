import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Platform, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Partner, isDemoPartner, DEMO_HOURS } from '../constants/MockData';
import { usePartners } from '../context/PartnersContext';
import { getPartnerHeroImage } from '../constants/PartnerCategoryPlaceholders';
import { ORBTAP_UNIVERSE_PARTNER_ID } from '../constants/MockData';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS, getPartnerTierBorderWidth, getPartnerTierShineOpacity, getPartnerTierShadowAll } from '../constants/PartnerTiers';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { useRouter } from 'expo-router';
import { OrbTapLogoMark } from './OrbTapLogoMark';
import { VerifiedBadge } from './VerifiedBadge';
import { OTPointsBadge } from './OTPointsBadge';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { promptAndOpenDirections } from '../utils/openDirections';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface PerkGridModalProps {
  visible: boolean;
  partner: Partner | null;
  onClose: () => void;
}

export function PerkGridModal({ visible, partner, onClose }: PerkGridModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getActivePerksForPartner } = usePartners();
  const { colors, isDark } = useTheme();
  const flip = useSharedValue(0);
  const perks = partner ? getActivePerksForPartner(partner.id) : [];
  const primaryPerk = perks[0] ?? null;

  /** Max height so the tile never goes under camera cutout or off-screen. */
  const safeMaxHeight = height - insets.top - insets.bottom - 24;

  useEffect(() => {
    if (visible) flip.value = 0;
  }, [visible]);

  const showBack = () => {
    safeHaptics.selectionAsync();
    flip.value = withTiming(1, { duration: 300 });
  };

  const showFront = () => {
    safeHaptics.selectionAsync();
    flip.value = withTiming(0, { duration: 300 });
  };

  const handleViewPartner = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    if (partner) router.push(`/partner/${partner.id}` as any);
  };

  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [0, 0.5], [1, 0]),
    transform: [{ translateX: interpolate(flip.value, [0, 1], [0, -CARD_WIDTH]) }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    opacity: interpolate(flip.value, [0.5, 1], [0, 1]),
    transform: [{ translateX: interpolate(flip.value, [0, 1], [CARD_WIDTH, 0]) }],
  }));

  if (!partner) return null;

  const tierColor = PARTNER_TIER_COLORS[partner.tier];
  const address = partner.location?.address ?? '—';
  const glassCardBg = isDark ? 'rgba(12,12,18,0.92)' : 'rgba(255,255,255,0.96)';
  const borderGlow = tierColor + '66';
  const tierBorderWidth = getPartnerTierBorderWidth(partner.tier);
  const tierShineOpacity = getPartnerTierShineOpacity(partner.tier);
  const tierShadow = getPartnerTierShadowAll(partner.tier);
  const heroImageUrl = primaryPerk?.imageUrl ?? getPartnerHeroImage(partner);

  const openDirections = () => {
    if (partner.location) {
      safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      promptAndOpenDirections(partner.location.lat, partner.location.lng);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={[styles.overlayDim, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.5)' }]} />
        <Animated.View entering={FadeIn.duration(200)} style={[styles.overlayContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
          <ScrollView
            style={[styles.overlayScroll, { maxHeight: safeMaxHeight }]}
            contentContainerStyle={styles.overlayScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.modalSlot}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.cardWrap}>
            {/* FRONT: Perk tile summary — fills tile; close inside tile */}
            <Animated.View style={[styles.cardWrapInner, frontStyle]}>
              <LinearGradient colors={[tierColor, tierColor + 'dd', tierColor] as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.holoBorder, { padding: tierBorderWidth }]}>
                <View style={[styles.card, styles.cardFront, { backgroundColor: glassCardBg, shadowColor: tierColor }, tierShadow]}>
                  <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
                  <LinearGradient colors={[tierColor + '18', tierColor + '08', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: tierShineOpacity }]} pointerEvents="none" />
                  <ScrollView style={styles.frontScroll} contentContainerStyle={styles.frontContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.frontTitleRow}>
                      <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{partner.name}</Text>
                      {partner.verified && <VerifiedBadge size={16} tier={partner.tier} />}
                    </View>
                    <View style={[styles.tierPillFront, { backgroundColor: tierColor + '22', borderColor: tierColor }]}>
                      <Text style={[styles.tierPillText, { color: tierColor }]}>{PARTNER_TIER_LABELS[partner.tier]}</Text>
                    </View>
                    <Text style={[styles.category, { color: colors.textSecondary }]}>{partner.category}</Text>
                    <Text style={[styles.addressLine, { color: colors.textSecondary }]}>{address}</Text>
                    {partner.location && (
                      <TouchableOpacity style={[styles.directionsBtn, { borderColor: tierColor + '66' }]} onPress={openDirections} activeOpacity={0.8}>
                        <Ionicons name="navigate" size={16} color={tierColor} />
                        <Text style={[styles.directionsBtnText, { color: tierColor }]}>Get directions</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.hoursLine, { color: colors.textSecondary }]}>
                      {isDemoPartner(partner) ? `Demo hours: ${partner.hours || DEMO_HOURS}` : (partner.hours || '—')}
                    </Text>
                    {partner.termsShort ? (
                      <Text style={[styles.termsShortLine, { color: colors.textSecondary }]}>{partner.termsShort}</Text>
                    ) : null}
                    {primaryPerk && (
                      <View style={[styles.perkChip, { backgroundColor: tierColor + '28', borderColor: tierColor }]}>
                        <Text style={[styles.perkTitle, { color: tierColor }]}>{primaryPerk.title}</Text>
                        <OTPointsBadge amount={primaryPerk.cost} size={14} label="none" compact textColor={tierColor} />
                      </View>
                    )}
                  </ScrollView>
                  <View style={[styles.frontFooter, { borderTopColor: colors.border }]}>
                    <TouchableOpacity style={[styles.flipBtn, { borderColor: tierColor + '55' }]} onPress={showBack}>
                      <Text style={[styles.flipBtnText, { color: tierColor }]}>See hours & perks</Text>
                      <Ionicons name="arrow-forward" size={18} color={tierColor} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.closeBtnInTile, { borderColor: colors.border }]} onPress={onClose} activeOpacity={0.8}>
                      <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
                      <Text style={[styles.closeBtnInTileText, { color: colors.textSecondary }]}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* BACK: Partner full info — tile fills page; Visit & redeem then Close inside tile */}
            <Animated.View style={[styles.cardWrapInner, backStyle]}>
              <LinearGradient colors={[tierColor, tierColor + 'dd', tierColor] as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.holoBorder, { padding: tierBorderWidth }]}>
                <View style={[styles.card, styles.cardBack, { backgroundColor: glassCardBg, shadowColor: tierColor }, tierShadow]}>
                  <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
                  <LinearGradient colors={[tierColor + '18', tierColor + '08', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: tierShineOpacity }]} pointerEvents="none" />
                  {/* Hero: partner logo or perk photo — optional; partners can add in-app */}
                  {(heroImageUrl || partner.id === ORBTAP_UNIVERSE_PARTNER_ID) ? (
                    <View style={[styles.backHeroWrap, partner.id === ORBTAP_UNIVERSE_PARTNER_ID && styles.backHeroWrapLogo]}>
                      {partner.id === ORBTAP_UNIVERSE_PARTNER_ID ? (
                        <OrbTapLogoMark variant="hero" width={72} height={62} />
                      ) : (
                        <Image source={{ uri: heroImageUrl! }} style={styles.backHeroImage} resizeMode="cover" onError={() => {}} />
                      )}
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.backHeroGrad} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                    </View>
                  ) : (
                    <View style={[styles.backHeroPlaceholder, { backgroundColor: tierColor + '20' }]}>
                      <Ionicons name="image-outline" size={36} color={tierColor} />
                      <Text style={[styles.backHeroPlaceholderText, { color: colors.textSecondary }]}>Logo or perk photo</Text>
                    </View>
                  )}
                  <ScrollView style={styles.backScroll} contentContainerStyle={styles.backScrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.backTitle, { color: colors.textSecondary }]}>PARTNER DETAILS</Text>
                    <Text style={[styles.backName, { color: colors.text }]}>{partner.name}</Text>
                    <Text style={[styles.backCategory, { color: colors.textSecondary }]}>{partner.category} · {PARTNER_TIER_LABELS[partner.tier]}</Text>
                    {partner.verified && (
                      <View style={styles.verifiedRow}>
                        <VerifiedBadge size={14} tier={partner.tier} />
                        <Text style={[styles.verifiedText, { color: colors.textSecondary }]}>Verified</Text>
                      </View>
                    )}
                    <Text style={[styles.backLabel, { color: colors.textSecondary }]}>Address</Text>
                    <Text style={[styles.backValue, { color: colors.text }]}>{address}</Text>
                    {/* Hours — prominent for foot traffic */}
                    <View style={[styles.hoursBlock, { backgroundColor: tierColor + '18', borderColor: tierColor + '44' }]}>
                      <Ionicons name="time" size={18} color={tierColor} />
                      <View style={styles.hoursBlockText}>
                        <Text style={[styles.hoursBlockLabel, { color: colors.textSecondary }]}>{isDemoPartner(partner) ? 'Demo hours' : 'Hours'}</Text>
                        <Text style={[styles.hoursBlockValue, { color: colors.text }]}>{partner.hours || (isDemoPartner(partner) ? DEMO_HOURS : '—')}</Text>
                      </View>
                    </View>
                    {partner.description ? (
                      <>
                        <Text style={[styles.backLabel, { color: colors.textSecondary }]}>About</Text>
                        <Text style={[styles.backValue, { color: colors.text }]}>{partner.description}</Text>
                      </>
                    ) : null}
                    {/* All perks here — drive redemptions & foot traffic */}
                    {perks.length > 0 && (
                      <>
                        <Text style={[styles.backLabel, { color: colors.textSecondary }]}>PERKS HERE</Text>
                        {perks.map((p) => (
                          <TouchableOpacity
                            key={p.id}
                            style={[styles.perkRow, { borderColor: tierColor + '33', backgroundColor: tierColor + '0c' }]}
                            onPress={() => {
                              safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              onClose();
                              router.push(`/perk/${p.id}` as any);
                            }}
                            activeOpacity={0.85}
                          >
                            <View style={styles.perkRowLeft}>
                              <Text style={[styles.perkRowTitle, { color: colors.text }]} numberOfLines={1}>{p.title}</Text>
                              {typeof p.stock?.remaining === 'number' && (
                                <Text style={[styles.perkRowRemaining, { color: tierColor }]}>{p.stock.remaining} left</Text>
                              )}
                            </View>
                            <OTPointsBadge amount={p.cost} size={14} label="pts" compact textColor={PARTNER_TIER_COLORS[p.tier]} />
                            <Text style={[styles.perkRowCooldown, { color: colors.textSecondary }]}>{p.cooldown}</Text>
                          </TouchableOpacity>
                        ))}
                      </>
                    )}
                    <TouchableOpacity style={styles.flipBackBtn} onPress={showFront}>
                      <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
                      <Text style={[styles.flipBackText, { color: colors.textSecondary }]}>Back to summary</Text>
                    </TouchableOpacity>
                  </ScrollView>
                  {/* Footer: Visit & redeem then Close — both inside the tile */}
                  <View style={[styles.backFooter, { borderTopColor: colors.border }]}>
                    <TouchableOpacity style={[styles.viewPartnerBtn, { backgroundColor: tierColor }]} onPress={handleViewPartner}>
                      <Ionicons name="walk" size={20} color="#000" />
                      <Text style={styles.viewPartnerText}>Visit & redeem</Text>
                      <Ionicons name="open-outline" size={18} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.closeBtnInTile, { borderColor: colors.border }]} onPress={onClose} activeOpacity={0.8} accessibilityLabel="Close partner details">
                      <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
                      <Text style={[styles.closeBtnInTileText, { color: colors.textSecondary }]}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
          </View>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  overlayDim: { ...StyleSheet.absoluteFillObject },
  overlayContent: {
    flex: 1,
    width: '100%',
    maxWidth: CARD_WIDTH + 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayScroll: { width: '100%' },
  overlayScrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: 16 },
  modalSlot: {
    width: '100%',
    maxWidth: CARD_WIDTH,
    alignItems: 'center',
  },
  cardWrap: { width: '100%' },
  cardWrapInner: { width: '100%' },
  holoBorder: {
    width: '100%',
    borderRadius: 24,
  },
  card: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  cardFront: { minHeight: 240 },
  cardBack: { minHeight: 240 },
  tierBar: { height: 4, width: '100%' },
  backHeroWrap: { height: 100, width: '100%', backgroundColor: 'rgba(0,0,0,0.2)' },
  backHeroWrapLogo: { backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  backHeroImage: { width: '100%', height: '100%' },
  backHeroLogoImage: { width: 56, height: 56 },
  backHeroGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 },
  backHeroPlaceholder: { height: 72, width: '100%', justifyContent: 'center', alignItems: 'center' },
  backHeroPlaceholderText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  frontScroll: {},
  frontContent: { padding: 22, paddingBottom: 16 },
  frontFooter: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  closeBtnInTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  closeBtnInTileText: { fontSize: 14, fontWeight: '700' },
  backScroll: { flexGrow: 0 },
  backScrollContent: { padding: 20, paddingBottom: 24 },
  backFooter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, gap: 10, flexDirection: 'column', alignItems: 'stretch' },
  hoursBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  hoursBlockText: { marginLeft: 10 },
  hoursBlockLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  hoursBlockValue: { fontSize: 15, fontWeight: '700' },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  perkRowLeft: { flex: 1, minWidth: 0, marginRight: 8 },
  perkRowTitle: { fontSize: 14, fontWeight: '700' },
  perkRowRemaining: { fontSize: 11, fontWeight: '800', marginTop: 2, letterSpacing: 0.3 },
  perkRowCooldown: { fontSize: 11, fontWeight: '600', marginLeft: 8 },
  frontTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  partnerName: { fontSize: 22, fontWeight: '800', flex: 1, letterSpacing: 0.3 },
  tierPillFront: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  tierPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  category: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  addressLine: { fontSize: 12, marginBottom: 4 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  directionsBtnText: { fontSize: 12, fontWeight: '700' },
  hoursLine: { fontSize: 12, marginBottom: 6 },
  termsShortLine: { fontSize: 11, fontStyle: 'italic', marginBottom: 10 },
  perkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  perkTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  flipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  flipBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  backTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  backName: { fontSize: 22, fontWeight: '800', marginBottom: 4, letterSpacing: 0.2 },
  backCategory: { fontSize: 13, marginBottom: 10 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  verifiedText: { fontSize: 12, fontWeight: '600' },
  backLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: 10, marginBottom: 2 },
  backValue: { fontSize: 14, fontWeight: '500' },
  viewPartnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  viewPartnerText: { fontSize: 16, fontWeight: '800', color: '#000', letterSpacing: 0.3 },
  flipBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, alignSelf: 'flex-start' },
  flipBackText: { fontSize: 13, fontWeight: '600' },
});
