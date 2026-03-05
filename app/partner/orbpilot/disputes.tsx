import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useMyPartner } from '../../../hooks/useMyPartner';
import {
  pilotDisputeListPartner,
  pilotDisputeSubmit,
} from '../../../services/orbPilot';
import {
  DISPUTE_STATUS_LABEL,
  DISPUTE_STATUS_COLOR,
  type DisputeDoc,
  type DisputeStatus,
} from '../../../constants/OrbPilot';

const FILTERS: Array<{ key: DisputeStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'under_review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'denied', label: 'Denied' },
  { key: 'reversed', label: 'Reversed' },
];

export default function OrbPilotDisputesScreen() {
  const { colors } = useTheme();
  const { myPartnerId } = useMyPartner();
  const [disputes, setDisputes] = useState<DisputeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | 'all'>('all');
  const [submitVisitId, setSubmitVisitId] = useState('');
  const [submitReason, setSubmitReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDisputes = useCallback(async () => {
    if (!myPartnerId) return;
    setLoading(true);
    try {
      const res = await pilotDisputeListPartner(myPartnerId, filterStatus === 'all' ? undefined : filterStatus);
      if (res.success) setDisputes(res.disputes);
    } finally {
      setLoading(false);
    }
  }, [myPartnerId, filterStatus]);

  React.useEffect(() => { loadDisputes(); }, [loadDisputes]);

  const handleSubmitDispute = async () => {
    if (!submitVisitId.trim() || !submitReason.trim()) {
      Alert.alert('Missing Info', 'Please enter a Visit ID and reason.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await pilotDisputeSubmit(submitVisitId.trim(), submitReason.trim(), 'partner');
      if (res.success) {
        Alert.alert('Dispute Submitted', `Dispute ID: ${res.disputeId}`);
        setSubmitVisitId('');
        setSubmitReason('');
        loadDisputes();
      } else {
        Alert.alert('Error', res.message ?? 'Could not submit dispute');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = disputes; // Already filtered by backend

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDisputes} />}
      >
        <Text style={[styles.title, { color: colors.text }]}>Disputes</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Raise a dispute for a visit you believe should be reviewed.
        </Text>

        {/* Submit Form */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Submit New Dispute</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
            placeholder="Visit ID"
            placeholderTextColor={colors.textMuted}
            value={submitVisitId}
            onChangeText={setSubmitVisitId}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, styles.inputMulti, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
            placeholder="Reason (describe the issue)"
            placeholderTextColor={colors.textMuted}
            value={submitReason}
            onChangeText={setSubmitReason}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#7C3AED', opacity: submitting ? 0.6 : 1 }]}
            onPress={handleSubmitDispute}
            disabled={submitting}
          >
            <Ionicons name="flag" size={16} color="#fff" />
            <Text style={styles.btnText}>{submitting ? 'Submitting…' : 'Submit Dispute'}</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filterStatus === f.key && styles.filterChipActive]}
              onPress={() => setFilterStatus(f.key)}
            >
              <Text style={[styles.filterLabel, filterStatus === f.key && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No disputes found</Text>
          </View>
        ) : (
          filtered.map((dispute) => (
            <View key={dispute.id} style={[styles.disputeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.disputeHeader}>
                <Text style={[styles.disputeVisit, { color: colors.text }]}>Visit: {dispute.visitId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: DISPUTE_STATUS_COLOR[dispute.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: DISPUTE_STATUS_COLOR[dispute.status] }]}>
                    {DISPUTE_STATUS_LABEL[dispute.status]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.disputeReason, { color: colors.textSecondary }]}>{dispute.reason}</Text>
              <Text style={[styles.disputeDate, { color: colors.textMuted }]}>{new Date(dispute.createdAt).toLocaleDateString()}</Text>
              {dispute.adminNote && (
                <Text style={[styles.adminNote, { color: colors.accent }]}>Admin: {dispute.adminNote}</Text>
              )}
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, marginBottom: 10 },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, justifyContent: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  filterRow: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1A1A2E', marginRight: 8 },
  filterChipActive: { backgroundColor: '#7C3AED' },
  filterLabel: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  filterLabelActive: { color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 15 },
  disputeCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  disputeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  disputeVisit: { fontSize: 13, fontWeight: '600', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  disputeReason: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  disputeDate: { fontSize: 11 },
  adminNote: { fontSize: 12, fontStyle: 'italic', marginTop: 6 },
});
