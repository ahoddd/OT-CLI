/**
 * When maintenance mode is ON (Admin Hub), non-admin users see a full-screen overlay.
 * Admins can sign in via "Admin? Sign in" to reach the app and turn maintenance off.
 * While waiting, users can browse OrbTap links and read-only content.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useFlags } from './FlagContext';
import { useAuth } from '../context/AuthContext';
import { isAdminEmail } from '../constants/Admin';
import { ORBTAP_APP_LINK, PRIVACY_POLICY_URL, TERMS_URL } from '../constants/AppLinks';

const WHILE_YOU_WAIT = [
  {
    title: 'What is OrbTap?',
    body: 'Discover real places, earn OT Points for visits and missions, and redeem perks at local partners. Proof-backed and local.',
    icon: 'planet' as const,
  },
  {
    title: 'Do some OT — but not at work',
    body: 'Tap orbs, complete missions, and climb the leaderboard. Your city, your rules.',
    icon: 'flash' as const,
  },
  {
    title: 'Real rewards',
    body: 'Partners offer perks, drops, and deals. Earn points, then redeem for coffee, food, fitness, and more.',
    icon: 'gift' as const,
  },
];

function openUrl(url: string) {
  Linking.openURL(url).catch(() => {});
}

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { flags } = useFlags();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const maintenanceOn = Boolean(flags.isMaintenanceModeEnabled);
  const isAdmin = isAdminEmail(user?.email);

  // Let staff reach login/signup so they can sign in and bypass maintenance.
  const isAuthScreen = typeof pathname === 'string' && (pathname.includes('auth/login') || pathname.includes('auth/signup'));
  const showOverlay = maintenanceOn && !isAdmin && !isAuthScreen;

  if (!showOverlay) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]} pointerEvents="box-none">
        <LinearGradient
          colors={['#0f0f12', '#1a1a22', '#0a0a0b']}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Ionicons name="construct" size={40} color="#60a5fa" />
            </View>
            <Text style={styles.heroTitle}>We’re making OrbTap better</Text>
            <Text style={styles.heroSubtitle}>
              Quick update in progress. You’ll be back in soon.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>While you wait</Text>
            <Text style={styles.cardSubtitle}>Explore OrbTap — no app access needed</Text>
            {WHILE_YOU_WAIT.map((item, i) => (
              <View key={i} style={styles.factRow}>
                <View style={styles.factIconWrap}>
                  <Ionicons name={item.icon} size={20} color="#60a5fa" />
                </View>
                <View style={styles.factBody}>
                  <Text style={styles.factTitle}>{item.title}</Text>
                  <Text style={styles.factBodyText}>{item.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.linksCard}>
            <Text style={styles.linksTitle}>Links</Text>
            <TouchableOpacity style={styles.linkRow} onPress={() => openUrl(ORBTAP_APP_LINK)} activeOpacity={0.8}>
              <Ionicons name="globe-outline" size={20} color="#9ca3af" />
              <Text style={styles.linkText}>Visit orbtap.com</Text>
              <Ionicons name="open-outline" size={16} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => openUrl(PRIVACY_POLICY_URL)} activeOpacity={0.8}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#9ca3af" />
              <Text style={styles.linkText}>Privacy policy</Text>
              <Ionicons name="open-outline" size={16} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => openUrl(TERMS_URL)} activeOpacity={0.8}>
              <Ionicons name="document-text-outline" size={20} color="#9ca3af" />
              <Text style={styles.linkText}>Terms of service</Text>
              <Ionicons name="open-outline" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => router.push('/auth/login' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="key" size={18} color="#0a0a0b" />
            <Text style={styles.adminBtnText}>Staff or admin? Sign in</Text>
          </TouchableOpacity>
          <Text style={styles.adminHint}>
            If you’re an OrbTap admin, sign in here to access the app and turn off maintenance.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  factIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  factBody: { flex: 1 },
  factTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  factBodyText: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 20,
  },
  linksCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  linksTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: '#e5e7eb',
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  adminBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a0a0b',
  },
  adminHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
});
