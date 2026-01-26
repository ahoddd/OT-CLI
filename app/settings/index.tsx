import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { resetFlags } = useFlags();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => router.replace('/') }
    ]);
  };

  const Option = ({ label, icon, dest, isDestructive = false }: any) => (
    <TouchableOpacity 
        style={styles.option} 
        onPress={() => dest ? router.push(dest) : null}
    >
        <View style={styles.optionLeft}>
            <Ionicons name={icon} size={20} color={isDestructive ? '#f87171' : '#fff'} />
            <Text style={[styles.optionText, isDestructive && styles.destructiveText]}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#444" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <Option label="Personal Info" icon="person-outline" />
        <Option label="Notifications" icon="notifications-outline" />
        <Option label="Data & Privacy" icon="shield-checkmark-outline" />

        <Text style={styles.sectionTitle}>SUPPORT & LEGAL</Text>
        <Option label="Support Center" icon="help-buoy-outline" dest="/support" />
        <Option label="Community Guidelines" icon="people-outline" dest="/legal/guidelines" />
        <Option label="Terms of Service" icon="document-text-outline" dest="/legal/terms" />
        <Option label="Privacy Policy" icon="lock-closed-outline" dest="/legal/privacy" />

        <Text style={styles.sectionTitle}>DEV</Text>
        <Option label="Admin Hub" icon="build-outline" dest="/admin" />

        <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
            <Text style={styles.version}>OrbTap v1.0.0 (MVP)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  sectionTitle: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#111' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { color: '#fff', fontSize: 16 },
  destructiveText: { color: '#f87171' },
  footer: { marginTop: 40, alignItems: 'center' },
  logoutBtn: { width: '100%', padding: 16, backgroundColor: '#221111', borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  logoutText: { color: '#f87171', fontWeight: 'bold' },
  version: { color: '#444', fontSize: 12 },
});
