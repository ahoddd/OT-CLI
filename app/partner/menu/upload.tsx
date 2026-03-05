/**
 * Partner Menu Upload — capture photos or paste menu text → OCR/parse → live preview → edit.
 * Photos: parallel upload, optional cloud OCR, then show preview and "Edit menu".
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/Colors';
import { useTheme } from '../../../hooks/useTheme';
import { useFlags } from '../../../components/FlagContext';
import { useAuth } from '../../../context/AuthContext';
import { useMenuContext } from '../../../context/MenuContext';
import { uploadMenuImage } from '../../../services/uploadMenuImage';
import { resizeForMenuUpload } from '../../../utils/resizeImageForUpload';
import { extractMenuTextFromImageUrls } from '../../../services/menuOcr';
import { parseMenuFromRawText } from '../../../utils/parseMenuFromText';
import { safeHaptics } from '../../../utils/safeHaptics';
import { MENU_MAX_PHOTOS } from '../../../constants/PartnerMenu';
import type { MenuVersion, MenuPhoto, MenuSection } from '../../../constants/PartnerMenu';
import { showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

type Step = 'idle' | 'uploading' | 'analyzing' | 'preview' | 'error';

const PLACEHOLDER_MENU_TEXT = 'APPETIZERS\nItem from photo 1\t$9.99\n\nMAINS\nItem from photo 2\t$14.99';

export default function PartnerMenuUploadScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { partnerId } = useLocalSearchParams<{ partnerId?: string }>();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { user } = useAuth();
  const { createDraftMenu, updateMenuVersion } = useMenuContext();

  const pid = partnerId ?? 'p1';
  const storagePathUid = user?.uid ?? undefined;
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [manualText, setManualText] = useState('');
  const [useManual, setUseManual] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [previewMenuId, setPreviewMenuId] = useState<string | null>(null);
  const [previewSections, setPreviewSections] = useState<MenuSection[]>([]);
  const [ocrUsed, setOcrUsed] = useState(false);

  const pickImages = async () => {
    if (imageUris.length >= MENU_MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showErrorAlert('Photo access needed', 'Allow photo library access in Settings to add menu photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MENU_MAX_PHOTOS - imageUris.length,
      quality: 0.75,
    });
    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.map((a) => a.uri).slice(0, MENU_MAX_PHOTOS - imageUris.length);
      setImageUris((prev) => [...prev, ...uris].slice(0, MENU_MAX_PHOTOS));
    }
  };

  const takePhoto = async () => {
    if (imageUris.length >= MENU_MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showErrorAlert('Camera access needed', 'Allow camera access in Settings to take menu photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75 });
    if (!result.canceled && result.assets?.[0]) {
      setImageUris((prev) => [...prev, result.assets[0].uri].slice(0, MENU_MAX_PHOTOS));
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const buildDraftFromManual = () => {
    const text = manualText.trim();
    if (!text.length) {
      showErrorAlert('Menu text needed', 'Paste or type your menu (sections and items with prices) in the text box.');
      return;
    }
    const { sections, confidence, rawLines } = parseMenuFromRawText(text);
    const now = Date.now();
    const versionId = `ver_${now}_${Math.random().toString(36).slice(2, 9)}`;
    const version: MenuVersion = {
      id: versionId,
      partnerId: pid,
      menuId: '',
      source: {
        photos: [],
        ocrEngine: 'MANUAL',
        confidence,
        rawLines,
      },
      sections,
      changeLog: { updatedByUid: 'You', summary: 'Initial from manual entry' },
      createdAt: now,
    };
    const { doc } = createDraftMenu(pid, version);
    router.replace({ pathname: '/partner/menu/edit', params: { menuId: doc.id } } as any);
  };

  const buildDraftFromPhotos = async () => {
    if (imageUris.length === 0) {
      showErrorAlert('Photos or text needed', 'Add at least one menu photo, or switch to "Paste menu text" and enter your menu.');
      return;
    }
    setStep('uploading');
    setUploadProgress({ current: 0, total: imageUris.length });
    const now = Date.now();
    const versionId = `ver_${now}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      const { doc } = createDraftMenu(pid, {
        id: versionId,
        partnerId: pid,
        menuId: '',
        source: { photos: [], ocrEngine: 'MANUAL', confidence: 0, rawLines: [] },
        sections: [],
        changeLog: { updatedByUid: 'You', summary: 'Uploading…' },
        createdAt: now,
      });

      const resizedUris = await Promise.all(imageUris.map((uri) => resizeForMenuUpload(uri)));
      const uploadPromises = resizedUris.map((uri, i) =>
        uploadMenuImage(uri, pid, doc.id, versionId, i, { storagePathUid }).then((url) => {
          setUploadProgress((p) => ({ ...p, current: p.current + 1 }));
          return { storagePath: url, createdAt: now } as MenuPhoto;
        })
      );
      const photos = await Promise.all(uploadPromises);

      setStep('analyzing');
      const photoUrls = photos.map((p) => p.storagePath);
      let text = '';
      const ocrResult = await extractMenuTextFromImageUrls(photoUrls);
      if (ocrResult.success && ocrResult.text) {
        text = ocrResult.text;
        setOcrUsed(true);
      }
      if (!text) text = PLACEHOLDER_MENU_TEXT;

      const { sections, confidence, rawLines } = parseMenuFromRawText(text);
      const version: MenuVersion = {
        id: versionId,
        partnerId: pid,
        menuId: doc.id,
        source: {
          photos,
          ocrEngine: flags.partnerMenusOcrOnDevice ? 'ON_DEVICE' : (ocrResult.success && ocrResult.text ? 'CLOUD_FALLBACK' : 'MANUAL'),
          confidence,
          rawLines,
        },
        sections,
        changeLog: { updatedByUid: 'You', summary: ocrResult.success && ocrResult.text ? 'From photo OCR' : 'Initial from photos (edit items below)' },
        createdAt: now,
      };
      updateMenuVersion(doc.id, version);
      setPreviewMenuId(doc.id);
      setPreviewSections(sections);
      setStep('preview');
    } catch (e) {
      if (__DEV__) console.error('Upload menu error:', e);
      setStep('error');
      const isRetryable = (e as { code?: string })?.code === 'storage/retry-limit-exceeded' || (e as { code?: string })?.code === 'storage/network-request-failed';
      showErrorAlert(
        'Upload didn’t complete',
        isRetryable
          ? 'The upload timed out (weak or unstable connection). Check your network and tap "Retry upload" below, or use "Paste menu text" instead.'
          : 'We couldn’t upload your menu. Try using "Paste menu text" instead, or check your connection and try again.'
      );
    }
  };

  const goToEdit = () => {
    if (previewMenuId) {
      safeHaptics.selectionAsync();
      router.replace({ pathname: '/partner/menu/edit', params: { menuId: previewMenuId } } as any);
    }
  };

  const startOver = () => {
    setStep('idle');
    setPreviewMenuId(null);
    setPreviewSections([]);
    setImageUris([]);
    setOcrUsed(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  const canProceed = useManual ? manualText.trim().length > 0 : imageUris.length > 0;
  const processing = step === 'uploading' || step === 'analyzing';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (step === 'preview') startOver();
            else router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {step === 'preview' ? 'Menu preview' : 'Upload Menu'}
        </Text>
      </View>

      {step === 'preview' ? (
        <ScrollView contentContainerStyle={styles.previewContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>
              {ocrUsed ? 'We extracted this from your photos' : 'Your menu draft'}
            </Text>
            <Text style={[styles.previewSub, { color: colors.textSecondary }]}>
              {ocrUsed ? 'Review below and tap Edit menu to fix any items or prices.' : 'Edit the placeholder items below to match your real menu.'}
            </Text>
          </View>
          {previewSections.map((section) => (
            <View key={section.id} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionName, { color: colors.text }]}>{section.name}</Text>
              {section.items.map((item) => (
                <View key={item.id} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                    {item.priceCents != null ? `$${(item.priceCents / 100).toFixed(2)}` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          ))}
          <TouchableOpacity
            style={[styles.primaryBtn, styles.editBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? '#3b82f6' }]}
            onPress={goToEdit}
          >
            <Ionicons name="create-outline" size={22} color="#fff" />
            <Text style={styles.primaryBtnText}>Edit menu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={startOver}>
            <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Upload different photos</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {(step === 'uploading' || step === 'analyzing') && (
              <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ActivityIndicator size="large" color={COLORS.neonBlue?.[0]} />
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {step === 'uploading'
                    ? `Uploading photo ${uploadProgress.current} of ${uploadProgress.total}…`
                    : 'Analyzing menu text…'}
                </Text>
                <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                  {step === 'uploading' ? 'Your photos are being saved.' : 'Extracting items and prices.'}
                </Text>
              </View>
            )}

            {step === 'idle' && (
              <>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      { borderColor: colors.border },
                      !useManual && { backgroundColor: (COLORS.neonBlue?.[0] ?? '#3b82f6') + '28', borderColor: COLORS.neonBlue?.[0] ?? '#3b82f6', borderWidth: 2 },
                    ]}
                    onPress={() => { setUseManual(false); safeHaptics.selectionAsync(); }}
                  >
                    <Ionicons name="camera-outline" size={20} color={!useManual ? (COLORS.neonBlue?.[0] ?? '#3b82f6') : colors.textSecondary} />
                    <Text style={[styles.toggleText, { color: !useManual ? colors.text : colors.textSecondary, fontWeight: '700' }]}>Photos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      { borderColor: colors.border },
                      useManual && { backgroundColor: (COLORS.neonBlue?.[0] ?? '#3b82f6') + '28', borderColor: COLORS.neonBlue?.[0] ?? '#3b82f6', borderWidth: 2 },
                    ]}
                    onPress={() => { setUseManual(true); safeHaptics.selectionAsync(); }}
                  >
                    <Ionicons name="document-text-outline" size={20} color={useManual ? (COLORS.neonBlue?.[0] ?? '#3b82f6') : colors.textSecondary} />
                    <Text style={[styles.toggleText, { color: useManual ? colors.text : colors.textSecondary, fontWeight: '700' }]}>Paste text</Text>
                  </TouchableOpacity>
                </View>

                {useManual ? (
                  <>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Paste menu text (sections + items with prices)</Text>
                    <TextInput
                      style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholder="APPETIZERS\nCaesar Salad $9.99\n...\nENTREES\nGrilled Salmon $18.00"
                      placeholderTextColor={colors.textSecondary}
                      value={manualText}
                      onChangeText={setManualText}
                      multiline
                      numberOfLines={8}
                    />
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: canProceed ? (COLORS.neonBlue?.[0] ?? '#3b82f6') : colors.border }]}
                      onPress={buildDraftFromManual}
                      disabled={!canProceed}
                    >
                      <Text style={[styles.primaryBtnText, { color: canProceed ? '#fff' : colors.textSecondary }]}>Parse & Edit</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Photos (up to {MENU_MAX_PHOTOS})</Text>
                    <View style={styles.imageRow}>
                      {imageUris.map((uri, i) => (
                        <View key={i} style={[styles.imageWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                          <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(i)}>
                            <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {imageUris.length < MENU_MAX_PHOTOS && (
                        <>
                          <TouchableOpacity style={[styles.addImg, { backgroundColor: colors.surface, borderColor: (COLORS.neonBlue?.[0] ?? '#3b82f6') + '60' }]} onPress={pickImages}>
                            <Ionicons name="images-outline" size={28} color={colors.text} />
                            <Text style={[styles.addImgText, { color: colors.text, fontWeight: '700' }]}>Library</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.addImg, { backgroundColor: colors.surface, borderColor: (COLORS.neonBlue?.[0] ?? '#3b82f6') + '60' }]} onPress={takePhoto}>
                            <Ionicons name="camera-outline" size={28} color={colors.text} />
                            <Text style={[styles.addImgText, { color: colors.text, fontWeight: '700' }]}>Camera</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                    <Text style={[styles.hint, { color: colors.textSecondary }]}>
                      We'll extract menu items from your photos. You can review and edit them in the next step.
                    </Text>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: canProceed && !processing ? (COLORS.neonBlue?.[0] ?? '#3b82f6') : colors.border }]}
                      onPress={buildDraftFromPhotos}
                      disabled={!canProceed || processing}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={[styles.primaryBtnText, { color: canProceed && !processing ? '#fff' : colors.textSecondary }]}>Upload & continue</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {step === 'error' && (
              <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
                <Text style={[styles.progressText, { color: colors.text }]}>Upload failed</Text>
                <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                  Check your connection, then retry or choose different photos.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 16, backgroundColor: COLORS.neonBlue?.[0] ?? '#3b82f6' }]}
                  onPress={() => buildDraftFromPhotos()}
                >
                  <Text style={styles.primaryBtnText}>Retry upload</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 10, borderColor: colors.border }]} onPress={startOver}>
                  <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Choose different photos</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  keyboard: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  progressText: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  progressSub: { fontSize: 13, marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  toggleText: { fontSize: 14, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 160, textAlignVertical: 'top', marginBottom: 20 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  imageWrap: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  removeImg: { position: 'absolute', top: 4, right: 4 },
  addImg: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  addImgText: { fontSize: 11, marginTop: 4 },
  hint: { fontSize: 12, marginBottom: 20 },
  primaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  previewContent: { padding: 20, paddingBottom: 40 },
  previewCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  previewTitle: { fontSize: 17, fontWeight: '800' },
  previewSub: { fontSize: 13, marginTop: 6 },
  sectionCard: { borderRadius: 16, borderWidth: 1, marginBottom: 12, padding: 16 },
  sectionName: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1 },
  itemName: { fontSize: 15, flex: 1 },
  itemPrice: { fontSize: 14 },
  editBtn: { marginTop: 8, marginBottom: 12 },
  secondaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
});
