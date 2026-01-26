import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocial } from '../../hooks/useSocial';
import { Ionicons } from '@expo/vector-icons';

export default function SphereDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { circles } = useSocial();
  const circle = circles.find(c => c.id === id);

  if (!circle) return <View style={styles.container}><Text style={styles.text}>Sphere not found</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{circle.name}</Text>
      </View>

      <View style={styles.hero}>
         <Ionicons name={circle.type === 'couple' ? 'heart' : 'people'} size={48} color="#4ade80" />
         <Text style={styles.points}>{circle.totalPoints.toLocaleString()}</Text>
         <Text style={styles.label}>TOTAL POINTS</Text>
      </View>

      <View style={styles.list}>
        <Text style={styles.sectionTitle}>MEMBERS</Text>
        {circle.members.map((m, idx) => (
          <View key={idx} style={styles.row}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{m[0]}</Text></View>
            <Text style={styles.memberName}>{m}</Text>
            <Text style={styles.rank}>#{idx + 1}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
         <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Invite Code: ABC-123</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  text: { color: '#fff', textAlign: 'center', marginTop: 50 },
  hero: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1, borderBottomColor: '#222' },
  points: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginVertical: 8 },
  label: { color: '#888', letterSpacing: 2, fontSize: 12 },
  list: { padding: 20 },
  sectionTitle: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#111', padding: 12, borderRadius: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  memberName: { color: '#fff', fontSize: 16, flex: 1 },
  rank: { color: '#4ade80', fontWeight: 'bold' },
  footer: { padding: 20, position: 'absolute', bottom: 20, width: '100%' },
  btn: { backgroundColor: '#222', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  btnText: { color: '#fff', letterSpacing: 1 },
});
