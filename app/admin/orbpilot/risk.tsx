/**
 * OrbPilot™ Admin — Partner Risk Manager: view campaigns by partner, set risk profiles.
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
  Switch,
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
import type { CampaignDoc, RiskProfile } from '../../../constants/OrbPilot';
import { CAMPAIGN_STATUS_LABEL } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

const RISK_COLORS: Record<RiskProfile, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

const RISK_LABELS: Record<RiskProfile, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

type PartnerGroup = {
  partnerId: string;
  campaigns: CampaignDoc[];
};

function groupByPartner(campaigns: CampaignDoc[]): PartnerGroup[] {
  const map = new Map<string, CampaignDoc[]>();
  for (const c of campaigns) {
    if (!map.has(c.partnerId)) map.set(c.partnerId, []);
    map.get(c.partnerId)!.push(c);
  }
  return Array.from(map.entries()).map(([partnerId, cams]) => ({ partnerId, campaigns: cams }));
}

export default function OrbPilotAdminRisk() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { campaigns, loading, fetchCampaigns, setPartnerRisk } = useOrbPilotAdmin();

  const [riskPartnerId, setRiskPartnerId] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<RiskProfile>('medium');
  const [forcePinRequired, setForcePinRequired] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  if (!isAdminEmail(user?.email ?? '')) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Admin only</Text>
      </SafeAreaView>
    );
  }

  const partnerGroups = groupByPartner(campaigns);

  const handleApply = async () => {
    if (!riskPartnerId.trim()) {
      Alert.alert('Missing', 'Enter a Partner ID');
      return;
    }
    Alert.alert(
      'Set Partner Risk',
      `Set ${riskPartnerId.trim()} to ${RISK_LABELS[selectedRisk]} risk?\nForce PIN: ${forcePinRequired ? 'Yes' : 'No'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply', onPress: async () => {
            setApplying(true);
            const res = await setPartnerRisk(riskPartnerId.trim(), selectedRisk, forcePinRequired);
            setApplying(false);
            if (res.success) {
              Alert.alert('Done', 'Partner risk profile updated');
              setRiskPartnerId('');
              setForcePinRequired(false);
              fetchCampaigns();
            } else {
              Alert.alert('Error', res.message ?? 'Failed to update risk profile');
            }
          }
        }
      ]
    );
  };

  const getPartnerStatus = (group: PartnerGroup) => {
    const active = group.campaigns.filter((c) => c.status === 'active').length;
    const total = group.campaigns.length;
    return { active, total };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Partner Risk Manager</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE.xxl }}>
          {/* Partner list */}
          <View style={{ paddingHorizontal: SPACE.md, marginBottom: SPACE.lg }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              PARTNERS ({partnerGroups.length})
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: SPACE.xxl }} />
            ) : partnerGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No campaigns found</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Partners with active campaigns will appear here</Text>
              </View>
            ) : (
              partnerGroups.map((group) => {
                const { active, total } = getPartnerStatus(group);
                const shortId = group.partnerId.slice(0, 12);
                // Determine if any campaign has pinRequired set (proxy for high risk)
                const hasPinForced = group.campaigns.some((c) => c.pinRequired);
                const hasKilled = group.campaigns.some((c) => c.status === 'killed');

                return (
                  <View key={group.partnerId} style={[styles.partnerCard, { backgroundColor: colors.card }]}>
                    <View style={styles.partnerHeader}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={styles.partnerIdRow}>
                          <Text style={[styles.partnerId, { color: colors.text }]}>{shortId}</Text>
                          {hasKilled && (
                            <View style={[styles.warningBadge, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}>
                              <Text style={{ fontSize: 10 }}>⚠️</Text>
                              <Text style={[styles.warningText, { color: '#EF4444' }]}>Killed</Text>
                            </View>
                          )}
                          {hasPinForced && (
                            <View style={[styles.warningBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
                              <Ionicons name="keypad" size={10} color="#F59E0B" />
                              <Text style={[styles.warningText, { color: '#F59E0B' }]}>PIN Forced</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.partnerCampaignCount, { color: colors.textSecondary }]}>
                          {active} active / {total} total campaigns
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.copyBtn}
                        onPress={() => setRiskPartnerId(group.partnerId)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    {/* Campaign status row */}
                    <View style={styles.campaignStatusRow}>
                      {group.campaigns.slice(0, 6).map((c) => {
                        const statusColor: Record<string, string> = {
                          active: '#22C55E',
                          paused: '#F59E0B',
                          draft: '#94A3B8',
                          ended: '#64748B',
                          killed: '#EF4444',
                        };
                        return (
                          <View
                            key={c.id}
                            style={[styles.statusDot, { backgroundColor: statusColor[c.status] ?? '#94A3B8' }]}
                          />
                        );
                      })}
                      {group.campaigns.length > 6 && (
                        <Text style={[styles.moreText, { color: colors.textSecondary }]}>+{group.campaigns.length - 6}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Set Risk form */}
          <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: SPACE.md }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Set Risk Profile</Text>

            <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border ?? '#374151' }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Partner ID</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Paste or type partnerId…"
                placeholderTextColor={colors.textSecondary}
                value={riskPartnerId}
                onChangeText={setRiskPartnerId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Risk Profile</Text>
            <View style={styles.riskChipsRow}>
              {(['low', 'medium', 'high'] as RiskProfile[]).map((r) => {
                const c = RISK_COLORS[r];
                const isSelected = selectedRisk === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.riskChip,
                      {
                        backgroundColor: isSelected ? c : colors.background,
                        borderColor: isSelected ? c : (colors.border ?? '#374151'),
                      },
                    ]}
                    onPress={() => setSelectedRisk(r)}
                  >
                    <Text style={[styles.riskChipText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                      {RISK_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Force PIN toggle */}
            <View style={[styles.toggleRow, { borderTopColor: colors.border ?? '#374151' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Force PIN Required</Text>
                <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>
                  Override campaign config — users must enter PIN to verify
                </Text>
              </View>
              <Switch
                value={forcePinRequired}
                onValueChange={setForcePinRequired}
                trackColor={{ false: '#374151', true: '#F59E0B' }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: RISK_COLORS[selectedRisk] }, applying && { opacity: 0.6 }]}
              onPress={handleApply}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="warning" size={16} color="#fff" />
              )}
              <Text style={styles.applyBtnText}>{applying ? 'Applying…' : 'Apply Risk Profile'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.md, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: SPACE.sm },
  partnerCard: { borderRadius: RADIUS.md, padding: SPACE.md, marginBottom: SPACE.sm },
  partnerHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm, marginBottom: SPACE.sm },
  partnerIdRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, flexWrap: 'wrap' },
  partnerId: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  partnerCampaignCount: { fontSize: 12 },
  warningBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  warningText: { fontSize: 10, fontWeight: '700' },
  copyBtn: { padding: SPACE.xs },
  campaignStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  moreText: { fontSize: 11 },
  emptyState: { alignItems: 'center', paddingTop: SPACE.xxl, gap: SPACE.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: SPACE.lg },
  card: { borderRadius: RADIUS.md, padding: SPACE.md },
  formTitle: { fontSize: 14, fontWeight: '700', marginBottom: SPACE.sm },
  inputWrap: { borderRadius: RADIUS.sm, borderWidth: 1, paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs, marginBottom: SPACE.sm },
  inputLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  input: { fontSize: 13, paddingVertical: 2 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACE.xs },
  riskChipsRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.md },
  riskChip: { flex: 1, borderRadius: RADIUS.full, paddingVertical: 8, borderWidth: 1, alignItems: 'center' },
  riskChipText: { fontSize: 13, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, paddingTop: SPACE.md, borderTopWidth: StyleSheet.hairlineWidth, marginBottom: SPACE.md },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleSub: { fontSize: 12, marginTop: 2 },
  applyBtn: { borderRadius: RADIUS.md, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
