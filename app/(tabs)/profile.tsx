import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          style={styles.adminButton} 
          onPress={() => router.push('/admin')}
        >
          <Text style={styles.adminText}>⚠️ Admin Hub</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  adminButton: { padding: 15, backgroundColor: '#221111', borderRadius: 8, borderWidth: 1, borderColor: '#522' },
  adminText: { color: '#f88', fontWeight: 'bold', textAlign: 'center' },
});
