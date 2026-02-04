import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PARTNERS, MOCK_PERKS, TIER_COLORS } from '../../constants/MockData';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { PremiumPerkCard } from '../../components/PremiumPerkCard';
import { PartnerBadge } from '../../components/GamificationUI';
import { TerritoryControl } from '../../components/TerritoryControl';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../../hooks/useSocial';
import { useReviews } from '../../hooks/useReviews';
import { useBookmarks } from '../../context/BookmarkContext';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

function openDirections(lat: number, lng: number) {
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() => {});
}

export default function PartnerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFollowing, toggleFollow } = useSocial();
  const { getPartnerReviews, getOrbScore } = useReviews();
  const { colors, isDark } = useTheme();
  const { isPartnerBookmarked, togglePartner } = useBookmarks();

  const partner = MOCK_PARTNERS.find((p) => p.id === id);
  const perks = MOCK_PERKS.filter((p) => p.partnerId === id);
  const reviews = getPartnerReviews(partner?.id ?? '');

  if (!partner) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.text }]}>Partner not found</Text>
      </View>
    );
  }

  const tierColor = TIER_COLORS[partner.tier];
  const following = isFollowing(partner.id);
  const address = partner.location?.address ?? '—';
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const orbScore = getOrbScore(partner.id);
  const isBookmarked = isPartnerBookmarked(partner.id);

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        title: partner.name,
        message: `Check out ${partner.name} on OrbTap — ${partner.category}. ${address}`,
        url: undefined,
      });
    } catch {}
  };

  const handleDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (partner.location) openDirections(partner.location.lat, partner.location.lng);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero: gradient + tier bar + name + category + verified */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[tierColor, tierColor + 'dd', isDark ? '#0a0a0a' : '#f5f5f5']}
            style={styles.heroGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <SafeAreaView edges={['top']} style={styles.heroHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.heroHeaderRight}>
                <TouchableOpacity
                  onPress={() => { Haptics.selectionAsync(); togglePartner(partner.id); }}
                  style={[styles.iconBtn, isBookmarked && { backgroundColor: 'rgba(255,215,0,0.4)' }]}
                >
                  <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color={isBookmarked ? '#ffd700' : '#fff'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                  <Ionicons name="share-social" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
            <View style={[styles.tierBar, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
            <Animated.View entering={FadeInDown.duration(500)} style={styles.heroBody}>
              <View style={styles.badgeWrap}>
                <PartnerBadge tier={partner.tier} size={48} />
              </View>
              <Text style={styles.heroName}>{partner.name}</Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroCategory}>{partner.category}</Text>
                {partner.verified && (
                  <View style={styles.verifiedWrap}>
                    <VerifiedBadge size={14} />
                    <Text style={styles.verifiedLabel}>Verified</Text>
                  </View>
                )}
              </View>
              <View style={[styles.tierPill, { borderColor: 'rgba(255,255,255,0.4)' }]}>
                <Text style={[styles.tierLabel, { color: '#fff' }]}>{partner.tier.toUpperCase()} PARTNER</Text>
              </View>
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Content sheet */}
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Action row: Follow, Directions, Share */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                following ? { backgroundColor: tierColor + '22', borderColor: tierColor } : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => { Haptics.selectionAsync(); toggleFollow(partner.id); }}
            >
              <Ionicons name={following ? 'heart' : 'heart-outline'} size={22} color={following ? tierColor : colors.textSecondary} />
              <Text style={[styles.actionLabel, { color: following ? tierColor : colors.text }]}>{following ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: tierColor, borderColor: tierColor }]}
              onPress={handleDirections}
            >
              <Ionicons name="navigate" size={22} color="#000" />
              <Text style={[styles.actionLabel, { color: '#000' }]}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={22} color={colors.text} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Info block: address, hours, description */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color={tierColor} />
              <Text style={[styles.infoText, { color: colors.text }]}>{address}</Text>
            </View>
            {partner.hours ? (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={18} color={tierColor} />
                <Text style={[styles.infoText, { color: colors.text }]}>{partner.hours}</Text>
              </View>
            ) : null}
            {partner.description ? (
              <Text style={[styles.description, { color: colors.textSecondary }]}>{partner.description}</Text>
            ) : null}
          </View>

          {/* Deals & Perks — premium holographic cards */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DEALS & PERKS</Text>
          {perks.length > 0 ? (
            perks.map((perk, i) => (
              <Animated.View key={perk.id} entering={FadeInDown.delay(i * 80).duration(400)} style={styles.perkCardWrap}>
                <PremiumPerkCard perk={perk} partnerName={partner.name} variant="row" />
              </Animated.View>
            ))
          ) : (
            <View style={[styles.emptyPerks, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="gift-outline" size={28} color={colors.textSecondary} />
              <Text style={[styles.emptyPerksText, { color: colors.textSecondary }]}>No active perks at the moment. Check back soon.</Text>
            </View>
          )}

          {/* Reviews — Orb Score™ (Only on OrbTap) + Verified visit badges */}
          {reviews.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>REVIEWS</Text>
              <View style={[styles.reviewsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Orb Score™ — unique OrbTap metric */}
                <View style={[styles.orbScoreRow, { backgroundColor: tierColor + '18', borderColor: tierColor + '50' }]}>
                  <View style={styles.orbScoreLeft}>
                    <Text style={[styles.orbScoreLabel, { color: colors.textSecondary }]}>Orb Score™</Text>
                    <Text style={[styles.orbScoreTagline, { color: colors.textSecondary }]}>Only on OrbTap · Verified visits count more</Text>
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
                    <Ionicons name="star" size={20} color={COLORS.gold[0]} />
                    <Text style={[styles.ratingValue, { color: colors.text }]}>{avgRating}</Text>
                    <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>({reviews.length})</Text>
                  </View>
                )}
                {reviews.slice(0, 5).map((r) => (
                  <View key={r.id} style={[styles.reviewRow, { borderTopColor: colors.border }]}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewNameRow}>
                        <Text style={[styles.reviewName, { color: colors.text }]}>{r.userName}</Text>
                        {r.verified && (
                          <View style={[styles.verifiedVisitBadge, { backgroundColor: tierColor + '25', borderColor: tierColor }]}>
                            <Ionicons name="checkmark-circle" size={12} color={tierColor} />
                            <Text style={[styles.verifiedVisitText, { color: tierColor }]}>Verified visit</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={12} color={COLORS.gold[0]} />
                        ))}
                      </View>
                    </View>
                    <Text style={[styles.reviewText, { color: colors.textSecondary }]} numberOfLines={3}>{r.text}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { padding: 24, fontSize: 16 },
  scrollContent: { paddingBottom: 120 },
  heroWrap: { minHeight: 280 },
  heroGrad: { flex: 1, paddingBottom: 48, justifyContent: 'space-between' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  heroHeaderRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  tierBar: { height: 3, marginHorizontal: 16, marginBottom: 8, borderRadius: 2 },
  heroBody: { paddingHorizontal: 24, alignItems: 'center' },
  badgeWrap: { marginBottom: 12 },
  heroName: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  heroCategory: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600' },
  verifiedWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  tierPill: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tierLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  sheet: { marginTop: -32, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingTop: 24 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 13, fontWeight: '700' },

  infoCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoText: { fontSize: 15, fontWeight: '500', flex: 1 },
  description: { fontSize: 14, lineHeight: 22, marginTop: 4 },

  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 14 },
  perkCardWrap: { marginBottom: 14 },
  emptyPerks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  emptyPerksText: { fontSize: 14, flex: 1 },

  reviewsCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
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
});
