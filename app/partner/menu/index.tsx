/**
 * Partner Menu — Manage / Upload / Version history.
 * Entry from partner dashboard when partnerMenusEnabled.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/Colors';
import { useTheme } from '../../../hooks/useTheme';
import { useFlags } from '../../../components/FlagContext';
import { useMenuContext } from '../../../context/MenuContext';
import { safeHaptics } from '../../../utils/safeHaptics';
import { usePartners } from '../../../context/PartnersContext';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { useI18n } from '../../../context/I18nContext';

export default function PartnerMenuIndexScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { partnerId } = useLocalSearchParams<{ partnerId?: string }>();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { getMenuForPartner, getCurrentVersion, documents, versions, loading, dropDrafts } = useMenuContext();
  const { partners, getPartner } = usePartners();
  const { myPartnerId } = useMyPartner();

  const pid = partnerId ?? myPartnerId ?? partners[0]?.id ?? 'p1';
  const partner = getPartner(pid);
  const menuDoc = getMenuForPartner(pid);
  const currentVersion = menuDoc ? getCurrentVersion(menuDoc) : null;

  if (!flags.partnerMenusEnabled) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Menu</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.text }]}>Partner menus are disabled</Text>
        </View>
      </SafeAreaView>
    );
  }

  const versionHistory = menuDoc
    ? versions.filter((v) => v.menuId === menuDoc.id).sort((a, b) => b.createdAt - a.createdAt)
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Menu</Text>
      </View>

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="large" color={COLORS.neonBlue[0]} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {partner && (
            <Text style={[styles.partnerName, { color: colors.textSecondary }]}>{partner.name}</Text>
          )}

          {menuDoc && currentVersion && (
            <>
              <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Status</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.badge, { backgroundColor: menuDoc.status === 'PUBLISHED' ? COLORS.success + '22' : menuDoc.status === 'NEEDS_REVIEW' ? COLORS.danger + '22' : colors.border }]}>
                    <Text style={[styles.badgeText, { color: menuDoc.status === 'PUBLISHED' ? COLORS.success : menuDoc.status === 'NEEDS_REVIEW' ? COLORS.danger : colors.text }]}>
                      {menuDoc.status}
                    </Text>
                  </View>
                  {menuDoc.verified && (
                    <View style={[styles.badge, { backgroundColor: COLORS.success + '22' }]}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                      <Text style={[styles.badgeText, { color: COLORS.success }]}>Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                  {currentVersion.sections.length} sections,{' '}
                  {currentVersion.sections.reduce((n, s) => n + s.items.length, 0)} items
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => { safeHaptics.selectionAsync(); router.push({ pathname: '/partner/menu/edit', params: { menuId: menuDoc.id } } as any); }}
                activeOpacity={0.88}
              >
                <View style={styles.settingRow}>
                  <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                  <View style={styles.settingTextWrap}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Edit menu</Text>
                    <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Change sections, items, prices, Tonight Picks</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VERSION HISTORY</Text>
              <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {versionHistory.slice(0, 5).map((v) => (
                  <View key={v.id} style={[styles.versionRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.versionSummary, { color: colors.text }]}>{v.changeLog.summary || 'No summary'}</Text>
                    <Text style={[styles.versionDate, { color: colors.textSecondary }]}>
                      {new Date(v.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
                {versionHistory.length === 0 && (
                  <Text style={[styles.emptyVersions, { color: colors.textSecondary }]}>No prior versions</Text>
                )}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push({ pathname: '/partner/menu/upload', params: { partnerId: pid } } as any); }}
            activeOpacity={0.88}
          >
            <View style={styles.settingRow}>
              <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {menuDoc ? 'Upload new menu (replace)' : 'Upload menu'}
                </Text>
                <Text style={[styles.settingHint, { color: colors.textSecondary }]}>
                  Take or pick photos → OCR → review & publish
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {flags.partnerMenusDropSuggestions && dropDrafts.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DROP DRAFTS</Text>
              <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.draftIntro, { color: colors.textSecondary }]}>
                  {dropDrafts.length} draft{dropDrafts.length !== 1 ? 's' : ''} from menu items. We'll notify you when you can publish these as Drops.
                </Text>
                {dropDrafts.slice(0, 5).map((d) => {
                  const p = getPartner(d.partnerId);
                  return (
                    <View key={d.id} style={[styles.draftRow, { borderTopColor: colors.border }]}>
                      <Ionicons name="gift-outline" size={16} color={COLORS.neonBlue[0]} />
                      <View style={styles.draftTextWrap}>
                        <Text style={[styles.draftItemName, { color: colors.text }]} numberOfLines={1}>{d.itemName}</Text>
                        <Text style={[styles.draftMeta, { color: colors.textSecondary }]}>
                          {p?.name ?? d.partnerId} · {new Date(d.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {dropDrafts.length > 5 && (
                  <Text style={[styles.draftMore, { color: colors.textSecondary }]}>+{dropDrafts.length - 5} more</Text>
                )}
                <TouchableOpacity
                  style={[styles.pulseLink, { borderColor: COLORS.neonBlue[0] + '66' }]}
                  onPress={() => { safeHaptics.selectionAsync(); router.push('/pulse' as any); }}
                >
                  <Text style={[styles.pulseLinkText, { color: COLORS.neonBlue[0] }]}>Open Pulse</Text>
                  <Ionicons name="open-outline" size={16} color={COLORS.neonBlue[0]} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  partnerName: { fontSize: 12, marginBottom: 16 },
  statusCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  statusLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sectionCount: { fontSize: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  settingsCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTextWrap: { flex: 1, minWidth: 0 },
  settingLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  settingHint: { fontSize: 12 },
  versionRow: { paddingVertical: 12, borderTopWidth: 1 },
  versionSummary: { fontSize: 13 },
  versionDate: { fontSize: 11, marginTop: 2 },
  emptyVersions: { fontSize: 13 },
  draftIntro: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  draftTextWrap: { flex: 1, minWidth: 0 },
  draftItemName: { fontSize: 14, fontWeight: '600' },
  draftMeta: { fontSize: 11, marginTop: 2 },
  draftMore: { fontSize: 12, marginTop: 8 },
  pulseLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  pulseLinkText: { fontSize: 13, fontWeight: '700' },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16 },
});
