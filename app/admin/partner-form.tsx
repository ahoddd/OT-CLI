import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { KitCard } from '../../components/ui/KitCard';
import { KitSectionHeader } from '../../components/ui/KitSectionHeader';
import { KitButton } from '../../components/ui/KitButton';
import { usePartners } from '../../context/PartnersContext';
import { createPartner, updatePartner, type PartnerPayload } from '../../services/partnersAdmin';
import { geocodeAddress } from '../../services/mapboxGeocode';
import type { Partner } from '../../constants/MockData';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { capitalizeFirstLetter } from '../../utils/capitalizeFirstLetter';
import { useI18n } from '../../context/I18nContext';

const PARTNER_TIERS: PartnerTier[] = ['silver', 'gold', 'platinum'];
const CATEGORIES = ['Dining', 'Cafe', 'Retail', 'Services', 'Entertainment', 'Nightlife', 'Hospitality', 'Other'];

export default function PartnerFormScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { colors } = useTheme();
  const { getPartner, refresh } = usePartners();

  const [name, setName] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [category, setCategory] = useState('');
  const [tier, setTier] = useState<PartnerTier>('silver');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [verified, setVerified] = useState(true);
  const [termsShort, setTermsShort] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [about, setAbout] = useState('');
  const [showOrbOpsButton, setShowOrbOpsButton] = useState(true);
  const [offersCatering, setOffersCatering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const existing = isEdit ? getPartner(id!) : undefined;

  const handleGeocode = async () => {
    if (!address.trim()) {
      showErrorAlert('Address needed', 'Enter an address first, then tap to get coordinates.');
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress(address.trim());
      if (result) {
        setLat(String(result.lat));
        setLng(String(result.lng));
        setAddress(result.formattedAddress);
        alertDialog('Done', 'Coordinates set. Partner will appear on the map.', [{ text: 'OK' }]);
      } else {
        showErrorAlert('Address not found', 'We couldn’t find that address. Try a more specific address or enter lat/lng manually.');
      }
    } catch {
      showErrorAlert('Geocoding failed', 'We couldn’t look up the address. Check it or enter lat/lng manually.');
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setPartnerId(existing.id);
      setCategory(existing.category);
      setTier(existing.tier);
      setAddress(existing.location.address);
      setLat(String(existing.location.lat));
      setLng(String(existing.location.lng));
      setDescription(existing.description);
      setHours(existing.hours);
      setVerified(existing.verified);
      setTermsShort(existing.termsShort ?? '');
      setFeaturedImageUrl(existing.featuredImageUrl ?? '');
      setLogoUrl(existing.logoUrl ?? '');
      setAbout(existing.about ?? '');
      setShowOrbOpsButton(existing.showOrbOpsButton !== false);
      setOffersCatering(existing.offersCatering === true);
    }
  }, [existing, isEdit]);

  const handleSave = async () => {
    const tid = (isEdit ? id : partnerId.trim()) || partnerId.trim();
    if (!tid.trim()) {
      showErrorAlert('Partner ID required', 'Enter a partner ID (e.g. p21). Use lowercase letters and numbers.');
      return;
    }
    if (!name.trim()) {
      showErrorAlert('Business name required', 'Enter the business or partner name.');
      return;
    }
    setSaving(true);
    try {
      const payload: PartnerPayload = {
        id: tid,
        name: name.trim(),
        category: category.trim() || 'Other',
        tier,
        location: {
          lat: parseFloat(lat) || 0,
          lng: parseFloat(lng) || 0,
          address: address.trim() || '',
        },
        description: description.trim(),
        hours: hours.trim(),
        verified,
        termsShort: termsShort.trim() || undefined,
        featuredImageUrl: featuredImageUrl.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        about: about.trim().slice(0, 500) || undefined,
        showOrbOpsButton,
        offersCatering,
      };
      const result = isEdit ? await updatePartner(payload) : await createPartner(payload);
      if (result.success) {
        await refresh();
        setSuccess(true);
        alertDialog(
          isEdit ? 'Partner updated' : 'Partner added',
          'Changes are live. Add perks from the Partners section in Admin.',
          [
            { text: 'Add another', onPress: () => { setSuccess(false); if (isEdit) router.replace('/admin/partner-form'); else { setPartnerId(''); setName(''); setCategory(''); setDescription(''); setHours(''); setTermsShort(''); } } },
            { text: 'Back to Admin', onPress: () => router.back() },
          ]
        );
      } else {
        showErrorAlert('Save didn’t complete', result.message ?? 'We couldn’t save the partner. Please try again.');
      }
    } catch (e: unknown) {
      showErrorAlert('Save didn’t complete', e instanceof Error ? e.message : 'We couldn’t save the partner. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isEdit ? 'Edit partner' : 'Add partner'}</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <KitCard variant="solid" style={{ marginBottom: SPACE.base }}>
            <KitSectionHeader label="Partner details" />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Partner ID (e.g. p21)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={partnerId}
            onChangeText={setPartnerId}
            placeholder="p21"
            placeholderTextColor={colors.textSecondary}
            editable={!isEdit}
            autoCapitalize="none"
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Business name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={name}
            onChangeText={(t) => setName(capitalizeFirstLetter(t))}
            placeholder="Partner name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="sentences"
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.pill, { backgroundColor: colors.surfaceHighlight }, category === c && { backgroundColor: PARTNER_TIER_COLORS[tier] }]}
              >
                <Text style={[styles.pillText, { color: category === c ? '#fff' : colors.text }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tier</Text>
          <View style={styles.pillRow}>
            {PARTNER_TIERS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTier(t)}
                style={[styles.pill, { backgroundColor: tier === t ? PARTNER_TIER_COLORS[t] : colors.surfaceHighlight }]}
              >
                <Text style={[styles.pillText, { color: tier === t ? '#fff' : colors.text }]}>{PARTNER_TIER_LABELS[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Address (used for map pin)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Street, city — then tap Get coordinates"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            style={[styles.geocodeBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
            onPress={handleGeocode}
            disabled={geocoding || !address.trim()}
          >
            {geocoding ? <ActivityIndicator size="small" color={colors.text} /> : <Ionicons name="navigate" size={18} color={colors.text} />}
            <Text style={[styles.geocodeBtnText, { color: colors.text }]}>{geocoding ? 'Looking up…' : 'Get coordinates from address'}</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TextInput style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={lat} onChangeText={setLat} placeholder="Lat" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
            <TextInput style={[styles.inputHalf, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={lng} onChangeText={setLng} placeholder="Lng" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
          </View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={description} onChangeText={(t) => setDescription(capitalizeFirstLetter(t))} placeholder="Short description" placeholderTextColor={colors.textSecondary} multiline autoCapitalize="sentences" />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Hours</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={hours} onChangeText={(t) => setHours(capitalizeFirstLetter(t))} placeholder="e.g. 11AM - 9PM" placeholderTextColor={colors.textSecondary} autoCapitalize="sentences" />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Terms short (one line)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={termsShort} onChangeText={(t) => setTermsShort(capitalizeFirstLetter(t))} placeholder="e.g. One free taco with drink" placeholderTextColor={colors.textSecondary} autoCapitalize="sentences" />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Featured image URL (optional)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={featuredImageUrl} onChangeText={setFeaturedImageUrl} placeholder="https://..." placeholderTextColor={colors.textSecondary} autoCapitalize="none" />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Logo URL (optional)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={logoUrl} onChangeText={setLogoUrl} placeholder="https://..." placeholderTextColor={colors.textSecondary} autoCapitalize="none" />
          <Text style={[styles.label, { color: colors.textSecondary }]}>About (max 500 chars)</Text>
          <TextInput style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={about} onChangeText={(t) => setAbout(capitalizeFirstLetter(t))} placeholder="About the business" placeholderTextColor={colors.textSecondary} multiline maxLength={500} autoCapitalize="sentences" />
          <View style={[styles.toggleRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Verified</Text>
            <TouchableOpacity onPress={() => setVerified((v) => !v)} style={[styles.toggle, { backgroundColor: verified ? '#22c55e' : colors.border }]}>
              <View style={[styles.toggleThumb, { marginLeft: verified ? 20 : 2 }]} />
            </TouchableOpacity>
          </View>
          <View style={[styles.toggleRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Show Request Work / Catering button</Text>
            <TouchableOpacity onPress={() => setShowOrbOpsButton((v) => !v)} style={[styles.toggle, { backgroundColor: showOrbOpsButton ? '#22c55e' : colors.border }]}>
              <View style={[styles.toggleThumb, { marginLeft: showOrbOpsButton ? 20 : 2 }]} />
            </TouchableOpacity>
          </View>
          <View style={[styles.toggleRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Offers catering</Text>
            <TouchableOpacity onPress={() => setOffersCatering((v) => !v)} style={[styles.toggle, { backgroundColor: offersCatering ? '#22c55e' : colors.border }]}>
              <View style={[styles.toggleThumb, { marginLeft: offersCatering ? 20 : 2 }]} />
            </TouchableOpacity>
          </View>
          </KitCard>
          <KitButton
            title={isEdit ? 'Update partner' : 'Add partner'}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={{ marginTop: SPACE.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.base, paddingVertical: SPACE.md, borderBottomWidth: 1 },
  backBtn: { marginRight: SPACE.md, padding: SPACE.xs },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACE.base, paddingBottom: SPACE.xxxl },
  label: { fontSize: 12, fontWeight: '600', marginBottom: SPACE.xs, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.md, paddingVertical: SPACE.md, fontSize: 16, marginBottom: SPACE.md },
  inputHalf: { flex: 1, borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.md, paddingVertical: SPACE.md, fontSize: 16 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  geocodeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.sm, borderWidth: 1, marginBottom: SPACE.md },
  geocodeBtnText: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', gap: SPACE.md, marginBottom: SPACE.md },
  pillRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.md },
  pill: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, borderRadius: RADIUS.lg },
  pillText: { fontSize: 14, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACE.md, borderTopWidth: 1 },
  toggleLabel: { fontSize: 15, flex: 1 },
  toggle: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
});
