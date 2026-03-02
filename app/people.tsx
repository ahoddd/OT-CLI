import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS } from '../constants/Colors';
import { SPACE } from '../constants/DesignTokens';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useFriends, type FriendRequest } from '../hooks/useFriends';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { SearchOverlay } from '../components/SearchOverlay';
import { GuidedTutorialOverlay } from '../components/GuidedTutorialOverlay';
import { useTutorial } from '../context/TutorialContext';
import { alert as alertDialog, showErrorAlert } from '../utils/alert';

export default function PeopleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { user, loading: authLoading } = useAuth();
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();
  const [showPeopleTutorial, setShowPeopleTutorial] = useState(false);
  const {
    friends,
    requestsReceived,
    loading,
    error,
    loadFriends,
    sendRequest,
    acceptRequest,
    declineRequest,
  } = useFriends();
  const [searchUid, setSearchUid] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, { displayName: string | null; username: string | null }>>({});

  React.useEffect(() => {
    if (shouldShowTutorial('people')) setShowPeopleTutorial(true);
  }, [shouldShowTutorial]);

  useEffect(() => {
    if (!user || friends.length === 0) {
      setFriendProfiles({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<string, { displayName: string | null; username: string | null }> = {};
      await Promise.all(
        friends.map(async (uid) => {
          if (cancelled) return;
          try {
            const snap = await getDoc(doc(db, 'users', uid));
            const d = snap.data();
            next[uid] = {
              displayName: (d?.displayName as string) ?? null,
              username: (d?.username as string) ?? null,
            };
          } catch {
            next[uid] = { displayName: null, username: null };
          }
        })
      );
      if (!cancelled) setFriendProfiles((prev) => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
  }, [user?.uid, friends.join(',')]);

  const handleSelectMemberFromSearch = useCallback(
    async (selected: { uid: string; displayName: string | null; username: string | null }) => {
      setSearchVisible(false);
      setSendingTo(selected.uid);
      const result = await sendRequest(selected.uid);
      setSendingTo(null);
      if (result.ok) {
        safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        alertDialog('Sent', `Friend request sent to ${selected.displayName || selected.username || selected.uid}.`, [{ text: 'OK' }]);
      } else {
        showErrorAlert('Request didn’t send', result.message ?? 'We couldn’t send the friend request. Please try again.');
      }
    },
    [sendRequest]
  );

  const handleAccept = async (req: FriendRequest) => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await acceptRequest(req.fromUid);
    if (!result.ok) showErrorAlert('Request didn’t complete', result.message ?? 'We couldn’t accept the request. Please try again.');
  };

  const handleDecline = async (req: FriendRequest) => {
    safeHaptics.selectionAsync();
    await declineRequest(req.fromUid);
  };

  const handleSendRequest = async () => {
    const uid = searchUid.trim();
    if (!uid) return;
    setSendingTo(uid);
    const result = await sendRequest(uid);
    setSendingTo(null);
    if (result.ok) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alertDialog('Sent', 'Friend request sent.', [{ text: 'OK' }]);
      setSearchUid('');
    } else {
      showErrorAlert('Request didn’t send', result.message ?? 'We couldn’t send the friend request. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>People</Text>
            <View style={styles.headerSearchBtn} />
          </View>
          <View style={styles.loadWrap}>
            <ActivityIndicator size="large" color={COLORS.neonBlue[0]} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>People</Text>
            <TouchableOpacity style={styles.headerSearchBtn} onPress={() => setSearchVisible(true)} hitSlop={12}>
              <Ionicons name="search" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <SearchOverlay
            visible={searchVisible}
            onClose={() => setSearchVisible(false)}
            defaultScope="members"
            onSelectMember={undefined}
          />
          <GuidedTutorialOverlay
            visible={showPeopleTutorial}
            tutorialId="people"
            onClose={() => { markCompleted('people'); setShowPeopleTutorial(false); }}
            onSkipAll={() => { setSkipAllTutorials(); setShowPeopleTutorial(false); }}
          />
          <View style={styles.placeholder}>
            <Ionicons name="people" size={64} color={colors.textSecondary} />
            <Text style={[styles.placeholderTitle, { color: colors.text }]}>Sign in to see People</Text>
            <Text style={[styles.placeholderSub, { color: colors.textSecondary }]}>Friends and requests appear here.</Text>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.neonBlue[0] }]} onPress={() => router.push('/auth/login' as any)}>
              <Text style={styles.primaryBtnText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>People</Text>
          <TouchableOpacity style={styles.headerSearchBtn} onPress={() => setSearchVisible(true)} hitSlop={12}>
            <Ionicons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <SearchOverlay
          visible={searchVisible}
          onClose={() => setSearchVisible(false)}
          defaultScope="members"
          onSelectMember={handleSelectMemberFromSearch}
        />
        <GuidedTutorialOverlay
          visible={showPeopleTutorial}
          tutorialId="people"
          onClose={() => { markCompleted('people'); setShowPeopleTutorial(false); }}
          onSkipAll={() => { setSkipAllTutorials(); setShowPeopleTutorial(false); }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? (
            <View style={styles.loadWrap}>
              <ActivityIndicator size="large" color={COLORS.neonBlue[0]} />
              <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>REQUESTS</Text>
                {requestsReceived.length === 0 ? (
                  <Text style={[styles.empty, { color: colors.textSecondary }]}>No pending requests</Text>
                ) : (
                  requestsReceived.map((req) => (
                    <View key={req.fromUid} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={[styles.avatar, { backgroundColor: COLORS.neonBlue[0] + '30' }]}>
                        <Text style={[styles.avatarText, { color: COLORS.neonBlue[0] }]}>{(req.fromDisplayName || req.fromUid).slice(0, 1).toUpperCase()}</Text>
                      </View>
                      <View style={styles.rowBody}>
                        <Text style={[styles.rowName, { color: colors.text }]}>{req.fromDisplayName || req.fromUsername || req.fromUid.slice(0, 8)}</Text>
                        {req.fromUsername ? <Text style={[styles.rowHandle, { color: colors.textSecondary }]}>@{req.fromUsername}</Text> : null}
                      </View>
                      <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: COLORS.neonBlue[0] }]} onPress={() => handleAccept(req)}>
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.declineBtn, { borderColor: colors.border }]} onPress={() => handleDecline(req)}>
                        <Text style={[styles.declineBtnText, { color: colors.textSecondary }]}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FRIENDS ({friends.length})</Text>
                {friends.length === 0 ? (
                  <View style={[styles.emptyFriends, { backgroundColor: COLORS.neonBlue[0] + '0C', borderColor: COLORS.neonBlue[0] + '30' }]}>
                    <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
                    <Text style={[styles.emptyFriendsTitle, { color: colors.text }]}>No connections yet</Text>
                    <Text style={[styles.emptyFriendsSub, { color: colors.textSecondary }]}>
                      Invite friends or search for users to build your network.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/invite' as any)}
                      style={[styles.inviteBtn, { backgroundColor: COLORS.neonBlue[0] }]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.inviteBtnText}>Invite friends</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  friends.map((uid) => {
                    const profile = friendProfiles[uid];
                    const label = profile?.displayName || profile?.username || uid.slice(0, 12);
                    const sub = profile?.username ? `@${profile.username}` : (profile?.displayName ? uid.slice(0, 8) : null);
                    return (
                      <View key={uid} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.avatar, { backgroundColor: themeGold + '30' }]}>
                          <Text style={[styles.avatarText, { color: themeGold }]}>{label.slice(0, 1).toUpperCase()}</Text>
                        </View>
                        <View style={styles.rowBody}>
                          <Text style={[styles.rowName, { color: colors.text }]}>{label}</Text>
                          {sub ? <Text style={[styles.rowHandle, { color: colors.textSecondary }]}>{sub}</Text> : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ADD FRIEND</Text>
                <Text style={[styles.empty, { color: colors.textSecondary, fontStyle: 'normal', marginBottom: 8 }]}>
                  Use search (top right) to find people by name or @handle, or paste a UID below.
                </Text>
                <View style={styles.addRow}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={searchUid}
                    onChangeText={setSearchUid}
                    placeholder="Or paste friend's UID"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: COLORS.neonBlue[0] }]}
                    onPress={handleSendRequest}
                    disabled={!searchUid.trim() || sendingTo !== null}
                  >
                    {sendingTo ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.addBtnText}>Send request</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', flex: 1, textAlign: 'center' },
  headerSearchBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: SPACE.base, paddingBottom: 120 },
  error: { fontSize: 13, color: '#ef4444', marginBottom: 12 },
  loadWrap: { alignItems: 'center', paddingVertical: 48 },
  loadText: { marginTop: 12 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  empty: { fontSize: 14, fontStyle: 'italic', paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '800' },
  rowBody: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '700' },
  rowHandle: { fontSize: 12, marginTop: 2 },
  acceptBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8 },
  acceptBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
  declineBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  declineBtnText: { fontSize: 13, fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  addBtn: { paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', minWidth: 120 },
  addBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  placeholder: { alignItems: 'center', paddingVertical: 48 },
  placeholderTitle: { fontSize: 18, fontWeight: '800', marginTop: 16 },
  placeholderSub: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  primaryBtn: { marginTop: 24, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  emptyFriends: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center', marginTop: 4 },
  emptyFriendsTitle: { fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  emptyFriendsSub: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  inviteBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  inviteBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
});
