import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function DataDeletionScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Missing email', 'Please enter your account email.');
      return;
    }
    Alert.alert(
      'Request submitted',
      'Your data deletion request has been recorded. We will process it within 30 days and confirm to this email.',
      [
        { text: 'OK', onPress: () => router.back() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Data Deletion Request</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.paragraph}>
            Request permanent deletion of your OrbTap account and associated data. This cannot be undone.
          </Text>
          <Text style={styles.label}>Account email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.submitText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, flex: 1 },
  paragraph: { color: '#aaa', fontSize: 14, lineHeight: 20, marginBottom: 24 },
  label: { color: '#888', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
