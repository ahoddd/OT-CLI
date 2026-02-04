import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OrbTapLogoImage } from '../../components/AppLogos';
import { COLORS } from '../../constants/Colors';
import {
  requestVerificationCode,
  verifyAndCreateUser,
  signInWithCustomToken,
} from '../../services/emailVerification';

type Step = 'form' | 'code';

const CODE_LENGTH = 6;

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRef = useRef<TextInput>(null);

  const handleSendCode = async () => {
    if (!email.trim() || !password || !username.trim()) {
      Alert.alert('Missing fields', 'Please fill in username, email, and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const result = await requestVerificationCode(email.trim(), password, username.trim());
      if (result.success) {
        setStep('code');
        setCode('');
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimeout(() => codeInputRef.current?.focus(), 300);
      } else {
        Alert.alert('Could not send code', result.message ?? 'Try again later.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async () => {
    const trimmed = code.replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (trimmed.length !== CODE_LENGTH) {
      Alert.alert('Invalid code', 'Enter the 6-digit code we sent to your email.');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyAndCreateUser(
        email.trim(),
        trimmed,
        password,
        username.trim()
      );
      if (result.success) {
        if (result.customToken && result.customToken.length > 0) {
          await signInWithCustomToken(result.customToken);
        }
        router.replace('/auth/onboarding' as any);
      } else {
        Alert.alert('Verification failed', result.message ?? 'Invalid or expired code.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'code') {
      setStep('form');
      setCode('');
    } else {
      router.back();
    }
  };

  const codeDigits = code.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
  const canVerify = codeDigits.length === CODE_LENGTH;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#0a0a12', '#000']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {step === 'form' ? (
          <>
            <View style={styles.header}>
              <OrbTapLogoImage width={100} height={75} />
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>We’ll send a 6-digit code to your email. No bots, no spam.</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#555"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#555"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters)"
                placeholderTextColor="#555"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.btn}
                onPress={handleSendCode}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
                  style={styles.btnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.btnText}>SEND VERIFICATION CODE</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to {email}. Enter it below.
              </Text>
              {__DEV__ && (
                <View style={styles.devHint}>
                  <Text style={styles.devHintText}>Dev: use code 123456</Text>
                </View>
              )}
            </View>

            <View style={styles.codeSection}>
              <TextInput
                ref={codeInputRef}
                style={styles.codeInputHidden}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, CODE_LENGTH))}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                placeholder="000000"
                placeholderTextColor="#333"
              />
              <View style={styles.codeDots}>
                {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.codeDot,
                      codeDigits[i] && styles.codeDotFilled,
                    ]}
                  >
                    <Text style={styles.codeDotText}>{codeDigits[i] ?? ''}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.resendBtn, resendCooldown > 0 && styles.resendDisabled]}
                onPress={resendCooldown === 0 ? handleSendCode : undefined}
                disabled={resendCooldown > 0 || loading}
              >
                <Text style={styles.resendText}>
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, !canVerify && styles.btnDisabled]}
                onPress={handleVerifyAndCreate}
                disabled={!canVerify || loading}
              >
                <LinearGradient
                  colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
                  style={styles.btnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.btnText}>VERIFY & CREATE ACCOUNT</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1, padding: 24 },
  backBtn: { marginBottom: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  devHint: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 8,
  },
  devHintText: { color: COLORS.neonBlue[0], fontSize: 12, fontWeight: '700' },
  form: { gap: 14 },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  btn: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  btnDisabled: { opacity: 0.6 },
  btnGrad: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '900', letterSpacing: 1 },

  codeSection: { alignItems: 'center' },
  codeInputHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  codeDots: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  codeDot: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeDotFilled: { borderColor: COLORS.neonBlue[0] },
  codeDotText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  resendBtn: { marginBottom: 24 },
  resendText: { color: COLORS.neonBlue[0], fontSize: 14, fontWeight: '700' },
  resendDisabled: { opacity: 0.6 },
});
