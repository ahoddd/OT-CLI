import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignal } from '../../hooks/useSignal';
import { SignalCard } from '../../components/SignalCard';
import { Ionicons } from '@expo/vector-icons';

export default function OrbSignalScreen() {
  const router = useRouter();
  const { markets } = useSignal();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>OrbSignal</Text>
        <Ionicons name="information-circle-outline" size={24} color="#666" />
      </View>
      
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Use OT Points to forecast outcomes. No real money.</Text>
      </View>

      <FlatList
        data={markets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SignalCard 
            market={item} 
            onPress={() => router.push(`/orbsignal/${item.id}` as any)} 
          />
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  banner: { backgroundColor: '#221111', padding: 12 },
  bannerText: { color: '#f87171', fontSize: 12, textAlign: 'center' },
  list: { padding: 20 },
});
