import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../../hooks/useSocial';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { safeHaptics } from '../../utils/safeHaptics';
import { APP_STORE_URL, PLAY_STORE_URL } from '../../constants/AppLinks';

export default function SphereJoinScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { getCircleByInviteCode, joinByCode } = useSocial();
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);

  const inviteCode = typeof code === 'string' ? code : (Array.isArray(code) ? code[0] : '');
  const circle = inviteCode ? getCircleByInviteCode(inviteCode) : undefined;
  const currentName = user?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || '';
  const isAlreadyMember = circle && (circle.members.includes('You') || (currentName && circle.members.some((m) => m === currentName)));

  useEffect(() => {
    if (!inviteCode) return;
    if (!circle) return;
    if (isAlreadyMember) {
      router.replace(`/spheres/${circle.id}` as any);
    }
  }, [inviteCode, circle, isAlreadyMember, router]);

  const handleJoin = () => {
    if (!circle || !inviteCode) return;
    const memberName = currentName || 'Member';
    safeHaptics.selectionAsync();
    setJoining(true);
    const joined = joinByCode(inviteCode, memberName);
    setJoining(false);
    if (joined) {
      router.replace(`/spheres/${circle.id}` as any);
    }
  };

  const openAppStore = () => Linking.openURL(APP_STORE_URL);
  const openPlayStore = () => Linking.openURL(PLAY_STORE_URL);

  if (!inviteCode) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.centered}>
            <Ionicons name="help-buoy-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.title, { color: colors.text }]}>Missing invite code</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Open this link from a QR code or invite message to join a Sphere.
            </Text>
            <Text style={[styles.storeLabel, { color: colors.textSecondary }]}>Don’t have OrbTap?</Text>
            <View style={styles.storeRow}>
              <TouchableOpacity style={[styles.storeBtn, { backgroundColor: colors.surface }]} onPress={openAppStore}>
                <Text style={[styles.storeBtnText, { color: colors.text }]}>App Store</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.storeBtn, { backgroundColor: colors.surface }]} onPress={openPlayStore}>
                <Text style={[styles.storeBtnText, { color: colors.text }]}>Play Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!circle) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.centered}>
            <Ionicons name="close-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.title, { color: colors.text }]}>Invalid invite code</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              This code isn’t valid or the Sphere no longer exists.
            </Text>
            <Text style={[styles.storeLabel, { color: colors.textSecondary }]}>Get OrbTap</Text>
            <View style={styles.storeRow}>
              <TouchableOpacity style={[styles.storeBtn, { backgroundColor: colors.surface }]} onPress={openAppStore}>
                <Text style={[styles.storeBtnText, { color: colors.text }]}>App Store</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.storeBtn, { backgroundColor: colors.surface }]} onPress={openPlayStore}>
                <Text style={[styles.storeBtnText, { color: colors.text }]}>Play Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (isAlreadyMember) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[styles.sub, { color: colors.textSecondary, marginTop: 12 }]}>Opening Sphere…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const accent = circle.type === 'couple' ? '#EC4899' : circle.type === 'fami' ? '#F59E0B' : '#8B5CF6';
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.background, colors.surface, colors.background]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <View style={[styles.iconWrap, { backgroundColor: accent + '25' }]}>
            <Ionicons
              name={circle.type === 'couple' ? 'heart' : circle.type === 'fami' ? 'home' : 'people'}
              size={48}
              color={accent}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{circle.name}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            You’re invited to join this Sphere. Pool points, share experiences, and chat with the circle.
          </Text>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: accent }]}
            onPress={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={22} color="#fff" />
                <Text style={styles.joinBtnText}>Join Sphere</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.storeLabel, { color: colors.textSecondary }]}>Don’t have OrbTap?</Text>
          <View style={styles.storeRow}>
            <TouchableOpacity style={[styles.storeBtn, { borderColor: colors.border }]} onPress={openAppStore}>
              <Text style={[styles.storeBtnText, { color: colors.text }]}>App Store</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.storeBtn, { borderColor: colors.border }]} onPress={openPlayStore}>
              <Text style={[styles.storeBtnText, { color: colors.text }]}>Play Store</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  back: { padding: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, marginBottom: 32 },
  joinBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  storeLabel: { fontSize: 13, marginBottom: 10 },
  storeRow: { flexDirection: 'row', gap: 12 },
  storeBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1 },
  storeBtnText: { fontSize: 14, fontWeight: '600' },
});
