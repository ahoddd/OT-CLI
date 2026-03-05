/**
 * User invite landing — when someone opens a link with ?invite=referrerUid.
 * Prompts to sign up; passes invite param so both get 50 OT when they join.
 * Personalizes with referrer display name from Firestore when available.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';
import { useI18n } from '../../context/I18nContext';

export default function InviteLandingScreen() {
  const { t } = useI18n();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { user } = useAuth();
  const [referrerName, setReferrerName] = useState<string | null>(null);

  const referrerUid = typeof invite === 'string' ? invite.trim() : '';

  useEffect(() => {
    if (!referrerUid) return;
    getDoc(doc(db, 'users', referrerUid))
      .then((snap) => {
        const d = snap.data();
        const name = (d?.displayName as string) || (d?.username as string) || null;
        if (name) setReferrerName(name);
      })
      .catch(() => {});
  }, [referrerUid]);

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const goSignup = () => {
    if (referrerUid) {
      router.push({ pathname: '/auth/signup', params: { invite: referrerUid } } as any);
    } else {
      router.push('/auth/signup');
    }
  };

  const inviteSub = referrerUid
    ? referrerName
      ? `${referrerName} invited you to OrbTap — claim your 50 OT bonus when you join.`
      : "A friend invited you to OrbTap — you'll both get 50 OT Points when you join."
    : 'Join OrbTap to discover real places, earn points, and redeem perks.';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[COLORS.neonBlue[0] + '18', themeGold + '0c'] as [string, string]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: themeGold + '28' }]}>
            <Ionicons name="gift" size={48} color={themeGold} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>You're invited</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {inviteSub}
          </Text>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: COLORS.neonBlue[0] }]}
            onPress={goSignup}
          >
            <Text style={styles.ctaText}>Create account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/auth/login')}>
            <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, justifyContent: 'center', padding: 24 },
  content: { alignItems: 'center' },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  sub: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  cta: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14 },
  ctaText: { color: '#000', fontSize: 17, fontWeight: '800' },
  loginLink: { marginTop: 20 },
  loginLinkText: { fontSize: 15 },
});
