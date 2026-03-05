/**
 * OrbPilot™ Guardrails Editor — Caps, CPA limits, trust tier requirements, PIN policy.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useFlags } from '../../../components/FlagContext';
import { useOrbPilotCampaign } from '../../../hooks/useOrbPilotCampaign';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import {
  OrbPilotDefaults,
  TRUST_TIER_LABEL,
  TRUST_TIER_COLOR,
} from '../../../constants/OrbPilot';
import type { TrustTier } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

const TRUST_TIERS: TrustTier[] = ['bronze', 'silver', 'gold', 'platinum'];
const CPA_ADMIN_MAX = 20;

interface GuardrailForm {
  maxVVPerDay: string;
  maxVVPerUserPerWeek: string;
  cpaMaxUsd: string;
  minTrustTier: TrustTier;
  pinRequired: boolean;
}

function FieldLabel({ text, colors }: { text: string; colors: Record<string, string> }) {
  return <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{text}</Text>;
}

function NumberField({
  label,
  value,
  onChangeText,
  hint,
  colors,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  hint?: string;
  colors: Record<string, string>;
  suffix?: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel text={label} colors={colors} />
      <View style={styles.inputWithSuffix}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border ?? '#333',
              flex: 1,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={colors.textSecondary}
        />
        {suffix ? (
          <View style={[styles.suffix, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 14 }}>{suffix}</Text>
          </View>
        ) : null}
      </View>
      {hint ? <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

export default function OrbPilotGuardrails() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isOrbPilotEnabled, isOrbPilotPartnerEnabled } = useFlags();
  const router = useRouter();
  const { myPartnerId } = useMyPartner();
  const { campaigns, loading, loadCampaigns, update } = useOrbPilotCampaign(myPartnerId ?? undefined);

  const [form, setForm] = useState<GuardrailForm>({
    maxVVPerDay: '50',
    maxVVPerUserPerWeek: String(OrbPilotDefaults.maxVVPerUserPerWeek),
    cpaMaxUsd: String(OrbPilotDefaults.cpaMaxUsd),
    minTrustTier: 'silver',
    pinRequired: false,
  });
  const [saving, setSaving] = useState(false);

  const activeCampaign =
    campaigns.find((c) => c.status === 'active' || c.status === 'paused') ??
    campaigns[0] ??
    null;

  useFocusEffect(
    useCallback(() => {
      loadCampaigns();
    }, []),
  );

  useEffect(() => {
    if (activeCampaign) {
      setForm({
        maxVVPerDay: String(activeCampaign.maxVVPerDay),
        maxVVPerUserPerWeek: String(activeCampaign.maxVVPerUserPerWeek),
        cpaMaxUsd: String(activeCampaign.cpaMaxUsd),
        minTrustTier: activeCampaign.minTrustTier,
        pinRequired: activeCampaign.pinRequired,
      });
    }
  }, [activeCampaign?.id]);

  function set<K extends keyof GuardrailForm>(key: K, value: GuardrailForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const maxVVDay = parseInt(form.maxVVPerDay);
    const maxVVUser = parseInt(form.maxVVPerUserPerWeek);
    const cpa = parseFloat(form.cpaMaxUsd);

    if (isNaN(maxVVDay) || maxVVDay < 1) {
      Alert.alert('Invalid', 'Max VV per day must be at least 1.');
      return false;
    }
    if (isNaN(maxVVUser) || maxVVUser < 1) {
      Alert.alert('Invalid', 'Max VV per user per week must be at least 1.');
      return false;
    }
    if (isNaN(cpa) || cpa <= 0) {
      Alert.alert('Invalid', 'CPA max must be a positive number.');
      return false;
    }
    if (cpa > CPA_ADMIN_MAX) {
      Alert.alert('Admin Limit', `CPA max cannot exceed $${CPA_ADMIN_MAX}.`);
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!activeCampaign) {
      Alert.alert('No Campaign', 'No active campaign to update.');
      return;
    }
    if (!validate()) return;
    setSaving(true);
    const res = await update(activeCampaign.id, {
      maxVVPerDay: parseInt(form.maxVVPerDay),
      maxVVPerUserPerWeek: parseInt(form.maxVVPerUserPerWeek),
      cpaMaxUsd: parseFloat(form.cpaMaxUsd),
      minTrustTier: form.minTrustTier,
      pinRequired: form.pinRequired,
    });
    setSaving(false);
    if (res.success) {
      Alert.alert('Saved', 'Guardrails updated successfully.');
    } else {
      Alert.alert('Error', res.message ?? 'Failed to save');
    }
  }

  if (!isOrbPilotEnabled || !isOrbPilotPartnerEnabled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>OrbPilot not enabled</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Guardrails</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#EF4444" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACE.base, gap: 20, paddingBottom: 40 }}>
          {/* Info */}
          <View style={[styles.infoCard, { backgroundColor: '#EF444410', borderColor: '#EF444430' }]}>
            <Ionicons name="shield-outline" size={18} color="#EF4444" />
            <Text style={styles.infoText}>
              Guardrails protect your budget. The campaign auto-pauses if any cap is reached.
            </Text>
          </View>

          {!activeCampaign && (
            <View style={[styles.noCampaign, { backgroundColor: colors.card }]}>
              <Text style={[{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }]}>
                No active campaign. Create one first.
              </Text>
            </View>
          )}

          {/* Visit Caps */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#60A5FA20' }]}>
                <Ionicons name="people-outline" size={18} color="#60A5FA" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Visit Caps</Text>
            </View>
            <NumberField
              label="Max Verified Visits per Day"
              value={form.maxVVPerDay}
              onChangeText={(v) => set('maxVVPerDay', v)}
              hint="Campaign pauses for the day when this is reached"
              colors={colors}
              suffix="visits"
            />
            <NumberField
              label="Max Visits per User per Week"
              value={form.maxVVPerUserPerWeek}
              onChangeText={(v) => set('maxVVPerUserPerWeek', v)}
              hint={`Prevents repeat abuse. Default: ${OrbPilotDefaults.maxVVPerUserPerWeek}`}
              colors={colors}
              suffix="/ user"
            />
          </View>

          {/* CPA Stop-Loss */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="cash-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>CPA Stop-Loss</Text>
            </View>
            <NumberField
              label="Max CPA (USD)"
              value={form.cpaMaxUsd}
              onChangeText={(v) => set('cpaMaxUsd', v)}
              hint={`Campaign pauses if average cost-per-visit exceeds this. Admin max: $${CPA_ADMIN_MAX}`}
              colors={colors}
              suffix="USD"
            />
            {/* CPA gauge */}
            {activeCampaign && (
              <View style={styles.cpaGauge}>
                <View style={styles.cpaGaugeRow}>
                  <Text style={[styles.cpaGaugeLabel, { color: colors.textSecondary }]}>Current avg CPA</Text>
                  <Text style={[styles.cpaGaugeValue, { color: colors.text }]}>
                    — (see analytics)
                  </Text>
                </View>
                <View style={[styles.cpaGaugeBar, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.cpaGaugeFill,
                      {
                        width: `${Math.min(100, (parseFloat(form.cpaMaxUsd) / CPA_ADMIN_MAX) * 100)}%`,
                        backgroundColor: '#F59E0B',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.cpaGaugeRange, { color: colors.textSecondary }]}>
                  $0 ← limit set → ${form.cpaMaxUsd} (admin max: ${CPA_ADMIN_MAX})
                </Text>
              </View>
            )}
          </View>

          {/* Min Trust Tier */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#A78BFA20' }]}>
                <Ionicons name="star-outline" size={18} color="#A78BFA" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Minimum Trust Tier</Text>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Only users at or above this trust level can claim and redeem slots.
            </Text>
            <View style={styles.tierChips}>
              {TRUST_TIERS.map((tier) => {
                const col = TRUST_TIER_COLOR[tier];
                const selected = form.minTrustTier === tier;
                return (
                  <TouchableOpacity
                    key={tier}
                    onPress={() => set('minTrustTier', tier)}
                    style={[
                      styles.tierChip,
                      selected
                        ? { backgroundColor: col + '30', borderColor: col }
                        : { backgroundColor: colors.background, borderColor: colors.border ?? '#333' },
                    ]}
                  >
                    <View style={[styles.tierDot, { backgroundColor: col }]} />
                    <Text style={[styles.tierChipText, { color: selected ? col : colors.textSecondary }]}>
                      {TRUST_TIER_LABEL[tier]}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark" size={14} color={col} style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.tierInfo, { backgroundColor: colors.background }]}>
              <Text style={[styles.tierInfoText, { color: colors.textSecondary }]}>
                {form.minTrustTier === 'bronze'
                  ? 'Bronze: New users. Higher fraud risk — use PIN or limit budget.'
                  : form.minTrustTier === 'silver'
                  ? 'Silver: Verified users with no recent rejections. Recommended default.'
                  : form.minTrustTier === 'gold'
                  ? 'Gold: Trusted regulars. Low fraud risk, high conversion rate.'
                  : 'Platinum: Elite users. Minimum 1h cooldown, highest trust level.'}
              </Text>
            </View>
          </View>

          {/* PIN Required */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#7C3AED20' }]}>
                <Ionicons name="keypad-outline" size={18} color="#7C3AED" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>PIN Verification</Text>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              When enabled, staff must show the rotating PIN to customers before their visit counts.
              Adds fraud protection at the cost of extra friction.
            </Text>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Require staff PIN</Text>
                <Text style={[styles.hint, { color: colors.textSecondary, marginTop: 2 }]}>
                  PIN rotates every 45 seconds on the Verify screen
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => set('pinRequired', !form.pinRequired)}
                style={[
                  styles.toggle,
                  form.pinRequired
                    ? { backgroundColor: '#7C3AED' }
                    : { backgroundColor: colors.background, borderColor: colors.border ?? '#555', borderWidth: 1 },
                ]}
              >
                <View style={[styles.toggleThumb, { marginLeft: form.pinRequired ? 20 : 2 }]} />
              </TouchableOpacity>
            </View>
            {form.pinRequired && (
              <View style={[styles.pinNotice, { backgroundColor: '#7C3AED15', borderColor: '#7C3AED30' }]}>
                <Ionicons name="information-circle-outline" size={14} color="#A78BFA" />
                <Text style={{ color: '#A78BFA', fontSize: 12, flex: 1, marginLeft: 6, lineHeight: 17 }}>
                  Open the Verify screen on your POS device or phone. Show customers the 6-digit PIN.
                </Text>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Guardrails</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.base,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  infoCard: { flexDirection: 'row', padding: 14, borderRadius: RADIUS.sm, borderWidth: 1, gap: 10, alignItems: 'flex-start' },
  infoText: { color: '#FCA5A5', fontSize: 12, flex: 1, lineHeight: 18 },
  noCampaign: { padding: 14, borderRadius: RADIUS.sm, alignItems: 'center' },
  section: { borderRadius: RADIUS.md, padding: SPACE.base, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWithSuffix: { flexDirection: 'row', gap: 0 },
  input: { height: 46, borderRadius: RADIUS.sm, paddingHorizontal: 14, fontSize: 15, borderWidth: 1 },
  suffix: { paddingHorizontal: 14, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.sm, marginLeft: 8 },
  hint: { fontSize: 11, lineHeight: 16 },
  cpaGauge: { gap: 6 },
  cpaGaugeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cpaGaugeLabel: { fontSize: 12 },
  cpaGaugeValue: { fontSize: 12, fontWeight: '700' },
  cpaGaugeBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  cpaGaugeFill: { height: '100%', borderRadius: 3 },
  cpaGaugeRange: { fontSize: 10 },
  tierChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tierChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, gap: 6 },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  tierChipText: { fontSize: 13, fontWeight: '700' },
  tierInfo: { padding: 12, borderRadius: RADIUS.sm },
  tierInfoText: { fontSize: 12, lineHeight: 17 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '700' },
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  pinNotice: { flexDirection: 'row', padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'flex-start' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: RADIUS.base,
    gap: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
