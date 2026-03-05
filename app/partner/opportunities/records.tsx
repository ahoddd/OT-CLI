/**
 * OrbOpportunities — Partner records & export (CSV/JSON) for bookkeeping.
 * Disclaimers: no tax advice; consult accountant.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import {
  getExportOpportunities,
  getExportApplications,
  getExportReceipts,
} from '../../../hooks/useOpportunities';
import {
  OPPORTUNITIES_EXPORT_COLUMNS,
  APPLICATIONS_EXPORT_COLUMNS,
  RECEIPTS_EXPORT_COLUMNS,
  type Opportunity,
  type OpportunityApplication,
  type WorkReceipt,
} from '../../../constants/Opportunities';
import { COLORS } from '../../../constants/Colors';
import { useI18n } from '../../../context/I18nContext';

type DateRangePreset = 'month' | 'quarter' | 'year';

function getRangeForPreset(preset: DateRangePreset): { from: number; to: number } {
  const now = Date.now();
  const d = new Date();
  let from: number;
  if (preset === 'month') {
    d.setMonth(d.getMonth() - 1);
    from = d.getTime();
  } else if (preset === 'quarter') {
    d.setMonth(d.getMonth() - 3);
    from = d.getTime();
  } else {
    d.setFullYear(d.getFullYear() - 1);
    from = d.getTime();
  }
  return { from, to: now };
}

function rowToCsvRow(obj: Record<string, unknown>): string {
  return Object.values(obj).map((v) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }).join(',');
}

function buildOpportunitiesCsv(rows: Opportunity[], timezone: string, generatedAt: string): string {
  const header = [...OPPORTUNITIES_EXPORT_COLUMNS, 'timezone', 'exportGeneratedAt'].join(',');
  const dataRows = rows.map((o) => {
    const comp = o.compensation;
    const obj: Record<string, unknown> = {
      opportunityId: o.id,
      title: o.title,
      type: o.type,
      locationId: o.locationId ?? '',
      status: o.status,
      createdAt: o.createdAt,
      publishedAt: o.publishedAt ?? '',
      startAt: o.startAt,
      compensationType: comp.type,
      compensationMin: comp.payMin ?? '',
      compensationMax: comp.payMax ?? '',
      perkValue: comp.perkValue ?? '',
      capacity: o.capacity ?? '',
      timezone,
      exportGeneratedAt: generatedAt,
    };
    return rowToCsvRow(obj);
  });
  return [header, ...dataRows].join('\n');
}

function buildApplicationsCsv(rows: OpportunityApplication[], timezone: string, generatedAt: string): string {
  const header = [...APPLICATIONS_EXPORT_COLUMNS, 'timezone', 'exportGeneratedAt'].join(',');
  const dataRows = rows.map((a) => {
    const obj: Record<string, unknown> = {
      applicationId: a.id,
      opportunityId: a.opportunityId,
      userId: a.userId,
      status: a.status,
      submittedAt: a.submittedAt,
      updatedAt: a.updatedAt,
      acceptedAt: a.acceptedAt ?? '',
      withdrawnAt: a.withdrawnAt ?? '',
      timezone,
      exportGeneratedAt: generatedAt,
    };
    return rowToCsvRow(obj);
  });
  return [header, ...dataRows].join('\n');
}

function buildReceiptsCsv(rows: WorkReceipt[], timezone: string, generatedAt: string): string {
  const header = [...RECEIPTS_EXPORT_COLUMNS, 'timezone', 'exportGeneratedAt'].join(',');
  const dataRows = rows.map((r) => {
    const c = r.compensationSnapshot;
    const obj: Record<string, unknown> = {
      receiptId: r.receiptId,
      opportunityId: r.opportunityId,
      userId: r.userId,
      partnerId: r.partnerId,
      locationId: r.locationId ?? '',
      verifiedAt: r.verifiedAt,
      hours: r.hours ?? '',
      compensationType: c.type,
      compensationMin: c.payMin ?? '',
      compensationMax: c.payMax ?? '',
      perkValue: c.perkValue ?? '',
      notes: r.notes ?? '',
      timezone,
      exportGeneratedAt: generatedAt,
    };
    return rowToCsvRow(obj);
  });
  return [header, ...dataRows].join('\n');
}

export default function PartnerOpportunitiesRecordsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ partnerId?: string }>();
  const partnerId = params.partnerId ?? 'p1';
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const insets = useSafeAreaInsets();
  const [preset, setPreset] = useState<DateRangePreset>('quarter');
  const [exportType, setExportType] = useState<'opportunities' | 'applications' | 'receipts'>('receipts');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await Share.share({ message: text, title: 'Export' });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // User dismissed share
    }
  };

  const { from, to } = useMemo(() => getRangeForPreset(preset), [preset]);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const generatedAt = new Date().toISOString();

  const opportunities = useMemo(() => getExportOpportunities(partnerId, from, to), [partnerId, from, to]);
  const applications = useMemo(() => getExportApplications(partnerId, from, to), [partnerId, from, to]);
  const receipts = useMemo(() => getExportReceipts(partnerId, from, to), [partnerId, from, to]);

  const csvContent = useMemo(() => {
    if (exportType === 'opportunities') return buildOpportunitiesCsv(opportunities, timezone, generatedAt);
    if (exportType === 'applications') return buildApplicationsCsv(applications, timezone, generatedAt);
    return buildReceiptsCsv(receipts, timezone, generatedAt);
  }, [exportType, opportunities, applications, receipts, timezone, generatedAt]);

  const jsonContent = useMemo(() => {
    const payload = {
      timezone,
      exportGeneratedAt: generatedAt,
      ...(exportType === 'opportunities' && { opportunities }),
      ...(exportType === 'applications' && { applications }),
      ...(exportType === 'receipts' && { receipts }),
    };
    return JSON.stringify(payload, null, 2);
  }, [exportType, opportunities, applications, receipts, timezone, generatedAt]);

  const copyCsv = () => copyToClipboard(csvContent);
  const copyJson = () => copyToClipboard(jsonContent);
  const shareCsv = async () => {
    try {
      await Share.share({
        message: csvContent,
        title: `OrbOpportunities export — ${exportType}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Records & export</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          OrbTap does not provide tax advice. These exports are provided for bookkeeping convenience; consult your accountant.
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Date range</Text>
        <View style={styles.presetRow}>
          {(['month', 'quarter', 'year'] as DateRangePreset[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.presetPill, preset === p && { backgroundColor: themeGold }, { borderColor: colors.border }]}
              onPress={() => setPreset(p)}
            >
              <Text style={[styles.presetPillText, { color: preset === p ? '#000' : colors.text }]}>
                {p === 'month' ? 'This month' : p === 'quarter' ? 'This quarter' : 'This year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Export type</Text>
        <View style={styles.presetRow}>
          {(['opportunities', 'applications', 'receipts'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.presetPill, exportType === t && { backgroundColor: themeGold }, { borderColor: colors.border }]}
              onPress={() => setExportType(t)}
            >
              <Text style={[styles.presetPillText, { color: exportType === t ? '#000' : colors.text }]} numberOfLines={1}>
                {t === 'opportunities' ? 'Opportunities' : t === 'applications' ? 'Applications' : 'Receipts'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>Timezone: {timezone}</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>Generated: {generatedAt}</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {exportType === 'opportunities' && `${opportunities.length} opportunities`}
            {exportType === 'applications' && `${applications.length} applications`}
            {exportType === 'receipts' && `${receipts.length} receipts`}
          </Text>
        </View>

        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: themeGold }]} onPress={copyCsv}>
          <Ionicons name="copy-outline" size={20} color="#000" />
          <Text style={styles.exportBtnText}>{copied ? 'Copied!' : 'Copy CSV'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={shareCsv}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
          <Text style={[styles.exportBtnText, { color: colors.text }]}>Share CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={copyJson}>
          <Ionicons name="document-text-outline" size={20} color={colors.text} />
          <Text style={[styles.exportBtnText, { color: colors.text }]}>Copy JSON</Text>
        </TouchableOpacity>
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
  disclaimer: { fontSize: 12, marginBottom: 20, fontStyle: 'italic' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  presetPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  presetPillText: { fontSize: 13, fontWeight: '600' },
  metaCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  metaText: { fontSize: 12, marginBottom: 4 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  exportBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});
