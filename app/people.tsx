import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useFriends, type FriendRequest } from '../hooks/useFriends';
import * as Haptics from 'expo-haptics';

export default function PeopleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
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

  const handleAccept = async (req: FriendRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await acceptRequest(req.fromUid);
    if (!result.ok) Alert.alert('Error', result.message ?? 'Could not accept');
  };

  const handleDecline = async (req: FriendRequest) => {
    Haptics.selectionAsync();
    await declineRequest(req.fromUid);
  };

  const handleSendRequest = async () => {
    const uid = searchUid.trim();
    if (!uid) return;
    setSendingTo(uid);
    const result = await sendRequest(uid);
    setSendingTo(null);
    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sent', 'Friend request sent.');
      setSearchUid('');
    } else {
      Alert.alert('Could not send', result.message ?? 'Try again.');
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>People</Text>
            <View style={{ width: 40 }} />
          </View>
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
          <View style={{ width: 40 }} />
        </View>

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
                  <Text style={[styles.empty, { color: colors.textSecondary }]}>No friends yet. Add by UID below or from Leaderboard / Sphere.</Text>
                ) : (
                  friends.map((uid) => (
                    <View key={uid} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={[styles.avatar, { backgroundColor: COLORS.gold[0] + '30' }]}>
                        <Text style={[styles.avatarText, { color: COLORS.gold[0] }]}>{uid.slice(0, 1).toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.rowName, { color: colors.text }]}>{uid}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ADD BY UID</Text>
                <View style={styles.addRow}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={searchUid}
                    onChangeText={setSearchUid}
                    placeholder="Friend's UID"
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
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 48 },
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
});
