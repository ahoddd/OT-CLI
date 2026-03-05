/**
 * Partner — Manage perks for your venue. List, create, edit. Partner-branded form, inline status toggle, per-perk analytics.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { usePartners } from '../../../context/PartnersContext';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../../../constants/PartnerTiers';
import { getPartnerTierShadow } from '../../../constants/PartnerTiers';
import { useEffectiveTier } from '../../../hooks/useEffectiveTier';
import type { PartnerTier } from '../../../constants/PartnerTiers';
import { deletePerk } from '../../../services/adminDelete';
import { partnerUpdatePerk } from '../../../services/partnersPartnerPerks';
import { getPartnerMetrics } from '../../../services/partnerAttribution';
import { alert as alertDialog, showErrorAlert } from '../../../utils/alert';
import { PerkQRModal } from '../../../components/PerkQRModal';
import type { Perk } from '../../../constants/MockData';
import { safeHaptics } from '../../../utils/safeHaptics';
import { useI18n } from '../../../context/I18nContext';

export default function PartnerPerksManageScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { partners, getPartner, getPerksForPartner, refresh } = usePartners();
  const { testPartnerTier } = useEffectiveTier();
  const { myPartnerId } = useMyPartner();
  const partnerId = myPartnerId ?? partners[0]?.id ?? 'p1';
  const partner = getPartner(partnerId);
  const perks = getPerksForPartner(partnerId);
  const effectiveTier: PartnerTier = (testPartnerTier ?? (partner?.tier as PartnerTier) ?? 'silver');
  const tierColor = PARTNER_TIER_COLORS[effectiveTier];
  const [qrPerk, setQrPerk] = useState<Perk | null>(null);

  const MAX_PERKS: Record<PartnerTier, number> = { silver: 3, gold: 10, platinum: Infinity };
  const perkLimit = MAX_PERKS[effectiveTier];
  const canCreate = perks.length < perkLimit;
  const usageLabel = perkLimit === Infinity ? `${perks.length} perks` : `${perks.length} / ${perkLimit} perks (${effectiveTier})`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: tierColor + '50' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Manage perks</Text>
          <Text style={[styles.headerSubtitle, { color: !canCreate ? colors.error : colors.textSecondary }]}>{usageLabel}</Text>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => {
            safeHaptics.selectionAsync();
            if (!canCreate) {
              const nextTier = effectiveTier === 'silver' ? 'Gold (10 perks)' : 'Platinum (unlimited)';
              Alert.alert(
                'Perk limit reached',
                `${effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1)} partners can create up to ${perkLimit} perks. Upgrade to ${nextTier} to add more.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => router.push('/compare-accounts' as any) },
                ]
              );
              return;
            }
            router.push(`/admin/perk-form?partnerId=${encodeURIComponent(partnerId)}` as any);
          }}
          style={[styles.addBtn, { backgroundColor: canCreate ? tierColor : colors.textSecondary + '80' }, getPartnerTierShadow(effectiveTier)]}
        >
          <Ionicons name={canCreate ? 'add-circle-outline' : 'lock-closed-outline'} size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>{canCreate ? 'Create perk' : 'Limit reached — Upgrade'}</Text>
        </TouchableOpacity>
        {perks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="pricetag-outline" size={40} color={tierColor} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No perks yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Create offers customers can redeem with OT Points.</Text>
          </View>
        ) : (
          perks.map((perk) => {
            const metrics = getPartnerMetrics(partnerId);
            const active = perk.active !== false;
            const toggleActive = async () => {
              safeHaptics.selectionAsync();
              const res = await partnerUpdatePerk({ perkId: perk.id, partnerId, active: !active });
              if (res.success) await refresh();
              else showErrorAlert('Update failed', res.message ?? 'Could not update status.');
            };
            return (
            <View key={perk.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: tierColor + '40' }, getPartnerTierShadow(effectiveTier)]}>
              <View style={styles.rowLeft}>
                <View style={[styles.tierDot, { backgroundColor: PARTNER_TIER_COLORS[perk.tier] }]} />
                <View>
                  <Text style={[styles.perkTitle, { color: colors.text }, !active && { opacity: 0.6 }]}>{perk.title}{!active ? ' (paused)' : ''}</Text>
                  <Text style={[styles.perkMeta, { color: colors.textSecondary }]}>{perk.cost} OT · {perk.cooldown} · {PARTNER_TIER_LABELS[perk.tier]}</Text>
                  <Text style={[styles.perkAnalytics, { color: colors.textSecondary }]}>{metrics.redemptions > 0 ? `Partner: ${metrics.redemptions} redemptions` : '—'} (session)</Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <View style={styles.toggleRow}>
                  <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>{active ? 'Live' : 'Paused'}</Text>
                  <Switch value={active} onValueChange={toggleActive} trackColor={{ false: colors.border, true: tierColor + '80' }} thumbColor={active ? tierColor : colors.textSecondary} />
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); setQrPerk(perk); }} style={[styles.iconBtn, { backgroundColor: tierColor + '22' }]}>
                    <Ionicons name="qr-code-outline" size={18} color={tierColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { safeHaptics.selectionAsync(); router.push(`/partner/perk-form?id=${encodeURIComponent(perk.id)}` as any); }}
                    style={[styles.iconBtn, { backgroundColor: tierColor + '22' }]}
                  >
                    <Ionicons name="pencil" size={18} color={tierColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                  onPress={() => {
                    safeHaptics.selectionAsync();
                    alertDialog('Delete perk', `Remove "${perk.title}"? This cannot be undone.`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: async () => {
                        const res = await deletePerk(perk.id);
                        if (res.success) { refresh(); alertDialog('Deleted', 'Perk removed.', [{ text: 'OK' }]); }
                        else { showErrorAlert('Request didn’t complete', res.message ?? 'Delete failed. Please try again.'); }
                      } },
                    ]);
                  }}
                  style={[styles.iconBtn, { backgroundColor: colors.error + '22' }]}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
          })
        )}
      </ScrollView>
      {qrPerk && (
        <PerkQRModal visible={!!qrPerk} onClose={() => setQrPerk(null)} perk={qrPerk} partnerName={partner?.name} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2 },
  backBtn: { marginRight: 12, padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, marginBottom: 16 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyCard: { alignItems: 'center', padding: 32, borderRadius: 16, borderWidth: 1 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 14, marginTop: 6, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  rowRight: { alignItems: 'flex-end', gap: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 11, fontWeight: '600' },
  perkAnalytics: { fontSize: 11, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 10 },
  tierDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  perkTitle: { fontSize: 16, fontWeight: '700' },
  perkMeta: { fontSize: 12, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
