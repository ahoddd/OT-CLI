/**
 * OrbPilot™ Reward Ladder Editor — Edit base, boost, and rescue OT Point rewards.
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
import { OrbPilotDefaults, REWARD_TIER_COLOR, REWARD_TIER_LABEL } from '../../../constants/OrbPilot';
import type { RewardTier } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

const REWARD_TIERS: RewardTier[] = ['base', 'boost', 'rescue'];

const TIER_META: Record<RewardTier, { icon: string; thresholdInfo: string; description: string }> = {
  base: {
    icon: 'checkmark-circle-outline',
    thresholdInfo: 'Awarded when fill rate ≥ 50%',
    description: 'Standard reward for every successful verified visit during normal business hours.',
  },
  boost: {
    icon: 'trending-up-outline',
    thresholdInfo: 'Auto-activates when fill rate < 50%',
    description: 'Automatically escalates rewards to attract more customers during slower periods.',
  },
  rescue: {
    icon: 'flash-outline',
    thresholdInfo: 'Emergency mode when fill rate < 25%',
    description: 'Maximum rewards to rescue dead hours. Kicks in automatically — no action needed.',
  },
};

export default function OrbPilotRewards() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isOrbPilotEnabled, isOrbPilotPartnerEnabled } = useFlags();
  const router = useRouter();
  const { myPartnerId } = useMyPartner();
  const { campaigns, loading, loadCampaigns, update } = useOrbPilotCampaign(myPartnerId ?? undefined);

  const [basePoints, setBasePoints] = useState(String(OrbPilotDefaults.defaultBasePoints));
  const [boostPoints, setBoostPoints] = useState(String(OrbPilotDefaults.defaultBoostPoints));
  const [rescuePoints, setRescuePoints] = useState(String(OrbPilotDefaults.defaultRescuePoints));
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
    if (activeCampaign?.rewardLadder) {
      setBasePoints(String(activeCampaign.rewardLadder.basePoints));
      setBoostPoints(String(activeCampaign.rewardLadder.boostPoints));
      setRescuePoints(String(activeCampaign.rewardLadder.rescuePoints));
    }
  }, [activeCampaign?.id]);

  const ptValues: Record<RewardTier, { value: string; setter: (v: string) => void }> = {
    base: { value: basePoints, setter: setBasePoints },
    boost: { value: boostPoints, setter: setBoostPoints },
    rescue: { value: rescuePoints, setter: setRescuePoints },
  };

  function ptCost(pts: number) {
    return `$${(pts * OrbPilotDefaults.otPointCostUsd).toFixed(2)}`;
  }

  function validate(): boolean {
    const base = parseInt(basePoints);
    const boost = parseInt(boostPoints);
    const rescue = parseInt(rescuePoints);
    if (isNaN(base) || base < 1) {
      Alert.alert('Invalid', 'Base points must be at least 1.');
      return false;
    }
    if (isNaN(boost) || boost < base) {
      Alert.alert('Invalid', 'Boost points must be greater than or equal to base points.');
      return false;
    }
    if (isNaN(rescue) || rescue < boost) {
      Alert.alert('Invalid', 'Rescue points must be greater than or equal to boost points.');
      return false;
    }
    if (rescue > 5000) {
      Alert.alert('Too High', 'Maximum reward is 5,000 points per visit.');
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
      rewardLadder: {
        basePoints: parseInt(basePoints),
        boostPoints: parseInt(boostPoints),
        rescuePoints: parseInt(rescuePoints),
      },
    });
    setSaving(false);
    if (res.success) {
      Alert.alert('Saved', 'Reward ladder updated successfully.');
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
        <Text style={[styles.title, { color: colors.text }]}>Reward Ladder</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACE.base, gap: 20, paddingBottom: 40 }}>
          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: '#F59E0B10', borderColor: '#F59E0B30' }]}>
            <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
            <Text style={styles.infoText}>
              OrbPilot automatically escalates rewards based on fill rate. You set the points — the
              engine handles the rest.
            </Text>
          </View>

          {!activeCampaign && (
            <View style={[styles.noCampaign, { backgroundColor: colors.card }]}>
              <Text style={[styles.noCampaignText, { color: colors.textSecondary }]}>
                No active campaign. Changes will apply when you create one.
              </Text>
            </View>
          )}

          {/* Reward rows */}
          {REWARD_TIERS.map((tier) => {
            const color = REWARD_TIER_COLOR[tier];
            const meta = TIER_META[tier];
            const { value, setter } = ptValues[tier];
            const pts = parseInt(value) || 0;

            return (
              <View key={tier} style={[styles.rewardCard, { backgroundColor: colors.card }]}>
                {/* Color accent bar */}
                <View style={[styles.accentBar, { backgroundColor: color }]} />
                <View style={styles.rewardContent}>
                  {/* Top row */}
                  <View style={styles.rewardTopRow}>
                    <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
                      <Ionicons name={meta.icon as any} size={20} color={color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.tierLabel, { color: colors.text }]}>
                        {REWARD_TIER_LABEL[tier]} Reward
                      </Text>
                      <Text style={[styles.thresholdInfo, { color }]}>{meta.thresholdInfo}</Text>
                    </View>
                  </View>

                  <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {meta.description}
                  </Text>

                  {/* Point input */}
                  <View style={styles.pointInputRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>OT Points</Text>
                      <TextInput
                        style={[
                          styles.pointInput,
                          {
                            backgroundColor: colors.background,
                            color: colors.text,
                            borderColor: color + '60',
                          },
                        ]}
                        value={value}
                        onChangeText={setter}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={[styles.costBox, { backgroundColor: color + '15' }]}>
                      <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Cost per visit</Text>
                      <Text style={[styles.costValue, { color }]}>{ptCost(pts)}</Text>
                      <Text style={[styles.costPts, { color: colors.textSecondary }]}>{pts} pts</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Cost Summary</Text>
            {[
              { label: 'Base visit', tier: 'base' as RewardTier, pts: parseInt(basePoints) || 0 },
              { label: 'Boost visit', tier: 'boost' as RewardTier, pts: parseInt(boostPoints) || 0 },
              { label: 'Rescue visit', tier: 'rescue' as RewardTier, pts: parseInt(rescuePoints) || 0 },
            ].map(({ label, tier, pts }) => (
              <View key={tier} style={styles.summaryRow}>
                <View style={[styles.summaryDot, { backgroundColor: REWARD_TIER_COLOR[tier] }]} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{ptCost(pts)}</Text>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: colors.border ?? '#333' }]} />
            <Text style={[styles.summaryHint, { color: colors.textSecondary }]}>
              At 50 visits/week mostly at base rate:{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>
                ~{ptCost((parseInt(basePoints) || 0) * 50)} / week
              </Text>
            </Text>
          </View>

          {/* Fill rate thresholds info */}
          <View style={[styles.thresholdCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Fill Rate Thresholds</Text>
            <View style={styles.thresholdRow}>
              <View style={[styles.thresholdBadge, { backgroundColor: '#22C55E20', borderColor: '#22C55E40' }]}>
                <Text style={{ color: '#22C55E', fontWeight: '800', fontSize: 13 }}>≥50%</Text>
              </View>
              <Text style={[styles.thresholdDesc, { color: colors.textSecondary }]}>
                Base rewards apply — campaign running normally
              </Text>
            </View>
            <View style={styles.thresholdRow}>
              <View style={[styles.thresholdBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B40' }]}>
                <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 13 }}>&lt;50%</Text>
              </View>
              <Text style={[styles.thresholdDesc, { color: colors.textSecondary }]}>
                Boost activates automatically to attract customers
              </Text>
            </View>
            <View style={styles.thresholdRow}>
              <View style={[styles.thresholdBadge, { backgroundColor: '#EF444420', borderColor: '#EF444440' }]}>
                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13 }}>&lt;25%</Text>
              </View>
              <Text style={[styles.thresholdDesc, { color: colors.textSecondary }]}>
                Rescue mode — maximum rewards to fill dead hours
              </Text>
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
                <Text style={styles.saveBtnText}>Save Reward Ladder</Text>
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
  infoCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: { color: '#FCD34D', fontSize: 12, flex: 1, lineHeight: 18 },
  noCampaign: { padding: 14, borderRadius: RADIUS.sm, alignItems: 'center' },
  noCampaignText: { fontSize: 13, textAlign: 'center' },
  rewardCard: { borderRadius: RADIUS.md, overflow: 'hidden', flexDirection: 'row' },
  accentBar: { width: 4 },
  rewardContent: { flex: 1, padding: SPACE.base, gap: 10 },
  rewardTopRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tierLabel: { fontSize: 15, fontWeight: '800' },
  thresholdInfo: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  description: { fontSize: 12, lineHeight: 17 },
  pointInputRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  pointInput: { height: 52, borderRadius: RADIUS.sm, textAlign: 'center', fontSize: 22, fontWeight: '800', borderWidth: 1.5 },
  costBox: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: 'center', minWidth: 90 },
  costLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  costValue: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  costPts: { fontSize: 10, marginTop: 1 },
  summaryCard: { borderRadius: RADIUS.md, padding: SPACE.base, gap: 10 },
  summaryTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryLabel: { flex: 1, fontSize: 13 },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  summaryHint: { fontSize: 12 },
  thresholdCard: { borderRadius: RADIUS.md, padding: SPACE.base, gap: 12 },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thresholdBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, minWidth: 56, alignItems: 'center' },
  thresholdDesc: { flex: 1, fontSize: 12, lineHeight: 17 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: RADIUS.base,
    gap: 8,
  },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
