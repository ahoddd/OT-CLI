import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import {
  pilotDisputeListAdmin,
  pilotDisputeReview,
  pilotDisputeResolve,
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

export default function DisputesQueueScreen() {
  const { colors } = useTheme();
  const [disputes, setDisputes] = useState<DisputeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | 'all'>('open');
  const [resolving, setResolving] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pilotDisputeListAdmin(filterStatus === 'all' ? undefined : filterStatus, 100);
      if (res.success) setDisputes(res.disputes);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (disputeId: string) => {
    await pilotDisputeReview(disputeId);
    load();
  };

  const handleResolve = async (disputeId: string, resolution: 'approved' | 'denied') => {
    const note = adminNotes[disputeId] || '';
    if (!note.trim() && resolution === 'approved') {
      Alert.alert('Note Required', 'Please add an admin note before approving (triggers reversal).');
      return;
    }
    Alert.alert(
      `${resolution === 'approved' ? 'Approve' : 'Deny'} Dispute`,
      resolution === 'approved'
        ? 'This will reverse the user\'s OT Points reward. Confirm?'
        : 'Deny this dispute? Partner spend is not refunded.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: resolution === 'approved' ? 'Approve & Reverse' : 'Deny',
          style: resolution === 'approved' ? 'destructive' : 'default',
          onPress: async () => {
            setResolving(disputeId);
            const res = await pilotDisputeResolve(disputeId, resolution, note);
            setResolving(null);
            if (res.success) {
              Alert.alert('Done', res.resolution === 'reversed' ? `Points reversed. Txn: ${res.reversalLedgerTxnId}` : 'Dispute denied.');
              load();
            } else {
              Alert.alert('Error', res.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={[styles.title, { color: colors.text }]}>Disputes Queue</Text>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filterStatus === f.key && styles.chipActive]}
              onPress={() => setFilterStatus(f.key)}
            >
              <Text style={[styles.chipLabel, filterStatus === f.key && styles.chipLabelActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {disputes.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No disputes in this queue</Text>
          </View>
        ) : (
          disputes.map((d) => (
            <View key={d.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.row}>
                <Text style={[styles.disputeId, { color: colors.textMuted }]}>#{d.id.slice(0, 8)}</Text>
                <View style={[styles.badge, { backgroundColor: DISPUTE_STATUS_COLOR[d.status] + '22' }]}>
                  <Text style={[styles.badgeText, { color: DISPUTE_STATUS_COLOR[d.status] }]}>
                    {DISPUTE_STATUS_LABEL[d.status]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.field, { color: colors.text }]}>Visit: <Text style={{ color: colors.textSecondary }}>{d.visitId}</Text></Text>
              <Text style={[styles.field, { color: colors.text }]}>Partner: <Text style={{ color: colors.textSecondary }}>{d.partnerId}</Text></Text>
              <Text style={[styles.field, { color: colors.text }]}>By: <Text style={{ color: colors.textSecondary }}>{d.submittedBy}</Text></Text>
              <Text style={[styles.field, { color: colors.text }]}>Reason: <Text style={{ color: colors.textSecondary }}>{d.reason}</Text></Text>
              <Text style={[styles.field, { color: colors.textMuted }]}>{new Date(d.createdAt).toLocaleString()}</Text>

              {(d.status === 'open' || d.status === 'under_review') && (
                <>
                  <TextInput
                    style={[styles.noteInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                    placeholder="Admin note (required to approve)"
                    placeholderTextColor={colors.textMuted}
                    value={adminNotes[d.id] || ''}
                    onChangeText={(t) => setAdminNotes((prev) => ({ ...prev, [d.id]: t }))}
                    multiline
                  />
                  <View style={styles.actions}>
                    {d.status === 'open' && (
                      <TouchableOpacity style={[styles.btn, { backgroundColor: '#1A1A2E' }]} onPress={() => handleReview(d.id)}>
                        <Text style={{ color: '#FBBF24', fontWeight: '600', fontSize: 13 }}>Mark In Review</Text>
                      </TouchableOpacity>
                    )}
                    {resolving === d.id ? (
                      <ActivityIndicator color="#7C3AED" />
                    ) : (
                      <>
                        <TouchableOpacity style={[styles.btn, { backgroundColor: '#7C3AED' }]} onPress={() => handleResolve(d.id, 'approved')}>
                          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Approve + Reverse</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={() => handleResolve(d.id, 'denied')}>
                          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Deny</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </>
              )}
              {d.adminNote && (
                <Text style={[styles.adminNote, { color: colors.accent }]}>Admin note: {d.adminNote}</Text>
              )}
              {d.reversalLedgerTxnId && (
                <Text style={[styles.adminNote, { color: '#22C55E' }]}>Reversed — txn: {d.reversalLedgerTxnId}</Text>
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
  title: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  filterRow: { marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1A1A2E', marginRight: 8 },
  chipActive: { backgroundColor: '#7C3AED' },
  chipLabel: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  chipLabelActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  disputeId: { fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  field: { fontSize: 13, marginBottom: 4 },
  noteInput: { borderRadius: 10, borderWidth: 1, padding: 10, fontSize: 13, marginTop: 10, minHeight: 52, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  adminNote: { fontSize: 12, fontStyle: 'italic', marginTop: 8 },
});
