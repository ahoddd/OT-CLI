import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AcceptableUseScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Acceptable Use Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
          Effective Date: Jan 26, 2026{'\n\n'}
          1. Introduction — OrbTap is for discovering and redeeming local perks. You agree to use the app only for lawful, intended purposes.{'\n\n'}
          2. Prohibited Conduct — You may not: spoof location; abuse redemption (fraud, resale); harass partners or other users; circumvent caps or cooldowns; or use automation to gain unfair advantage.{'\n\n'}
          3. Consequences — Violations may result in loss of access, balance adjustments, or account termination.{'\n\n'}
          4. Reporting — Report violations via the in-app Report flow or Support.{'\n\n'}
          (Full text placeholder for MVP.)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  text: { color: '#ccc', lineHeight: 24, fontSize: 16 },
});
