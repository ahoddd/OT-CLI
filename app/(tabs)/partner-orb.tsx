/**
 * Partner Orb — full command center (middle tab). All partner tools in one place with frosted glass UX.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { useTheme } from '../../hooks/useTheme';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { useFlags } from '../../components/FlagContext';
import { useReviews } from '../../hooks/useReviews';
import { usePartnerPendingApplicationsCount } from '../../hooks/useOpportunities';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { isAdminEmail } from '../../constants/Admin';
import { useAuth } from '../../context/AuthContext';
import { safeHaptics } from '../../utils/safeHaptics';
import { PartnerFrostedCard } from '../../components/PartnerFrostedCard';
import type { PartnerTier } from '../../constants/PartnerTiers';

const PARTNER_HUB_TILES: Array<{
  id: string;
  label: string;
  subLabel: string;
  icon: string;
  route: string | (() => void);
  minTier?: PartnerTier;
  flag?: keyof ReturnType<typeof useFlags>['flags'];
}> = [
  { id: 'dashboard', label: 'Command center', subLabel: 'Analytics & impact', route: '/(tabs)/partner-dashboard', icon: 'grid' },
  { id: 'perks', label: 'Perks', subLabel: 'Create & manage', route: '/(tabs)/partner-perks', icon: 'pricetag' },
  { id: 'view-page', label: 'View your page', subLabel: 'As customers see it', route: 'view-page', icon: 'eye' },
  { id: 'edit-page', label: 'Edit your page', subLabel: 'Hours, about, info', route: '/partner/edit-page', icon: 'create-outline' },
  { id: 'polls', label: 'Polls', subLabel: 'OrbVote', route: '/partner/polls', icon: 'stats-chart' },
  { id: 'feed', label: 'Feed', subLabel: 'Create posts', route: '/(tabs)/partner-feed', icon: 'newspaper' },
  { id: 'signal-create', label: 'Orb Signal', subLabel: 'Create prediction market', route: '/partner/signal/create', icon: 'megaphone' },
  { id: 'invite-sphere', label: 'Invite sphere', subLabel: 'Offer to spheres', route: '/partner/invite-sphere', icon: 'people' },
  { id: 'menu', label: 'Menu', subLabel: 'Upload & publish', route: '/partner/menu', icon: 'restaurant', minTier: 'silver', flag: 'partnerMenusEnabled' },
  { id: 'stamp-studio', label: 'Stamp Studio', subLabel: 'Stamp cards QR', route: '/partner/stamp-studio', icon: 'pricetag-outline', flag: 'stampCardsPartnerStudio' },
  { id: 'stamp-redeem', label: 'Stamp Redeem', subLabel: 'Redeem rewards', route: '/partner/stamp-redeem', icon: 'gift-outline', flag: 'stampCardsRewardClaim' },
  { id: 'orbswipe', label: 'OrbSwipe', subLabel: 'Leads & drops', route: '/partner/orbswipe', icon: 'swap-horizontal', flag: 'isOrbSwipeEnabled' },
  { id: 'meal-proposals', label: 'Meal Studio', subLabel: 'Meal proposals', route: '/partner/meal-proposals', icon: 'restaurant', flag: 'partner.mealProposalComposer' },
  { id: 'work-orders', label: 'Work orders', subLabel: 'Catering & requests', route: '/work-orders', icon: 'document-text-outline', flag: 'isOrbOpsEnabled' },
  { id: 'opportunities', label: 'Opportunities', subLabel: 'Hiring & gigs', route: '/partner/opportunities', icon: 'briefcase', minTier: 'silver', flag: 'isOrbOpportunitiesEnabled', badgeKey: 'opportunities' },
  { id: 'reviews', label: 'Reviews', subLabel: 'See & respond', route: 'reviews', icon: 'star', badgeKey: 'reviews' },
  { id: 'settings', label: 'Settings', subLabel: 'Account & more', route: '/(tabs)/partner-settings', icon: 'settings-sharp' },
];

export default function PartnerOrbTab() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { partners } = usePartners();
  const { myPartner } = useMyPartner();
  const { flags } = useFlags();
  const { testPartnerTier } = useEffectiveTier();
  const { user } = useAuth();
  const partner = myPartner ?? partners[0] ?? null;
  const partnerId = partner?.id ?? 'p1';
  const effectiveTier: PartnerTier = (testPartnerTier ?? (partner?.tier as PartnerTier) ?? 'silver');
  const { getPartnerReviews } = useReviews();
  const pendingAppsCount = usePartnerPendingApplicationsCount(partnerId);
  const reviewCount = getPartnerReviews(partnerId).length;
  const tierColor = PARTNER_TIER_COLORS[effectiveTier];
  const isAdmin = isAdminEmail(user?.email);

  const tierRank = { silver: 0, gold: 1, platinum: 2 };
  const canUse = (minTier?: PartnerTier) => !minTier || tierRank[effectiveTier] >= tierRank[minTier];

  const handleNav = (route: string | (() => void)) => {
    safeHaptics.selectionAsync();
    if (typeof route === 'function') route();
    else if (route === 'reviews') router.push(`/partner/reviews/${partnerId}` as any);
    else if (route === 'view-page') router.push(`/partner/${partnerId}` as any);
    else if (route === '/work-orders') router.push({ pathname: '/work-orders', params: { role: 'partner' } } as any);
    else router.push(route as any);
  };

  const visibleTiles = PARTNER_HUB_TILES.filter((t) => {
    if (t.flag !== undefined) {
      const v = (flags as Record<string, boolean>)[t.flag];
      if (!v) return false;
    }
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Page title top-left */}
        <View style={[styles.pageHeader, { borderBottomColor: tierColor + '40' }]}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Partner Orb</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero: frosted */}
          <PartnerFrostedCard borderColor={tierColor} style={styles.heroCard}>
            <LinearGradient
              colors={[tierColor + '25', 'transparent']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.heroIconWrap}>
              <View style={[styles.orbIcon, { backgroundColor: tierColor + '35' }]}>
                <Ionicons name="planet" size={36} color={tierColor} />
              </View>
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Your OrbTap generator</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              All partner tools in one place. Create perks, run polls, manage stamps, post to the feed, and more — all by yourself.
            </Text>
          </PartnerFrostedCard>

          {/* Quick start — frosted */}
          <PartnerFrostedCard borderColor={colors.border} style={styles.instructionsCard}>
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>Quick start</Text>
            <Text style={[styles.instructionsBody, { color: colors.textSecondary }]}>
              • <Text style={{ fontWeight: '700', color: colors.text }}>Command center</Text> — analytics & impact{'\n'}
              • <Text style={{ fontWeight: '700', color: colors.text }}>Perks</Text> — create & manage redemptions{'\n'}
              • <Text style={{ fontWeight: '700', color: colors.text }}>Polls</Text> & <Text style={{ fontWeight: '700', color: colors.text }}>Feed</Text> — engage customers{'\n'}
              • <Text style={{ fontWeight: '700', color: colors.text }}>Stamp Studio</Text> & <Text style={{ fontWeight: '700', color: colors.text }}>OrbSwipe</Text> — when enabled
            </Text>
          </PartnerFrostedCard>

          {/* Hub tiles — frosted glass tiles */}
          <View style={styles.hubSection}>
            <Text style={[styles.hubSectionTitle, { color: colors.textSecondary }]}>YOUR TOOLS</Text>
            <View style={styles.hubTilesWrap}>
              {visibleTiles.map((tile) => {
                const allowed = canUse(tile.minTier);
                const badgeCount = tile.badgeKey === 'reviews' ? reviewCount : tile.badgeKey === 'opportunities' ? pendingAppsCount : 0;
                const showBadge = badgeCount > 0;
                return (
                  <Pressable
                    key={tile.id}
                    style={({ pressed }) => [pressed && allowed && styles.tilePressed]}
                    onPress={() => allowed && handleNav(tile.route)}
                    disabled={!allowed}
                  >
                    <PartnerFrostedCard
                      borderColor={allowed ? tierColor : colors.border}
                      style={[styles.tile, !allowed && styles.tileLocked]}
                    >
                      <View style={[styles.tileIconWrap, { backgroundColor: allowed ? tierColor + '28' : colors.border + '50' }]}>
                        <Ionicons name={tile.icon as any} size={22} color={allowed ? tierColor : colors.textSecondary} />
                        {showBadge && (
                          <View style={[styles.tileBadge, { backgroundColor: COLORS.danger ?? '#ef4444' }]}>
                            <Text style={styles.tileBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.tileLabel, { color: allowed ? colors.text : colors.textSecondary }]} numberOfLines={1}>{tile.label}</Text>
                      <Text style={[styles.tileSub, { color: colors.textSecondary }]} numberOfLines={1}>{tile.subLabel}</Text>
                      {!allowed && (
                        <View style={styles.lockBadge}>
                          <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
                        </View>
                      )}
                    </PartnerFrostedCard>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {isAdmin && (
            <TouchableOpacity
              onPress={() => { safeHaptics.selectionAsync(); router.push('/admin'); }}
              activeOpacity={0.9}
            >
              <PartnerFrostedCard borderColor={themeGold} style={styles.adminBtn}>
                <View style={styles.adminBtnInner}>
                  <Ionicons name="construct" size={20} color={themeGold} />
                  <Text style={[styles.adminBtnText, { color: colors.text }]}>Admin Hub</Text>
                  <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
                </View>
              </PartnerFrostedCard>
            </TouchableOpacity>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  pageHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  pageTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  heroCard: {
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroIconWrap: { marginBottom: 12 },
  orbIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  heroTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  heroSub: { fontSize: 14, lineHeight: 20 },
  instructionsCard: { padding: 16, marginBottom: 16 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  instructionsBody: { fontSize: 13, lineHeight: 20 },
  hubSection: { marginBottom: 20 },
  hubSectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  hubTilesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '30%',
    minWidth: 100,
    padding: 12,
    alignItems: 'center',
  },
  tileLocked: { opacity: 0.7 },
  tilePressed: { opacity: 0.9 },
  tileIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6, position: 'relative' },
  tileBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tileBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  tileLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  tileSub: { fontSize: 10 },
  lockBadge: { position: 'absolute', top: 6, right: 6 },
  adminBtn: { marginBottom: 16, padding: 0 },
  adminBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16 },
  adminBtnText: { fontSize: 14, fontWeight: '700' },
  bottomPad: { height: 100 },
});
