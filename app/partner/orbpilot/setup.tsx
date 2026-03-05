/**
 * OrbPilot™ Campaign Wizard — 5-step campaign creation flow.
 * Step 1: Budget | Step 2: Schedule | Step 3: Reward Ladder | Step 4: Caps & Objective | Step 5: Review
 */
import React, { useState, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useFlags } from '../../../components/FlagContext';
import { useOrbPilotCampaign } from '../../../hooks/useOrbPilotCampaign';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import {
  OrbPilotDefaults,
  OBJECTIVE_LABEL,
  TRUST_TIER_LABEL,
  TRUST_TIER_COLOR,
} from '../../../constants/OrbPilot';
import type { Objective, TrustTier, TimeWindow } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const OBJECTIVES: Objective[] = ['fill_rate', 'new_customers', 'repeat_customers', 'cpa_optimize'];
const TRUST_TIERS: TrustTier[] = ['bronze', 'silver', 'gold', 'platinum'];
const TOTAL_STEPS = 5;

interface WizardState {
  // Step 1: Budget
  weeklyBudgetUsd: string;
  dailyMaxUsd: string;
  // Step 2: Schedule
  windows: TimeWindow[];
  newWindowDow: number[];
  newWindowStart: string;
  newWindowEnd: string;
  // Step 3: Reward Ladder
  basePoints: string;
  boostPoints: string;
  rescuePoints: string;
  // Step 4: Caps & Objective
  maxVVPerDay: string;
  maxVVPerUserPerWeek: string;
  cpaMaxUsd: string;
  objective: Objective;
  minTrustTier: TrustTier;
  pinRequired: boolean;
}

const defaultState: WizardState = {
  weeklyBudgetUsd: '100',
  dailyMaxUsd: '20',
  windows: [],
  newWindowDow: [1, 2, 3, 4, 5],
  newWindowStart: '09:00',
  newWindowEnd: '21:00',
  basePoints: String(OrbPilotDefaults.defaultBasePoints),
  boostPoints: String(OrbPilotDefaults.defaultBoostPoints),
  rescuePoints: String(OrbPilotDefaults.defaultRescuePoints),
  maxVVPerDay: '50',
  maxVVPerUserPerWeek: String(OrbPilotDefaults.maxVVPerUserPerWeek),
  cpaMaxUsd: String(OrbPilotDefaults.cpaMaxUsd),
  objective: 'fill_rate',
  minTrustTier: 'silver',
  pinRequired: false,
};

function SectionLabel({ text, colors }: { text: string; colors: Record<string, string> }) {
  return <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>{text}</Text>;
}

function StepInput({
  label,
  value,
  onChangeText,
  hint,
  colors,
  keyboardType = 'numeric',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  hint?: string;
  colors: Record<string, string>;
  keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={s.inputGroup}>
      <Text style={[s.inputLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[s.textInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border ?? '#333' }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textSecondary}
      />
      {hint ? <Text style={[s.inputHint, { color: colors.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

function DowChip({
  index,
  selected,
  onToggle,
  colors,
}: {
  index: number;
  selected: boolean;
  onToggle: () => void;
  colors: Record<string, string>;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        s.dowChip,
        selected
          ? { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }
          : { backgroundColor: colors.card, borderColor: colors.border ?? '#333' },
      ]}
    >
      <Text style={[s.dowChipText, { color: selected ? '#fff' : colors.textSecondary }]}>
        {DOW_LABELS[index]}
      </Text>
    </TouchableOpacity>
  );
}

export default function OrbPilotSetup() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isOrbPilotEnabled, isOrbPilotPartnerEnabled } = useFlags();
  const router = useRouter();
  const { myPartnerId } = useMyPartner();
  const { create, loading } = useOrbPilotCampaign(myPartnerId ?? undefined);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardState>(defaultState);

  const set = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function toggleDow(dow: number) {
    setForm((prev) => {
      const existing = prev.newWindowDow;
      return {
        ...prev,
        newWindowDow: existing.includes(dow)
          ? existing.filter((d) => d !== dow)
          : [...existing, dow].sort((a, b) => a - b),
      };
    });
  }

  function addWindow() {
    if (form.newWindowDow.length === 0) {
      Alert.alert('Select Days', 'Please select at least one day of the week.');
      return;
    }
    if (!form.newWindowStart.match(/^\d{2}:\d{2}$/) || !form.newWindowEnd.match(/^\d{2}:\d{2}$/)) {
      Alert.alert('Invalid Time', 'Please enter times in HH:MM format.');
      return;
    }
    const newWindow: TimeWindow = {
      dow: form.newWindowDow,
      startTime: form.newWindowStart,
      endTime: form.newWindowEnd,
    };
    setForm((prev) => ({ ...prev, windows: [...prev.windows, newWindow] }));
  }

  function removeWindow(index: number) {
    setForm((prev) => ({ ...prev, windows: prev.windows.filter((_, i) => i !== index) }));
  }

  function validateStep(): boolean {
    if (step === 1) {
      const weekly = parseFloat(form.weeklyBudgetUsd);
      const daily = parseFloat(form.dailyMaxUsd);
      if (isNaN(weekly) || weekly < 10) {
        Alert.alert('Budget Required', 'Weekly budget must be at least $10.');
        return false;
      }
      if (isNaN(daily) || daily < 1) {
        Alert.alert('Daily Max Required', 'Daily max must be at least $1.');
        return false;
      }
      if (daily > weekly) {
        Alert.alert('Budget Error', 'Daily max cannot exceed weekly budget.');
        return false;
      }
    }
    if (step === 2) {
      if (form.windows.length === 0) {
        Alert.alert('Schedule Required', 'Add at least one schedule window.');
        return false;
      }
    }
    if (step === 3) {
      const base = parseInt(form.basePoints);
      const boost = parseInt(form.boostPoints);
      const rescue = parseInt(form.rescuePoints);
      if (isNaN(base) || base < 1) {
        Alert.alert('Invalid Points', 'Base points must be at least 1.');
        return false;
      }
      if (boost < base) {
        Alert.alert('Invalid Points', 'Boost points must be >= base points.');
        return false;
      }
      if (rescue < boost) {
        Alert.alert('Invalid Points', 'Rescue points must be >= boost points.');
        return false;
      }
    }
    if (step === 4) {
      const cpa = parseFloat(form.cpaMaxUsd);
      if (isNaN(cpa) || cpa > 20) {
        Alert.alert('CPA Limit', 'CPA max cannot exceed $20 (admin limit).');
        return false;
      }
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleActivate() {
    if (!myPartnerId) {
      Alert.alert('Error', 'No partner account linked.');
      return;
    }
    const res = await create({
      partnerId: myPartnerId,
      objective: form.objective,
      weeklyBudgetUsd: parseFloat(form.weeklyBudgetUsd),
      dailyMaxUsd: parseFloat(form.dailyMaxUsd),
      schedule: form.windows,
      rewardLadder: {
        basePoints: parseInt(form.basePoints),
        boostPoints: parseInt(form.boostPoints),
        rescuePoints: parseInt(form.rescuePoints),
      },
      maxVVPerDay: parseInt(form.maxVVPerDay),
      maxVVPerUserPerWeek: parseInt(form.maxVVPerUserPerWeek),
      minTrustTier: form.minTrustTier,
      cpaMaxUsd: parseFloat(form.cpaMaxUsd),
      pinRequired: form.pinRequired,
    });
    if (res.success) {
      Alert.alert('Campaign Created!', 'Your OrbPilot campaign is now active.', [
        { text: 'Go to Cockpit', onPress: () => router.replace('/partner/orbpilot/cockpit' as any) },
      ]);
    } else {
      Alert.alert('Error', res.message ?? 'Failed to create campaign');
    }
  }

  if (!isOrbPilotEnabled || !isOrbPilotPartnerEnabled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>OrbPilot not enabled</Text>
      </SafeAreaView>
    );
  }

  const ptCost = (pts: number) => `$${(pts * OrbPilotDefaults.otPointCostUsd).toFixed(2)}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => (step > 1 ? back() : router.back())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]}>New Campaign</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Progress bar */}
      <View style={[s.progressWrap, { backgroundColor: colors.card }]}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              s.progressSegment,
              {
                backgroundColor: i < step ? '#7C3AED' : colors.background,
                marginRight: i < TOTAL_STEPS - 1 ? 4 : 0,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[s.stepLabel, { color: colors.textSecondary }]}>
        Step {step} of {TOTAL_STEPS}
      </Text>

      <ScrollView contentContainerStyle={{ padding: SPACE.base, paddingBottom: 32, gap: 20 }}>
        {/* ── Step 1: Budget ── */}
        {step === 1 && (
          <>
            <Text style={[s.stepTitle, { color: colors.text }]}>Budget</Text>
            <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
              Set your weekly and daily spend limits. You only pay per verified visit.
            </Text>
            <StepInput
              label="Weekly Budget (USD)"
              value={form.weeklyBudgetUsd}
              onChangeText={(v) => set('weeklyBudgetUsd', v)}
              hint="Minimum $10 per week"
              colors={colors}
            />
            <StepInput
              label="Daily Max Spend (USD)"
              value={form.dailyMaxUsd}
              onChangeText={(v) => set('dailyMaxUsd', v)}
              hint="Must be less than weekly budget"
              colors={colors}
            />
            <View style={[s.infoBox, { backgroundColor: '#7C3AED10', borderColor: '#7C3AED30' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#7C3AED" />
              <Text style={{ color: '#A78BFA', fontSize: 12, flex: 1, marginLeft: 8, lineHeight: 18 }}>
                Each OT Point costs ${OrbPilotDefaults.otPointCostUsd.toFixed(2)}. A visitor earning 50 pts costs $0.50.
                Budget is only charged on verified visits.
              </Text>
            </View>
          </>
        )}

        {/* ── Step 2: Schedule ── */}
        {step === 2 && (
          <>
            <Text style={[s.stepTitle, { color: colors.text }]}>Schedule</Text>
            <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
              Define when OrbPilot releases slots. Customers can only earn points during these windows.
            </Text>

            {/* Existing windows */}
            {form.windows.length > 0 && (
              <View style={[s.card, { backgroundColor: colors.card }]}>
                <Text style={[s.cardTitle, { color: colors.text }]}>Active Windows</Text>
                {form.windows.map((w, i) => (
                  <View key={i} style={s.windowRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.windowDays, { color: colors.text }]}>
                        {w.dow.map((d) => DOW_LABELS[d]).join(', ')}
                      </Text>
                      <Text style={[s.windowTime, { color: colors.textSecondary }]}>
                        {w.startTime} – {w.endTime}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeWindow(i)}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add window form */}
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <Text style={[s.cardTitle, { color: colors.text }]}>Add Window</Text>
              <SectionLabel text="Days of week" colors={colors} />
              <View style={s.dowRow}>
                {DOW_LABELS.map((_, i) => (
                  <DowChip
                    key={i}
                    index={i}
                    selected={form.newWindowDow.includes(i)}
                    onToggle={() => toggleDow(i)}
                    colors={colors}
                  />
                ))}
              </View>
              <View style={s.timeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.inputLabel, { color: colors.text }]}>Start (HH:MM)</Text>
                  <TextInput
                    style={[s.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border ?? '#333' }]}
                    value={form.newWindowStart}
                    onChangeText={(v) => set('newWindowStart', v)}
                    placeholder="09:00"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <Text style={[s.timeSep, { color: colors.textSecondary }]}>—</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.inputLabel, { color: colors.text }]}>End (HH:MM)</Text>
                  <TextInput
                    style={[s.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border ?? '#333' }]}
                    value={form.newWindowEnd}
                    onChangeText={(v) => set('newWindowEnd', v)}
                    placeholder="21:00"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
              <TouchableOpacity
                onPress={addWindow}
                style={[s.addBtn, { backgroundColor: '#7C3AED20', borderColor: '#7C3AED40' }]}
              >
                <Ionicons name="add-circle-outline" size={18} color="#7C3AED" />
                <Text style={{ color: '#7C3AED', fontWeight: '700', marginLeft: 6 }}>Add Window</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Step 3: Reward Ladder ── */}
        {step === 3 && (
          <>
            <Text style={[s.stepTitle, { color: colors.text }]}>Reward Ladder</Text>
            <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
              OrbPilot auto-escalates rewards when your venue is quiet. Rescue kicks in during dead hours.
            </Text>

            {[
              { key: 'basePoints' as const, label: 'Base Points', color: '#22C55E', hint: 'Normal verified visit — fill rate ≥ 50%' },
              { key: 'boostPoints' as const, label: 'Boost Points', color: '#F59E0B', hint: 'Auto-boost when fill rate < 50%' },
              { key: 'rescuePoints' as const, label: 'Rescue Points', color: '#EF4444', hint: 'Rescue mode when fill rate < 25%' },
            ].map(({ key, label, color, hint }) => (
              <View key={key} style={[s.rewardRow, { backgroundColor: colors.card }]}>
                <View style={[s.rewardColorBar, { backgroundColor: color }]} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={[s.rewardLabel, { color: colors.text }]}>{label}</Text>
                  <Text style={[s.rewardHint, { color: colors.textSecondary }]}>{hint}</Text>
                </View>
                <View style={s.rewardInputWrap}>
                  <TextInput
                    style={[s.rewardInput, { backgroundColor: colors.background, color: colors.text, borderColor: color + '50' }]}
                    value={form[key]}
                    onChangeText={(v) => set(key, v)}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[s.rewardCost, { color }]}>
                    {ptCost(parseInt(form[key]) || 0)} / visit
                  </Text>
                </View>
              </View>
            ))}

            <View style={[s.infoBox, { backgroundColor: '#22C55E10', borderColor: '#22C55E30' }]}>
              <Ionicons name="bulb-outline" size={16} color="#22C55E" />
              <Text style={{ color: '#86EFAC', fontSize: 12, flex: 1, marginLeft: 8, lineHeight: 18 }}>
                Total weekly cost at base rate: ~{ptCost(parseInt(form.basePoints) * 50 || 0)} (50 visits/week estimated)
              </Text>
            </View>
          </>
        )}

        {/* ── Step 4: Caps & Objective ── */}
        {step === 4 && (
          <>
            <Text style={[s.stepTitle, { color: colors.text }]}>Caps & Objective</Text>
            <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
              Set visit caps to control costs and choose your campaign objective.
            </Text>

            <StepInput
              label="Max Verified Visits per Day"
              value={form.maxVVPerDay}
              onChangeText={(v) => set('maxVVPerDay', v)}
              hint="Campaign pauses automatically if hit"
              colors={colors}
            />
            <StepInput
              label="Max Visits per User per Week"
              value={form.maxVVPerUserPerWeek}
              onChangeText={(v) => set('maxVVPerUserPerWeek', v)}
              hint={`Default: ${OrbPilotDefaults.maxVVPerUserPerWeek} visits/user/week`}
              colors={colors}
            />
            <StepInput
              label="CPA Stop-Loss (USD)"
              value={form.cpaMaxUsd}
              onChangeText={(v) => set('cpaMaxUsd', v)}
              hint="Campaign pauses if avg CPA exceeds this. Admin max: $20"
              colors={colors}
            />

            <SectionLabel text="Campaign Objective" colors={colors} />
            <View style={s.chipRow}>
              {OBJECTIVES.map((obj) => (
                <TouchableOpacity
                  key={obj}
                  onPress={() => set('objective', obj)}
                  style={[
                    s.chip,
                    form.objective === obj
                      ? { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }
                      : { backgroundColor: colors.card, borderColor: colors.border ?? '#333' },
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      { color: form.objective === obj ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {OBJECTIVE_LABEL[obj]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionLabel text="Minimum Trust Tier" colors={colors} />
            <View style={s.chipRow}>
              {TRUST_TIERS.map((tier) => (
                <TouchableOpacity
                  key={tier}
                  onPress={() => set('minTrustTier', tier)}
                  style={[
                    s.chip,
                    form.minTrustTier === tier
                      ? { backgroundColor: TRUST_TIER_COLOR[tier] + '30', borderColor: TRUST_TIER_COLOR[tier] }
                      : { backgroundColor: colors.card, borderColor: colors.border ?? '#333' },
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      { color: form.minTrustTier === tier ? TRUST_TIER_COLOR[tier] : colors.textSecondary },
                    ]}
                  >
                    {TRUST_TIER_LABEL[tier]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionLabel text="PIN Required" colors={colors} />
            <View style={s.toggleRow}>
              <Text style={[s.toggleLabel, { color: colors.text }]}>
                Require staff PIN for verification
              </Text>
              <TouchableOpacity
                onPress={() => set('pinRequired', !form.pinRequired)}
                style={[
                  s.toggle,
                  form.pinRequired
                    ? { backgroundColor: '#7C3AED' }
                    : { backgroundColor: colors.card, borderColor: colors.border ?? '#555' },
                ]}
              >
                <View style={[s.toggleThumb, { marginLeft: form.pinRequired ? 20 : 2 }]} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Step 5: Review ── */}
        {step === 5 && (
          <>
            <Text style={[s.stepTitle, { color: colors.text }]}>Review & Activate</Text>
            <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
              Your campaign goes live immediately after activation.
            </Text>

            {[
              { label: 'Weekly Budget', value: `$${form.weeklyBudgetUsd}` },
              { label: 'Daily Max', value: `$${form.dailyMaxUsd}` },
              { label: 'Objective', value: OBJECTIVE_LABEL[form.objective] },
              { label: 'Schedule Windows', value: `${form.windows.length} window${form.windows.length !== 1 ? 's' : ''}` },
              { label: 'Base Points', value: `${form.basePoints} pts (${ptCost(parseInt(form.basePoints) || 0)})` },
              { label: 'Boost Points', value: `${form.boostPoints} pts (${ptCost(parseInt(form.boostPoints) || 0)})` },
              { label: 'Rescue Points', value: `${form.rescuePoints} pts (${ptCost(parseInt(form.rescuePoints) || 0)})` },
              { label: 'Max VV / Day', value: form.maxVVPerDay },
              { label: 'Max VV / User / Week', value: form.maxVVPerUserPerWeek },
              { label: 'CPA Stop-Loss', value: `$${form.cpaMaxUsd}` },
              { label: 'Min Trust Tier', value: TRUST_TIER_LABEL[form.minTrustTier] },
              { label: 'PIN Required', value: form.pinRequired ? 'Yes' : 'No' },
            ].map(({ label, value }) => (
              <View key={label} style={[s.reviewRow, { borderBottomColor: colors.border ?? '#222' }]}>
                <Text style={[s.reviewLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[s.reviewValue, { color: colors.text }]}>{value}</Text>
              </View>
            ))}

            {/* Schedule windows detail */}
            {form.windows.length > 0 && (
              <View style={[s.card, { backgroundColor: colors.card, marginTop: 4 }]}>
                <Text style={[s.cardTitle, { color: colors.text }]}>Schedule</Text>
                {form.windows.map((w, i) => (
                  <Text key={i} style={[s.reviewLabel, { color: colors.textSecondary, marginBottom: 4 }]}>
                    {w.dow.map((d) => DOW_LABELS[d]).join(', ')} · {w.startTime}–{w.endTime}
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[s.activateBtn, loading && { opacity: 0.6 }]}
              onPress={handleActivate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="rocket" size={18} color="#fff" />
                  <Text style={s.activateBtnText}>Activate Campaign</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Nav buttons */}
      {step < TOTAL_STEPS && (
        <View style={[s.navRow, { borderTopColor: colors.border ?? '#222', backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={back}
            style={[s.navBtnSecondary, { backgroundColor: colors.card }]}
            disabled={step === 1}
          >
            <Text style={[s.navBtnSecondaryText, { color: step === 1 ? colors.textSecondary : colors.text }]}>
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={next} style={s.navBtnPrimary}>
            <Text style={s.navBtnPrimaryText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.base,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  progressWrap: { flexDirection: 'row', marginHorizontal: SPACE.base, borderRadius: RADIUS.xs, overflow: 'hidden', height: 4 },
  progressSegment: { flex: 1, height: 4 },
  stepLabel: { fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 4 },
  stepTitle: { fontSize: 20, fontWeight: '800' },
  stepDesc: { fontSize: 13, lineHeight: 19, marginTop: -8 },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600' },
  textInput: {
    height: 46,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  inputHint: { fontSize: 11, marginTop: 2 },
  infoBox: { flexDirection: 'row', padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'flex-start' },
  card: { borderRadius: RADIUS.md, padding: SPACE.base, gap: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  windowRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  windowDays: { fontSize: 13, fontWeight: '700' },
  windowTime: { fontSize: 12, marginTop: 2 },
  dowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dowChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  dowChipText: { fontSize: 12, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  timeSep: { fontSize: 18, paddingBottom: 12 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  rewardRow: { flexDirection: 'row', borderRadius: RADIUS.md, padding: 14, alignItems: 'center', overflow: 'hidden' },
  rewardColorBar: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  rewardLabel: { fontSize: 14, fontWeight: '700' },
  rewardHint: { fontSize: 11, marginTop: 2 },
  rewardInputWrap: { alignItems: 'center', gap: 4 },
  rewardInput: { width: 80, height: 44, borderRadius: RADIUS.sm, textAlign: 'center', fontSize: 18, fontWeight: '800', borderWidth: 1.5 },
  rewardCost: { fontSize: 10, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { flex: 1, fontSize: 14 },
  toggle: { width: 46, height: 26, borderRadius: 13, borderWidth: 1, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  reviewLabel: { fontSize: 13 },
  reviewValue: { fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 12 },
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: RADIUS.base,
    marginTop: 8,
    gap: 8,
  },
  activateBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  navRow: { flexDirection: 'row', padding: SPACE.base, gap: 12, borderTopWidth: StyleSheet.hairlineWidth },
  navBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.sm, alignItems: 'center' },
  navBtnSecondaryText: { fontSize: 15, fontWeight: '700' },
  navBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
