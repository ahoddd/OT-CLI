import React from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFlags } from '../../components/FlagContext';
import { FlagKey } from '../../constants/Flags';
import { useRouter } from 'expo-router';

export default function AdminHub() {
  const { flags, setFlag, resetFlags } = useFlags();
  const router = useRouter();
  const keys = Object.keys(flags) as FlagKey[];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Hub</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feature Flags</Text>
          {keys.map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key}</Text>
              <Switch
                value={flags[key]}
                onValueChange={(val) => setFlag(key, val)}
                trackColor={{ false: '#333', true: '#4ade80' }}
              />
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={resetFlags} style={styles.resetButton}>
          <Text style={styles.resetText}>Reset Defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16 },
  backText: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scroll: { padding: 16 },
  section: { marginBottom: 32 },
  sectionTitle: { color: '#888', marginBottom: 16, fontSize: 12, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  label: { color: '#fff', fontSize: 14 },
  resetButton: { backgroundColor: '#333', padding: 16, borderRadius: 8, alignItems: 'center' },
  resetText: { color: '#fff', fontWeight: 'bold' },
});
