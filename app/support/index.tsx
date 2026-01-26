import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Support</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>HOW CAN WE HELP?</Text>
        <TextInput 
            style={styles.input} 
            placeholder="Describe your issue..." 
            placeholderTextColor="#666" 
            multiline 
            numberOfLines={6}
        />
        
        <TouchableOpacity style={styles.btn} onPress={() => { alert('Report sent!'); router.back(); }}>
            <Text style={styles.btnText}>Send Report</Text>
        </TouchableOpacity>

        <View style={styles.info}>
            <Text style={styles.infoText}>For immediate assistance, email:</Text>
            <Text style={styles.email}>help@orbtap.com</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  label: { color: '#888', marginBottom: 12, fontWeight: 'bold', fontSize: 12 },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 8, padding: 16, height: 150, textAlignVertical: 'top', marginBottom: 20 },
  btn: { backgroundColor: '#fff', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { fontWeight: 'bold' },
  info: { marginTop: 40, alignItems: 'center' },
  infoText: { color: '#666', marginBottom: 8 },
  email: { color: '#4ade80', fontSize: 16, fontWeight: 'bold' },
});
