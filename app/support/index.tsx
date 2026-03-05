/**
 * Support — submit help requests. Persisted to Firestore.
 * Premium UI with loading, success, and error states.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useModerationLevel } from '../../hooks/useModerationLevel';
import { moderateContent } from '../../utils/moderation';
import { COLORS } from '../../constants/Colors';
import { SCROLL_CONTENT, SPACE, RADIUS, TYPE } from '../../constants/DesignTokens';
import { submitSupportRequest } from '../../services/supportRequests';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { useI18n } from '../../context/I18nContext';

export default function SupportScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const moderationLevel = useModerationLevel();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) {
      setError('Please sign in to submit a support request.');
      return;
    }
    const trimmed = message.trim();
    if (!trimmed || trimmed.length < 10) {
      setError('Please describe your issue in at least 10 characters.');
      return;
    }
    if (moderationLevel !== 'none') {
      const result = moderateContent(trimmed, moderationLevel);
      if (!result.passed) {
        setError(result.reason ?? 'Message contains content that cannot be sent.');
        return;
      }
    }
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await submitSupportRequest({
      message: trimmed,
      userId: user?.uid ?? null,
      email: user?.email ?? null,
      displayName: user?.displayName ?? null,
    });

    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      setMessage('');
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }
  };

  if (submitted) {
    return (
      <ScreenWrapper
        title={t('support.support')}
        headerLeft={
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        }
      >
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: COLORS.success + '24' }]}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>{t('support.requestReceived')}</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            {t('support.requestReceivedSub')}
          </Text>
          <TouchableOpacity
            style={[styles.successBtn, { backgroundColor: COLORS.neonBlue[0] }]}
            onPress={() => { setSubmitted(false); }}
          >
            <Text style={styles.successBtnText}>{t('support.sendAnother')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>{t('support.backToSettings')}</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      title={t('support.support')}
      headerLeft={
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      }
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient
              colors={[(COLORS.neonBlue?.[0] ?? '#60a5fa') + '18', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="headset" size={40} color={COLORS.neonBlue?.[0] ?? '#60a5fa'} style={{ marginBottom: 12 }} />
            <Text style={[styles.heroTitle, { color: colors.text }]}>{t('support.heroTitle')}</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              {t('support.heroSub')}
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>YOUR MESSAGE</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: error ? COLORS.danger : colors.border, color: colors.text },
            ]}
            value={message}
            onChangeText={(t) => { setMessage(t); setError(null); }}
            placeholder={t('support.placeholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!submitting}
          />
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={[styles.errorText, { color: COLORS.danger }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: COLORS.neonBlue[0] },
              (submitting || !user) && styles.btnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || !user}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>{t('support.sendRequest')}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="mail" size={20} color={COLORS.success} />
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('support.needFasterHelp')}</Text>
              <Text style={[styles.email, { color: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}>help@orbtap.com</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  keyboardView: { flex: 1 },
  scrollContent: { ...SCROLL_CONTENT, paddingTop: SPACE.lg, paddingBottom: SPACE.xxxl },
  heroCard: {
    borderRadius: RADIUS.base,
    borderWidth: 1,
    padding: SPACE.xl,
    alignItems: 'center',
    marginBottom: SPACE.xl,
  },
  heroTitle: { fontSize: TYPE.heading, fontWeight: '800', marginBottom: SPACE.sm },
  heroSub: { fontSize: TYPE.label, textAlign: 'center', lineHeight: 22 },
  label: { fontSize: TYPE.caption, fontWeight: '800', letterSpacing: 1.2, marginBottom: SPACE.md },
  input: {
    borderRadius: 14,
    padding: 18,
    minHeight: 160,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: '600' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 24,
    gap: 14,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 12, marginBottom: 4 },
  email: { fontSize: 15, fontWeight: '700' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  successBtn: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  successBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  backLink: { marginTop: 20 },
  backLinkText: { fontSize: 14, fontWeight: '600' },
});
