import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ partnerId?: string; name?: string }>();
  const name = params.name ?? 'this item';
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    Alert.alert(
      'Thank You',
      'We have received your report and will review it within 24 hours.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScreenWrapper
      title="Report"
      headerLeft={
        <>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={require('../assets/images/icon.png')} style={styles.headerLogo} resizeMode="contain" />
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.reportingLabel}>Reporting: {name}</Text>
        <Text style={styles.reasonLabel}>Reason for report</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the issue..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={5}
          value={reason}
          onChangeText={setReason}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={styles.submitBtnText}>Submit Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48 },
  reportingLabel: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 24 },
  reasonLabel: { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  textArea: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#888', fontSize: 16 },
  backBtn: { padding: 8 },
  headerLogo: { width: 32, height: 26 },
});
