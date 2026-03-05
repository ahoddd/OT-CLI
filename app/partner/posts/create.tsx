/**
 * OrbFeed Partner Composer — create OrbPost (template-based).
 * Requires isOrbFeedPartnerComposerEnabled. Upload up to 3 images. Moderation before publish.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../../components/FlagContext';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../context/AuthContext';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { COLORS } from '../../../constants/Colors';
import { getPostTypeLabel, type OrbPostType, type CtaKind } from '../../../constants/OrbFeed';
import { moderateContent } from '../../../utils/moderation';
import { validateImageForUpload } from '../../../utils/imageModeration';
import { useModerationLevel } from '../../../hooks/useModerationLevel';
import { uploadPostImage } from '../../../services/uploadPostImage';
import { createOrbPost } from '../../../services/orbPosts';
import { alert as alertDialog, showErrorAlert } from '../../../utils/alert';
import { capitalizeFirstLetter } from '../../../utils/capitalizeFirstLetter';
import { useI18n } from '../../../context/I18nContext';

const MAX_IMAGES = 3;
const POST_TYPES: OrbPostType[] = ['DROP', 'EVENT', 'PRODUCT', 'ANNOUNCEMENT', 'MENU_ITEM', 'SERVICE_SLOT'];
const CTA_OPTIONS: CtaKind[] = ['CLAIM', 'RESERVE', 'BUY', 'NAVIGATE', 'SAVE', 'PLAN'];

function initialPostTypeFromParam(template?: string): OrbPostType {
  if (!template) return 'ANNOUNCEMENT';
  const u = (template || '').toUpperCase();
  if (POST_TYPES.includes(u as OrbPostType)) return u as OrbPostType;
  if (template === 'drop_promo') return 'DROP';
  return 'ANNOUNCEMENT';
}

export default function PartnerCreatePostScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ template?: string; schedule?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { myPartnerId, myPartner, loading: myPartnerLoading } = useMyPartner();
  const { flags } = useFlags();
  const moderationLevel = useModerationLevel();
  const [postType, setPostType] = useState<OrbPostType>(() => initialPostTypeFromParam(params.template));
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ctaKind, setCtaKind] = useState<CtaKind>('NAVIGATE');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [scarcityQty, setScarcityQty] = useState('');
  const [scarcityExpiresHours, setScarcityExpiresHours] = useState('');

  if (!flags.isOrbFeedPartnerComposerEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Create Post</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.text }]}>Composer is off</Text>
          <Text style={[styles.offSub, { color: colors.textSecondary }]}>Enable in Admin Hub.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const titleValid = title.trim().length >= 6 && title.trim().length <= 60;
  const bodyValid = body.trim().length >= 20 && body.trim().length <= 400;

  const pickImage = async () => {
    if (imageUris.length >= MAX_IMAGES) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showErrorAlert('Photo access needed', 'Allow photo library access in Settings to add images to your post.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - imageUris.length,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const candidateUris = result.assets.map((a) => a.uri).slice(0, MAX_IMAGES - imageUris.length);
      const validUris: string[] = [];
      for (const uri of candidateUris) {
        const validation = await validateImageForUpload(uri);
        if (validation.passed) {
          validUris.push(uri);
        } else {
          showErrorAlert('Image not allowed', validation.reason ?? 'This image can’t be used. Please choose a different photo.');
          return;
        }
      }
      if (validUris.length) {
        setImageUris((prev) => [...prev, ...validUris].slice(0, MAX_IMAGES));
      }
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!user?.uid || !myPartnerId) {
      showErrorAlert('Sign in required', 'Link a business to save drafts.');
      return;
    }
    setPublishing(true);
    try {
      const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const partnerId = myPartnerId;
      const mediaRefs: string[] = [];
      for (let i = 0; i < imageUris.length; i++) {
        try {
          const url = await uploadPostImage(imageUris[i], partnerId, postId, i);
          mediaRefs.push(url);
        } catch (_) {}
      }
      let scarcity: { quantityRemaining?: number; expiresAt?: number } | undefined;
      if (postType === 'DROP' && scarcityQty.trim()) {
        const qty = parseInt(scarcityQty.trim(), 10);
        const hours = parseInt(scarcityExpiresHours.trim(), 10) || 24;
        scarcity = {
          quantityRemaining: Number.isNaN(qty) ? 99 : Math.min(999, qty),
          expiresAt: Date.now() + (Number.isNaN(hours) ? 24 : Math.min(168, hours)) * 60 * 60 * 1000,
        };
      }
      const result = await createOrbPost({
        partnerId,
        partnerName: myPartner?.name ?? 'Partner',
        partnerVerified: myPartner?.verified ?? false,
        type: postType,
        title: title.trim() || '(Draft)',
        body: body.trim(),
        mediaRefs,
        ctaKind,
        ctaTargetRef: `partner_${partnerId}`,
        scarcity,
        moderatedBy: 'bypass',
        status: 'DRAFT',
      });
      if (result.success) {
        alertDialog('Draft saved', 'You can edit and publish from My Posts.', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        showErrorAlert('Save failed', result.error ?? 'Could not save draft.');
      }
    } catch (e) {
      showErrorAlert('Save failed', e instanceof Error ? e.message : 'Could not save draft.');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = async () => {
    if (!user?.uid) {
      showErrorAlert('Sign in required', 'You must be signed in to publish. Please sign in and try again.');
      return;
    }
    if (!myPartnerId) {
      showErrorAlert('Link a business', 'You need a linked business to publish. Go to Partner Command and link your business, or apply to get on the map.');
      return;
    }
    if (!titleValid) {
      showErrorAlert('Title length', 'Use a title between 6 and 60 characters.');
      return;
    }
    if (!bodyValid) {
      showErrorAlert('Body length', 'Use a description between 20 and 400 characters.');
      return;
    }
    if (moderationLevel !== 'none') {
      const result = moderateContent(`${title.trim()} ${body.trim()}`, moderationLevel);
      if (!result.passed) {
        showErrorAlert('Content not allowed', result.reason ?? 'Your post contains content that can’t be published. Please edit and try again.');
        return;
      }
    }
    setPublishing(true);
    try {
      const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const partnerId = myPartnerId;
      const mediaRefs: string[] = [];
      for (let i = 0; i < imageUris.length; i++) {
        try {
          const url = await uploadPostImage(imageUris[i], partnerId, postId, i);
          mediaRefs.push(url);
        } catch (_imgErr) {
          // Continue without this image so post can still be published
        }
      }
      const now = Date.now();
      const HOUR_MS = 60 * 60 * 1000;
      let scarcity: { quantityRemaining?: number; expiresAt?: number } | undefined;
      if (postType === 'DROP') {
        const qty = scarcityQty.trim() ? parseInt(scarcityQty.trim(), 10) : 99;
        const hours = scarcityExpiresHours.trim() ? parseInt(scarcityExpiresHours.trim(), 10) : 24;
        scarcity = {
          quantityRemaining: Number.isNaN(qty) || qty < 1 ? 99 : Math.min(999, qty),
          expiresAt: now + (Number.isNaN(hours) || hours < 1 ? 24 : Math.min(168, hours)) * HOUR_MS,
        };
      }
      const moderatedBy = moderationLevel === 'full' ? 'system' as const : 'bypass' as const;
      const result = await createOrbPost({
        partnerId,
        partnerName: myPartner?.name ?? 'Partner',
        partnerVerified: myPartner?.verified ?? false,
        type: postType,
        title: title.trim(),
        body: body.trim(),
        mediaRefs,
        ctaKind,
        ctaTargetRef: `partner_${partnerId}`,
        scarcity,
        moderatedBy,
      });
      if (!result.success) {
        showErrorAlert('Publish did not complete', result.error ?? 'We couldn’t publish your post. Check your connection and try again.');
        return;
      }
      alertDialog('Published', 'Your post will appear in the Commerce Feed.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (__DEV__) console.error('Publish error:', e);
      showErrorAlert('Publish did not complete', message || 'Something went wrong. Check your connection and try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Create Post</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Post type</Text>
          <View style={styles.typeRow}>
            {POST_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typePill,
                  { backgroundColor: postType === t ? COLORS.neonBlue[0] : colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setPostType(t)}
              >
                <Text
                  style={[styles.typePillText, { color: postType === t ? '#000' : colors.textSecondary }]}
                >
                  {getPostTypeLabel(t)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Title (6–60 chars)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. Half-Off Cold Brew Tonight"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={(t) => setTitle(capitalizeFirstLetter(t))}
            maxLength={60}
            autoCapitalize="sentences"
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{title.length}/60</Text>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Body (20–400 chars)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="Describe your offer, event, or update. Min 20 characters."
            placeholderTextColor={colors.textSecondary}
            value={body}
            onChangeText={(t) => setBody(capitalizeFirstLetter(t))}
            maxLength={400}
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{body.length}/400</Text>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Images (up to {MAX_IMAGES})</Text>
          <View style={styles.imageRow}>
            {imageUris.map((uri, i) => (
              <View key={i} style={[styles.imageWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(i)}>
                  <Ionicons name="close-circle" size={22} color={COLORS.danger ?? '#ef4444'} />
                </TouchableOpacity>
              </View>
            ))}
            {imageUris.length < MAX_IMAGES && (
              <TouchableOpacity
                style={[styles.addImgBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={pickImage}
              >
                <Ionicons name="add" size={28} color={colors.textSecondary} />
                <Text style={[styles.addImgText, { color: colors.textSecondary }]}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Primary CTA</Text>
          <View style={styles.ctaRow}>
            {CTA_OPTIONS.map((k) => (
              <TouchableOpacity
                key={k}
                style={[
                  styles.ctaPill,
                  { backgroundColor: ctaKind === k ? colors.surfaceHighlight : colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setCtaKind(k)}
              >
                <Text style={[styles.ctaPillText, { color: colors.text }]}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {postType === 'DROP' && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Drop scarcity (optional)</Text>
              <View style={styles.scarcityRow}>
                <View style={styles.scarcityField}>
                  <Text style={[styles.scarcityHint, { color: colors.textSecondary }]}>Qty left</Text>
                  <TextInput
                    style={[styles.input, styles.scarcityInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="99"
                    placeholderTextColor={colors.textSecondary}
                    value={scarcityQty}
                    onChangeText={setScarcityQty}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.scarcityField}>
                  <Text style={[styles.scarcityHint, { color: colors.textSecondary }]}>Ends in (hours)</Text>
                  <TextInput
                    style={[styles.input, styles.scarcityInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="24"
                    placeholderTextColor={colors.textSecondary}
                    value={scarcityExpiresHours}
                    onChangeText={setScarcityExpiresHours}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </>
          )}

          {!myPartnerLoading && !myPartnerId && (
            <View style={[styles.linkBusinessBanner, { backgroundColor: (COLORS.danger ?? '#ef4444') + '18', borderColor: (COLORS.danger ?? '#ef4444') + '60' }]}>
              <Ionicons name="business-outline" size={20} color={COLORS.danger ?? '#ef4444'} />
              <Text style={[styles.linkBusinessText, { color: colors.text }]}>Link a business to publish. Go to Partner Command or apply to get on the map.</Text>
            </View>
          )}

          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>LIVE PREVIEW — How it appears in the feed</Text>
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.previewType, { color: colors.textSecondary }]}>{getPostTypeLabel(postType)}</Text>
            <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>{title.trim() || 'Your title'}</Text>
            <Text style={[styles.previewBody, { color: colors.textSecondary }]} numberOfLines={3}>{body.trim() || 'Description will appear here.'}</Text>
            {imageUris.length > 0 && (
              <View style={styles.previewThumbRow}>
                {imageUris.slice(0, 3).map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.previewThumb} resizeMode="cover" />
                ))}
              </View>
            )}
            <View style={[styles.previewCta, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.previewCtaText, { color: colors.text }]}>{ctaKind}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              disabled={!myPartnerId || publishing}
              style={[styles.draftBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={handleSaveDraft}
            >
              <Text style={[styles.draftBtnText, { color: colors.text }]}>Save as draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!myPartnerId || !titleValid || !bodyValid || publishing}
              style={[
                styles.publishBtn,
                (!myPartnerId || !titleValid || !bodyValid || publishing) && styles.publishBtnDisabled,
                { backgroundColor: myPartnerId && titleValid && bodyValid && !publishing ? COLORS.success : colors.surfaceHighlight },
              ]}
              onPress={handlePublish}
            >
              {publishing ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={[styles.publishBtnText, { color: myPartnerId && titleValid && bodyValid ? '#000' : colors.textSecondary }]}>
                  Publish
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  typePillText: { fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  inputMultiline: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, marginBottom: 16 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  imageWrap: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  thumb: { width: '100%', height: '100%' },
  removeImg: { position: 'absolute', top: 4, right: 4 },
  addImgBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImgText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  ctaPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  ctaPillText: { fontSize: 12, fontWeight: '600' },
  scarcityRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  scarcityField: { flex: 1 },
  scarcityHint: { fontSize: 11, marginBottom: 4 },
  scarcityInput: { marginBottom: 0 },
  linkBusinessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  linkBusinessText: { fontSize: 13, flex: 1 },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  draftBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  draftBtnText: { fontSize: 15, fontWeight: '700' },
  publishBtnDisabled: { opacity: 0.7 },
  previewLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  previewType: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  previewTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  previewBody: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  previewThumbRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  previewThumb: { width: 56, height: 56, borderRadius: 8 },
  previewCta: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  previewCtaText: { fontSize: 13, fontWeight: '600' },
  publishBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  publishBtnText: { fontSize: 16, fontWeight: '800' },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  offSub: { fontSize: 13, marginTop: 4 },
});
