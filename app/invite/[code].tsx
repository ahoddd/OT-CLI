import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSocial } from '../../hooks/useSocial';
import { useSphereInvites } from '../../hooks/useSphereInvites';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/Colors';
import { useI18n } from '../../context/I18nContext';

export default function InviteScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { getCircleByInviteCode, joinByCode } = useSocial();
  const { getPendingByInviteCode, acceptInvite, loading: sphereInvitesLoading } = useSphereInvites();
  const { user } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const codeRaw = params.code;
  const codeStr = typeof codeRaw === 'string' ? codeRaw : Array.isArray(codeRaw) ? codeRaw[0] ?? '' : '';
  const trimmedCode = codeStr.trim();
  const isValidCode = trimmedCode.length > 0;
  const pendingSphereInvites = useMemo(
    () => (isValidCode ? getPendingByInviteCode(trimmedCode) : []),
    [isValidCode, trimmedCode, getPendingByInviteCode]
  );
  const circle = isValidCode ? getCircleByInviteCode(trimmedCode) : undefined;
  const currentName = user?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || '';
  const isAlreadyMember = circle && (circle.members.includes('You') || (currentName && circle.members.some((m) => m === currentName)));
  const hasSphereInvite = pendingSphereInvites.length > 0;
  const firstSphereInvite = pendingSphereInvites[0];

  useEffect(() => {
    if (isValidCode && circle && isAlreadyMember && !hasSphereInvite) {
      router.replace(`/spheres/${circle.id}` as any);
    }
  }, [isValidCode, circle, isAlreadyMember, hasSphereInvite, router]);

  const handleAcceptInvite = async () => {
    if (hasSphereInvite && firstSphereInvite) {
      setAcceptError(null);
      setAccepting(true);
      const result = await acceptInvite(firstSphereInvite.id, currentName || 'Member');
      setAccepting(false);
      if (result.ok) {
        router.replace(`/partner/${firstSphereInvite.partnerId}` as any);
      } else {
        setAcceptError(result.error ?? 'Could not accept invite.');
      }
      return;
    }
    if (circle && isValidCode) {
      const memberName = currentName || 'Member';
      const joined = joinByCode(trimmedCode, memberName);
      if (joined) router.replace(`/spheres/${circle.id}` as any);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Invite</Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Join Sphere</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Sign in to accept this invite and join the sphere.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.surface }]}
            onPress={() => router.replace(`/auth/login?redirect=${encodeURIComponent(`/spheres/join?code=${codeStr}`)}` as any)}
            accessibilityLabel="Sign in"
            accessibilityRole="button"
          >
            <Text style={[styles.btnText, { color: colors.text }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Invite</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Join Sphere</Text>
        {isValidCode && sphereInvitesLoading ? (
          <ActivityIndicator size="small" color={colors.text} style={{ marginTop: 24 }} />
        ) : isValidCode ? (
          hasSphereInvite && firstSphereInvite ? (
            <>
              <Text style={[styles.code, { color: COLORS.success }]}>{firstSphereInvite.partnerName}</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>
                {firstSphereInvite.title || `${firstSphereInvite.partnerName} invited you`}. {firstSphereInvite.description || 'Accept to join this offer.'}
              </Text>
              {firstSphereInvite.otCost > 0 && (
                <Text style={[styles.text, { color: colors.textSecondary }]}>{firstSphereInvite.otCost} OT required</Text>
              )}
              {acceptError ? (
                <Text style={[styles.errorText, { color: colors.error ?? COLORS.danger }]}>{acceptError}</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.surface }]}
                onPress={handleAcceptInvite}
                disabled={accepting}
                accessibilityLabel="Accept invite"
                accessibilityRole="button"
              >
                {accepting ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={[styles.btnText, { color: colors.text }]}>Accept Invite</Text>
                )}
              </TouchableOpacity>
            </>
          ) : circle ? (
            <>
              <Text style={[styles.code, { color: COLORS.success }]}>{circle.name}</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>
                You have been invited to join {circle.name}. Pool points, share experiences, and chat with the circle.
              </Text>
              {!isAlreadyMember && (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.surface }]}
                  onPress={handleAcceptInvite}
                  accessibilityLabel="Accept invite"
                  accessibilityRole="button"
                >
                  <Text style={[styles.btnText, { color: colors.text }]}>Join Sphere</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.code, { color: COLORS.success }]}>{codeStr.trim()}</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>
                This code may be invalid or the sphere no longer exists. Try opening the link from your inviter again.
              </Text>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.surface }]}
                onPress={() => router.replace(`/spheres/join?code=${encodeURIComponent(codeStr)}` as any)}
                accessibilityLabel="Try join"
                accessibilityRole="button"
              >
                <Text style={[styles.btnText, { color: colors.text }]}>Try joining</Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          <>
            <Text style={[styles.codeInvalid, { color: colors.textSecondary }]}>Invalid or missing invite code</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>
              Use a valid invite link or code from your inviter.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 8 },
  topBarTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  code: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, letterSpacing: 4 },
  codeInvalid: { fontSize: 16, marginBottom: 24, fontStyle: 'italic' },
  text: { marginBottom: 40, textAlign: 'center' },
  errorText: { marginBottom: 12, textAlign: 'center', fontSize: 14 },
  btn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 16 },
});

