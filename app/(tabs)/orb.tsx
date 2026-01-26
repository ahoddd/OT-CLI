import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreak } from '../../hooks/useStreak';
import { StreakOrb } from '../../components/StreakOrb';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function OrbScreen() {
  const { streak, checkIn, canCheckIn } = useStreak();
  const router = useRouter();

  const handleTap = () => {
    if (canCheckIn) {
      checkIn();
      // Optional: Add vibration here if haptics installed
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ORBTAP PRIME</Text>
        <Text style={styles.subtitle}>Daily Check-in</Text>
      </View>

      <View style={styles.orbContainer}>
        <StreakOrb 
          active={canCheckIn} 
          streakCount={canCheckIn ? streak.currentStreak : streak.currentStreak} 
          onTap={handleTap} 
        />
        <Text style={styles.status}>
          {canCheckIn ? "TAP TO MAINTAIN STREAK" : "STREAK ACTIVE • COME BACK TOMORROW"}
        </Text>
      </View>

      <View style={styles.grid}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/scan')}>
            <Ionicons name="qr-code" size={32} color="#4ade80" />
            <Text style={styles.cardText}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/wallet')}>
            <Ionicons name="wallet" size={32} color="#60a5fa" />
            <Text style={styles.cardText}>Wallet</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/spheres' as any)}>
            <Ionicons name="people" size={32} color="#f472b6" />
            <Text style={styles.cardText}>Spheres</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)')}>
            <Ionicons name="map" size={32} color="#fbbf24" />
            <Text style={styles.cardText}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { alignItems: 'center', paddingVertical: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  subtitle: { color: '#666', fontSize: 14, marginTop: 4 },
  orbContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  status: { color: '#888', marginTop: 30, fontSize: 10, letterSpacing: 2, fontWeight: 'bold' },
  grid: { padding: 20, paddingBottom: 40 },
  sectionTitle: { color: '#444', fontSize: 12, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: '#111', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  cardText: { color: '#fff', marginTop: 8, fontWeight: 'bold' },
});
