import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { OrbTapLogoImage } from '../../components/AppLogos';
import { COLORS } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn, FadeInDown, FadeOut, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { getRememberedEmail, setRememberedEmail, getBiometricCreds, saveBiometricCreds, isBiometricEnabled } from '../../services/authStorage';

const isExpoGo = Constants.appOwnership === 'expo';

const { width } = Dimensions.get('window');
const IDLE_BUBBLE_DELAY_MS = 2000;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [useBiometric, setUseBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasStoredCreds, setHasStoredCreds] = useState(false);
  const hasShownBubbleRef = useRef(false);

  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(withTiming(0.8, { duration: 2000 }), -1, true);
  }, []);

  useEffect(() => {
    (async () => {
      const remembered = await getRememberedEmail();
      if (remembered) setEmail(remembered);
      const enabled = await isBiometricEnabled();
      const creds = await getBiometricCreds();
      setHasStoredCreds(enabled && !!creds);
      if (isExpoGo) {
        setBiometricAvailable(false);
        return;
      }
      try {
        const LA = require('expo-local-authentication');
        const [hasHardware, isEnrolled] = await Promise.all([LA.hasHardwareAsync(), LA.isEnrolledAsync()]);
        setBiometricAvailable(hasHardware && isEnrolled);
      } catch {
        setBiometricAvailable(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (hasShownBubbleRef.current) return;
    const t = setTimeout(() => {
      hasShownBubbleRef.current = true;
      setShowBubble(true);
    }, IDLE_BUBBLE_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const dismissBubble = useCallback(() => setShowBubble(false), []);

  const getOrbTapErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return "That doesn't look like a valid email. Double-check and try again.";
      case 'auth/user-disabled':
        return "This OrbTap account has been deactivated. Contact support if you think this is a mistake.";
      case 'auth/user-not-found':
        return "We don't have an account with that email. Tap \"Claim Your Spot\" to sign up.";
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return "That password doesn't match our records. Try again or reset your password.";
      case 'auth/too-many-requests':
        return "Too many attempts. Please wait a moment and try again.";
      case 'auth/network-request-failed':
        return "Check your connection and try again. OrbTap needs the internet to sign you in.";
      default:
        return "We couldn't sign you in right now. Please try again.";
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Oops', 'Enter your email and password to continue.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      if (rememberMe) await setRememberedEmail(email.trim());
      else await setRememberedEmail(null);
      if (useBiometric) await saveBiometricCreds(email.trim(), password);
      router.replace('/' as any);
    } catch (error: any) {
      const code = error?.code ?? '';
      const message = getOrbTapErrorMessage(code);
      Alert.alert('Couldn\'t sign you in', message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!hasStoredCreds || isExpoGo) return;
    setLoading(true);
    try {
      const LA = require('expo-local-authentication');
      const { success } = await LA.authenticateAsync({ promptMessage: 'Sign in to OrbTap' });
      if (!success) {
        setLoading(false);
        return;
      }
      const creds = await getBiometricCreds();
      if (!creds) {
        setLoading(false);
        return;
      }
      await signInWithEmailAndPassword(auth, creds.email, creds.password);
      router.replace('/' as any);
    } catch (error: any) {
      Alert.alert('Couldn\'t sign you in', 'Try signing in with your email and password instead.');
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
          <OrbTapLogoImage width={160} height={120} />
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

          {showBubble && (
            <Animated.View entering={FadeInDown.duration(400)} exiting={FadeOut.duration(200)} style={styles.bubbleWrap}>
              <TouchableOpacity activeOpacity={1} onPress={dismissBubble} style={styles.bubbleTouch}>
                <View style={styles.bubble}>
                  <Text style={styles.bubbleText}>Tap in to see your perks!</Text>
                  <Text style={styles.bubbleEmoji}>👇</Text>
                  <View style={styles.bubbleArrow} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {hasStoredCreds && biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={() => { dismissBubble(); handleBiometricLogin(); }}
              disabled={loading}
            >
              <Ionicons name={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print'} size={24} color={COLORS.neonBlue[0]} />
              <Text style={styles.biometricBtnText}>Sign in with {Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.loginBtn} onPress={() => { dismissBubble(); handleLogin(); }} disabled={loading}>
            <LinearGradient
              colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Tap to Enter</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => { setRememberMe((r) => !r); }}
              activeOpacity={0.8}
            >
              <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={20} color={rememberMe ? COLORS.neonBlue[0] : '#666'} />
              <Text style={styles.checkLabel}>Remember me</Text>
            </TouchableOpacity>
            {biometricAvailable && (
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => { setUseBiometric((b) => !b); }}
                activeOpacity={0.8}
              >
                <Ionicons name={useBiometric ? 'checkbox' : 'square-outline'} size={20} color={useBiometric ? COLORS.neonBlue[0] : '#666'} />
                <Text style={styles.checkLabel}>{Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={() => { dismissBubble(); router.push('/auth/signup'); }}>
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
  orbGlow: { position: 'absolute', top: -100, width: width, height: width, borderRadius: width/2, backgroundColor: COLORS.neonBlue[0], opacity: 0.2 },
  
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  
  logoSection: { alignItems: 'center', marginBottom: 50 },
  tagline: { color: '#888', letterSpacing: 3, fontSize: 10, marginTop: 16, fontWeight: 'bold' },
  socialProof: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginRight: 6 },
  proofText: { color: '#ccc', fontSize: 10, fontWeight: 'bold' },

  form: { width: '100%', gap: 16 },
  inputWrapper: { borderRadius: 12, borderWidth: 1, borderColor: '#333', backgroundColor: '#050505', overflow: 'hidden' },
  input: { padding: 18, color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  bubbleWrap: { alignItems: 'center', marginBottom: 6 },
  bubbleTouch: { alignSelf: 'center' },
  bubble: {
    backgroundColor: 'rgba(30, 38, 58, 0.94)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
    alignItems: 'center',
    shadowColor: COLORS.neonBlue[0],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bubbleText: { color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  bubbleEmoji: { fontSize: 20, marginTop: 2 },
  bubbleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(30, 38, 58, 0.94)',
    marginTop: 4,
  },

  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
  },
  biometricBtnText: { color: COLORS.neonBlue[0], fontSize: 14, fontWeight: '700' },
  loginBtn: { marginTop: 10, borderRadius: 12, overflow: 'hidden', shadowColor: COLORS.neonBlue[0], shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
  btnGradient: { padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 2 },
  optionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkLabel: { color: '#888', fontSize: 12, fontWeight: '600' },
  linkText: { color: '#666', textAlign: 'center', fontSize: 12, marginTop: 20 },
  highlight: { color: '#fff', fontWeight: 'bold', textDecorationLine: 'underline' }
});
