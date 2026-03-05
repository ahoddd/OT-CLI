/**
 * OrbPilot™ Admin — Rules & Thresholds Editor: edit global engine defaults.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../context/AuthContext';
import { isAdminEmail } from '../../../constants/Admin';
import { useOrbPilotAdmin } from '../../../hooks/useOrbPilotAdmin';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import { OrbPilotDefaults } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

// Field definitions for the rules editor
type FieldDef = {
  key: string;
  label: string;
  description: string;
  unit: string;
  defaultValue: number;
  section: string;
  step?: number;
};

const FIELD_SECTIONS: FieldDef[] = [
  // Economics
  { key: 'otPointCostUsd', label: 'OT Point Cost', description: 'USD value per 1 OT Point (used for budget math)', unit: 'USD', defaultValue: OrbPilotDefaults.otPointCostUsd, section: 'Economics', step: 0.001 },
  { key: 'cpaMaxUsd', label: 'CPA Max', description: 'Stop-loss threshold per verified visit in USD', unit: 'USD', defaultValue: OrbPilotDefaults.cpaMaxUsd, section: 'Economics', step: 0.1 },
  { key: 'boostFillRateThreshold', label: 'Boost Fill-Rate Threshold', description: 'Fill-rate below this triggers Boost tier rewards', unit: 'ratio (0–1)', defaultValue: OrbPilotDefaults.boostFillRateThreshold, section: 'Economics', step: 0.05 },
  { key: 'rescueFillRateThreshold', label: 'Rescue Fill-Rate Threshold', description: 'Fill-rate below this triggers Rescue tier rewards', unit: 'ratio (0–1)', defaultValue: OrbPilotDefaults.rescueFillRateThreshold, section: 'Economics', step: 0.05 },

  // PIN
  { key: 'pinLength', label: 'PIN Length', description: 'Number of digits in the rotating PIN', unit: 'digits', defaultValue: OrbPilotDefaults.pinLength, section: 'PIN' },
  { key: 'pinRotationSeconds', label: 'PIN Rotation Interval', description: 'How often the PIN rotates (seconds)', unit: 'seconds', defaultValue: OrbPilotDefaults.pinRotationSeconds, section: 'PIN' },

  // Geo
  { key: 'claimRadiusMeters', label: 'Claim Radius', description: 'Max distance from partner to claim a slot', unit: 'meters', defaultValue: OrbPilotDefaults.claimRadiusMeters, section: 'Geo & Timing' },
  { key: 'verifyRadiusMeters', label: 'Verify Radius', description: 'Max distance from partner at verify time', unit: 'meters', defaultValue: OrbPilotDefaults.verifyRadiusMeters, section: 'Geo & Timing' },
  { key: 'maxAccuracyMeters', label: 'Max Accuracy', description: 'GPS accuracy must be within this value at verify', unit: 'meters', defaultValue: OrbPilotDefaults.maxAccuracyMeters, section: 'Geo & Timing' },
  { key: 'completeWithinSeconds', label: 'Complete Within', description: 'Max seconds from initiate to verify complete', unit: 'seconds', defaultValue: OrbPilotDefaults.completeWithinSeconds, section: 'Geo & Timing' },

  // Limits
  { key: 'maxOffersNearby', label: 'Max Offers Nearby', description: 'Max number of offers returned in nearby search', unit: 'offers', defaultValue: OrbPilotDefaults.maxOffersNearby, section: 'Limits' },
];

// Group fields by section
function groupSections(fields: FieldDef[]): Map<string, FieldDef[]> {
  const map = new Map<string, FieldDef[]>();
  for (const f of fields) {
    if (!map.has(f.section)) map.set(f.section, []);
    map.get(f.section)!.push(f);
  }
  return map;
}

export default function OrbPilotAdminRules() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { config, fetchConfig, updateConfig } = useOrbPilotAdmin();

  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingConfig(true);
      await fetchConfig();
      setLoadingConfig(false);
    };
    load();
  }, []);

  // Seed local values from loaded config
  useEffect(() => {
    if (config) {
      const initial: Record<string, string> = {};
      for (const field of FIELD_SECTIONS) {
        const val = config[field.key];
        initial[field.key] = val !== undefined ? String(val) : String(field.defaultValue);
      }
      setLocalValues(initial);
      setIsDirty(false);
    }
  }, [config]);

  if (!isAdminEmail(user?.email ?? '')) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Admin only</Text>
      </SafeAreaView>
    );
  }

  const handleChange = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    // Validate all values are valid numbers
    const updates: Record<string, unknown> = {};
    for (const field of FIELD_SECTIONS) {
      const raw = localValues[field.key];
      if (raw === undefined || raw === '') {
        Alert.alert('Validation Error', `"${field.label}" cannot be empty`);
        return;
      }
      const num = parseFloat(raw);
      if (isNaN(num)) {
        Alert.alert('Validation Error', `"${field.label}" must be a valid number`);
        return;
      }
      if (num < 0) {
        Alert.alert('Validation Error', `"${field.label}" must be non-negative`);
        return;
      }
      updates[field.key] = num;
    }

    Alert.alert(
      'Save All Rules',
      'Apply these thresholds to the OrbPilot engine? Changes take effect on next engine tick.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save', onPress: async () => {
            setSaving(true);
            const res = await updateConfig(updates);
            setSaving(false);
            if (res.success) {
              Alert.alert('Saved', 'Rules & thresholds updated successfully');
              setIsDirty(false);
            } else {
              Alert.alert('Error', res.message ?? 'Save failed');
            }
          }
        }
      ]
    );
  };

  const handleReset = (key: string, defaultValue: number) => {
    handleChange(key, String(defaultValue));
  };

  const sections = groupSections(FIELD_SECTIONS);

  const sectionColors: Record<string, string> = {
    Economics: '#22C55E',
    PIN: '#FBBF24',
    'Geo & Timing': '#0EA5E9',
    Limits: '#A78BFA',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Rules & Thresholds</Text>
          <View style={{ width: 32 }} />
        </View>

        {loadingConfig ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#A78BFA" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading config…</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE.xxl + 80 }}>
            {/* Info banner */}
            <View style={[styles.infoBanner, { backgroundColor: '#A78BFA15', borderColor: '#A78BFA' }]}>
              <Ionicons name="information-circle" size={16} color="#A78BFA" />
              <Text style={[styles.infoBannerText, { color: '#A78BFA' }]}>
                Changes take effect on the next engine tick. Use caution — these affect all campaigns globally.
              </Text>
            </View>

            {Array.from(sections.entries()).map(([sectionName, fields]) => {
              const sectionColor = sectionColors[sectionName] ?? '#7C3AED';
              return (
                <View key={sectionName} style={{ marginHorizontal: SPACE.md, marginBottom: SPACE.lg }}>
                  {/* Section header */}
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: sectionColor }]} />
                    <Text style={[styles.sectionTitle, { color: sectionColor }]}>
                      {sectionName.toUpperCase()}
                    </Text>
                  </View>

                  <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                    {fields.map((field, idx) => {
                      const currentValue = localValues[field.key] ?? String(field.defaultValue);
                      const isDefault = parseFloat(currentValue) === field.defaultValue;
                      const isLast = idx === fields.length - 1;

                      return (
                        <View
                          key={field.key}
                          style={[
                            styles.fieldRow,
                            !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border ?? '#374151' },
                          ]}
                        >
                          <View style={styles.fieldInfo}>
                            <View style={styles.fieldLabelRow}>
                              <Text style={[styles.fieldLabel, { color: colors.text }]}>{field.label}</Text>
                              {!isDefault && (
                                <View style={[styles.modifiedBadge, { backgroundColor: '#FBBF2420', borderColor: '#FBBF24' }]}>
                                  <Text style={{ color: '#FBBF24', fontSize: 9, fontWeight: '700' }}>EDITED</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.fieldDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                              {field.description}
                            </Text>
                            <Text style={[styles.fieldUnit, { color: sectionColor }]}>{field.unit}</Text>
                          </View>

                          <View style={styles.fieldInput}>
                            <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border ?? '#374151' }]}>
                              <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={currentValue}
                                onChangeText={(v) => handleChange(field.key, v)}
                                keyboardType="decimal-pad"
                                placeholder={String(field.defaultValue)}
                                placeholderTextColor={colors.textSecondary}
                                selectTextOnFocus
                              />
                            </View>
                            {!isDefault && (
                              <TouchableOpacity
                                style={styles.resetBtn}
                                onPress={() => handleReset(field.key, field.defaultValue)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="refresh" size={12} color={colors.textSecondary} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Sticky Save button */}
        {!loadingConfig && (
          <View style={[styles.saveBar, { backgroundColor: colors.background, borderTopColor: colors.border ?? '#374151' }]}>
            {isDirty && (
              <Text style={[styles.dirtyHint, { color: '#FBBF24' }]}>Unsaved changes</Text>
            )}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: isDirty ? '#A78BFA' : '#374151' },
                saving && { opacity: 0.6 },
              ]}
              onPress={handleSave}
              disabled={saving || !isDirty}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
              )}
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save All'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.md, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE.sm },
  loadingText: { fontSize: 14 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm, margin: SPACE.md, marginBottom: SPACE.sm, borderRadius: RADIUS.sm, borderWidth: 1, padding: SPACE.sm },
  infoBannerText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, marginBottom: SPACE.xs },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionCard: { borderRadius: RADIUS.md, overflow: 'hidden' },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACE.md, gap: SPACE.sm },
  fieldInfo: { flex: 1 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, marginBottom: 2 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  modifiedBadge: { borderRadius: RADIUS.xs, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1 },
  fieldDescription: { fontSize: 11, lineHeight: 15, marginBottom: 2 },
  fieldUnit: { fontSize: 10, fontWeight: '700' },
  fieldInput: { alignItems: 'flex-end', gap: 4 },
  inputWrap: { borderRadius: RADIUS.xs, borderWidth: 1, paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs, minWidth: 90, alignItems: 'center' },
  input: { fontSize: 14, fontWeight: '700', textAlign: 'right', minWidth: 70 },
  resetBtn: { padding: 2 },
  saveBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, borderTopWidth: StyleSheet.hairlineWidth, gap: SPACE.sm },
  dirtyHint: { fontSize: 12, fontWeight: '600' },
  saveBtn: { borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACE.xl, flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
