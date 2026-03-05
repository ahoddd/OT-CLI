/**
 * OrbOps™ — Work Order detail: timeline + role-based actions.
 * Customer: Approve / Dispute. Partner: Accept, Schedule, Milestones, Submit completion.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { useAuth } from '../../context/AuthContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { useTheme } from '../../hooks/useTheme';
import { WORK_ORDER_CATEGORY_LABELS } from '../../constants/OrbOps';
import type { WorkOrderCategory } from '../../constants/OrbOps';
import { COLORS } from '../../constants/Colors';
import type { WorkOrderPayload } from '../../services/orbOps';
import { showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

function statusLabel(s: string): string {
  const labels: Record<string, string> = {
    REQUESTED: 'Requested', CLARIFYING: 'Clarifying', ACCEPTED: 'Accepted', SCHEDULED: 'Scheduled',
    EN_ROUTE: 'En route', STARTED: 'Started', MIDPOINT_PROOF: 'In progress',
    COMPLETED_PENDING_APPROVAL: 'Pending your approval', COMPLETED: 'Completed', DISPUTED: 'Disputed', CANCELED: 'Canceled',
  };
  return labels[s] ?? s;
}

export default function WorkOrderDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { user, loading: authLoading } = useAuth();
  const { myPartnerId } = useMyPartner();
  const uid = user?.uid ?? '';

  if (!authLoading && !user) {
    return <Redirect href="/auth/login" />;
  }
  const { getOne, accept, schedule, submitMilestone, submitCompletion, approve, dispute, cancel, refresh } = useWorkOrders();
  const [wo, setWo] = useState<WorkOrderPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [summaryLine, setSummaryLine] = useState('');
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleStart, setScheduleStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [scheduleDurationHours, setScheduleDurationHours] = useState(2);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await getOne(id);
    if (res.success && res.workOrder) setWo(res.workOrder);
    else setWo(null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const isRequester = wo?.requesterUid === uid;
  const isPartner = Boolean(myPartnerId && wo?.partnerId === myPartnerId);

  const handleAccept = async () => {
    if (!wo || !isPartner) return;
    setBusy(true);
    const res = await accept(wo.id);
    setBusy(false);
    if (res.success) await load();
    else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.');
  };

  const openScheduleModal = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    setScheduleStart(d);
    setScheduleDurationHours(2);
    setScheduleModalVisible(true);
  };

  const handleScheduleConfirm = async () => {
    if (!wo || !isPartner) return;
    const start = scheduleStart.getTime();
    const end = start + scheduleDurationHours * 60 * 60 * 1000;
    setScheduleModalVisible(false);
    setBusy(true);
    const res = await schedule(wo.id, start, end);
    setBusy(false);
    if (res.success) await load();
    else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.');
  };

  const handleMilestone = async (type: 'EN_ROUTE' | 'STARTED' | 'MIDPOINT_PROOF') => {
    if (!wo || !isPartner) return;
    setBusy(true);
    const res = await submitMilestone(wo.id, type, `milestone_${type}_${Date.now()}`);
    setBusy(false);
    if (res.success) await load();
    else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.');
  };

  const handleSubmitCompletion = async () => {
    if (!wo || !isPartner) return;
    setBusy(true);
    const res = await submitCompletion(wo.id, `complete_${Date.now()}`, { summaryLine: summaryLine || wo.title, afterMediaRefs: [] });
    setBusy(false);
    if (res.success) await load();
    else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.');
  };

  const handleApprove = async () => {
    if (!wo || !isRequester) return;
    setBusy(true);
    const res = await approve(wo.id, `approve_${Date.now()}`);
    setBusy(false);
    if (res.success) {
      if (res.receiptId && flags.isOrbOpsJobProofReceiptEnabled) {
        const pts = String(res.pointsAwarded ?? 60);
        const summary = encodeURIComponent(wo.title || 'Job completed');
        router.replace(`/proof/${res.receiptId}?partner=${encodeURIComponent(wo.partnerId)}&points=${pts}&createdAt=${Date.now()}&summaryLine=${summary}`);
      } else {
        await load();
      }
    } else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.');
  };

  const handleDispute = async () => {
    if (!wo || !isRequester) return;
    const reason = disputeReason.trim() || 'No details provided';
    setBusy(true);
    const res = await dispute(wo.id, reason);
    setBusy(false);
    if (res.success) await load();
    else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.');
  };

  const handleCancel = async () => {
    if (!wo || !isRequester) return;
    setBusy(true);
    const res = await cancel(wo.id);
    setBusy(false);
    if (res.success) await load();
    else showErrorAlert("Request didn't complete", res.message ?? 'Please try again.');
  };

  if (!flags.isOrbOpsEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Work Order</Text>
        </View>
        <Text style={[styles.offText, { color: colors.text }]}>OrbOps is disabled.</Text>
      </SafeAreaView>
    );
  }

  if (loading || !wo) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Work Order</Text>
        </View>
        <View style={styles.loadWrap}>
          <ActivityIndicator size="large" color={COLORS.neonBlue?.[0]} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>{wo ? 'Loading…' : 'Not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scheduleData = wo.schedule as { confirmedStartAt?: number; confirmedEndAt?: number } | undefined;
  const milestones = (wo.milestones ?? []) as Array<{ type: string; createdAt: number; completedAt?: number; notes?: string }>;
  const canRequesterCancel = ['REQUESTED', 'CLARIFYING', 'ACCEPTED', 'SCHEDULED'].includes(wo.status);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{wo.title}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statusPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statusText, { color: COLORS.neonBlue?.[0] }]}>{statusLabel(wo.status)}</Text>
        </View>
        <Text style={[styles.category, { color: colors.textSecondary }]}>{WORK_ORDER_CATEGORY_LABELS[wo.category as WorkOrderCategory] ?? wo.category}</Text>
        {wo.description ? <Text style={[styles.desc, { color: colors.text }]}>{wo.description}</Text> : null}
        {scheduleData?.confirmedStartAt ? (
          <Text style={[styles.scheduleText, { color: colors.textSecondary }]}>
            Scheduled: {new Date(scheduleData.confirmedStartAt).toLocaleString()}
          </Text>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TIMELINE</Text>
        {milestones.length === 0 ? (
          <Text style={[styles.muted, { color: colors.textSecondary }]}>No milestones yet.</Text>
        ) : (
          milestones.map((m, i) => (
            <View key={`${m.type}-${m.createdAt}`} style={[styles.timelineRow, { borderLeftColor: colors.border }]}>
              <View style={[styles.timelineDot, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa' }]} />
              <View style={styles.timelineBody}>
                <Text style={[styles.timelineType, { color: colors.text }]}>{m.type.replace(/_/g, ' ')}</Text>
                <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>{new Date(m.createdAt).toLocaleString()}</Text>
                {m.notes ? <Text style={[styles.timelineNotes, { color: colors.textSecondary }]}>{m.notes}</Text> : null}
              </View>
            </View>
          ))
        )}

        {/* Partner actions */}
        {isPartner && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIONS</Text>
            {wo.status === 'REQUESTED' && (
              <TouchableOpacity style={[styles.cta, { backgroundColor: COLORS.success }]} onPress={handleAccept} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.ctaText}>Accept</Text>}
              </TouchableOpacity>
            )}
            {wo.status === 'ACCEPTED' && (
              <TouchableOpacity style={[styles.cta, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa' }]} onPress={openScheduleModal} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.ctaText}>Confirm schedule</Text>}
              </TouchableOpacity>
            )}
            {wo.status === 'SCHEDULED' && (
              <TouchableOpacity style={[styles.cta, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa' }]} onPress={() => handleMilestone('EN_ROUTE')} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.ctaText}>Mark En Route</Text>}
              </TouchableOpacity>
            )}
            {wo.status === 'EN_ROUTE' && (
              <TouchableOpacity style={[styles.cta, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa' }]} onPress={() => handleMilestone('STARTED')} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.ctaText}>Mark Started</Text>}
              </TouchableOpacity>
            )}
            {(wo.status === 'STARTED' || wo.status === 'MIDPOINT_PROOF') && (
              <>
                <TouchableOpacity style={[styles.ctaSecondary, { borderColor: colors.border }]} onPress={() => handleMilestone('MIDPOINT_PROOF')} disabled={busy}>
                  <Text style={[styles.ctaTextSecondary, { color: colors.text }]}>Add midpoint proof</Text>
                </TouchableOpacity>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Completion summary</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={summaryLine}
                  onChangeText={setSummaryLine}
                  placeholder="Brief summary of work done"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity style={[styles.cta, { backgroundColor: COLORS.success }]} onPress={handleSubmitCompletion} disabled={busy}>
                  {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.ctaText}>Submit completion</Text>}
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* Customer: Cancel (when allowed) */}
        {isRequester && canRequesterCancel && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIONS</Text>
            <TouchableOpacity style={[styles.ctaSecondary, { borderColor: COLORS.danger }]} onPress={handleCancel} disabled={busy}>
              <Text style={[styles.ctaTextSecondary, { color: COLORS.danger }]}>Cancel work order</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Customer: Approve / Dispute */}
        {isRequester && wo.status === 'COMPLETED_PENDING_APPROVAL' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PROOF PACK — Approve or dispute</Text>
            <TouchableOpacity style={[styles.cta, { backgroundColor: COLORS.success }]} onPress={handleApprove} disabled={busy}>
              {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.ctaText}>Approve · Get Job Proof Receipt</Text>}
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="Reason (if disputing)"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity style={[styles.ctaSecondary, { borderColor: COLORS.danger }]} onPress={handleDispute} disabled={busy}>
              <Text style={[styles.ctaTextSecondary, { color: COLORS.danger }]}>Dispute / Request fix</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal visible={scheduleModalVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule work</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Start date & time</Text>
            {Platform.OS === 'web' ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. 2025-03-01 10:00"
                placeholderTextColor={colors.textSecondary}
                value={scheduleStart.toISOString().slice(0, 16)}
                onChangeText={(t) => {
                  const d = new Date(t);
                  if (!isNaN(d.getTime())) setScheduleStart(d);
                }}
              />
            ) : (
              <DateTimePicker
                value={scheduleStart}
                mode="datetime"
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => d && setScheduleStart(d)}
              />
            )}
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary, marginTop: 16 }]}>Duration (hours)</Text>
            <View style={styles.durationRow}>
              {[1, 2, 3, 4].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.durationBtn,
                    { borderColor: colors.border, backgroundColor: scheduleDurationHours === h ? (COLORS.neonBlue?.[0] ?? '#60a5fa') : colors.surface },
                  ]}
                  onPress={() => setScheduleDurationHours(h)}
                >
                  <Text style={[styles.durationBtnText, { color: scheduleDurationHours === h ? '#000' : colors.text }]}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.ctaSecondary, { borderColor: colors.border, flex: 1 }]} onPress={() => setScheduleModalVisible(false)}>
                <Text style={[styles.ctaTextSecondary, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cta, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa', flex: 1, marginLeft: 12 }]} onPress={handleScheduleConfirm} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.ctaText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  category: { fontSize: 12, marginBottom: 8 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  scheduleText: { fontSize: 13, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  muted: { fontSize: 13, marginBottom: 16 },
  timelineRow: { flexDirection: 'row', marginBottom: 16, paddingLeft: 12, borderLeftWidth: 2 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginLeft: -16, marginTop: 4 },
  timelineBody: {},
  timelineType: { fontSize: 14, fontWeight: '700' },
  timelineDate: { fontSize: 11, marginTop: 2 },
  timelineNotes: { fontSize: 12, marginTop: 2 },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  ctaText: { color: '#000', fontSize: 16, fontWeight: '800' },
  ctaSecondary: { paddingVertical: 14, borderRadius: 14, borderWidth: 2, alignItems: 'center', marginBottom: 12 },
  ctaTextSecondary: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  offText: { padding: 24 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, marginBottom: 8 },
  modalActions: { flexDirection: 'row', marginTop: 24 },
  durationRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  durationBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  durationBtnText: { fontSize: 14, fontWeight: '700' },
});
