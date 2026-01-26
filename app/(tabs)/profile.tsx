import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocial } from '../../hooks/useSocial';
import { useWallet } from '../../hooks/useWallet';
import { Ionicons } from '@expo/vector-icons';
import { TIER_COLORS } from '../../constants/MockData';

export default function ProfileScreen() {
  const router = useRouter();
  const { getFollowedPartners, circles } = useSocial();
  const { balance } = useWallet();
  const followed = getFollowedPartners();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <View style={styles.topRow}>
             <View style={styles.userInfo}>
                <View style={styles.avatar}><Text style={styles.avatarText}>YOU</Text></View>
                <View>
                    <Text style={styles.username}>Explorer One</Text>
                    <Text style={styles.stats}>{balance} Points • {followed.length} Following</Text>
                </View>
             </View>
             <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
                <Ionicons name="settings-sharp" size={24} color="#fff" />
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MY SPHERES</Text>
          <TouchableOpacity onPress={() => router.push('/spheres' as any)}>
            <Text style={styles.seeAll}>VIEW ALL ›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hzList}>
          {circles.map(c => (
            <TouchableOpacity 
              key={c.id} 
              style={styles.circleCard}
              onPress={() => router.push(`/spheres/${c.id}` as any)}
            >
              <View style={styles.circleIcon}>
                <Ionicons name={c.type === 'couple' ? 'heart' : 'people'} size={20} color="#fff" />
              </View>
              <Text style={styles.circleName}>{c.name}</Text>
              <Text style={styles.circlePoints}>{c.totalPoints} pts</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.circleCard, styles.addCircle]}>
             <Ionicons name="add" size={32} color="#444" />
             <Text style={styles.addText}>Join</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>FOLLOWING</Text>
        {followed.length === 0 ? (
          <Text style={styles.empty}>Follow partners to see them here.</Text>
        ) : (
          followed.map(p => (
            <TouchableOpacity 
              key={p.id} 
              style={styles.partnerRow}
              onPress={() => router.push(`/partner/${p.id}` as any)}
            >
              <View style={[styles.dot, { backgroundColor: TIER_COLORS[p.tier] }]} />
              <Text style={styles.partnerName}>{p.name}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#888', fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  stats: { color: '#888', marginTop: 4 },
  settingsBtn: { padding: 8, backgroundColor: '#111', borderRadius: 20 },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  seeAll: { color: '#4ade80', fontSize: 12, fontWeight: 'bold' },
  hzList: { flexDirection: 'row', marginBottom: 20 },
  circleCard: { width: 120, height: 140, backgroundColor: '#111', borderRadius: 12, padding: 12, marginRight: 12, justifyContent: 'space-between' },
  addCircle: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#333', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  addText: { color: '#444', fontWeight: 'bold', marginTop: 8 },
  circleIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  circleName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  circlePoints: { color: '#4ade80', fontSize: 12 },
  empty: { color: '#444', fontStyle: 'italic' },
  partnerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  partnerName: { color: '#fff', fontSize: 16, flex: 1 },
  arrow: { color: '#666', fontSize: 18 },
});
