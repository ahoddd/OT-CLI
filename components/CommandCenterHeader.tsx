import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { OrbTapLogoMark } from './OrbTapLogoMark';
import { OTPointsBadge } from './OTPointsBadge';
import { PremiumBadge } from './PremiumBadge';
import { PartnerProBadge } from './PartnerProBadge';
import type { SearchScope } from '../context/SearchOpenContext';

export interface CommandCenterHeaderProps {
  colors: { text: string; textSecondary: string; surface: string; border: string; background: string; primary?: string; gold?: string; surfaceHighlight?: string };
  balance: number;
  displayName: string;
  profileUsername: string | null | undefined;
  sloganText: string;
  hintText: string;
  searchOpen: { openSearch: (scope?: SearchScope) => void } | null;
  onNav: (route: string) => void;
  onOpenDir: () => void;
  /** Optional: show level pill for engagement (e.g. "Lv. 2 Mapper") */
  level?: number;
  levelTitle?: string;
  /** Optional: show tier badge next to display name (Premium or Pro) */
  tier?: 'free' | 'premium' | 'pro';
  /** When true with tier pro, show Partner Pro badge */
  isPartner?: boolean;
}

const headerStyles = StyleSheet.create({
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  row1: { flexDirection: 'row', alignItems: 'center' },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  logoWrap: { marginRight: 10 },
  center: { flex: 1, minWidth: 0, marginRight: 6, justifyContent: 'center' },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'nowrap', minWidth: 0 },
  name: { fontSize: 14, fontWeight: '900', letterSpacing: -0.2, flexShrink: 1, minWidth: 0, maxWidth: '100%' },
  handle: { fontSize: 11, fontWeight: '600', flexShrink: 1, opacity: 0.9, minWidth: 0, maxWidth: '100%' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slogan: { flex: 1, minWidth: 0, fontSize: 11, fontWeight: '600', marginRight: 8 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  levelPillText: { fontSize: 10, fontWeight: '800' },
  levelPillTitle: { fontSize: 11, fontWeight: '700', maxWidth: 72 },
  tierBadge: { marginLeft: 4, justifyContent: 'center' },
});

export function CommandCenterHeader({
  colors,
  balance,
  displayName,
  profileUsername,
  sloganText,
  hintText,
  searchOpen,
  onNav,
  onOpenDir,
  level,
  levelTitle,
  tier,
  isPartner,
}: CommandCenterHeaderProps) {
  const pointsBadgeProps = { amount: balance, size: 22, label: 'pts' as const, textColor: colors.text };
  const showProBadge = (tier === 'pro' || isPartner) ?? false;
  const showPremiumBadge = tier === 'premium' && !showProBadge;
  return (
    <View style={[headerStyles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <LinearGradient
        colors={[(colors.gold ?? COLORS.neonBlue[0]) + '06', 'transparent', 'transparent']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={headerStyles.row1}>
        <View style={headerStyles.logoWrap}>
          <OrbTapLogoMark variant="hero" width={44} height={38} />
        </View>
        <View style={headerStyles.center} pointerEvents="box-none">
          <Text style={[headerStyles.label, { color: colors.textSecondary }]} numberOfLines={1}>WELCOME BACK</Text>
          <View style={headerStyles.nameRow}>
            <Text style={[headerStyles.name, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{displayName}</Text>
            {profileUsername ? <Text style={[headerStyles.handle, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail"> @{profileUsername}</Text> : null}
            {showProBadge ? <View style={headerStyles.tierBadge}><PartnerProBadge size="small" showIcon={true} /></View> : null}
            {showPremiumBadge ? <View style={headerStyles.tierBadge}><PremiumBadge variant="compact" size={18} /></View> : null}
          </View>
        </View>
        <View style={headerStyles.right}>
          <TouchableOpacity style={headerStyles.iconBtn} onPress={() => searchOpen?.openSearch('all')} hitSlop={8}>
            <Ionicons name="search" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={headerStyles.iconBtn} onPress={() => onNav('/notifications')} hitSlop={8}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[headerStyles.menuBtn, { backgroundColor: colors.background }]} onPress={onOpenDir}>
            <Ionicons name="menu" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[headerStyles.row2, { borderTopColor: colors.border }]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Text style={[headerStyles.slogan, { color: colors.textSecondary }]} numberOfLines={1}>{sloganText}</Text>
          {level != null && levelTitle ? (
            <TouchableOpacity style={[headerStyles.levelPill, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]} onPress={() => onNav('/(tabs)/profile')} activeOpacity={0.8} accessibilityLabel={`Level ${level} ${levelTitle}. Tap to view profile.`} accessibilityRole="button">
              <Text style={[headerStyles.levelPillText, { color: colors.textSecondary }]}>Lv. {level}</Text>
              <Text style={[headerStyles.levelPillTitle, { color: colors.text }]} numberOfLines={1}>{levelTitle}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={headerStyles.pointsRow} onPress={() => onNav('/(tabs)/wallet')} activeOpacity={0.8} accessibilityLabel="Your OT Points. Tap to open Wallet." accessibilityRole="button">
          <OTPointsBadge {...pointsBadgeProps} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
