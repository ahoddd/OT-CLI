import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { KitCard } from '../../components/ui/KitCard';
import { KitButton } from '../../components/ui/KitButton';
import { usePartners } from '../../context/PartnersContext';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../../constants/PartnerTiers';
import { deletePerk } from '../../services/adminDelete';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { PerkQRModal } from '../../components/PerkQRModal';
import type { Perk } from '../../constants/MockData';
import { useI18n } from '../../context/I18nContext';

export default function AdminPerksScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const { colors } = useTheme();
  const { getPartner, getPerksForPartner, refresh } = usePartners();

  const partner = partnerId ? getPartner(partnerId) : null;
  const perks = partnerId ? getPerksForPartner(partnerId) : [];
  const [qrPerk, setQrPerk] = useState<Perk | null>(null);

  if (!partnerId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.empty, { color: colors.textSecondary }]}>No partner selected.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Perks</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{partner?.name ?? partnerId}</Text>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <KitButton
          title="Add perk"
          onPress={() => router.push(`/admin/perk-form?partnerId=${encodeURIComponent(partnerId)}`)}
          style={{ marginBottom: SPACE.base }}
        />
        {perks.length === 0 ? (
          <KitCard variant="solid">
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No perks yet. Tap &quot;Add perk&quot; to create one.</Text>
          </KitCard>
        ) : (
          perks.map((perk) => (
            <KitCard key={perk.id} variant="solid" style={{ marginBottom: SPACE.sm }}>
            <View style={[styles.row, { borderColor: colors.border }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.tierDot, { backgroundColor: PARTNER_TIER_COLORS[perk.tier] }]} />
                <View>
                  <Text style={[styles.perkTitle, { color: colors.text }]}>{perk.title}</Text>
                  <Text style={[styles.perkMeta, { color: colors.textSecondary }]}>{perk.cost} OT · {perk.cooldown} · {PARTNER_TIER_LABELS[perk.tier]}</Text>
                </View>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity
                  onPress={() => setQrPerk(perk)}
                  style={[styles.editBtn, { backgroundColor: colors.surfaceHighlight }]}
                >
                  <Ionicons name="qr-code-outline" size={18} color={PARTNER_TIER_COLORS[perk.tier]} style={{ marginRight: 4 }} />
                  <Text style={[styles.editBtnText, { color: PARTNER_TIER_COLORS[perk.tier] }]}>QR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/admin/perk-form?partnerId=${encodeURIComponent(partnerId!)}&id=${encodeURIComponent(perk.id)}`)}
                  style={[styles.editBtn, { backgroundColor: colors.surfaceHighlight }]}
                >
                  <Text style={[styles.editBtnText, { color: PARTNER_TIER_COLORS[perk.tier] }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    alertDialog('Delete perk', `Remove "${perk.title}"? This cannot be undone.`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: async () => {
                        const res = await deletePerk(perk.id);
                        if (res.success) {
                          refresh();
                          alertDialog('Deleted', 'Perk removed.', [{ text: 'OK' }]);
                        } else {
                          showErrorAlert('Request didn’t complete', res.message ?? 'Delete failed. Please try again.');
                        }
                      } },
                    ]);
                  }}
                  style={[styles.editBtn, styles.deleteBtn]}
                >
                  <Text style={[styles.editBtnText, styles.deleteBtnText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            </KitCard>
          ))
        )}
      </ScrollView>
      {qrPerk && (
        <PerkQRModal
          visible={!!qrPerk}
          onClose={() => setQrPerk(null)}
          perk={qrPerk}
          partnerName={partner?.name}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.base, paddingVertical: SPACE.md, borderBottomWidth: 1 },
  backBtn: { marginRight: SPACE.md, padding: SPACE.xs },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  backRow: { flexDirection: 'row', alignItems: 'center', padding: SPACE.base },
  backText: { fontSize: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACE.base, paddingBottom: SPACE.xxxl },
  empty: { textAlign: 'center', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACE.md, borderRadius: RADIUS.sm, borderWidth: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowActions: { flexDirection: 'row', gap: 8 },
  tierDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  perkTitle: { fontSize: 16, fontWeight: '600' },
  perkMeta: { fontSize: 12, marginTop: 2 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  editBtnText: { fontSize: 14, fontWeight: '600' },
  deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  deleteBtnText: { color: '#ef4444' },
});
