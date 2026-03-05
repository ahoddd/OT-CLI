/**
 * OrbOpportunities — Partner opportunity detail: applicants, accept/reject, verify completion.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { alert as alertDialog } from '../../../utils/alert';
import {
  useOpportunityById,
  useApplicationsForOpportunity,
  useUpdateApplicationStatus,
  useVerifyCompletion,
  useMarkNoShow,
} from '../../../hooks/useOpportunities';
import { APPLICATION_STATUS_LABELS } from '../../../constants/Opportunities';
import type { ApplicationStatus } from '../../../constants/Opportunities';
import { COLORS } from '../../../constants/Colors';
import { useI18n } from '../../../context/I18nContext';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PartnerOpportunityDetailScreen() {
  const { t } = useI18n();
  const { id, partnerId } = useLocalSearchParams<{ id: string; partnerId?: string }>();
  const pid = partnerId ?? 'p1';
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const insets = useSafeAreaInsets();
  const opportunity = useOpportunityById(id ?? null);
  const applications = useApplicationsForOpportunity(id ?? null);
  const updateStatus = useUpdateApplicationStatus(id ?? '', () => {});
  const verifyCompletion = useVerifyCompletion(pid);
  const markNoShow = useMarkNoShow(pid);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  if (!id || !opportunity) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Opportunity</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAccept = (appId: string) => updateStatus(appId, 'ACCEPTED');
  const handleReject = (appId: string) => updateStatus(appId, 'REJECTED');
  const handleVerify = (appId: string, userId: string) => {
    const app = applications.find((a) => a.id === appId && a.status === 'ACCEPTED');
    if (!app) return;
    setVerifyingId(appId);
    verifyCompletion(
      opportunity.id,
      appId,
      userId,
      opportunity.title,
      opportunity.compensation,
      opportunity.durationHours,
      opportunity.locationId,
      undefined
    );
    setVerifyingId(null);
    alertDialog('Verification complete', 'A Verified Work Receipt has been created for this applicant.', [{ text: 'OK' }]);
  };
  const handleNoShow = (userId: string) => {
    markNoShow(userId, 'no_show');
    alertDialog('No-show recorded', 'The applicant has been marked as a no-show. They may be temporarily restricted from applying.', [{ text: 'OK' }]);
  };

  const accepted = applications.filter((a) => a.status === 'ACCEPTED');
  const pending = applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'REVIEWED');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{opportunity.title}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>Status: {opportunity.status}</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>Start: {formatDate(opportunity.startAt)}</Text>
          {opportunity.capacity != null && (
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Slots: {accepted.length} / {opportunity.capacity}</Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPLICANTS</Text>
        {pending.map((app) => (
          <View key={app.id} style={[styles.appCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.appId, { color: colors.text }]}>Applicant {app.userId.slice(0, 8)}…</Text>
            <Text style={[styles.appMeta, { color: colors.textSecondary }]}>{APPLICATION_STATUS_LABELS[app.status]} · {formatDate(app.submittedAt)}</Text>
            {app.availability && <Text style={[styles.appMeta, { color: colors.textSecondary }]}>Availability: {app.availability}</Text>}
            {app.note && <Text style={[styles.appNote, { color: colors.text }]} numberOfLines={2}>{app.note}</Text>}
            <View style={styles.appActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(app.id)}>
                <Text style={styles.actionBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(app.id)}>
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {accepted.map((app) => (
          <View key={app.id} style={[styles.appCard, { backgroundColor: colors.surface, borderColor: COLORS.success + '60' }]}>
            <Text style={[styles.appId, { color: colors.text }]}>Applicant {app.userId.slice(0, 8)}…</Text>
            <Text style={[styles.appMeta, { color: COLORS.success }]}>Accepted · {formatDate(app.acceptedAt ?? app.updatedAt)}</Text>
            <View style={styles.appActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.verifyBtn, { backgroundColor: themeGold }, verifyingId === app.id && styles.actionBtnDisabled]}
                onPress={() => handleVerify(app.id, app.userId)}
                disabled={verifyingId !== null}
              >
                <Ionicons name="checkmark-circle" size={18} color="#000" />
                <Text style={styles.actionBtnText}>Verify completion</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.noShowBtn]} onPress={() => handleNoShow(app.userId)}>
                <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>No-show</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {applications.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No applications yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  metaCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  metaText: { fontSize: 13, marginBottom: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  appCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  appId: { fontSize: 14, fontWeight: '700' },
  appMeta: { fontSize: 12, marginTop: 4 },
  appNote: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  appActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  acceptBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: '#1a1a1e' },
  verifyBtn: {},
  noShowBtn: { backgroundColor: 'transparent' },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 14 },
});
