import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
            **Effective Date: Jan 26, 2026**{'\n\n'}
            1. **Introduction**: OrbTap values your privacy...{'\n\n'}
            2. **Data Collection**: We collect location data to verify visits...{'\n\n'}
            3. **Usage**: Your data is used to provide rewards...{'\n\n'}
            4. **Sharing**: We do not sell your personal data...{'\n\n'}
            (Full text placeholder for MVP)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  text: { color: '#ccc', lineHeight: 24, fontSize: 16 },
});
