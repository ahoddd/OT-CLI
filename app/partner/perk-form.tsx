/**
 * Partner-branded perk form. Create/edit perks for your venue.
 * Uses partnerCreatePerk / partnerUpdatePerk (owner-only).
 */

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
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { partnerCreatePerk, partnerUpdatePerk } from '../../services/partnersPartnerPerks';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { safeHaptics } from '../../utils/safeHaptics';

const PARTNER_TIERS: PartnerTier[] = ['silver', 'gold', 'platinum'];

export default function PartnerPerkFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { colors } = useTheme();
  const { getPartner, getPerksForPartner, refresh } = usePartners();
  const { myPartnerId } = useMyPartner();
  const partnerId = myPartnerId ?? 'p1';
  const partner = getPartner(partnerId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [tier, setTier] = useState<PartnerTier>('silver');
  const [cooldown, setCooldown] = useState('24h');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const existing = isEdit && id ? getPerksForPartner(partnerId).find((p) => p.id === id) : undefined;

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setCost(String(existing.cost));
      setTier(existing.tier);
      setCooldown(existing.cooldown);
      setImageUrl(existing.imageUrl ?? '');
    } else if (partner) {
      setTier(partner.tier as PartnerTier);
    }
  }, [existing, partner?.tier]);

  const handleSave = async () => {
    if (!partnerId?.trim()) {
      showErrorAlert('Error', 'Partner not found.');
      return;
    }
    if (!title.trim()) {
      showErrorAlert('Title required', 'Enter a perk title.');
      return;
    }
    const costNum = Math.max(0, parseInt(cost, 10) || 0);
    setSaving(true);
    try {
      if (isEdit && id) {
        const result = await partnerUpdatePerk({
          perkId: id,
          partnerId,
          title: title.trim(),
          description: description.trim(),
          cost: costNum,
          tier,
          cooldown: cooldown.trim() || '24h',
          imageUrl: imageUrl.trim() || undefined,
        });
        if (result.success) {
          await refresh();
          safeHaptics.notificationAsync(1);
          alertDialog('Updated', 'Your perk has been updated.', [
            { text: 'Back', onPress: () => router.back() },
          ]);
        } else {
          showErrorAlert('Save failed', result.message ?? 'Please try again.');
        }
      } else {
        const result = await partnerCreatePerk({
          partnerId,
          title: title.trim(),
          description: description.trim(),
          cost: costNum,
          tier,
          cooldown: cooldown.trim() || '24h',
          imageUrl: imageUrl.trim() || undefined,
        });
        if (result.success) {
          await refresh();
          safeHaptics.notificationAsync(1);
          alertDialog('Created', 'Your perk is live.', [
            { text: 'Add another', onPress: () => { setTitle(''); setDescription(''); setCost(''); } },
            { text: 'Back', onPress: () => router.back() },
          ]);
        } else {
          showErrorAlert('Save failed', result.message ?? 'Please try again.');
        }
      }
    } catch (e) {
      showErrorAlert('Save failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tierColor = partner ? PARTNER_TIER_COLORS[partner.tier as PartnerTier] : '#64748b';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: tierColor + '50' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEdit ? 'Edit perk' : 'Create perk'}</Text>
        {partner ? <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{partner.name}</Text> : null}
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Free Taco"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="One free taco with any drink"
            placeholderTextColor={colors.textSecondary}
            multiline
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Cost (OT points)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={cost}
            onChangeText={setCost}
            placeholder="150"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tier</Text>
          <View style={styles.pillRow}>
            {PARTNER_TIERS.map((t) => (
              <TouchableOpacity key={t} onPress={() => { safeHaptics.selectionAsync(); setTier(t); }} style={[styles.pill, { backgroundColor: tier === t ? PARTNER_TIER_COLORS[t] : colors.surfaceHighlight }]}>
                <Text style={[styles.pillText, { color: tier === t ? '#fff' : colors.text }]}>{PARTNER_TIER_LABELS[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.tierHint, { color: colors.textSecondary }]}>
            {tier === 'silver' ? 'Visible to all users' :
             tier === 'gold' ? 'Visible to Premium+ users only' :
             'Visible to Pro users only'}
          </Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Cooldown</Text>
          <View style={styles.cooldownPicker}>
            {(['once', '24h', '7d', '30d'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.cooldownChip, { backgroundColor: cooldown === opt ? tierColor : colors.surfaceHighlight }]}
                onPress={() => { safeHaptics.selectionAsync(); setCooldown(opt); }}
                activeOpacity={0.85}
              >
                <Text style={[styles.cooldownChipText, { color: cooldown === opt ? '#fff' : colors.text }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Image URL (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
          <View style={[styles.previewCard, { backgroundColor: colors.surfaceHighlight, borderColor: tierColor }]}>
            <View style={[styles.previewTierBadge, { backgroundColor: tierColor }]}>
              <Text style={styles.previewTierText}>{PARTNER_TIER_LABELS[tier]}</Text>
            </View>
            <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={2}>{title || 'Perk title'}</Text>
            <Text style={[styles.previewDesc, { color: colors.textSecondary }]} numberOfLines={2}>{description || 'Description appears here.'}</Text>
            <Text style={[styles.previewCost, { color: tierColor }]}>{cost.trim() ? `${cost} OT` : '0 OT'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: tierColor }]}
            onPress={() => { safeHaptics.selectionAsync(); handleSave(); }}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Create'} perk</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  pillText: { fontSize: 14, fontWeight: '600' },
  tierHint: { fontSize: 12, marginTop: -8, marginBottom: 16 },
  cooldownPicker: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  cooldownChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  cooldownChipText: { fontSize: 14, fontWeight: '600' },
  previewCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  previewTierBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  previewTierText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  previewTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  previewDesc: { fontSize: 13, marginBottom: 8 },
  previewCost: { fontSize: 14, fontWeight: '800' },
  saveBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
