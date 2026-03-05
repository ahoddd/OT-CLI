import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { KitCard } from '../../components/ui/KitCard';
import { KitSectionHeader } from '../../components/ui/KitSectionHeader';
import { KitButton } from '../../components/ui/KitButton';
import { usePartners } from '../../context/PartnersContext';
import { createPerk, updatePerk, type PerkPayload } from '../../services/partnersAdmin';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

const PARTNER_TIERS: PartnerTier[] = ['silver', 'gold', 'platinum'];

export default function PerkFormScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { partnerId, id } = useLocalSearchParams<{ partnerId: string; id?: string }>();
  const isEdit = Boolean(id);
  const { colors } = useTheme();
  const { getPartner, getPerksForPartner, refresh } = usePartners();

  const [perkId, setPerkId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [tier, setTier] = useState<PartnerTier>('silver');
  const [cooldown, setCooldown] = useState('24h');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const existing = isEdit && id ? getPerksForPartner(partnerId ?? '').find((p) => p.id === id) : undefined;
  const partner = partnerId ? getPartner(partnerId) : null;

  useEffect(() => {
    if (existing) {
      setPerkId(existing.id);
      setTitle(existing.title);
      setDescription(existing.description);
      setCost(String(existing.cost));
      setTier(existing.tier);
      setCooldown(existing.cooldown);
      setImageUrl(existing.imageUrl ?? '');
    } else if (partnerId && partner) {
      setPerkId('');
      setTier(partner.tier);
    }
  }, [existing, partnerId, partner?.tier]);

  const handleSave = async () => {
    const pid = (isEdit ? id : perkId.trim()) || perkId.trim();
    if (!pid.trim()) {
      showErrorAlert('Perk ID required', 'Enter a perk ID (e.g. pk33). Use lowercase letters and numbers.');
      return;
    }
    if (!partnerId?.trim()) {
      showErrorAlert('Partner required', 'Select a partner for this perk.');
      return;
    }
    if (!title.trim()) {
      showErrorAlert('Title required', 'Enter a perk title.');
      return;
    }
    const costNum = Math.max(0, parseInt(cost, 10) || 0);
    setSaving(true);
    try {
      const payload: PerkPayload = {
        id: pid,
        partnerId: partnerId.trim(),
        title: title.trim(),
        description: description.trim(),
        cost: costNum,
        tier,
        cooldown: cooldown.trim() || '24h',
        imageUrl: imageUrl.trim() || undefined,
      };
      const result = isEdit ? await updatePerk(payload) : await createPerk(payload);
      if (result.success) {
        await refresh();
        alertDialog(isEdit ? 'Perk updated' : 'Perk added', undefined, [
          { text: 'Add another', onPress: () => { if (isEdit) router.replace(`/admin/perk-form?partnerId=${encodeURIComponent(partnerId)}`); else { setPerkId(''); setTitle(''); setDescription(''); setCost(''); } } },
          { text: 'Back', onPress: () => router.back() },
        ]);
      } else {
        showErrorAlert('Save didn’t complete', result.message ?? 'We couldn’t save the perk. Please try again.');
      }
    } catch (e: unknown) {
      showErrorAlert('Save didn’t complete', e instanceof Error ? e.message : 'We couldn’t save the perk. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!partnerId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.empty, { color: colors.textSecondary }]}>Partner ID required.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isEdit ? 'Edit perk' : 'Add perk'}</Text>
          {partner ? <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{partner.name}</Text> : null}
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Perk ID (e.g. pk33)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={perkId} onChangeText={setPerkId} placeholder="pk33" placeholderTextColor={colors.textSecondary} editable={!isEdit} autoCapitalize="none" />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={title} onChangeText={setTitle} placeholder="e.g. Free Taco" placeholderTextColor={colors.textSecondary} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={description} onChangeText={setDescription} placeholder="One free taco with any drink" placeholderTextColor={colors.textSecondary} multiline />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Cost (OT points)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={cost} onChangeText={(t) => setCost(t.replace(/\D/g, '').slice(0, 6))} placeholder="150" placeholderTextColor={colors.textSecondary} keyboardType="number-pad" maxLength={6} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tier</Text>
          <View style={styles.pillRow}>
            {PARTNER_TIERS.map((t) => (
              <TouchableOpacity key={t} onPress={() => setTier(t)} style={[styles.pill, { backgroundColor: tier === t ? PARTNER_TIER_COLORS[t] : colors.surfaceHighlight }]}>
                <Text style={[styles.pillText, { color: tier === t ? '#fff' : colors.text }]}>{PARTNER_TIER_LABELS[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Cooldown</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={cooldown} onChangeText={setCooldown} placeholder="24h, 7d, once" placeholderTextColor={colors.textSecondary} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Image URL (optional)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor={colors.textSecondary} autoCapitalize="none" />
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 8 }]}>LIVE PREVIEW</Text>
          <View style={[styles.previewCard, { backgroundColor: colors.surfaceHighlight, borderColor: PARTNER_TIER_COLORS[tier] }]}>
            <View style={[styles.previewTierBadge, { backgroundColor: PARTNER_TIER_COLORS[tier] }]}>
              <Text style={styles.previewTierText}>{PARTNER_TIER_LABELS[tier]}</Text>
            </View>
            <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={2}>{title || 'Perk title'}</Text>
            <Text style={[styles.previewDesc, { color: colors.textSecondary }]} numberOfLines={2}>{description || 'Description appears here.'}</Text>
            <Text style={[styles.previewCost, { color: PARTNER_TIER_COLORS[tier] }]}>{cost.trim() ? `${cost} OT` : '0 OT'}</Text>
          </View>
          <KitButton
            title={isEdit ? 'Update perk' : 'Add perk'}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={{ marginTop: SPACE.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.base, paddingVertical: SPACE.md, borderBottomWidth: 1 },
  backBtn: { marginRight: SPACE.md, padding: SPACE.xs },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  backRow: { flexDirection: 'row', alignItems: 'center', padding: SPACE.base },
  backText: { fontSize: 16 },
  empty: { textAlign: 'center', margin: SPACE.base },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACE.base, paddingBottom: SPACE.xxxl },
  label: { fontSize: 12, fontWeight: '600', marginBottom: SPACE.xs, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.md, paddingVertical: SPACE.md, fontSize: 16, marginBottom: SPACE.md },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.md },
  pill: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, borderRadius: RADIUS.lg },
  pillText: { fontSize: 14, fontWeight: '600' },
  previewCard: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACE.md, marginBottom: SPACE.md },
  previewTierBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  previewTierText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  previewTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  previewDesc: { fontSize: 13, marginBottom: 8 },
  previewCost: { fontSize: 14, fontWeight: '800' },
});
