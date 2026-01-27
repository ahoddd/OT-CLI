import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { OrbTapLogo } from '../../components/AppLogos';
import { COLORS } from '../../constants/Colors';
import Animated, { FadeInUp, FadeIn, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(withTiming(0.8, { duration: 2000 }), -1, true);
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Credentials required.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert('Access Denied', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Ambience */}
      <LinearGradient colors={['#000000', '#110022', '#000000']} style={styles.background} />
      <Animated.View style={[styles.orbGlow, animatedGlow]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <Animated.View entering={FadeInUp.duration(1000)} style={styles.logoSection}>
          <OrbTapLogo width={200} />
          <Text style={styles.tagline}>THE FUTURE OF SOCIAL CURRENCY</Text>
          <View style={styles.socialProof}>
            <View style={styles.greenDot} />
            <Text style={styles.proofText}>1,204 Explorers joined today</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(500).duration(1000)} style={styles.form}>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} 
              placeholder="IDENTITY / EMAIL" 
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} 
              placeholder="ACCESS CODE / PASSWORD" 
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            <LinearGradient
              colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>INITIATE LINK</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.linkText}>No Access? <Text style={styles.highlight}>Claim Your Spot</Text></Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { position: 'absolute', width: '100%', height: '100%' },
  orbGlow: { position: 'absolute', top: -100, width: width, height: width, borderRadius: width/2, backgroundColor: COLORS.neonBlue[0], opacity: 0.2, blurRadius: 50 },
  
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  
  logoSection: { alignItems: 'center', marginBottom: 50 },
  tagline: { color: '#888', letterSpacing: 3, fontSize: 10, marginTop: 16, fontWeight: 'bold' },
  socialProof: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginRight: 6 },
  proofText: { color: '#ccc', fontSize: 10, fontWeight: 'bold' },

  form: { width: '100%', gap: 16 },
  inputWrapper: { borderRadius: 12, borderWidth: 1, borderColor: '#333', backgroundColor: '#050505', overflow: 'hidden' },
  input: { padding: 18, color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  
  loginBtn: { marginTop: 10, borderRadius: 12, overflow: 'hidden', shadowColor: COLORS.neonBlue[0], shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
  btnGradient: { padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 2 },
  
  linkText: { color: '#666', textAlign: 'center', fontSize: 12, marginTop: 20 },
  highlight: { color: '#fff', fontWeight: 'bold', textDecorationLine: 'underline' }
});
