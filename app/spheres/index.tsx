import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocial, Circle } from '../../hooks/useSocial';
import { Ionicons } from '@expo/vector-icons';

export default function SpheresScreen() {
  const router = useRouter();
  const { circles } = useSocial();

  const renderItem = ({ item }: { item: Circle }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/spheres/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={item.type === 'couple' ? 'heart' : 'people'} size={24} color="#fff" />
        <Text style={styles.points}>{item.totalPoints} PTS</Text>
      </View>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.members}>{item.members.length} Members</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Spheres</Text>
      </View>

      <FlatList
        data={circles}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={() => alert('Invite flow next sprint')}>
          <Text style={styles.btnText}>Create New Sphere</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  list: { padding: 20 },
  card: { backgroundColor: '#111', padding: 20, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  points: { color: '#4ade80', fontWeight: 'bold', fontSize: 16 },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  members: { color: '#888' },
  footer: { padding: 20 },
  btn: { backgroundColor: '#fff', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { fontWeight: 'bold' },
});
