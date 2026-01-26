import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InviteScreen() {
  const { code } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Join Sphere</Text>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.text}>You have been invited to join a sphere.</Text>
      
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/profile')}>
        <Text style={styles.btnText}>Accept Invite (Mock)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  code: { color: '#4ade80', fontSize: 32, fontWeight: 'bold', marginBottom: 24, letterSpacing: 4 },
  text: { color: '#888', marginBottom: 40, textAlign: 'center' },
  btn: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  btnText: { fontWeight: 'bold', fontSize: 16 },
});
