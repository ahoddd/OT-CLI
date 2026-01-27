import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { COLORS } from '../../constants/Colors';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Set the display name (username)
      await updateProfile(userCredential.user, { displayName: username });
      // Redirect handled by AuthContext
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Create Identity</Text>
        <Text style={styles.subtitle}>Begin your journey.</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.form}>
        <TextInput 
            style={styles.input} 
            placeholder="Username" 
            placeholderTextColor="#444"
            value={username}
            onChangeText={setUsername}
        />
        <TextInput 
            style={styles.input} 
            placeholder="Email" 
            placeholderTextColor="#444"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
        />
        <TextInput 
            style={styles.input} 
            placeholder="Password" 
            placeholderTextColor="#444"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>ESTABLISH CONNECTION</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 24 },
  backBtn: { marginBottom: 30 },
  header: { marginBottom: 40 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#666', fontSize: 16, marginTop: 8 },
  form: { gap: 16 },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 18, color: '#fff', fontSize: 16 },
  btn: { backgroundColor: COLORS.neonBlue[0], padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#000', fontWeight: '900', letterSpacing: 1 }
});
