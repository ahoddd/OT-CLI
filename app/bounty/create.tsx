/**
 * OrbBounty™ — Create Bounty (template-driven).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useUserLocation } from '../../context/UserLocationContext';
import { COLORS } from '../../constants/Colors';
import {
  BOUNTY_CATEGORY_LABELS,
  computeSanityScore,
  DEFAULT_ORB_BOUNTY_CONFIG,
  type BountyCategory,
  type BountyPrivacy,
} from '../../constants/orbBounty';
import * as Location from 'expo-location';
import * as api from '../../services/orbBounty';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

const CATEGORIES: BountyCategory[] = ['food', 'retail', 'services'];
const PRIVACY_OPTIONS: { value: BountyPrivacy; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'private', label: 'Private' },
];

export default function CreateBountyScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const { user } = useAuth();
  const { userLocation } = useUserLocation();
  const [category, setCategory] = useState<BountyCategory>('food');
  const [title, setTitle] = useState('');
  const [budgetMin, setBudgetMin] = useState('10');
  const [budgetMax, setBudgetMax] = useState('50');
  const [radiusMeters, setRadiusMeters] = useState('5000');
  const [ttlHours, setTtlHours] = useState('24');
  const [privacy, setPrivacy] = useState<BountyPrivacy>('public');
  const [templateData, setTemplateData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const budgetMinNum = Math.max(0, parseFloat(budgetMin) || 0);
  const budgetMaxNum = Math.max(budgetMinNum, parseFloat(budgetMax) || 50);
  const radiusNum = Math.max(500, Math.min(50000, parseInt(radiusMeters, 10) || 5000));
  const ttlSeconds = Math.max(3600, Math.min(604800, (parseFloat(ttlHours) || 24) * 3600));
  const config = DEFAULT_ORB_BOUNTY_CONFIG;
  const sanityScore = computeSanityScore({
    budgetMin: budgetMinNum,
    budgetMax: budgetMaxNum,
    category,
    radiusMeters: radiusNum,
    ttlSeconds,
    constraintCount: Object.keys(templateData).length,
    weights: config.sanityWeights,
  });
  const showStakeWarning = sanityScore >= 50 && sanityScore < 70;
  const needsStake = sanityScore < 50;

  const handleSubmit = async () => {
    if (!user || !flags.isOrbBountyEnabled) return;
    const t = title.trim();
    if (!t) {
      alertDialog('Title required', 'Please enter a short title for your bounty so others know what you’re looking for.', [{ text: 'OK' }]);
      return;
    }
    if (needsStake) {
      alertDialog(
        'Bounty needs a higher quality score',
        'Your bounty doesn’t meet the minimum quality score yet. Try adjusting budget, radius, or time window, or add a stake in Admin settings.',
        [{ text: 'OK' }],
      );
      return;
    }
    let geo: { lat: number; lng: number } | null = userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude }
      : null;
    if (!geo) {
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const { status: s } = await Location.requestForegroundPermissionsAsync();
          status = s;
        }
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
      } catch (_) {}
    }
    if (!geo) {
      showErrorAlert('Location required', 'OrbBounty needs your location to post. Enable Location in Settings and try again.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.bountyCreate({
        cityId: 'default',
        geo: { lat: geo.lat, lng: geo.lng },
        radiusMeters: radiusNum,
        category,
        budgetMin: budgetMinNum,
        budgetMax: budgetMaxNum,
        ttlSeconds,
        privacy,
        title: t,
        templateData: templateData as Record<string, unknown>,
        createdByDisplay: user.displayName ?? user.email ?? undefined,
      });
      if (res.success && res.bountyId) {
        // Navigate directly to the new bounty so user sees it immediately (fixes "don't see my bounty" after create)
        router.replace({ pathname: '/bounty/[id]', params: { id: res.bountyId } } as any);
      } else if (!res.success && res.message && /active bounty|at most \d+ active/i.test(res.message)) {
        // "You already have one active" — fetch my bounties and open the first active one so user can see it
        const mineRes = await api.bountyListMine(10);
        if (mineRes.success && mineRes.bounties?.length) {
          const active = mineRes.bounties.find((b: { status?: string }) => b.status === 'open' || b.status === 'locked');
          if (active) {
            router.replace({ pathname: '/bounty/[id]', params: { id: active.id } } as any);
            return;
          }
        }
        showErrorAlert(
          'You have an active bounty',
          'You can have only one active bounty at a time. Open "My Bounties" to view or cancel it, then create a new one.',
        );
      } else {
        showErrorAlert('Couldn’t create bounty', res.message ?? 'We couldn\'t post your bounty. Please try again. If OrbBounty is off, an admin can enable it in Admin Hub.',
        );
      }
    } catch (e) {
      showErrorAlert(
        'Connection problem',
        e instanceof Error ? e.message : 'We couldn’t reach the server. Please check your internet connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!flags.isOrbBountyEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Create Bounty</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.text }]}>OrbBounty is disabled.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Create Bounty</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryPill, { borderColor: colors.border }, category === c && { backgroundColor: themeGold + '30', borderColor: themeGold }]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.categoryText, { color: colors.text }, category === c && { color: themeGold }]}>{BOUNTY_CATEGORY_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TITLE</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. Lunch for two under $25"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>BUDGET (USD)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Min"
            placeholderTextColor={colors.textSecondary}
            value={budgetMin}
            onChangeText={setBudgetMin}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Max"
            placeholderTextColor={colors.textSecondary}
            value={budgetMax}
            onChangeText={setBudgetMax}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>RADIUS (meters)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="5000"
          placeholderTextColor={colors.textSecondary}
          value={radiusMeters}
          onChangeText={setRadiusMeters}
          keyboardType="number-pad"
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TIME WINDOW (hours)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="24"
          placeholderTextColor={colors.textSecondary}
          value={ttlHours}
          onChangeText={setTtlHours}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PRIVACY</Text>
        <View style={styles.privacyRow}>
          {PRIVACY_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o.value}
              style={[styles.privacyPill, { borderColor: colors.border }, privacy === o.value && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
              onPress={() => setPrivacy(o.value)}
            >
              <Text style={[styles.privacyText, { color: colors.text }]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {showStakeWarning && (
          <View style={[styles.banner, { backgroundColor: themeGold + '20', borderColor: themeGold }]}>
            <Ionicons name="information-circle" size={20} color={themeGold} />
            <Text style={[styles.bannerText, { color: colors.text }]}>Sanity score {sanityScore}. Optional small stake may apply.</Text>
          </View>
        )}
        {needsStake && (
          <View style={[styles.banner, { backgroundColor: COLORS.danger + '20', borderColor: COLORS.danger }]}>
            <Ionicons name="warning" size={20} color={COLORS.danger} />
            <Text style={[styles.bannerText, { color: colors.text }]}>Score {sanityScore}. Raise budget or radius, or add stake in Admin.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: themeGold }, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Post Bounty</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  categoryPill: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  categoryText: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  privacyRow: { flexDirection: 'row', gap: 8 },
  privacyPill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  privacyText: { fontSize: 13, fontWeight: '600' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  bannerText: { flex: 1, fontSize: 13 },
  submitBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16 },
});
