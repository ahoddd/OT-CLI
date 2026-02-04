import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function InviteScreen() {
  const { code } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Invite</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Join Sphere</Text>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.text}>You have been invited to join a sphere.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/profile')}>
          <Text style={styles.btnText}>Accept Invite (Mock)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
  },
  backBtn: { padding: 8 },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  code: { color: '#4ade80', fontSize: 32, fontWeight: 'bold', marginBottom: 24, letterSpacing: 4 },
  text: { color: '#888', marginBottom: 40, textAlign: 'center' },
  btn: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  btnText: { fontWeight: 'bold', fontSize: 16 },
});

