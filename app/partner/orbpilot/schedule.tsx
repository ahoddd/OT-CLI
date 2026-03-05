/**
 * OrbPilot™ Schedule Editor — Edit campaign schedule windows and blackout dates.
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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useFlags } from '../../../components/FlagContext';
import { useOrbPilotCampaign } from '../../../hooks/useOrbPilotCampaign';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import type { TimeWindow, CampaignDoc } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        styles.dowChip,
        selected
          ? { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' }
          : { backgroundColor: colors.card, borderColor: colors.border ?? '#333' },
      ]}
    >
      <Text style={[styles.dowChipText, { color: selected ? '#fff' : colors.textSecondary }]}>
        {DOW_LABELS[index]}
      </Text>
    </TouchableOpacity>
  );
}

export default function OrbPilotSchedule() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isOrbPilotEnabled, isOrbPilotPartnerEnabled } = useFlags();
  const router = useRouter();
  const { myPartnerId } = useMyPartner();
  const { campaigns, loading, loadCampaigns, update } = useOrbPilotCampaign(myPartnerId ?? undefined);

  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Add window form state
  const [newDow, setNewDow] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('21:00');
  const [newBlackout, setNewBlackout] = useState('');

  const activeCampaign: CampaignDoc | null =
    campaigns.find((c) => c.status === 'active' || c.status === 'paused') ??
    campaigns[0] ??
    null;

  useFocusEffect(
    useCallback(() => {
      loadCampaigns();
    }, []),
  );

  // Sync local state from campaign when campaigns load
  useCallback(() => {
    if (activeCampaign) {
      setWindows(activeCampaign.schedule ?? []);
      setBlackoutDates(activeCampaign.blackoutDates ?? []);
    }
  }, [activeCampaign])();

  // Keep local state in sync when activeCampaign changes
  React.useEffect(() => {
    if (activeCampaign) {
      setWindows(activeCampaign.schedule ?? []);
      setBlackoutDates(activeCampaign.blackoutDates ?? []);
    }
  }, [activeCampaign?.id]);

  function toggleDow(dow: number) {
    setNewDow((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort((a, b) => a - b),
    );
  }

  function handleAddWindow() {
    if (newDow.length === 0) {
      Alert.alert('Select Days', 'Choose at least one day of the week.');
      return;
    }
    if (!newStart.match(/^\d{2}:\d{2}$/) || !newEnd.match(/^\d{2}:\d{2}$/)) {
      Alert.alert('Invalid Time', 'Use HH:MM format (e.g. 09:00).');
      return;
    }
    if (newStart >= newEnd) {
      Alert.alert('Invalid Range', 'Start time must be before end time.');
      return;
    }
    setWindows((prev) => [
      ...prev,
      { dow: newDow, startTime: newStart, endTime: newEnd },
    ]);
    // Reset form
    setNewDow([1, 2, 3, 4, 5]);
    setNewStart('09:00');
    setNewEnd('21:00');
  }

  function handleRemoveWindow(index: number) {
    setWindows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddBlackout() {
    const trimmed = newBlackout.trim();
    if (!trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid Date', 'Enter date in YYYY-MM-DD format (e.g. 2026-12-25).');
      return;
    }
    if (blackoutDates.includes(trimmed)) {
      Alert.alert('Duplicate', 'This date is already in the blackout list.');
      return;
    }
    setBlackoutDates((prev) => [...prev, trimmed].sort());
    setNewBlackout('');
  }

  function handleRemoveBlackout(date: string) {
    setBlackoutDates((prev) => prev.filter((d) => d !== date));
  }

  async function handleSave() {
    if (!activeCampaign) {
      Alert.alert('No Campaign', 'No active or paused campaign to update.');
      return;
    }
    if (windows.length === 0) {
      Alert.alert('Schedule Required', 'Add at least one schedule window before saving.');
      return;
    }
    setSaving(true);
    const res = await update(activeCampaign.id, {
      schedule: windows,
      blackoutDates,
    });
    setSaving(false);
    if (res.success) {
      Alert.alert('Saved', 'Schedule updated successfully.');
    } else {
      Alert.alert('Error', res.message ?? 'Failed to save schedule');
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
        <Text style={[styles.title, { color: colors.text }]}>Schedule</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 60 }} />
      ) : !activeCampaign ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: SPACE.base }}>
          <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center' }}>
            No active campaign found.{'\n'}Create a campaign first.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/partner/orbpilot/setup' as any)}
            style={[styles.setupBtn, { backgroundColor: '#7C3AED20', borderColor: '#7C3AED40' }]}
          >
            <Text style={{ color: '#7C3AED', fontWeight: '700' }}>Create Campaign</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACE.base, gap: 20, paddingBottom: 100 }}>
          {/* Campaign badge */}
          <View style={[styles.campaignBadge, { backgroundColor: '#0EA5E910', borderColor: '#0EA5E930' }]}>
            <Ionicons name="megaphone-outline" size={14} color="#0EA5E9" />
            <Text style={{ color: '#0EA5E9', fontSize: 12, fontWeight: '700', marginLeft: 6 }}>
              Editing: Campaign #{activeCampaign.id.slice(0, 8)}...
            </Text>
          </View>

          {/* ── Active Windows ── */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Schedule Windows ({windows.length})
            </Text>
            {windows.length === 0 ? (
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                No windows yet. Add one below.
              </Text>
            ) : (
              windows.map((w, i) => (
                <View key={i} style={[styles.windowRow, { borderBottomColor: colors.border ?? '#222' }]}>
                  <View style={styles.windowDowRow}>
                    {w.dow.map((d) => (
                      <View key={d} style={[styles.dowBadge, { backgroundColor: '#0EA5E920' }]}>
                        <Text style={{ color: '#0EA5E9', fontSize: 11, fontWeight: '700' }}>
                          {DOW_LABELS[d]}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.windowTimeRow}>
                    <Text style={[styles.windowTime, { color: colors.text }]}>
                      {w.startTime} – {w.endTime}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveWindow(i)}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* ── Add Window ── */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Window</Text>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Days of week</Text>
            <View style={styles.dowRow}>
              {DOW_LABELS.map((_, i) => (
                <DowChip
                  key={i}
                  index={i}
                  selected={newDow.includes(i)}
                  onToggle={() => toggleDow(i)}
                  colors={colors}
                />
              ))}
            </View>
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Start (HH:MM)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border ?? '#333' }]}
                  value={newStart}
                  onChangeText={setNewStart}
                  placeholder="09:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <Text style={[styles.timeDash, { color: colors.textSecondary }]}>—</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>End (HH:MM)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border ?? '#333' }]}
                  value={newEnd}
                  onChangeText={setNewEnd}
                  placeholder="21:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={handleAddWindow}
              style={[styles.addBtn, { backgroundColor: '#0EA5E920', borderColor: '#0EA5E940' }]}
            >
              <Ionicons name="add-circle-outline" size={18} color="#0EA5E9" />
              <Text style={{ color: '#0EA5E9', fontWeight: '700', marginLeft: 6 }}>Add Window</Text>
            </TouchableOpacity>
          </View>

          {/* ── Blackout Dates ── */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Blackout Dates</Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary, marginBottom: 8 }]}>
              No slots will be released on these dates (e.g. holidays).
            </Text>
            {blackoutDates.length === 0 ? (
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>None set.</Text>
            ) : (
              <View style={styles.blackoutList}>
                {blackoutDates.map((d) => (
                  <View key={d} style={[styles.blackoutChip, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}>
                    <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>{d}</Text>
                    <TouchableOpacity onPress={() => handleRemoveBlackout(d)} style={{ marginLeft: 6 }}>
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.blackoutInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border ?? '#333' }]}
                value={newBlackout}
                onChangeText={setNewBlackout}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                onPress={handleAddBlackout}
                style={[styles.addBtnSmall, { backgroundColor: '#EF444420', borderColor: '#EF444440' }]}
              >
                <Ionicons name="add" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
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
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
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
  campaignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  section: { borderRadius: RADIUS.md, padding: SPACE.base, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  emptyHint: { fontSize: 13 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  windowRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 6 },
  windowDowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dowBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  windowTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  windowTime: { fontSize: 14, fontWeight: '700' },
  dowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dowChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  dowChipText: { fontSize: 12, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  timeDash: { fontSize: 18, paddingBottom: 12 },
  input: { height: 46, borderRadius: RADIUS.sm, paddingHorizontal: 14, fontSize: 15, borderWidth: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1 },
  addBtnSmall: { width: 46, height: 46, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  blackoutList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  blackoutChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1 },
  blackoutInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    borderRadius: RADIUS.base,
    gap: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  setupBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.sm, borderWidth: 1 },
});
