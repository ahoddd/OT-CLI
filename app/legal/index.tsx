import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const LEGAL_LINKS: { label: string; route: string }[] = [
  { label: 'Privacy Policy', route: '/legal/privacy' },
  { label: 'Terms of Service', route: '/legal/terms' },
  { label: 'Community Guidelines', route: '/legal/guidelines' },
  { label: 'Acceptable Use Policy', route: '/legal/acceptable-use' },
];

export default function LegalDirectoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Legal</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Policies & guidelines</Text>
        {LEGAL_LINKS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.row}
            onPress={() => router.push(item.route as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
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
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  subtitle: { color: '#888', fontSize: 12, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  rowLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
