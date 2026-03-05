import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { OrbTapLogoMark } from '../components/OrbTapLogoMark';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { alert as alertDialog } from '../utils/alert';
import { useI18n } from '../context/I18nContext';

export default function ReportScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ partnerId?: string; name?: string }>();
  const name = params.name ?? 'this item';
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    alertDialog(
      t('report.thankYouTitle'),
      t('report.thankYouMessage'),
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScreenWrapper
      title={t('report.title')}
      headerLeft={
        <>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <OrbTapLogoMark variant="small" width={32} height={28} />
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.reportingLabel, { color: colors.text }]}>{t('report.reporting', { name })}</Text>
        <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>{t('report.reasonLabel')}</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder={t('report.placeholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={5}
          value={reason}
          onChangeText={setReason}
          textAlignVertical="top"
        />
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: COLORS.danger }]} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={styles.submitBtnText}>{t('report.submitReport')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 120 },
  reportingLabel: { fontSize: 18, fontWeight: '700', marginBottom: 24 },
  reasonLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 16 },
  backBtn: { padding: 8 },
});
