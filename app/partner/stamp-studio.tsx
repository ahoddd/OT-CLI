/**
 * Stamp Cards™ — Partner Stamp Studio: create / manage stamp programs.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform, Share } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../hooks/useTheme';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { useFlags } from '../../components/FlagContext';
import { GuidedTutorialOverlay } from '../../components/GuidedTutorialOverlay';
import { useTutorial } from '../../context/TutorialContext';
import { listStampProgramsForPartner, upsertStampProgram } from '../../services/stampCardsApi';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { STAMPS_REQUIRED_PRESETS, COOLDOWN_HOURS_PRESETS, STAMP_REWARD_TYPE_LABELS, STAMP_TEMPLATE_LABELS, buildStampQrPayload } from '../../constants/StampCards';
import type { StampProgram, StampRewardType, StampTemplate } from '../../constants/StampCards';
import { getStampTierLimits } from '../../constants/StampCardsTierConfig';
import { getStampTemplateForCategory } from '../../constants/StampCardCategoryIcons';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { showErrorAlert, alert as showAlert } from '../../utils/alert';
import { capitalizeFirstLetter } from '../../utils/capitalizeFirstLetter';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { COLORS } from '../../constants/Colors';
import { useI18n } from '../../context/I18nContext';

export default function PartnerStampStudioScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { partners } = usePartners();
  const { testPartnerTier } = useEffectiveTier();
  const { myPartner } = useMyPartner();
  const partner = myPartner ?? partners[0] ?? null;
  const effectiveTier: PartnerTier = (testPartnerTier ?? (partner?.tier as PartnerTier) ?? 'silver');
  const limits = getStampTierLimits(effectiveTier);

  const [programs, setPrograms] = useState<(StampProgram & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stampsRequired, setStampsRequired] = useState(10);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [rewardType, setRewardType] = useState<StampRewardType>('FREE_ITEM');
  const [rewardLabel, setRewardLabel] = useState('Free reward');
  const [template, setTemplate] = useState<StampTemplate>('COFFEE');
  const [boostStartHour, setBoostStartHour] = useState<number | null>(null);
  const [boostEndHour, setBoostEndHour] = useState<number | null>(null);
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();
  const [showStampStudioTutorial, setShowStampStudioTutorial] = useState(false);
  const boostWindowsEnabled = Boolean(flags.stampCardsBoostWindows && limits.boostWindowsEligible);

  useEffect(() => {
    if (shouldShowTutorial('partner_stamp_studio')) setShowStampStudioTutorial(true);
  }, [shouldShowTutorial]);

  const enabled = Boolean(flags.moduleStampCards && flags.stampCardsPartnerStudio);
  if (!enabled) return <Redirect href="/partner/dashboard" />;
  if (!partner) return <Redirect href="/(tabs)" />;

  useEffect(() => {
    if (!enabled || !partner?.id) return;
    listStampProgramsForPartner(partner.id).then((res) => {
      if (res.success && res.programs) setPrograms(res.programs);
      setLoading(false);
    });
  }, [enabled, partner?.id]);

  const startNew = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setStampsRequired(limits.stampsRequiredPresets[0] ?? 10);
    setCooldownHours(limits.cooldownHoursPresets[0] ?? 24);
    setRewardType(limits.allowedRewardTypes[0] ?? 'FREE_ITEM');
    setRewardLabel('Free reward');
    setTemplate(getStampTemplateForCategory(partner?.category));
    setBoostStartHour(null);
    setBoostEndHour(null);
  };

  const saveProgram = async (status: 'DRAFT' | 'ACTIVE') => {
    if (!name.trim()) {
      showErrorAlert('Name required', 'Give your stamp card a name.');
      return;
    }
    setSaving(true);
    const boostWindows =
      boostWindowsEnabled && boostStartHour != null && boostEndHour != null && boostStartHour !== boostEndHour
        ? [{ startHour: boostStartHour, endHour: boostEndHour }]
        : undefined;
    const res = await upsertStampProgram({
      partnerId: partner.id,
      id: editingId ?? undefined,
      name: name.trim(),
      description: description.trim(),
      status,
      stampsRequired,
      cooldownHours,
      eligibility: { requireVerifiedUser: true, requirePartnerVerified: true },
      caps: { maxStampsPerUserPerDay: 1, maxRewardsPerDay: null },
      reward: { type: rewardType, label: rewardLabel.trim(), expiresHoursAfterEarn: null, otPointsBonus: null },
      design: { template, colors: { primary: '#1e3a5f', secondary: '#3b82f6' }, iconLogoRef: null, stampStyle: 'ORB' },
      boostWindows,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setSaving(false);
    if (res.success) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert(status === 'ACTIVE' ? 'Published' : 'Saved', status === 'ACTIVE' ? 'Your stamp card is live. Share the QR at your venue.' : 'Draft saved.');
      if (res.program) {
        setPrograms((prev) => {
          const idx = prev.findIndex((p) => p.id === res.program!.id);
          const next = [...prev];
          if (idx >= 0) next[idx] = res.program!;
          else next.push(res.program!);
          return next;
        });
        setEditingId(res.program.id);
        setName(res.program.name);
        setDescription(res.program.description);
        setStampsRequired(res.program.stampsRequired);
        setCooldownHours(res.program.cooldownHours);
        setRewardType(res.program.reward.type);
        setRewardLabel(res.program.reward.label);
        setTemplate(res.program.design.template);
        const bw = res.program.boostWindows;
        if (Array.isArray(bw) && bw.length > 0 && bw[0]) {
          setBoostStartHour((bw[0] as { startHour: number }).startHour);
          setBoostEndHour((bw[0] as { endHour: number }).endHour);
        } else {
          setBoostStartHour(null);
          setBoostEndHour(null);
        }
      }
    } else {
      showErrorAlert('Could not save', res.message ?? 'Try again.');
    }
  };

  const allowedStamps = limits.stampsRequiredPresets.filter((n) => STAMPS_REQUIRED_PRESETS.includes(n));
  const allowedCooldowns = limits.cooldownHoursPresets.filter((n) => COOLDOWN_HOURS_PRESETS.includes(n));

  const venueQrRef = useRef<ViewShot>(null);
  const [sharingQr, setSharingQr] = useState(false);

  const handleSaveOrShareQr = async () => {
    if (Platform.OS === 'web' || !editingId || !partner?.id) return;
    setSharingQr(true);
    try {
      const uri = await venueQrRef.current?.capture?.();
      if (uri) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Save or share stamp QR' });
        else if (Platform.OS !== 'web') Share.share({ url: uri, title: 'Stamp QR — ' + name, message: 'Customers scan this with the OrbTap app to add a stamp.' });
      }
    } catch (_) {}
    setSharingQr(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Stamp Studio</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 24 }} />
        ) : (
          <>
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={startNew}>
              <Ionicons name="add-circle-outline" size={28} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Create / Manage</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{programs.length} program(s) · max {limits.maxActivePrograms} active</Text>
            </TouchableOpacity>
            {programs.map((prog) => (
              <TouchableOpacity
                key={prog.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  setEditingId(prog.id);
                  setName(prog.name);
                  setDescription(prog.description);
                  setStampsRequired(prog.stampsRequired);
                  setCooldownHours(prog.cooldownHours);
                  setRewardType(prog.reward.type);
                  setRewardLabel(prog.reward.label);
                  setTemplate(prog.design.template);
                  const bw = prog.boostWindows;
                  if (Array.isArray(bw) && bw.length > 0 && bw[0]) {
                    setBoostStartHour((bw[0] as { startHour: number }).startHour);
                    setBoostEndHour((bw[0] as { endHour: number }).endHour);
                  } else {
                    setBoostStartHour(null);
                    setBoostEndHour(null);
                  }
                }}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{prog.name}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{prog.status} · {prog.stampsRequired} stamps</Text>
              </TouchableOpacity>
            ))}

            <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PROGRAM</Text>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Name" placeholderTextColor={colors.textSecondary} value={name} onChangeText={(t) => setName(capitalizeFirstLetter(t))} autoCapitalize="sentences" />
              <TextInput style={[styles.input, styles.inputArea, { color: colors.text, borderColor: colors.border }]} placeholder="Description" placeholderTextColor={colors.textSecondary} value={description} onChangeText={(t) => setDescription(capitalizeFirstLetter(t))} multiline autoCapitalize="sentences" />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>STAMPS & COOLDOWN</Text>
              <View style={styles.row}>
                {allowedStamps.map((n) => (
                  <TouchableOpacity key={n} style={[styles.pill, stampsRequired === n && { backgroundColor: COLORS.neonBlue?.[0] ?? '#3b82f6' }]} onPress={() => setStampsRequired(n)}>
                    <Text style={[styles.pillText, { color: stampsRequired === n ? '#fff' : colors.text }]} numberOfLines={1}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.row}>
                {allowedCooldowns.map((n) => (
                  <TouchableOpacity key={n} style={[styles.pill, cooldownHours === n && { backgroundColor: COLORS.neonBlue?.[0] ?? '#3b82f6' }]} onPress={() => setCooldownHours(n)}>
                    <Text style={[styles.pillText, { color: cooldownHours === n ? '#fff' : colors.text }]}>{n}h</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {boostWindowsEnabled && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DOUBLE STAMP WINDOW (UTC)</Text>
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>During this hour range, one scan = 2 stamps. Leave blank to disable.</Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.inputSmall, { color: colors.text, borderColor: colors.border }]}
                      placeholder="Start (0-23)"
                      placeholderTextColor={colors.textSecondary}
                      value={boostStartHour != null ? String(boostStartHour) : ''}
                      onChangeText={(t) => setBoostStartHour(t === '' ? null : Math.max(0, Math.min(23, parseInt(t, 10) || 0)))}
                      keyboardType="number-pad"
                    />
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>–</Text>
                    <TextInput
                      style={[styles.input, styles.inputSmall, { color: colors.text, borderColor: colors.border }]}
                      placeholder="End (0-23)"
                      placeholderTextColor={colors.textSecondary}
                      value={boostEndHour != null ? String(boostEndHour) : ''}
                      onChangeText={(t) => setBoostEndHour(t === '' ? null : Math.max(0, Math.min(23, parseInt(t, 10) || 0)))}
                      keyboardType="number-pad"
                    />
                  </View>
                </>
              )}
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>REWARD</Text>
              <View style={styles.row}>
                {limits.allowedRewardTypes.map((t) => (
                  <TouchableOpacity key={t} style={[styles.pill, rewardType === t && { backgroundColor: COLORS.neonBlue?.[0] ?? '#3b82f6' }]} onPress={() => setRewardType(t)}>
                    <Text style={[styles.pillText, { color: rewardType === t ? '#fff' : colors.text }]} numberOfLines={1}>{STAMP_REWARD_TYPE_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Reward label (e.g. Free medium coffee)" placeholderTextColor={colors.textSecondary} value={rewardLabel} onChangeText={(t) => setRewardLabel(capitalizeFirstLetter(t))} autoCapitalize="sentences" />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TEMPLATE</Text>
              <View style={styles.row}>
                {(['COFFEE', 'RESTAURANT', 'RETAIL', 'SERVICE', 'EVENT'] as StampTemplate[]).map((t) => (
                  <TouchableOpacity key={t} style={[styles.pill, template === t && { backgroundColor: COLORS.neonBlue?.[0] ?? '#3b82f6' }]} onPress={() => setTemplate(t)}>
                    <Text style={[styles.pillText, { color: template === t ? '#fff' : colors.text }]} numberOfLines={1}>{STAMP_TEMPLATE_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {editingId && partner?.id && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DISPLAY AT YOUR VENUE</Text>
                  <Text style={[styles.venueCopy, { color: colors.text }]}>
                    Customers scan this with the OrbTap app to add a stamp. Put it on the counter or in your window.
                  </Text>
                  <Text style={[styles.venueTip, { color: colors.textSecondary }]}>
                    Drive foot traffic: every scan is a verified visit. Share the QR online and remind people to scan when they come in — that brings them back for the next stamp.
                  </Text>
                  <ViewShot ref={venueQrRef} options={{ format: 'png', quality: 1 }} style={styles.venueQrShot}>
                    <View style={[styles.venueQrCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <QRCode value={buildStampQrPayload(partner.id, editingId)} size={200} backgroundColor="#fff" color="#0a0a0d" />
                      <Text style={[styles.venueQrLabel, { color: colors.textSecondary }]}>Scan to add a stamp</Text>
                    </View>
                  </ViewShot>
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      style={[styles.saveQrBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? '#3b82f6' }]}
                      onPress={handleSaveOrShareQr}
                      disabled={sharingQr}
                    >
                      {sharingQr ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="share-outline" size={20} color="#fff" />}
                      <Text style={styles.saveQrBtnText}>{sharingQr ? 'Preparing…' : 'Save or share QR'}</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnSecondary, { borderColor: colors.border }]} onPress={() => saveProgram('DRAFT')} disabled={saving}>
                  <Text style={[styles.btnText, { color: colors.text }]}>Save draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary, { backgroundColor: COLORS.neonBlue?.[0] ?? '#3b82f6' }]} onPress={() => saveProgram('ACTIVE')} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnTextPrimary}>Publish</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <GuidedTutorialOverlay
        visible={showStampStudioTutorial}
        tutorialId="partner_stamp_studio"
        onClose={() => {
          markCompleted('partner_stamp_studio');
          setShowStampStudioTutorial(false);
        }}
        onSkipAll={setSkipAllTutorials}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.sm, paddingVertical: SPACE.base, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  scroll: { padding: SPACE.base, paddingBottom: SPACE.xxl },
  card: { padding: SPACE.base, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACE.sm },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 4 },
  form: { padding: SPACE.base, borderRadius: RADIUS.lg, borderWidth: 1, marginTop: SPACE.xl },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: SPACE.sm, marginTop: SPACE.base },
  input: { borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACE.sm, fontSize: 16, marginBottom: SPACE.sm },
  inputArea: { minHeight: 60 },
  inputSmall: { flex: 1, minWidth: 80 },
  hint: { fontSize: 12, marginBottom: SPACE.sm },
  rowLabel: { alignSelf: 'center', fontSize: 16, marginHorizontal: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, marginBottom: SPACE.sm },
  pill: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.06)' },
  pillText: { fontSize: 14, fontWeight: '600' },
  venueCopy: { fontSize: 15, lineHeight: 22, marginBottom: SPACE.sm },
  venueTip: { fontSize: 13, lineHeight: 20, marginBottom: SPACE.lg },
  venueQrShot: { alignSelf: 'center', marginBottom: SPACE.base },
  venueQrCard: { padding: SPACE.lg, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center' },
  venueQrLabel: { fontSize: 13, marginTop: SPACE.sm },
  saveQrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.base, borderRadius: RADIUS.sm, marginBottom: SPACE.base },
  saveQrBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  actions: { flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.xl },
  btn: { flex: 1, paddingVertical: SPACE.base, borderRadius: RADIUS.sm, alignItems: 'center' },
  btnSecondary: { borderWidth: 1 },
  btnPrimary: {},
  btnText: {},
  btnTextPrimary: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
