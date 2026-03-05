/**
 * Partner: invite a sphere — select from nearby spheres (with range in mi/km) or enter code.
 * Full experience: range toggle, list of nearby spheres, offer details, OT cost.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { useSphereInvites } from '../../hooks/useSphereInvites';
import { COLORS } from '../../constants/Colors';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import {
  DEMO_NEARBY_SPHERES,
  distanceMi,
  distanceKm,
  RANGE_OPTIONS_MI,
  getRangeLabel,
  type DistanceUnit,
} from '../../constants/NearbySpheres';
import { safeHaptics } from '../../utils/safeHaptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import type { SphereInviteDuration } from '../../constants/SphereInvites';
import { isPremiumPartnerTier, isProPartnerTier } from '../../constants/PartnerTiers';
import { useI18n } from '../../context/I18nContext';

const INVITE_PRESETS_KEY = 'ORBTAP_INVITE_SPHERE_PRESETS';

type InvitePreset = {
  id: string;
  name: string;
  title: string;
  description: string;
  otCost: string;
  duration: SphereInviteDuration;
};

export default function PartnerInviteSphereScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { partners } = usePartners();
  const { addInvite } = useSphereInvites();
  const { testPartnerTier } = useEffectiveTier();
  const { myPartner } = useMyPartner();
  const partner = myPartner ?? partners[0] ?? null;
  const partnerId = partner?.id ?? 'p1';
  const partnerLat = partner?.location?.lat ?? 41.045;
  const partnerLng = partner?.location?.lng ?? -75.308;
  const effectivePartnerTier = testPartnerTier ?? (partner?.tier as 'silver' | 'gold' | 'platinum') ?? 'silver';
  const tierColor = PARTNER_TIER_COLORS[effectivePartnerTier];
  const canWeek = isPremiumPartnerTier(effectivePartnerTier);
  const canMonth = isProPartnerTier(effectivePartnerTier);

  const [rangeMi, setRangeMi] = useState(10);
  const [useKm, setUseKm] = useState(false);
  const [selectedSphere, setSelectedSphere] = useState<{ inviteCode: string; name: string } | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [duration, setDuration] = useState<SphereInviteDuration>('day');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [otCost, setOtCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [presets, setPresets] = useState<InvitePreset[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(INVITE_PRESETS_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const list = JSON.parse(raw) as InvitePreset[];
          if (Array.isArray(list)) setPresets(list);
        } catch (_) {}
      })
      .catch(() => {});
  }, []);

  const savePresets = (list: InvitePreset[]) => {
    setPresets(list);
    AsyncStorage.setItem(INVITE_PRESETS_KEY, JSON.stringify(list)).catch(() => {});
  };

  const saveCurrentAsPreset = () => {
    const name = `Preset ${new Date().toLocaleDateString()} ${presets.length + 1}`;
    const next: InvitePreset = {
      id: `pr_${Date.now()}`,
      name,
      title,
      description,
      otCost,
      duration,
    };
    const list = [...presets, next].slice(-20);
    savePresets(list);
    safeHaptics.notificationAsync(1);
    alertDialog('Saved', `"${name}" saved. Tap it below to load.`);
  };

  const loadPreset = (p: InvitePreset) => {
    setTitle(p.title);
    setDescription(p.description);
    setOtCost(p.otCost);
    let d = p.duration;
    if (d === 'month' && !canMonth) d = canWeek ? 'week' : 'day';
    if (d === 'week' && !canWeek) d = 'day';
    setDuration(d);
    safeHaptics.selectionAsync();
  };

  const unit: DistanceUnit = useKm ? 'km' : 'mi';
  const nearby = useMemo(() => {
    const list = DEMO_NEARBY_SPHERES.filter((s) => {
      if (s.lat == null || s.lng == null) return true;
      const distMi = distanceMi(partnerLat, partnerLng, s.lat, s.lng);
      const distKm = distanceMi(partnerLat, partnerLng, s.lat, s.lng) * 1.60934;
      if (useKm) return distKm <= rangeMi * 1.60934;
      return distMi <= rangeMi;
    }).map((s) => {
      const distMi = s.lat != null && s.lng != null ? distanceMi(partnerLat, partnerLng, s.lat, s.lng) : 0;
      const distKm = s.lat != null && s.lng != null ? distanceKm(partnerLat, partnerLng, s.lat, s.lng) : 0;
      return {
        ...s,
        distanceMi: distMi,
        distanceKm: distKm,
      };
    });
    list.sort((a, b) => a.distanceMi - b.distanceMi);
    return list;
  }, [partnerLat, partnerLng, rangeMi, useKm]);

  const effectiveCode = selectedSphere?.inviteCode ?? manualCode.trim().replace(/\s/g, '').toUpperCase();

  const handleCreate = async () => {
    const code = effectiveCode || manualCode.trim().replace(/\s/g, '').toUpperCase();
    if (!code) {
      showErrorAlert('Missing code', 'Select a sphere from the list or enter the sphere invite code.');
      return;
    }
    if (!title.trim()) {
      showErrorAlert('Missing title', 'Enter a short offer title.');
      return;
    }
    const cost = otCost.trim() === '' ? 0 : parseInt(otCost, 10);
    if (otCost.trim() !== '' && (isNaN(cost) || cost < 0)) {
      showErrorAlert('Invalid OT', 'OT cost must be 0 or a positive number.');
      return;
    }
    const normalizedCode = code.replace(/\s/g, '').replace(/-/g, '').toUpperCase();
    const formattedCode = normalizedCode.length >= 6 ? normalizedCode.slice(0, 3) + '-' + normalizedCode.slice(3, 6) : normalizedCode;
    setSaving(true);
    try {
      await addInvite({
        partnerId: partnerId,
        partnerName: partner?.name ?? 'Your venue',
        sphereInviteCode: formattedCode,
        title: title.trim(),
        description: description.trim(),
        otCost: cost,
        duration,
      });
      safeHaptics.notificationAsync(2);
      alertDialog(
        'Invite sent',
        `Your offer will appear in the sphere. Members can accept (${cost > 0 ? cost + ' OT' : 'free'}) or deny. Everything goes through OrbTap.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      showErrorAlert('Failed', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Invite sphere</Text>
          <View style={{ width: 40 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <Text style={[styles.dismissHint, { color: colors.textSecondary }]}>Tap outside any field to close keyboard</Text>
            <Text style={[styles.hero, { color: colors.textSecondary }]}>
              Send an offer to a sphere near you. Choose how far to look, pick a sphere, then add your offer. All through OrbTap — you get foot traffic, we handle the flow.
            </Text>

            {/* Range: miles/km toggle + distance options */}
            <View style={[styles.rangeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.rangeHeader}>
                <Text style={[styles.rangeLabel, { color: colors.text }]}>Show spheres within</Text>
                <View style={styles.unitRow}>
                  <Text style={[styles.unitText, { color: colors.textSecondary }]}>mi</Text>
                  <Switch value={useKm} onValueChange={setUseKm} trackColor={{ false: colors.border, true: tierColor }} thumbColor="#fff" />
                  <Text style={[styles.unitText, { color: colors.textSecondary }]}>km</Text>
                </View>
              </View>
              <View style={styles.rangeOptions}>
                {RANGE_OPTIONS_MI.map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.rangePill,
                      { backgroundColor: rangeMi === val ? tierColor + '30' : colors.background, borderColor: rangeMi === val ? tierColor : colors.border },
                    ]}
                    onPress={() => { safeHaptics.selectionAsync(); setRangeMi(val); }}
                  >
                    <Text style={[styles.rangePillText, { color: rangeMi === val ? tierColor : colors.text }]}>
                      {getRangeLabel(val, unit)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Nearby spheres list */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NEARBY SPHERES</Text>
            {nearby.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No spheres in this range</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try a larger range or enter a code below.</Text>
              </View>
            ) : (
              nearby.map((s) => {
                const selected = selectedSphere?.inviteCode === s.inviteCode;
                const distStr = useKm ? `${s.distanceKm.toFixed(1)} km` : `${s.distanceMi.toFixed(1)} mi`;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.sphereRow,
                      { backgroundColor: colors.surface, borderColor: selected ? tierColor : colors.border },
                      selected && { borderWidth: 2 },
                    ]}
                    onPress={() => { safeHaptics.selectionAsync(); setSelectedSphere({ inviteCode: s.inviteCode, name: s.name }); setManualCode(''); }}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.sphereIconWrap, { backgroundColor: tierColor + '22' }]}>
                      <Ionicons name="people" size={22} color={tierColor} />
                    </View>
                    <View style={styles.sphereBody}>
                      <Text style={[styles.sphereName, { color: colors.text }]}>{s.name}</Text>
                      <Text style={[styles.sphereMeta, { color: colors.textSecondary }]}>{s.inviteCode} · {s.memberCount} members · {distStr}</Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={24} color={tierColor} />}
                  </TouchableOpacity>
                );
              })
            )}

            {/* Offer duration — tier gated: Silver = day; Gold = day+week; Platinum = day+week+month */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OFFER VALID FOR</Text>
            <View style={styles.durationRow}>
              <TouchableOpacity
                style={[styles.durationPill, { backgroundColor: duration === 'day' ? tierColor + '30' : colors.surface, borderColor: duration === 'day' ? tierColor : colors.border }]}
                onPress={() => { safeHaptics.selectionAsync(); setDuration('day'); }}
              >
                <Text style={[styles.durationPillText, { color: duration === 'day' ? tierColor : colors.text }]}>24 hours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.durationPill, { backgroundColor: duration === 'week' ? tierColor + '30' : colors.surface, borderColor: duration === 'week' ? tierColor : colors.border }, !canWeek && styles.durationPillLocked]}
                onPress={() => { if (canWeek) { safeHaptics.selectionAsync(); setDuration('week'); } }}
                disabled={!canWeek}
              >
                <Text style={[styles.durationPillText, { color: duration === 'week' ? tierColor : colors.textSecondary }]}>1 week</Text>
                {!canWeek && <Ionicons name="lock-closed" size={12} color={colors.textSecondary} style={styles.durationLockIcon} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.durationPill, { backgroundColor: duration === 'month' ? tierColor + '30' : colors.surface, borderColor: duration === 'month' ? tierColor : colors.border }, !canMonth && styles.durationPillLocked]}
                onPress={() => { if (canMonth) { safeHaptics.selectionAsync(); setDuration('month'); } }}
                disabled={!canMonth}
              >
                <Text style={[styles.durationPillText, { color: duration === 'month' ? tierColor : colors.textSecondary }]}>1 month</Text>
                {!canMonth && <Ionicons name="lock-closed" size={12} color={colors.textSecondary} style={styles.durationLockIcon} />}
              </TouchableOpacity>
            </View>
            {(!canWeek || !canMonth) && (
              <Text style={[styles.tierHint, { color: colors.textSecondary }]}>
                {!canWeek ? 'Upgrade to Gold for weekly invites.' : !canMonth ? 'Upgrade to Platinum for monthly invites.' : ''}
              </Text>
            )}

            {/* Presets */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRESETS</Text>
            <TouchableOpacity style={[styles.presetSaveBtn, { borderColor: tierColor, backgroundColor: tierColor + '18' }]} onPress={saveCurrentAsPreset}>
              <Ionicons name="bookmark-outline" size={18} color={tierColor} />
              <Text style={[styles.presetSaveText, { color: tierColor }]}>Save current as preset</Text>
            </TouchableOpacity>
            {presets.length > 0 && (
              <View style={styles.presetList}>
                {presets.slice().reverse().map((p) => (
                  <View key={p.id} style={[styles.presetRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity style={styles.presetRowContent} onPress={() => loadPreset(p)} activeOpacity={0.85}>
                      <Text style={[styles.presetName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                      <Text style={[styles.presetMeta, { color: colors.textSecondary }]} numberOfLines={1}>{p.title || 'No title'} · {p.duration}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} onPress={() => { savePresets(presets.filter((x) => x.id !== p.id)); safeHaptics.selectionAsync(); }} style={styles.presetDelete}>
                      <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Or enter code manually */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OR ENTER CODE</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
              value={selectedSphere ? '' : manualCode}
              onChangeText={(t) => { setManualCode(t); setSelectedSphere(null); }}
              placeholder="e.g. PWR-001 (if not in list)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              blurOnSubmit
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Offer title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. 10% off for the squad"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="done"
              blurOnSubmit
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Details</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What they get, when, any conditions..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              returnKeyType="done"
              blurOnSubmit
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>OT cost (0 = free)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
              value={otCost}
              onChangeText={setOtCost}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              returnKeyType="done"
              blurOnSubmit
            />
            <TouchableOpacity
              style={[styles.submit, { backgroundColor: tierColor }]}
              onPress={() => { safeHaptics.selectionAsync(); handleCreate(); }}
              disabled={saving}
            >
              <Text style={styles.submitText}>{saving ? 'Sending…' : 'Send invite'}</Text>
            </TouchableOpacity>
          </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 20, paddingBottom: 40 },
  dismissHint: { fontSize: 11, marginBottom: 8 },
  hero: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  rangeCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  rangeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rangeLabel: { fontSize: 14, fontWeight: '600' },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitText: { fontSize: 12 },
  rangeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rangePill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  rangePillText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 11, fontWeight: '700', marginBottom: 10 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4 },
  sphereRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  sphereIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sphereBody: { flex: 1 },
  sphereName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  sphereMeta: { fontSize: 12 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  textArea: { minHeight: 88 },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  durationPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  durationPillLocked: { opacity: 0.7 },
  durationLockIcon: { marginLeft: 4 },
  durationPillText: { fontSize: 14, fontWeight: '600' },
  tierHint: { fontSize: 12, marginBottom: 16 },
  presetSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  presetSaveText: { fontSize: 14, fontWeight: '700' },
  presetList: { marginBottom: 20 },
  presetRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  presetRowContent: { flex: 1, minWidth: 0 },
  presetName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  presetMeta: { fontSize: 12 },
  presetDelete: { padding: 4 },
  submit: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
