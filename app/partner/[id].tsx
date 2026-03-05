import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, TextInput, Modal, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isDemoPartner, DEMO_HOURS } from '../../constants/MockData';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../../constants/PartnerTiers';
import { PartnerProBadge } from '../../components/PartnerProBadge';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { getPartnerHeroImage } from '../../constants/PartnerCategoryPlaceholders';
import { ORBTAP_UNIVERSE_PARTNER_ID } from '../../constants/MockData';
import { OrbTapLogoMark } from '../../components/OrbTapLogoMark';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { PremiumPerkCard } from '../../components/PremiumPerkCard';
import { PartnerBadge } from '../../components/GamificationUI';
import { TerritoryControl } from '../../components/TerritoryControl';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../../hooks/useSocial';
import { useReviews } from '../../hooks/useReviews';
import { useCanLeaveVerifiedReview } from '../../hooks/useStampCards';
import { ReviewSheet } from '../../components/ReviewSheet';
import { useBookmarks } from '../../context/BookmarkContext';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { useWallet } from '../../hooks/useWallet';
import { useFlags } from '../../components/FlagContext';
import { PartnerStampCardModule } from '../../components/PartnerStampCardModule';
import { StampCardModal } from '../../components/StampCardModal';
import type { StampCardWithProgram } from '../../hooks/useStampCards';
import { OTPointsBalanceLink } from '../../components/OTPointsBalanceLink';
import { usePartnerProofPortfolio } from '../../hooks/useWorkOrders';
import { useMenuContext } from '../../context/MenuContext';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import type { MenuReportType, MenuItem } from '../../constants/PartnerMenu';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { partnerPageSharePayload } from '../../utils/shareToSocial';
import { partnerDeepLink } from '../../constants/AppLinks';
import { promptAndOpenDirections } from '../../utils/openDirections';
import { recordPartnerView, recordPartnerFollow, getPartnerAnalyticsSummary } from '../../services/partnerAnalytics';
import { getPartnerMetrics } from '../../services/partnerAttribution';
import { alert as alertDialog } from '../../utils/alert';
import { PerkQRModal } from '../../components/PerkQRModal';
import type { Perk } from '../../constants/MockData';
import { useI18n } from '../../context/I18nContext';

export default function PartnerScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { flags } = useFlags();
  const { isFollowing, toggleFollow, getFollowedPartners } = useSocial();
  const { getPartnerReviews, getOrbScore, addReview } = useReviews();
  const canLeaveVerifiedReview = useCanLeaveVerifiedReview(id ?? null, Boolean(flags?.moduleStampCards));
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { isPartnerBookmarked, togglePartner } = useBookmarks();
  const { isPremium, testPartnerTier } = useEffectiveTier();
  const { portfolio, loading: portfolioLoading } = usePartnerProofPortfolio(id ?? '');
  const { getMenuForPartner, getCurrentVersion, addReport } = useMenuContext();
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [menuPriceFilter, setMenuPriceFilter] = useState<'all' | 'under10' | 'under20' | 'under30'>('all');
  const [menuTagFilter, setMenuTagFilter] = useState<string | null>(null);
  const [menuReportVisible, setMenuReportVisible] = useState(false);
  const [menuReportType, setMenuReportType] = useState<MenuReportType>('WRONG_PRICE');
  const [menuReportDetails, setMenuReportDetails] = useState('');
  const [menuReportItemId, setMenuReportItemId] = useState<string | undefined>();
  const [reviewSheetVisible, setReviewSheetVisible] = useState(false);
  const [socialProof, setSocialProof] = useState<{ viewsThisWeek: number; redemptions: number } | null>(null);

  const { getPartner, getActivePerksForPartner } = usePartners();
  const { myPartnerId } = useMyPartner();
  const { balance } = useWallet();
  const partner = getPartner(id ?? '');
  const perks = id ? getActivePerksForPartner(id) : [];
  const reviews = getPartnerReviews(partner?.id ?? '');
  const isOwnPage = Boolean(myPartnerId && id && myPartnerId === id);
  const [pageOverlay, setPageOverlay] = useState<{ hours?: string; description?: string; about?: string } | null>(null);

  if (!partner) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={[styles.notFoundHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.notFoundTitle, { color: colors.text }]}>Partner</Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.notFoundScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.notFoundCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.notFoundIconWrap, { backgroundColor: (colors.primary) + '22' }]}>
                <Ionicons name="business-outline" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.notFoundHeadline, { color: colors.text }]}>This partner isn't here</Text>
              <Text style={[styles.notFoundSub, { color: colors.textSecondary }]}>
                The page may have been removed or the link might be wrong. Try one of these instead — discover places, earn OT Points, and get back on track.
              </Text>
            </View>
            <Text style={[styles.notFoundSectionLabel, { color: colors.textSecondary }]}>BEST OPTIONS</Text>
            <TouchableOpacity
              style={[styles.notFoundTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { safeHaptics.selectionAsync(); router.replace('/(tabs)' as any); }}
            >
              <Ionicons name="map" size={24} color={themeGold} />
              <View style={styles.notFoundTileText}>
                <Text style={[styles.notFoundTileTitle, { color: colors.text }]}>Browse map</Text>
                <Text style={[styles.notFoundTileSub, { color: colors.textSecondary }]}>Find partners nearby</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notFoundTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/partners' as any); }}
            >
              <Ionicons name="storefront" size={24} color={colors.primary} />
              <View style={styles.notFoundTileText}>
                <Text style={[styles.notFoundTileTitle, { color: colors.text }]}>Browse partners</Text>
                <Text style={[styles.notFoundTileSub, { color: colors.textSecondary }]}>See all businesses</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notFoundTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)/scan' as any); }}
            >
              <Ionicons name="qr-code" size={24} color={COLORS.success} />
              <View style={styles.notFoundTileText}>
                <Text style={[styles.notFoundTileTitle, { color: colors.text }]}>Scan to earn</Text>
                <Text style={[styles.notFoundTileSub, { color: colors.textSecondary }]}>Redeem a perk, get OT Points</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notFoundTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)/wallet' as any); }}
            >
              <Ionicons name="wallet" size={24} color={themeGold} />
              <View style={styles.notFoundTileText}>
                <Text style={[styles.notFoundTileTitle, { color: colors.text }]}>Your vault</Text>
                <Text style={[styles.notFoundTileSub, { color: colors.textSecondary }]}>Balance & proof history</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notFoundTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)/orb' as any); }}
            >
              <Ionicons name="flash" size={24} color={colors.primary} />
              <View style={styles.notFoundTileText}>
                <Text style={[styles.notFoundTileTitle, { color: colors.text }]}>Orb hub</Text>
                <Text style={[styles.notFoundTileSub, { color: colors.textSecondary }]}>Missions, pulse, daily ritual</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notFoundTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/premium' as any); }}
            >
              <Ionicons name="diamond" size={24} color={themeGold} />
              <View style={styles.notFoundTileText}>
                <Text style={[styles.notFoundTileTitle, { color: colors.text }]}>OrbTap Plans</Text>
                <Text style={[styles.notFoundTileSub, { color: colors.textSecondary }]}>See what members unlock</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notFoundTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/support' as any); }}
            >
              <Ionicons name="help-circle" size={24} color={colors.textSecondary} />
              <View style={styles.notFoundTileText}>
                <Text style={[styles.notFoundTileTitle, { color: colors.text }]}>Help & support</Text>
                <Text style={[styles.notFoundTileSub, { color: colors.textSecondary }]}>FAQ, contact us</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.notFoundBottomPad} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const displayTier = (isOwnPage && testPartnerTier) ? testPartnerTier : partner.tier;
  const tierColor = PARTNER_TIER_COLORS[displayTier];
  const displayHours = (pageOverlay?.hours !== undefined && pageOverlay.hours !== '') ? pageOverlay.hours : partner.hours;
  const displayDescription = (pageOverlay?.description !== undefined && pageOverlay.description !== '') ? pageOverlay.description : partner.description;
  const displayAbout = (pageOverlay?.about !== undefined ? pageOverlay.about : (partner as { about?: string | null }).about) ?? '';
  const following = isFollowing(partner.id);
  const address = partner.location?.address ?? '—';
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const orbScore = getOrbScore(partner.id);
  const isBookmarked = isPartnerBookmarked(partner.id);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const [qrPerk, setQrPerk] = useState<Perk | null>(null);
  const [stampCardDetail, setStampCardDetail] = useState<StampCardWithProgram | null>(null);

  const handleShare = () => {
    safeHaptics.selectionAsync();
    setSharePayload(partnerPageSharePayload(partner.name, partnerDeepLink(partner.id)));
    setShareSheetVisible(true);
  };

  const handleDirections = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (partner.location) promptAndOpenDirections(partner.location.lat, partner.location.lng);
  };

  useEffect(() => {
    if (partner?.id) recordPartnerView(partner.id).catch(() => {});
  }, [partner?.id]);

  useEffect(() => {
    if (!id || isOwnPage) return;
    getPartnerAnalyticsSummary(id, 7)
      .then((summary) => {
        const metrics = getPartnerMetrics(id);
        setSocialProof({
          viewsThisWeek: summary.views ?? 0,
          redemptions: metrics.redemptions ?? 0,
        });
      })
      .catch(() => setSocialProof(null));
  }, [id, isOwnPage]);

  useEffect(() => {
    if (!isOwnPage || !id) return;
    const OVERLAY_KEY = 'ORBTAP_PARTNER_PAGE_OVERLAY';
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) =>
      AsyncStorage.getItem(OVERLAY_KEY).then((raw) => {
        if (!raw) return;
        try {
          const map = JSON.parse(raw) as Record<string, { hours?: string; description?: string; about?: string }>;
          const o = map[id];
          if (o) setPageOverlay(o);
        } catch (_) {}
      })
    ).catch(() => {});
  }, [isOwnPage, id]);

  const handleFollowPress = () => {
    safeHaptics.selectionAsync();
    const wasFollowing = following;
    const followedCount = getFollowedPartners().length;
    const atFreeLimit = !isPremium && followedCount >= 3;
    if (!wasFollowing && atFreeLimit) {
      alertDialog(
        'Follow limit reached',
        'Free accounts can follow up to 3 partners. Upgrade to Premium for unlimited follows.',
        [{ text: 'OK', style: 'cancel' }, { text: 'See plans', onPress: () => router.push('/premium' as any) }]
      );
      return;
    }
    toggleFollow(partner.id);
    if (!wasFollowing) recordPartnerFollow(partner.id).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero: photo only, no tier overlay. Neutral dark strip at bottom for name readability. */}
        <View style={styles.heroWrap}>
          {partner.id === ORBTAP_UNIVERSE_PARTNER_ID ? (
            <View style={styles.heroLogoWrap}>
              <OrbTapLogoMark variant="hero" width={140} height={120} />
            </View>
          ) : (
            <Image
              source={{ uri: getPartnerHeroImage(partner) }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          )}
          {/* Top: thin dark gradient so header buttons stay readable */}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.15)', 'transparent']}
            style={styles.heroGradTop}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <SafeAreaView edges={['top']} style={[styles.heroHeader, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroHeaderRight}>
              <OTPointsBalanceLink amount={balance} size={20} label="pts" compact textColor="#fff" />
              <TouchableOpacity
                onPress={() => { safeHaptics.selectionAsync(); togglePartner(partner.id); }}
                style={[styles.iconBtn, isBookmarked && { backgroundColor: 'rgba(255,255,255,0.25)' }]}
              >
                <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color={isBookmarked ? '#ffd700' : '#fff'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                <Ionicons name="share-social" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          {/* Bottom: neutral dark gradient only (no tier color) — keeps photo visible, name readable */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.88)']}
            style={styles.heroGradBottom}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <Animated.View entering={FadeInDown.duration(400)} style={styles.heroBody}>
              <Text style={[styles.heroName, { color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>{partner.name}</Text>
              <View style={styles.heroMeta}>
                <Text style={[styles.heroCategory, { color: 'rgba(255,255,255,0.95)' }]}>{partner.category}</Text>
                {partner.verified && (
                  <View style={styles.verifiedWrap}>
                    <VerifiedBadge size={14} tier={displayTier} />
                    <Text style={[styles.verifiedLabel, { color: 'rgba(255,255,255,0.9)' }]}>Verified</Text>
                  </View>
                )}
              </View>
              <View style={[styles.tierPill, { borderColor: tierColor, backgroundColor: tierColor }]}>
                <Text style={[styles.tierLabel, { color: '#fff' }]}>{PARTNER_TIER_LABELS[displayTier]} PARTNER</Text>
              </View>
              {socialProof && (socialProof.viewsThisWeek > 0 || socialProof.redemptions > 0) && (
                <View style={[styles.socialProofPill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.socialProofText}>
                    {socialProof.viewsThisWeek} visited this week{socialProof.redemptions > 0 ? ` · ${socialProof.redemptions} OT redeemed` : ''}
                  </Text>
                </View>
              )}
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Content sheet — tier used only here: accent bar, borders, CTAs (no overlay on photo) */}
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.sheetTierBar, { backgroundColor: tierColor }]} />
          {isOwnPage && (
            <TouchableOpacity
              style={[styles.ownPageBanner, { backgroundColor: COLORS.success + '22', borderColor: COLORS.success + '55' }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/edit-page' as any); }}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={[styles.ownPageBannerText, { color: colors.text }]}>This is your page</Text>
              <Text style={[styles.ownPageBannerCta, { color: COLORS.success }]}>Edit</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.success} />
            </TouchableOpacity>
          )}
          {/* Value prop: primary north-star CTA */}
          <View style={[styles.valuePropStrip, { backgroundColor: tierColor + '14', borderColor: tierColor + '70' }]}>
            <Ionicons name="gift" size={18} color={tierColor} />
            <Text style={[styles.valuePropText, { color: colors.text }]}>
              Visit and redeem a perk below to earn OT Points — then share your Proof.
            </Text>
          </View>
          {id && (
            <PartnerStampCardModule
              partnerId={id}
              partnerName={partner?.name}
              enabled={Boolean(flags.moduleStampCards && flags.stampCardsUserWallet)}
              onViewCard={setStampCardDetail}
            />
          )}
          {/* Action row: Follow, Directions, Share */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                following ? { backgroundColor: tierColor + '22', borderColor: tierColor } : { backgroundColor: colors.surface, borderColor: tierColor + '55' },
              ]}
              onPress={() => {
                safeHaptics.selectionAsync();
                const wasFollowing = following;
                const followedCount = getFollowedPartners().length;
                const atFreeLimit = !isPremium && followedCount >= 3;
                if (!wasFollowing && atFreeLimit) {
                  alertDialog(
                    'Follow limit reached',
                    'Free accounts can follow up to 3 partners. Upgrade to Premium for unlimited follows.',
                    [
                      { text: 'OK', style: 'cancel' },
                      { text: 'See plans', onPress: () => router.push('/premium' as any) },
                    ]
                  );
                  return;
                }
                toggleFollow(partner.id);
                if (!wasFollowing) recordPartnerFollow(partner.id).catch(() => {});
              }}
            >
              <Ionicons name={following ? 'heart' : 'heart-outline'} size={22} color={following ? tierColor : colors.textSecondary} />
              <Text style={[styles.actionLabel, { color: following ? tierColor : colors.text }]} numberOfLines={1}>{following ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: tierColor, borderColor: tierColor }]}
              onPress={handleDirections}
            >
              <Ionicons name="navigate" size={22} color="#000" />
              <Text style={[styles.actionLabel, { color: '#000' }]} numberOfLines={1}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: tierColor + '55' }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)' as any); }}
            >
              <Ionicons name="map" size={22} color={colors.text} />
              <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={1}>View on map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: tierColor + '55' }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={22} color={colors.text} />
              <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={1}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Info block: address, hours, description */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: tierColor + '44' }]}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color={tierColor} />
              <Text style={[styles.infoText, { color: colors.text }]}>{address}</Text>
            </View>
            {(displayHours || (isDemoPartner(partner) && DEMO_HOURS)) ? (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={18} color={tierColor} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {isDemoPartner(partner) ? `Demo hours: ${displayHours || DEMO_HOURS}` : displayHours}
                </Text>
              </View>
            ) : null}
            {displayDescription ? (
              <Text style={[styles.description, { color: colors.textSecondary }]}>{displayDescription}</Text>
            ) : null}
          </View>

          {/* About — partner custom note (max 500 chars, neat card) */}
          {displayAbout ? (
            <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: tierColor + '44' }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
              <Text style={[styles.aboutText, { color: colors.text }]}>
                {displayAbout.slice(0, 500)}
                {displayAbout.length > 500 ? '…' : ''}
              </Text>
            </View>
          ) : null}

          {/* OrbOps: Proof Portfolio + Request Work / Request Catering (partner can toggle in dashboard) */}
          {flags.isOrbOpsEnabled && (partner as { showOrbOpsButton?: boolean }).showOrbOpsButton !== false && (
            <View style={[styles.orbOpsSection, { backgroundColor: colors.surface, borderColor: tierColor + '44' }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PROOF PORTFOLIO™</Text>
              {portfolioLoading ? (
                <ActivityIndicator size="small" color={tierColor} style={styles.portfolioLoader} />
              ) : portfolio ? (
                <View style={styles.portfolioRow}>
                  <View style={styles.portfolioStat}>
                    <Text style={[styles.portfolioValue, { color: colors.text }]}>{portfolio.verifiedJobs30d}</Text>
                    <Text style={[styles.portfolioLabel, { color: colors.textSecondary }]}>Verified 30d</Text>
                  </View>
                  <View style={styles.portfolioStat}>
                    <Text style={[styles.portfolioValue, { color: colors.text }]}>{portfolio.verifiedJobs90d}</Text>
                    <Text style={[styles.portfolioLabel, { color: colors.textSecondary }]}>Verified 90d</Text>
                  </View>
                  {portfolio.categoriesTop?.length > 0 && (
                    <Text style={[styles.portfolioCats, { color: colors.textSecondary }]} numberOfLines={1}>
                      Top: {portfolio.categoriesTop.slice(0, 3).join(', ')}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.portfolioEmpty, { color: colors.textSecondary }]}>No verified jobs yet.</Text>
              )}
              {flags.isOrbOpsWorkOrdersEnabled && (
                <TouchableOpacity
                  style={[styles.requestWorkBtn, { backgroundColor: COLORS.success }]}
                  onPress={() => { safeHaptics.selectionAsync(); router.push({ pathname: '/work-orders/create', params: { partnerId: partner.id } }); }}
                >
                  <Ionicons name={partner.category === 'Dining' || partner.category === 'Cafe' ? 'restaurant' : 'document-text'} size={20} color="#000" />
                  <Text style={styles.requestWorkLabel}>
                    {(partner.category === 'Dining' || partner.category === 'Cafe') && (partner as { offersCatering?: boolean }).offersCatering
                      ? 'Request Catering'
                      : 'Request Work'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Partner Menu — when enabled and published */}
          {flags.partnerMenusEnabled && (() => {
            const menuDoc = getMenuForPartner(partner.id);
            const menuVersion = menuDoc ? getCurrentVersion(menuDoc) : null;
            const isPublished = menuDoc?.status === 'PUBLISHED';
            const isNeedsReview = menuDoc?.status === 'NEEDS_REVIEW';
            if (!menuDoc || !menuVersion || !isPublished) return null;

            const allItems: { item: MenuItem; sectionName: string }[] = [];
            menuVersion.sections.forEach((s) => {
              s.items.filter((i) => i.available).forEach((item) => allItems.push({ item, sectionName: s.name }));
            });

            const priceMax = menuPriceFilter === 'under10' ? 1000 : menuPriceFilter === 'under20' ? 2000 : menuPriceFilter === 'under30' ? 3000 : undefined;
            const filtered = allItems.filter(({ item }) => {
              const matchSearch = !menuSearchQuery.trim() || item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) || (item.description ?? '').toLowerCase().includes(menuSearchQuery.toLowerCase());
              const matchPrice = priceMax == null || (item.priceCents != null && item.priceCents <= priceMax);
              const matchTag = !menuTagFilter || (item.tags ?? []).includes(menuTagFilter);
              return matchSearch && matchPrice && matchTag;
            });

            const tonightPicks = flags.partnerMenusTonightPicks
              ? menuVersion.sections.flatMap((s) => s.items.filter((i) => i.featuredTonight && i.available))
              : [];

            const allTags = Array.from(new Set(menuVersion.sections.flatMap((s) => s.items.flatMap((i) => i.tags ?? []))));

            return (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MENU</Text>
                <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: tierColor + '44' }]}>
                  <View style={styles.menuBadgeRow}>
                    {menuDoc.verified && (
                      <View style={[styles.menuBadge, { backgroundColor: COLORS.success + '22' }]}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                        <Text style={[styles.menuBadgeText, { color: COLORS.success }]}>Verified Menu</Text>
                      </View>
                    )}
                    {isNeedsReview && (
                      <View style={[styles.menuBadge, { backgroundColor: COLORS.danger + '22' }]}>
                        <Text style={[styles.menuBadgeText, { color: COLORS.danger }]}>Needs Review</Text>
                      </View>
                    )}
                    {!isNeedsReview && !menuDoc.verified && (
                      <View style={[styles.menuBadge, { backgroundColor: colors.border }]}>
                        <Text style={[styles.menuBadgeText, { color: colors.textSecondary }]}>Menu may be outdated</Text>
                      </View>
                    )}
                  </View>
                  <TextInput
                    style={[styles.menuSearch, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Search menu..."
                    placeholderTextColor={colors.textSecondary}
                    value={menuSearchQuery}
                    onChangeText={setMenuSearchQuery}
                  />
                  <View style={styles.menuFilterRow}>
                    {(['all', 'under10', 'under20', 'under30'] as const).map((f) => (
                      <TouchableOpacity
                        key={f}
                        style={[styles.menuFilterChip, menuPriceFilter === f && { backgroundColor: tierColor + '33' }, { borderColor: colors.border }]}
                        onPress={() => { setMenuPriceFilter(f); safeHaptics.selectionAsync(); }}
                      >
                        <Text style={[styles.menuFilterText, { color: menuPriceFilter === f ? tierColor : colors.textSecondary }]}>
                          {f === 'all' ? 'All' : f === 'under10' ? 'Under $10' : f === 'under20' ? 'Under $20' : 'Under $30'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {allTags.length > 0 && (
                    <View style={styles.menuFilterRow}>
                      <TouchableOpacity
                        style={[styles.menuFilterChip, menuTagFilter === null && { backgroundColor: tierColor + '33' }, { borderColor: colors.border }]}
                        onPress={() => { setMenuTagFilter(null); safeHaptics.selectionAsync(); }}
                      >
                        <Text style={[styles.menuFilterText, { color: menuTagFilter === null ? tierColor : colors.textSecondary }]}>All</Text>
                      </TouchableOpacity>
                      {allTags.slice(0, 6).map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.menuFilterChip, menuTagFilter === tag && { backgroundColor: tierColor + '33' }, { borderColor: colors.border }]}
                          onPress={() => { setMenuTagFilter(menuTagFilter === tag ? null : tag); safeHaptics.selectionAsync(); }}
                        >
                          <Text style={[styles.menuFilterText, { color: menuTagFilter === tag ? tierColor : colors.textSecondary }]}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {tonightPicks.length > 0 && (
                    <>
                      <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>Tonight Picks</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tonightPicksScroll} contentContainerStyle={styles.tonightPicksContent}>
                        {tonightPicks.map((item) => (
                          <View key={item.id} style={[styles.tonightPickCard, { backgroundColor: colors.background, borderColor: colors.border, marginRight: 10 }]}>
                            <Text style={[styles.tonightPickName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                            {item.priceCents != null && (
                              <Text style={[styles.tonightPickPrice, { color: tierColor }]}>${(item.priceCents / 100).toFixed(2)}</Text>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  )}
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>Items</Text>
                  {filtered.length === 0 ? (
                    <Text style={[styles.menuEmpty, { color: colors.textSecondary }]}>No items match your filters.</Text>
                  ) : (
                    filtered.map(({ item, sectionName }) => (
                      <View key={item.id} style={[styles.menuItemRow, { borderTopColor: colors.border }]}>
                        <View style={styles.menuItemMain}>
                          <Text style={[styles.menuItemName, { color: colors.text }]}>{item.name}</Text>
                          {item.description ? <Text style={[styles.menuItemDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text> : null}
                          <View style={styles.menuItemMeta}>
                            {(item.tags ?? []).slice(0, 3).map((t) => (
                              <View key={t} style={[styles.menuItemTag, { backgroundColor: colors.background }]}>
                                <Text style={[styles.menuItemTagText, { color: colors.textSecondary }]}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        {item.priceCents != null && (
                          <Text style={[styles.menuItemPrice, { color: colors.text }]}>${(item.priceCents / 100).toFixed(2)}</Text>
                        )}
                        {flags.partnerMenusReporting && (
                          <TouchableOpacity
                            style={styles.menuItemReportBtn}
                            onPress={() => { setMenuReportItemId(item.id); setMenuReportDetails(''); setMenuReportType('WRONG_PRICE'); setMenuReportVisible(true); safeHaptics.selectionAsync(); }}
                          >
                            <Ionicons name="flag-outline" size={14} color={COLORS.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                  {flags.partnerMenusReporting && (
                    <TouchableOpacity
                      style={[styles.menuReportBtn, { borderColor: colors.border }]}
                      onPress={() => { setMenuReportItemId(undefined); setMenuReportDetails(''); setMenuReportType('OTHER'); setMenuReportVisible(true); safeHaptics.selectionAsync(); }}
                    >
                      <Ionicons name="flag-outline" size={16} color={COLORS.danger} />
                      <Text style={[styles.menuReportBtnText, { color: COLORS.danger }]}>Report an issue with this menu</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            );
          })()}

          {/* Deals & Perks — premium holographic cards */}
          <View style={styles.perksSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PERKS YOU CAN REDEEM</Text>
            {perks.length > 0 && (
              <Text style={[styles.perksCount, { color: tierColor }]}>{perks.length} {perks.length === 1 ? 'deal' : 'deals'} — visit & show QR to earn OT Points</Text>
            )}
          </View>
          {perks.length > 0 ? (
            perks.map((perk, i) => (
              <Animated.View key={perk.id} entering={FadeInDown.delay(i * 80).duration(400)} style={styles.perkCardWrap}>
                <PremiumPerkCard perk={perk} partnerName={partner.name} variant="row" />
                <TouchableOpacity
                  style={[styles.perkQrBtn, { borderColor: tierColor + '80', backgroundColor: tierColor + '18' }]}
                  onPress={() => { safeHaptics.selectionAsync(); setQrPerk(perk); }}
                >
                  <Ionicons name="qr-code-outline" size={18} color={tierColor} />
                  <Text style={[styles.perkQrBtnText, { color: tierColor }]}>Show QR for staff</Text>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <View style={[styles.emptyPerks, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="gift-outline" size={28} color={colors.textSecondary} />
              <Text style={[styles.emptyPerksText, { color: colors.text }]}>No active perks right now</Text>
              <Text style={[styles.emptyPerksSub, { color: colors.textSecondary }]}>Check back soon — new deals drop often</Text>
            </View>
          )}

          {/* Reviews — Verified reviews from OrbTap users (always visible) */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VERIFIED REVIEWS</Text>
          <View style={[styles.reviewsCard, { backgroundColor: colors.surface, borderColor: tierColor + '44' }]}>
            <Text style={[styles.reviewsSubtitle, { color: colors.textSecondary }]}>From OrbTap users · Verified visits count more</Text>
            {/* Orb Score™ */}
            <View style={[styles.orbScoreRow, { backgroundColor: tierColor + '18', borderColor: tierColor + '50' }]}>
              <View style={styles.orbScoreLeft}>
                <Text style={[styles.orbScoreLabel, { color: colors.textSecondary }]}>Orb Score™</Text>
                <Text style={[styles.orbScoreTagline, { color: colors.textSecondary }]}>Only on OrbTap</Text>
              </View>
              <View style={[styles.orbScoreBadge, { backgroundColor: tierColor }]}>
                <Text style={styles.orbScoreValue}>{orbScore.score}</Text>
                <Text style={styles.orbScoreMax}>/100</Text>
              </View>
              <View style={styles.orbScoreMeta}>
                <Text style={[styles.orbScoreTier, { color: tierColor }]}>{orbScore.label}</Text>
                <Text style={[styles.orbScoreVerified, { color: colors.textSecondary }]}>{orbScore.verifiedCount} verified</Text>
              </View>
            </View>
            {avgRating && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={20} color={themeGold} />
                <Text style={[styles.ratingValue, { color: colors.text }]}>{avgRating}</Text>
                <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>({reviews.length} reviews)</Text>
              </View>
            )}
            {reviews.length > 0 ? (
              reviews.slice(0, 5).map((r) => (
                <View key={r.id} style={[styles.reviewRow, { borderTopColor: colors.border }]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewNameRow}>
                      <Text style={[styles.reviewName, { color: colors.text }]}>{r.userName}</Text>
                      {r.verified && (
                        <View style={[styles.verifiedVisitBadge, { backgroundColor: tierColor + '25', borderColor: tierColor }]}>
                          <Ionicons name="checkmark-circle" size={12} color={tierColor} />
                          <Text style={[styles.verifiedVisitText, { color: tierColor }]}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={12} color={themeGold} />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewText, { color: colors.textSecondary }]}>{r.text}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noReviewsText, { color: colors.textSecondary }]}>No reviews yet. Be the first to leave a verified review after your visit.</Text>
            )}
            {canLeaveVerifiedReview && !reviews.some((r) => r.userId === 'me') && (
              <TouchableOpacity
                style={[styles.leaveVerifiedReviewBtn, { borderColor: COLORS.success, backgroundColor: COLORS.success + '18' }]}
                onPress={() => { safeHaptics.selectionAsync(); setReviewSheetVisible(true); }}
              >
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={[styles.leaveVerifiedReviewText, { color: COLORS.success }]}>Leave verified review</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.seeAllReviewsBtn, { borderColor: tierColor + '60', backgroundColor: tierColor + '12' }]}
              onPress={() => { safeHaptics.selectionAsync(); router.push(`/partner/reviews/${partner.id}` as any); }}
            >
              <Text style={[styles.seeAllReviewsBtnText, { color: tierColor }]}>See All Reviews</Text>
              {reviews.length > 0 && <Text style={[styles.seeAllReviewsBtnCount, { color: colors.textSecondary }]}>{(reviews.length)}</Text>}
              <Ionicons name="chevron-forward" size={18} color={tierColor} />
            </TouchableOpacity>

            <Modal visible={reviewSheetVisible} transparent animationType="slide">
              <TouchableOpacity style={styles.reviewSheetBackdrop} activeOpacity={1} onPress={() => setReviewSheetVisible(false)}>
                <View style={styles.reviewSheetWrap} onStartShouldSetResponder={() => true}>
                  <ReviewSheet
                    partnerName={partner?.name ?? 'Partner'}
                    onSubmit={(rating, text) => {
                      addReview(partner!.id, rating, text);
                      setReviewSheetVisible(false);
                    }}
                    onCancel={() => setReviewSheetVisible(false)}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          {/* Community teaser */}
          <TerritoryControl sphereName="Neon Raiders" />

          {/* Report — subtle */}
          <TouchableOpacity
            style={[styles.reportRow, { borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/report', params: { partnerId: partner.id, name: partner.name } })}
          >
            <Ionicons name="flag-outline" size={18} color={COLORS.danger} />
            <Text style={[styles.reportText, { color: COLORS.danger }]}>Report this partner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share partner"
        />
      )}
      {qrPerk && (
        <PerkQRModal
          visible={!!qrPerk}
          onClose={() => setQrPerk(null)}
          perk={qrPerk}
          partnerName={partner.name}
        />
      )}

      <StampCardModal
        visible={!!stampCardDetail}
        cards={stampCardDetail ? [stampCardDetail] : []}
        initialIndex={0}
        onClose={() => setStampCardDetail(null)}
        partnerLogoMap={partner?.id ? { [partner.id]: partner.logoUrl ?? null } : {}}
        partnerTierMap={partner?.id && partner?.tier ? { [partner.id]: partner.tier } : {}}
      />

      {/* Menu report modal */}
      <Modal visible={menuReportVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuReportVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Report menu issue</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.modalChips}>
              {(['WRONG_PRICE', 'ITEM_MISSING', 'ITEM_NOT_AVAILABLE', 'OTHER'] as MenuReportType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.modalChip, menuReportType === t && { backgroundColor: colors.primary + '33' }, { borderColor: colors.border }]}
                  onPress={() => { setMenuReportType(t); safeHaptics.selectionAsync(); }}
                >
                  <Text style={[styles.modalChipText, { color: menuReportType === t ? colors.primary : colors.text }]}>{t.replace(/_/g, ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Details (min 10 characters)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Describe the issue..."
              placeholderTextColor={colors.textSecondary}
              value={menuReportDetails}
              onChangeText={setMenuReportDetails}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setMenuReportVisible(false)}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.danger }]}
                onPress={() => {
                  if (menuReportDetails.trim().length < 10) return;
                  const menuDoc = getMenuForPartner(partner.id);
                  if (!menuDoc) return;
                  addReport({
                    partnerId: partner.id,
                    menuId: menuDoc.id,
                    versionId: menuDoc.currentVersionId,
                    itemId: menuReportItemId,
                    reporterUid: 'You',
                    type: menuReportType,
                    details: menuReportDetails.trim(),
                  });
                  setMenuReportVisible(false);
                  setMenuReportDetails('');
                  setMenuReportItemId(undefined);
                  safeHaptics.selectionAsync();
                }}
                disabled={menuReportDetails.trim().length < 10}
              >
                <Text style={styles.modalBtnTextPrimary}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { padding: 24, fontSize: 16 },
  safeArea: { flex: 1 },
  notFoundHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  notFoundTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  notFoundScroll: { padding: 20, paddingBottom: 80 },
  notFoundCard: { padding: 24, borderRadius: 20, borderWidth: 1, marginBottom: 24, alignItems: 'center' },
  notFoundIconWrap: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  notFoundHeadline: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  notFoundSub: { fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 8 },
  notFoundSectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  notFoundTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  notFoundTileText: { flex: 1, marginLeft: 14, minWidth: 0 },
  notFoundTileTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  notFoundTileSub: { fontSize: 13 },
  notFoundBottomPad: { height: 40 },
  scrollContent: { paddingBottom: 120, flexGrow: 1 },
  heroWrap: { minHeight: 260, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroLogoWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLogoImage: { width: 140, height: 140, maxWidth: '70%', maxHeight: 200 },
  heroGrad: { flex: 1, paddingBottom: 48, justifyContent: 'space-between' },
  heroGradTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 56, zIndex: 1 },
  heroGradBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 96, justifyContent: 'flex-end', paddingBottom: 10, paddingHorizontal: 24, zIndex: 1 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  heroHeaderRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  tierBar: { height: 3, marginHorizontal: 16, marginBottom: 8, borderRadius: 2 },
  heroBody: { paddingHorizontal: 16, alignItems: 'center' },
  badgeWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 },
  proBadgeWrap: {},
  heroName: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  heroCategory: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  verifiedWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  tierPill: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tierLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  socialProofPill: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  socialProofText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.95)' },

  sheet: { marginTop: -20, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingTop: 36, alignSelf: 'stretch', overflow: 'hidden' },
  sheetTierBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  ownPageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  ownPageBannerText: { fontSize: 15, fontWeight: '700', flex: 1 },
  ownPageBannerCta: { fontSize: 14, fontWeight: '800' },
  valuePropStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  valuePropText: { fontSize: 13, fontWeight: '600', flex: 1 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 0,
    flex: 1,
    flexBasis: '47%',
  },
  actionLabel: { fontSize: 13, fontWeight: '700' },

  infoCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24, alignSelf: 'stretch' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  infoText: { fontSize: 15, fontWeight: '500', flex: 1, flexShrink: 1 },
  description: { fontSize: 14, lineHeight: 22, marginTop: 4 },

  aboutCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24, alignSelf: 'stretch' },
  aboutText: { fontSize: 15, lineHeight: 24, letterSpacing: 0.2 },

  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  perksSectionHeader: { marginBottom: 14 },
  perksCount: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  perkCardWrap: { marginBottom: 14 },
  perkQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  perkQrBtnText: { fontSize: 13, fontWeight: '600' },
  emptyPerks: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  emptyPerksText: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyPerksSub: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  reviewsCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24, alignSelf: 'stretch' },
  reviewsSubtitle: { fontSize: 12, marginBottom: 12 },
  noReviewsText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginTop: 12 },
  orbScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  orbScoreLeft: { flex: 1 },
  orbScoreLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  orbScoreTagline: { fontSize: 10, marginTop: 2 },
  orbScoreBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 12 },
  orbScoreValue: { color: '#000', fontSize: 22, fontWeight: '800' },
  orbScoreMax: { color: 'rgba(0,0,0,0.6)', fontSize: 12, fontWeight: '700' },
  orbScoreMeta: { alignItems: 'flex-end' },
  orbScoreTier: { fontSize: 13, fontWeight: '800' },
  orbScoreVerified: { fontSize: 11, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  ratingValue: { fontSize: 18, fontWeight: '800' },
  ratingCount: { fontSize: 14 },
  reviewRow: { paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1 },
  reviewName: { fontSize: 14, fontWeight: '700' },
  verifiedVisitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  verifiedVisitText: { fontSize: 10, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 13, lineHeight: 20 },
  seeAllReviewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
  },
  seeAllReviewsBtnText: { fontSize: 15, fontWeight: '800' },
  seeAllReviewsBtnCount: { fontSize: 13, fontWeight: '600' },
  leaveVerifiedReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  leaveVerifiedReviewText: { fontSize: 15, fontWeight: '700' },
  reviewSheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  reviewSheetWrap: { borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 8,
  },
  reportText: { fontSize: 13, fontWeight: '600' },

  orbOpsSection: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24, alignSelf: 'stretch' },
  portfolioLoader: { marginVertical: 12 },
  portfolioRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 12 },
  portfolioStat: {},
  portfolioValue: { fontSize: 18, fontWeight: '800' },
  portfolioLabel: { fontSize: 11, fontWeight: '600' },
  portfolioCats: { fontSize: 12, flex: 1 },
  portfolioEmpty: { fontSize: 13, marginBottom: 12 },
  requestWorkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  requestWorkLabel: { color: '#000', fontSize: 15, fontWeight: '800' },

  menuCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24, alignSelf: 'stretch' },
  menuBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  menuBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  menuBadgeText: { fontSize: 11, fontWeight: '700' },
  menuSearch: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  menuFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  menuFilterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  menuFilterText: { fontSize: 12, fontWeight: '600' },
  menuSubtitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  tonightPicksScroll: { marginHorizontal: -16 },
  tonightPicksContent: { paddingHorizontal: 16, paddingBottom: 8 },
  tonightPickCard: { width: 140, padding: 12, borderRadius: 12, borderWidth: 1 },
  tonightPickName: { fontSize: 14, fontWeight: '700' },
  tonightPickPrice: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  menuEmpty: { fontSize: 14, fontStyle: 'italic', paddingVertical: 12 },
  menuItemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderTopWidth: 1 },
  menuItemMain: { flex: 1, minWidth: 0 },
  menuItemName: { fontSize: 15, fontWeight: '700' },
  menuItemDesc: { fontSize: 13, marginTop: 2 },
  menuItemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  menuItemTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  menuItemTagText: { fontSize: 10, fontWeight: '600' },
  menuItemPrice: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  menuItemReportBtn: { padding: 4, marginLeft: 4 },
  menuReportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginTop: 12, borderTopWidth: 1 },
  menuReportBtnText: { fontSize: 13, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: 16, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  modalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  modalChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  modalChipText: { fontSize: 13, fontWeight: '600' },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
  modalBtnTextPrimary: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
