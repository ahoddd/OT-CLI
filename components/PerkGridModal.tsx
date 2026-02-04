import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Platform, ScrollView, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Partner, MOCK_PERKS, TIER_COLORS } from '../constants/MockData';
import { HOLO_COLORS, SHINE_COLORS, getTierBorderWidth, getTierShineOpacity } from '../constants/PremiumStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { useRouter } from 'expo-router';
import { VerifiedBadge } from './VerifiedBadge';
import { OTPointsBadge } from './OTPointsBadge';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const MODAL_HEIGHT_RATIO = 0.70;
const CARD_MAX_HEIGHT = height * MODAL_HEIGHT_RATIO;
const CLOSE_GAP = 28;

interface PerkGridModalProps {
  visible: boolean;
  partner: Partner | null;
  onClose: () => void;
}

export function PerkGridModal({ visible, partner, onClose }: PerkGridModalProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const flip = useSharedValue(0);
  const perks = partner ? MOCK_PERKS.filter((p) => p.partnerId === partner.id) : [];
  const primaryPerk = perks[0] ?? null;

  useEffect(() => {
    if (visible) flip.value = 0;
  }, [visible]);

  const showBack = () => {
    Haptics.selectionAsync();
    flip.value = withTiming(1, { duration: 300 });
  };

  const showFront = () => {
    Haptics.selectionAsync();
    flip.value = withTiming(0, { duration: 300 });
  };

  const handleViewPartner = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const tierColor = TIER_COLORS[partner.tier];
  const address = partner.location?.address ?? '—';
  const glassCardBg = isDark ? 'rgba(12,12,18,0.92)' : 'rgba(20,20,26,0.94)';
  const borderGlow = tierColor + '66';
  const tierBorderWidth = getTierBorderWidth(partner.tier);
  const tierShineOpacity = getTierShineOpacity(partner.tier);
  const heroImageUrl = primaryPerk?.imageUrl ?? partner.featuredImageUrl ?? partner.logoUrl ?? null;

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
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlayContent}>
          <View style={[styles.modalSlot, { maxHeight: CARD_MAX_HEIGHT }]}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.cardWrap}>
            {/* FRONT: Perk tile summary — holographic glass card */}
            <Animated.View style={[styles.cardWrapInner, frontStyle]}>
              <LinearGradient colors={[...HOLO_COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.holoBorder, { padding: tierBorderWidth }]}>
                <View style={[styles.card, styles.cardFront, { backgroundColor: glassCardBg, shadowColor: tierColor }]}>
                  <TouchableOpacity style={styles.inCardClose} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
                  <LinearGradient colors={[...SHINE_COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: tierShineOpacity }]} pointerEvents="none" />
                  <View style={styles.frontContent}>
                <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>{partner.name}</Text>
                <Text style={[styles.category, { color: colors.textSecondary }]}>{partner.category}</Text>
                <Text style={[styles.addressLine, { color: colors.textSecondary }]} numberOfLines={1}>{address}</Text>
                <Text style={[styles.hoursLine, { color: colors.textSecondary }]}>{partner.hours}</Text>
                {primaryPerk && (
                  <View style={[styles.perkChip, { backgroundColor: tierColor + '28', borderColor: tierColor }]}>
                    <Text style={[styles.perkTitle, { color: tierColor }]} numberOfLines={1}>{primaryPerk.title}</Text>
                    <OTPointsBadge amount={primaryPerk.cost} size={14} label="none" compact textColor={tierColor} />
                  </View>
                )}
                <TouchableOpacity style={[styles.flipBtn, { borderColor: tierColor + '55' }]} onPress={showBack}>
                  <Text style={[styles.flipBtnText, { color: tierColor }]}>See hours & perks</Text>
                  <Ionicons name="arrow-forward" size={18} color={tierColor} />
                </TouchableOpacity>
              </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* BACK: Partner full info — tier-scaled holographic card, logo/perk photo, no overlapping buttons */}
            <Animated.View style={[styles.cardWrapInner, backStyle]}>
              <LinearGradient colors={[...HOLO_COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.holoBorder, { padding: tierBorderWidth }]}>
                <View style={[styles.card, styles.cardBack, { backgroundColor: glassCardBg, shadowColor: tierColor }]}>
                  <TouchableOpacity style={styles.inCardClose} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
                  <LinearGradient colors={[...SHINE_COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: tierShineOpacity }]} pointerEvents="none" />
                  {/* Hero: partner logo or perk photo — optional; partners can add in-app */}
                  {heroImageUrl ? (
                    <View style={styles.backHeroWrap}>
                      <Image source={{ uri: heroImageUrl }} style={styles.backHeroImage} resizeMode="cover" onError={() => {}} />
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
                    <Text style={[styles.backCategory, { color: colors.textSecondary }]}>{partner.category} · {partner.tier.toUpperCase()}</Text>
                    {partner.verified && (
                      <View style={styles.verifiedRow}>
                        <VerifiedBadge size={14} />
                        <Text style={[styles.verifiedText, { color: colors.textSecondary }]}>Verified</Text>
                      </View>
                    )}
                    <Text style={[styles.backLabel, { color: colors.textSecondary }]}>Address</Text>
                    <Text style={[styles.backValue, { color: colors.text }]}>{address}</Text>
                    {/* Hours — prominent for foot traffic */}
                    <View style={[styles.hoursBlock, { backgroundColor: tierColor + '18', borderColor: tierColor + '44' }]}>
                      <Ionicons name="time" size={18} color={tierColor} />
                      <View style={styles.hoursBlockText}>
                        <Text style={[styles.hoursBlockLabel, { color: colors.textSecondary }]}>Hours</Text>
                        <Text style={[styles.hoursBlockValue, { color: colors.text }]}>{partner.hours}</Text>
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
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              onClose();
                              router.push(`/perk/${p.id}` as any);
                            }}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.perkRowTitle, { color: colors.text }]} numberOfLines={1}>{p.title}</Text>
                            <OTPointsBadge amount={p.cost} size={14} label="pts" compact textColor={TIER_COLORS[p.tier]} />
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
                  {/* Fixed footer: Open partner page — always visible, no overlap with Close */}
                  <View style={styles.backFooter}>
                    <TouchableOpacity style={[styles.viewPartnerBtn, { backgroundColor: tierColor }]} onPress={handleViewPartner}>
                      <Ionicons name="walk" size={20} color="#000" />
                      <Text style={styles.viewPartnerText}>Visit & redeem</Text>
                      <Ionicons name="open-outline" size={18} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.closeArea, { marginTop: CLOSE_GAP }]}
            onPress={onClose}
          >
            <View style={[styles.closePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}>
              <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>Close</Text>
            </View>
          </TouchableOpacity>
          </View>
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
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  overlayDim: { ...StyleSheet.absoluteFillObject },
  overlayContent: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  modalSlot: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  cardWrap: { width: CARD_WIDTH },
  inCardClose: { position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 4 },
  cardWrapInner: { width: CARD_WIDTH },
  holoBorder: {
    borderRadius: 24,
  },
  card: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 280,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  cardFront: {},
  cardBack: { minHeight: 340, maxHeight: CARD_MAX_HEIGHT },
  tierBar: { height: 4, width: '100%' },
  backHeroWrap: { height: 100, width: '100%', backgroundColor: 'rgba(0,0,0,0.2)' },
  backHeroImage: { width: '100%', height: '100%' },
  backHeroGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 },
  backHeroPlaceholder: { height: 72, width: '100%', justifyContent: 'center', alignItems: 'center' },
  backHeroPlaceholderText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  backScroll: { flex: 1 },
  backScrollContent: { padding: 20, paddingBottom: 16 },
  backFooter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
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
  perkRowTitle: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  perkRowCooldown: { fontSize: 11, fontWeight: '600', marginLeft: 8 },
  frontContent: { padding: 20 },
  partnerName: { fontSize: 20, fontWeight: '800', marginBottom: 4, letterSpacing: 0.3 },
  category: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  addressLine: { fontSize: 11, marginBottom: 2 },
  hoursLine: { fontSize: 11, marginBottom: 12 },
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
  backContent: { padding: 22 },
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
  closeArea: {},
  closePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  closeText: { fontSize: 15, fontWeight: '700' },
});
