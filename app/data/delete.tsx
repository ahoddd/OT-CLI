/**
 * Data Deletion Request — Apple/Google compliant. Persisted to Firestore.
 * Premium UI with loading, success, and validation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/Colors';
import { submitDataDeletionRequest } from '../../services/dataDeletionRequests';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { useI18n } from '../../context/I18nContext';

export default function DataDeletionScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');

  if (!authLoading && !user) {
    return <Redirect href="/auth/login" />;
  }
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your account email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await submitDataDeletionRequest({
      email: trimmed,
      userId: user?.uid ?? null,
    });

    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setError(result.error || 'Failed to submit. Please try again.');
    }
  };

  if (submitted) {
    return (
      <ScreenWrapper
        title="Request submitted"
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
          <Text style={[styles.successTitle, { color: colors.text }]}>Request received</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            We will process your data deletion request within 30 days and confirm to the email you provided.
          </Text>
          <TouchableOpacity style={[styles.backBtnMain, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: colors.text }]}>Back to settings</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      title="Data Deletion Request"
      headerLeft={
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      }
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.warningCard, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: COLORS.danger + '44' }]}>
            <Ionicons name="shield-checkmark" size={28} color={COLORS.danger} />
            <View style={styles.warningTextWrap}>
              <Text style={[styles.warningTitle, { color: colors.text }]}>Permanent deletion</Text>
              <Text style={[styles.warningSub, { color: colors.textSecondary }]}>
                Request permanent deletion of your OrbTap account and associated data. This cannot be undone.
              </Text>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>ACCOUNT EMAIL</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: error ? COLORS.danger : colors.border, color: colors.text },
            ]}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(null); }}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
          />
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={[styles.errorText, { color: COLORS.danger }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: COLORS.danger }, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Submit request</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.footer, { color: colors.textSecondary }]}>
            Per our Privacy Policy, we process deletion requests within 30 days. You'll receive confirmation at the email above.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 16,
  },
  warningTextWrap: { flex: 1 },
  warningTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  warningSub: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    fontSize: 16,
    marginBottom: 12,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer: { fontSize: 13, lineHeight: 20, marginTop: 24 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  backBtnMain: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, borderWidth: 1 },
  backBtnText: { fontSize: 15, fontWeight: '800' },
});
