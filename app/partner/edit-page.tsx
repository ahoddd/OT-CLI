/**
 * Partner: edit store hours, logo, contact info, and public page fields.
 * Saves to Firestore via partnerUpdateSelf Cloud Function.
 * Phase 5: photo/logo upload, phone, website, social, 500-char About counter.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { partnerUpdateSelf } from '../../services/partnersFirestore';
import { uploadPartnerLogo } from '../../services/uploadProfileImage';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { safeHaptics } from '../../utils/safeHaptics';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

const ABOUT_MAX = 500;

export default function PartnerEditPageScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { partners, refresh: refreshPartners } = usePartners();
  const { testPartnerTier } = useEffectiveTier();
  const { myPartner } = useMyPartner();
  const partner = myPartner ?? partners[0] ?? null;
  const partnerId = partner?.id ?? '';
  const effectiveTier = testPartnerTier ?? (partner?.tier as 'silver' | 'gold' | 'platinum') ?? 'silver';
  const tierColor = PARTNER_TIER_COLORS[effectiveTier];

  const [hours, setHours] = useState(partner?.hours ?? '');
  const [description, setDescription] = useState(partner?.description ?? '');
  const [about, setAbout] = useState(partner?.about ?? '');
  const [logoUrl, setLogoUrl] = useState<string | null>(partner?.logoUrl ?? null);
  const [phone, setPhone] = useState(partner?.phone ?? '');
  const [website, setWebsite] = useState(partner?.website ?? '');
  const [socialInstagram, setSocialInstagram] = useState(partner?.socialInstagram ?? '');
  const [socialTwitter, setSocialTwitter] = useState(partner?.socialTwitter ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!partner) return;
    setHours(partner.hours ?? '');
    setDescription(partner.description ?? '');
    setAbout((partner.about ?? '').slice(0, ABOUT_MAX));
    setLogoUrl(partner.logoUrl ?? null);
    setPhone(partner.phone ?? '');
    setWebsite(partner.website ?? '');
    setSocialInstagram(partner.socialInstagram ?? '');
    setSocialTwitter(partner.socialTwitter ?? '');
    setLoaded(true);
  }, [partner]);

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showErrorAlert('Permission needed', 'Allow photo library access to upload your logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setUploadingLogo(true);
    try {
      const url = await uploadPartnerLogo(result.assets[0].uri, partnerId);
      setLogoUrl(url);
      safeHaptics.notificationAsync(1);
    } catch (e) {
      showErrorAlert('Upload failed', e instanceof Error ? e.message : 'Could not upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!partnerId) {
      showErrorAlert('Error', 'Partner not found.');
      return;
    }
    setSaving(true);
    try {
      const result = await partnerUpdateSelf({
        partnerId,
        hours: hours.trim() || undefined,
        description: description.trim() || undefined,
        about: about.trim().slice(0, ABOUT_MAX) || undefined,
        logoUrl: logoUrl || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        socialInstagram: socialInstagram.trim() || undefined,
        socialTwitter: socialTwitter.trim() || undefined,
      });
      if (result.success) {
        await refreshPartners();
        safeHaptics.notificationAsync(1);
        alertDialog('Saved', 'Your public page will show these updates. View your page to see how it looks.', [
          { text: 'View my page', onPress: () => router.replace(`/partner/${partnerId}` as any) },
          { text: 'Back', onPress: () => router.back() },
        ]);
      } else {
        showErrorAlert('Save failed', result.message ?? 'Please try again.');
      }
    } catch (e) {
      showErrorAlert('Save failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!partner) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.error, { color: colors.text }]}>Partner not found.</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { borderBottomColor: tierColor + '50' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit your page</Text>
          <View style={{ width: 40 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard} keyboardVerticalOffset={80}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                These fields are shown on your public partner page. Changes are saved to your listing.
              </Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>LOGO / PHOTO</Text>
              <TouchableOpacity
                style={[styles.logoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handlePickLogo}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <ActivityIndicator size="small" color={tierColor} />
                ) : logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
                ) : (
                  <View style={[styles.logoPlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    <Text style={[styles.logoHint, { color: colors.textSecondary }]}>Tap to add logo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.label, { color: colors.textSecondary }]}>STORE HOURS</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={hours}
                onChangeText={setHours}
                placeholder="e.g. 11AM – 9PM or 24/7"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
                blurOnSubmit
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>SHORT DESCRIPTION</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder="One line for cards and search"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
                blurOnSubmit
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>PHONE</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. (555) 123-4567"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                returnKeyType="done"
                blurOnSubmit
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>WEBSITE</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                returnKeyType="done"
                blurOnSubmit
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>INSTAGRAM</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={socialInstagram}
                onChangeText={setSocialInstagram}
                placeholder="@handle or full URL"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                returnKeyType="done"
                blurOnSubmit
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>TWITTER / X</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={socialTwitter}
                onChangeText={setSocialTwitter}
                placeholder="@handle or full URL"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                returnKeyType="done"
                blurOnSubmit
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>ABOUT (optional, max {ABOUT_MAX} chars)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={about}
                onChangeText={(t) => setAbout(t.slice(0, ABOUT_MAX))}
                placeholder="Tell customers about your venue..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={ABOUT_MAX}
                returnKeyType="done"
                blurOnSubmit
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>{about.length}/{ABOUT_MAX}</Text>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: tierColor }]}
                onPress={() => { safeHaptics.selectionAsync(); handleSave(); }}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  keyboard: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  hint: { fontSize: 13, marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  logoBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  logoPreview: { width: 100, height: 100 },
  logoPlaceholder: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  logoHint: { fontSize: 11, marginTop: 4 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, marginTop: -8, marginBottom: 16 },
  saveBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  error: { padding: 20 },
});
