import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { OptimizedImage } from './OptimizedImage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { OrbTapLogoMark } from './OrbTapLogoMark';
import { Partner, ORBTAP_UNIVERSE_PARTNER_ID } from '../constants/MockData';
import { getPartnerHeroImage } from '../constants/PartnerCategoryPlaceholders';
import { PARTNER_TIER_COLORS, getPartnerTierBorderWidth, getPartnerTierShineOpacity, getPartnerTierShadowAll } from '../constants/PartnerTiers';
import { safeHaptics, Haptics } from '../utils/safeHaptics';

const CARD_HEIGHT = 120;

interface FeaturedPartnerCardProps {
  partner: Partner;
  /** Override hero image (e.g. admin-uploaded spot image). */
  customImageUrl?: string | null;
  /** Label override, e.g. "Wildcard" for free-tier spot. */
  badgeLabel?: string;
}

/**
 * Premium Featured Partner spot — holographic, image-ready, high-demand placement.
 * Partners upload an image; card uses unique OrbTap effects so the spot feels worth top dollar.
 */
export function FeaturedPartnerCard({ partner, customImageUrl, badgeLabel = 'ORBTAP FEATURED' }: FeaturedPartnerCardProps) {
  const router = useRouter();
  const { colors, isDark, textStyles } = useTheme();
  const [imageError, setImageError] = useState(false);
  const tierColor = PARTNER_TIER_COLORS[partner.tier];
  const heroImageUrl = customImageUrl ?? getPartnerHeroImage(partner);
  const showImage = !imageError;
  const holoPadding = getPartnerTierBorderWidth(partner.tier);
  const shineOpacity = getPartnerTierShineOpacity(partner.tier);
  const tierShadow = getPartnerTierShadowAll(partner.tier);

  const handlePress = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/partner/${partner.id}` as any);
  };

  return (
    <TouchableOpacity
      style={[styles.outer, tierShadow]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* Tier-colored border — silver/gold/platinum by partner tier */}
      <LinearGradient
        colors={[tierColor, tierColor + 'dd', tierColor] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.borderGradient, { padding: holoPadding }]}
      >
        <View style={[styles.cardInner, { backgroundColor: colors.surface }]}>
          {/* Background: partner image or holographic gradient */}
          {showImage ? (
            <>
              {partner.id === ORBTAP_UNIVERSE_PARTNER_ID ? (
                <View style={[StyleSheet.absoluteFill, styles.orbtapLogoBg]}>
                  <OrbTapLogoMark variant="hero" width={72} height={62} />
                </View>
              ) : (
                <OptimizedImage
                  source={{ uri: heroImageUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              )}
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            </>
          ) : (
            <LinearGradient
              colors={isDark ? ['#1e1b4b', '#312e81', '#1e3a5f', '#0f172a'] : ['#2e1065', '#4c1d95', '#1e3a5f', '#0f172a']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          {/* Tier-tinted shine overlay */}
          <LinearGradient
            colors={[tierColor + '18', tierColor + '08', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.shineOverlay, { opacity: shineOpacity }]}
          />

          {/* Top-edge glow line */}
          <LinearGradient
            colors={[tierColor + 'aa', tierColor + '33', 'transparent']}
            style={styles.topGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* OrbTap Featured badge — premium pill with glow */}
          <View style={styles.badgeWrap}>
            <LinearGradient
              colors={[tierColor + 'ee', tierColor + '99']}
              style={styles.badgeGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={12} color="#fff" />
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </LinearGradient>
          </View>

          {/* Content — glass bar at bottom */}
          <View style={styles.contentBar}>
            <View style={styles.textBlock}>
              <Text style={[textStyles.heading, styles.name]} numberOfLines={1}>{partner.name}</Text>
              <Text style={[styles.category, { color: 'rgba(255,255,255,0.75)' }]} numberOfLines={1}>{partner.category}</Text>
              <Text style={[styles.cta, { color: tierColor }]}>Tap to visit · Get perks</Text>
            </View>
            <View style={[styles.chevronCircle, { backgroundColor: tierColor + '30' }]}>
              <Ionicons name="chevron-forward" size={20} color={tierColor} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
  borderGradient: {
    borderRadius: 18,
  },
  cardInner: {
    borderRadius: 16,
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  orbtapLogoBg: {
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbtapLogoImage: { width: 72, height: 72 },
  shineOverlay: {
    opacity: 0.9,
    pointerEvents: 'none',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    pointerEvents: 'none',
  },
  badgeWrap: {
    position: 'absolute',
    top: 10,
    left: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  contentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingTop: 14,
  },
  textBlock: { flex: 1 },
  name: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  cta: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chevronCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
