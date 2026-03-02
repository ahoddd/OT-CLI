/**
 * Partner tab: Settings — full app settings, notifications, partner applications (ads/featured), payouts, legal, upgrade paths.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BILLING_PORTAL_URL } from '../../constants/AppLinks';
import { useTheme } from '../../hooks/useTheme';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { COLORS } from '../../constants/Colors';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { safeHaptics } from '../../utils/safeHaptics';
import { useWindowDimensions } from 'react-native';
import { isPremiumPartnerTier, isProPartnerTier } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { KitAccordion } from '../../components/ui/KitAccordion';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { confirm as confirmAlert } from '../../utils/alert';

function NavCard({
  label,
  sub,
  icon,
  onPress,
  tierColor,
  colors,
  loading,
}: {
  label: string;
  sub: string;
  icon: string;
  onPress: () => void;
  tierColor: string;
  colors: { text: string; textSecondary: string; surface: string; border: string };
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={loading}
    >
      <View style={[styles.iconWrap, { backgroundColor: tierColor + '22' }]}>
        {loading ? (
          <ActivityIndicator size="small" color={tierColor} />
        ) : (
          <Ionicons name={icon as any} size={24} color={tierColor} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{sub}</Text>
      </View>
      {!loading && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
    </TouchableOpacity>
  );
}

export default function PartnerSettingsTab() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { partners } = usePartners();
  const { myPartner } = useMyPartner();
  const { testPartnerTier } = useEffectiveTier();
  const partner = myPartner ?? partners[0] ?? null;
  const effectiveTier: PartnerTier = (testPartnerTier ?? (partner?.tier as PartnerTier | undefined) ?? 'silver');
  const tierColor = PARTNER_TIER_COLORS[effectiveTier];
  const isPremium = isPremiumPartnerTier(effectiveTier);
  const isPro = isProPartnerTier(effectiveTier);

  const [loadingNav, setLoadingNav] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => setLoadingNav(null);
    }, [])
  );

  const nav = (path: string) => {
    safeHaptics.selectionAsync();
    setLoadingNav(path);
    router.push(path as any);
  };

  const openAppSettings = () => {
    safeHaptics.selectionAsync();
    setLoadingNav('/full-settings');
    router.push('/full-settings');
  };

  const [accordion, setAccordion] = useState<Record<string, boolean>>({
    account: true, growth: false, upgrade: false, billing: false, legal: false, payouts: false,
  });
  const toggleAccordion = (key: string) => setAccordion((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Account, notifications & legal</Text>
        </View>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingHorizontal: Math.max(16, width * 0.04) }]}
          showsVerticalScrollIndicator={false}
        >
          <KitAccordion title="Account & app" expanded={accordion.account} onToggle={() => toggleAccordion('account')} style={styles.accordionWrap}>
            {partner && (
              <NavCard
                label="Edit business profile"
                sub="Store hours, description, about, contact"
                icon="create-outline"
                onPress={() => nav('/partner/edit-page')}
                tierColor={tierColor}
                colors={colors}
                loading={loadingNav === '/partner/edit-page'}
              />
            )}
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={openAppSettings}
              activeOpacity={0.88}
              disabled={loadingNav === '/full-settings'}
            >
              <View style={[styles.iconWrap, { backgroundColor: tierColor + '22' }]}>
                {loadingNav === '/full-settings' ? (
                  <ActivityIndicator size="small" color={tierColor} />
                ) : (
                  <Ionicons name="settings-outline" size={24} color={tierColor} />
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardLabel, { color: colors.text }]}>App settings</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Profile, theme, notifications, public profile, security, support
                </Text>
              </View>
              {loadingNav !== '/full-settings' && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
            </TouchableOpacity>
            <NavCard
              label="Notification settings"
              sub="Push (on by default), polls, missions, drops, partner updates"
              icon="notifications-outline"
              onPress={() => nav('/notification-settings')}
              tierColor={tierColor}
              colors={colors}
              loading={loadingNav === '/notification-settings'}
            />
            <TouchableOpacity
              style={[styles.logoutCard, { backgroundColor: COLORS.danger + '12', borderColor: COLORS.danger + '44' }]}
              onPress={async () => {
                const ok = await confirmAlert('Log out', 'Are you sure you want to log out?');
                if (ok) {
                  await signOut(auth);
                }
              }}
              activeOpacity={0.88}
            >
              <View style={[styles.iconWrap, { backgroundColor: COLORS.danger + '22' }]}>
                <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardLabel, { color: COLORS.danger }]}>Log out</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Sign out of your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </KitAccordion>

          <KitAccordion title="Partner growth" subtitle="Featured & sponsored ads" expanded={accordion.growth} onToggle={() => toggleAccordion('growth')} style={styles.accordionWrap}>
            <NavCard
              label="Apply for Featured or Sponsored ads"
              sub="Featured carousel, Orb/Pulse/Feed ad spots · Submit application"
              icon="megaphone-outline"
              onPress={() => nav('/partner-apply')}
              tierColor={tierColor}
              colors={colors}
              loading={loadingNav === '/partner-apply'}
            />
            {/* Partner Referral — $10 credit */}
            <TouchableOpacity
              style={[styles.referralCta, { backgroundColor: themeGold + '12', borderColor: themeGold + '44' }]}
              onPress={() => nav('/partner/referral')}
              activeOpacity={0.88}
            >
              <View style={[styles.referralCtaIcon, { backgroundColor: themeGold + '25' }]}>
                <Ionicons name="gift" size={20} color={themeGold} />
              </View>
              <View style={styles.referralCtaBody}>
                <Text style={[styles.referralCtaTitle, { color: colors.text }]}>Refer a business — get $10 credit</Text>
                <Text style={[styles.referralCtaSub, { color: colors.textSecondary }]}>
                  Share your referral link. When they get approved, you both earn — 100 OT + <Text style={{ fontWeight: '800', color: themeGold }}>$10 off your next bill</Text>.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeGold} />
            </TouchableOpacity>
          </KitAccordion>

          {(!isPremium || !isPro) && (
            <KitAccordion title="Upgrade" subtitle="Premium & Pro" expanded={accordion.upgrade} onToggle={() => toggleAccordion('upgrade')} style={styles.accordionWrap}>
              <View style={[styles.upgradeCard, { backgroundColor: themeGold + '14', borderColor: themeGold + '50' }]}>
                <View style={styles.upgradeRow}>
                  <Ionicons name="diamond" size={22} color={themeGold} />
                  <View style={styles.upgradeBody}>
                    <Text style={[styles.upgradeTitle, { color: colors.text }]}>Premium Partner</Text>
                    <Text style={[styles.upgradeSub, { color: colors.textSecondary }]}>
                      30-day analytics · Export CSV · Conversion funnel · Premium badge
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.upgradeBtn, { backgroundColor: themeGold }]}
                    onPress={() => nav('/compare-accounts')}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.upgradeBtnText}>Compare</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {!isPro && (
                <View style={[styles.upgradeCard, { backgroundColor: PARTNER_TIER_COLORS.platinum + '18', borderColor: PARTNER_TIER_COLORS.platinum + '50' }]}>
                  <View style={styles.upgradeRow}>
                    <Ionicons name="star" size={22} color={PARTNER_TIER_COLORS.platinum} />
                    <View style={styles.upgradeBody}>
                      <Text style={[styles.upgradeTitle, { color: colors.text }]}>Pro (Platinum) Partner</Text>
                      <Text style={[styles.upgradeSub, { color: colors.textSecondary }]}>
                        Unlimited perks · Priority placement · Partner Pro badge
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.upgradeBtn, { backgroundColor: PARTNER_TIER_COLORS.platinum }]}
                      onPress={() => nav('/pro')}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.upgradeBtnText}>Pro</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </KitAccordion>
          )}

          <KitAccordion title="Billing & payments" expanded={accordion.billing} onToggle={() => toggleAccordion('billing')} style={styles.accordionWrap}>
            <NavCard
              label="Billing & subscription"
              sub="Pay OrbTap, manage Premium/Pro, update payment method"
              icon="card-outline"
              onPress={() => { safeHaptics.selectionAsync(); Linking.openURL(BILLING_PORTAL_URL); }}
              tierColor={tierColor}
              colors={colors}
            />
          </KitAccordion>

          <KitAccordion title="Legal & support" expanded={accordion.legal} onToggle={() => toggleAccordion('legal')} style={styles.accordionWrap}>
            <NavCard label="Terms of service" sub="OrbTap terms and use" icon="document-text-outline" onPress={() => nav('/legal/terms')} tierColor={tierColor} colors={colors} loading={loadingNav === '/legal/terms'} />
            <NavCard label="Privacy policy" sub="How we use your data" icon="shield-checkmark-outline" onPress={() => nav('/legal/privacy')} tierColor={tierColor} colors={colors} loading={loadingNav === '/legal/privacy'} />
            <NavCard label="Acceptable use" sub="Community guidelines" icon="hand-left-outline" onPress={() => nav('/legal/acceptable-use')} tierColor={tierColor} colors={colors} loading={loadingNav === '/legal/acceptable-use'} />
            <NavCard label="Help & support" sub="FAQ, contact" icon="help-circle-outline" onPress={() => nav('/support')} tierColor={tierColor} colors={colors} loading={loadingNav === '/support'} />
          </KitAccordion>

          <KitAccordion title="Payouts" subtitle="POS connection coming soon" expanded={accordion.payouts} onToggle={() => toggleAccordion('payouts')} style={styles.accordionWrap}>
            <View style={[styles.payoutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: tierColor + '18' }]}>
              <Ionicons name="card-outline" size={24} color={tierColor} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardLabel, { color: colors.text }]}>Payouts & OrbTap fee</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Connect Square, Clover, or enter transactions manually. OrbTap can automatically deduct its fee from your payouts.
              </Text>
              <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>
                Payouts integration launching Q3 2026. For manual payout setup, contact{' '}
                <Text style={{ color: tierColor }} onPress={() => Linking.openURL('mailto:partners@orbtap.com')}>
                  partners@orbtap.com
                </Text>
              </Text>
            </View>
          </View>
          </KitAccordion>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  content: { padding: 16, paddingTop: 20, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10, marginTop: 16 },
  accordionWrap: { marginBottom: 12 },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardBody: { flex: 1, minWidth: 0 },
  cardLabel: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 13 },
  upgradeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  upgradeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeBody: { flex: 1, minWidth: 0 },
  upgradeTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  upgradeSub: { fontSize: 12 },
  upgradeBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  upgradeBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  comingSoon: { fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  bottomPad: { height: 100 },
  referralCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 10, marginBottom: 2 },
  referralCtaIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  referralCtaBody: { flex: 1 },
  referralCtaTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  referralCtaSub: { fontSize: 12, fontWeight: '400', lineHeight: 17 },
});
