/**
 * Partner OrbSwipe Cockpit — manage how your business appears in OrbSwipe (swipe deck).
 * View today’s metrics, use Swipe Studio (Pro), and create cards from templates.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { useAdminLayout } from '../../context/AdminLayoutContext';
import { isProPartnerTier } from '../../constants/PartnerTiers';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { getOrbSwipePartnerSummary } from '../../services/orbswipeAnalytics';
import { safeHaptics } from '../../utils/safeHaptics';
import { useI18n } from '../../context/I18nContext';

/** Template options for OrbSwipe cards — map to post type or intent for create screen. */
const ORBSWIPE_TEMPLATES: Array<{ id: string; label: string; description: string; icon: string; postType?: string }> = [
  { id: 'drop_promo', label: 'Drop Promo', description: 'Limited-time offer or flash deal', icon: 'flash', postType: 'DROP' },
  { id: 'event', label: 'Event', description: 'Live event, happy hour, or happening', icon: 'calendar', postType: 'EVENT' },
  { id: 'menu_highlight', label: 'Menu Highlight', description: 'Feature a dish or drink', icon: 'restaurant', postType: 'MENU_ITEM' },
  { id: 'product', label: 'Product', description: 'Product or retail offer', icon: 'pricetag', postType: 'PRODUCT' },
  { id: 'announcement', label: 'Announcement', description: 'News, hours, or general update', icon: 'megaphone', postType: 'ANNOUNCEMENT' },
  { id: 'service_slot', label: 'Service / Slot', description: 'Bookable slot or service', icon: 'time', postType: 'SERVICE_SLOT' },
];

export default function PartnerOrbSwipeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { isPartner, testPartnerTier } = useEffectiveTier();
  const layout = useAdminLayout();
  const { partners } = usePartners();
  const { myPartner } = useMyPartner();
  const partner = myPartner ?? partners[0] ?? null;
  const [summary, setSummary] = useState<{ impressions: number; opens: number; ctaClicks: number; verifiedConversions: number } | null>(null);

  useEffect(() => {
    const pid = partner?.id;
    if (!pid) return;
    getOrbSwipePartnerSummary(pid).then(setSummary);
  }, [partner?.id]);

  const effectiveTier: PartnerTier = (testPartnerTier ?? (partner?.tier as PartnerTier) ?? 'silver');
  const isPro = flags.isOrbSwipePartnerSwipeStudioEnabled && isProPartnerTier(effectiveTier);

  if (!isPartner) return <Redirect href="/(tabs)" />;

  const pageTitle = layout.getDisplayName('screen_orbswipe_title', 'OrbSwipe') + ' Cockpit';
  const tierColor = PARTNER_TIER_COLORS[effectiveTier];

  const goCreatePost = (template?: string, scheduleHint?: boolean) => {
    safeHaptics.selectionAsync();
    const params: Record<string, string> = {};
    if (template) params.template = template;
    if (scheduleHint) params.schedule = '1';
    router.push({ pathname: '/partner/posts/create', params } as any);
  };

  return (
    <ScreenWrapper
      title={pageTitle}
      headerLeft={
        <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.back(); }} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.introCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.introTitle, { color: colors.text }]}>What this page is for</Text>
          <Text style={[styles.introBody, { color: colors.textSecondary }]}>
            Your OrbSwipe Cockpit shows how your cards perform in the swipe deck (impressions, opens, CTAs, verified conversions). Create new cards from templates below so customers see your offers when they swipe. Pro partners get Swipe Studio suggestions.
          </Text>
        </View>

        <View style={[styles.todayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.todayTitle, { color: colors.text }]}>Today’s metrics</Text>
          <Text style={[styles.todaySub, { color: colors.textSecondary }]}>Impressions · Opens · CTA clicks · Verified conversions</Text>
          {summary ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.impressions}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Impressions</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.opens}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Opens</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.ctaClicks}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>CTAs</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{summary.verifiedConversions}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Verified</Text>
            </View>
          ) : (
            <View style={styles.todayPlaceholder}>
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>OrbSwipe analytics for your cards (impressions, opens, CTAs, verified wins). Data appears once your cards are live.</Text>
            </View>
          )}
        </View>

        {isPro && (
          <View style={[styles.studioCard, { backgroundColor: colors.surface, borderColor: tierColor + '50' }]}>
            <Text style={[styles.studioTitle, { color: colors.text }]}>Swipe Studio (Pro)</Text>
            <Text style={[styles.studioSub, { color: colors.textSecondary }]}>Data-backed suggestions (last 14 days) to improve performance.</Text>
            <View style={styles.suggestions}>
              <View style={[styles.suggestionRow, { borderTopColor: colors.border }]}>
                <Ionicons name="time-outline" size={18} color={tierColor} />
                <Text style={[styles.suggestionLabel, { color: colors.text }]}>Best time to post</Text>
                <Text style={[styles.suggestionValue, { color: colors.textSecondary }]}>6–8 PM</Text>
              </View>
              <View style={[styles.suggestionRow, { borderTopColor: colors.border }]}>
                <Ionicons name="layers-outline" size={18} color={tierColor} />
                <Text style={[styles.suggestionLabel, { color: colors.text }]}>Best performing template</Text>
                <Text style={[styles.suggestionValue, { color: colors.textSecondary }]}>Drop Promo</Text>
              </View>
              <View style={[styles.suggestionRow, { borderTopColor: colors.border }]}>
                <Ionicons name="text-outline" size={18} color={tierColor} />
                <Text style={[styles.suggestionLabel, { color: colors.text }]}>Recommended headline length</Text>
                <Text style={[styles.suggestionValue, { color: colors.textSecondary }]}>Short wins</Text>
              </View>
              <View style={[styles.suggestionRow, { borderTopColor: colors.border }]}>
                <Ionicons name="timer-outline" size={18} color={tierColor} />
                <Text style={[styles.suggestionLabel, { color: colors.text }]}>Drop Promo window</Text>
                <Text style={[styles.suggestionValue, { color: colors.textSecondary }]}>2–3 hours</Text>
              </View>
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: tierColor + '22', borderColor: tierColor }]}
                onPress={() => goCreatePost('drop_promo')}
                activeOpacity={0.85}
              >
                <Text style={[styles.quickActionText, { color: tierColor }]}>Create card using best template (Drop Promo)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, { borderColor: colors.border }]}
                onPress={() => goCreatePost(undefined, true)}
                activeOpacity={0.85}
              >
                <Text style={[styles.quickActionText, { color: colors.text }]}>Create post (tip: post 6–8 PM for best reach)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.templatesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.templatesTitle, { color: colors.text }]}>Card templates</Text>
          <Text style={[styles.templatesSub, { color: colors.textSecondary }]}>Start from a template. Your post can appear in OrbSwipe and the Feed.</Text>
          {ORBSWIPE_TEMPLATES.map((tpl) => (
            <TouchableOpacity
              key={tpl.id}
              style={[styles.templateRow, { borderTopColor: colors.border }]}
              onPress={() => goCreatePost(tpl.postType ?? tpl.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.templateIconWrap, { backgroundColor: tierColor + '22' }]}>
                <Ionicons name={tpl.icon as any} size={20} color={tierColor} />
              </View>
              <View style={styles.templateTextWrap}>
                <Text style={[styles.templateLabel, { color: colors.text }]}>{tpl.label}</Text>
                <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>{tpl.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.createAnyBtn, { backgroundColor: tierColor + '22', borderColor: tierColor }]}
          onPress={() => goCreatePost()}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={22} color={tierColor} />
          <Text style={[styles.createAnyText, { color: tierColor }]}>Create post (no template)</Text>
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16 },
  introCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  introTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  introBody: { fontSize: 13, lineHeight: 20 },
  todayCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  todayTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  todaySub: { fontSize: 12, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 16 },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 12, fontWeight: '600' },
  todayPlaceholder: { minHeight: 80, justifyContent: 'center' },
  placeholderText: { fontSize: 13 },
  studioCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  studioTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  studioSub: { fontSize: 12, marginBottom: 12 },
  suggestions: {},
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  suggestionLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  suggestionValue: { fontSize: 13 },
  quickActions: { marginTop: 14, gap: 8 },
  quickActionBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  quickActionText: { fontSize: 14, fontWeight: '700' },
  templatesCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  templatesTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  templatesSub: { fontSize: 12, marginBottom: 12 },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  templateIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  templateTextWrap: { flex: 1, minWidth: 0 },
  templateLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  templateDesc: { fontSize: 12 },
  createAnyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  createAnyText: { fontSize: 15, fontWeight: '700' },
  bottomPad: { height: 40 },
});
