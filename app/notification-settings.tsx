/**
 * Notification preferences — granular control (polls, missions, drops, partner updates).
 * Synced to Firestore so Cloud Functions respect them when sending push.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../hooks/usePreferences';
import {
  getNotificationPreferences,
  setNotificationPreferences,
  type NotificationPreferences,
} from '../services/notificationPreferences';
import { safeHaptics } from '../utils/safeHaptics';
import { showErrorAlert } from '../utils/alert';
import { COLORS } from '../constants/Colors';
import { useI18n } from '../context/I18nContext';

export default function NotificationSettingsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { prefs, togglePref } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: true,
    polls: true,
    missionReminders: true,
    dropAlerts: true,
    partnerUpdates: false,
    orbsignalAlerts: true,
    friendActivity: true,
    stampReminders: true,
  });

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    getNotificationPreferences(user.uid)
      .then(setPreferences)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const update = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user?.uid || saving) return;
    setSaving(true);
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    try {
      await setNotificationPreferences(user.uid, next);
      safeHaptics.selectionAsync();
    } catch (e) {
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notification preferences</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Push is on by default. Control what you get — same settings for your account and partner account. We only send useful updates.
        </Text>

        {/* Master switch: push on by default; use prefs.pushEnabled */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: (colors.primary) + '22' }]}>
              <Ionicons name="notifications" size={22} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Push notifications</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>On by default — turn off to stop all push</Text>
            </View>
            <Switch
              value={prefs.pushEnabled}
              onValueChange={async () => {
                const next = !prefs.pushEnabled;
                togglePref('pushEnabled');
                if (user?.uid) {
                  setPreferences((p) => ({ ...p, pushEnabled: next }));
                  try {
                    await setNotificationPreferences(user.uid, { pushEnabled: next });
                  } catch (_e) {
                    togglePref('pushEnabled');
                    setPreferences((p) => ({ ...p, pushEnabled: !next }));
                    showErrorAlert(
                      'Push settings couldn’t be saved',
                      'We couldn’t update your notification preference. Please check your internet connection and try again.',
                    );
                  }
                }
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.textSecondary} style={styles.loader} />
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { key: 'polls' as const, label: 'OrbVote polls', sub: 'New polls and deadline reminders' },
              { key: 'missionReminders' as const, label: 'Mission reminders', sub: 'When a mission step is due' },
              { key: 'dropAlerts' as const, label: 'Drop alerts', sub: 'Limited drops and reservations' },
              { key: 'partnerUpdates' as const, label: 'Partner updates', sub: 'Offers and news from followed partners' },
              { key: 'orbsignalAlerts' as const, label: 'Orb Signal', sub: 'When a forecast is removed or updated' },
              { key: 'friendActivity' as const, label: 'Friend activity', sub: 'When friends check in or earn OT at a venue' },
              { key: 'stampReminders' as const, label: 'Stamp card reminders', sub: 'Reward expiring soon or one stamp away' },
            ].map(({ key, label, sub }) => (
              <View key={key} style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{sub}</Text>
                </View>
                <Switch
                  value={preferences[key]}
                  onValueChange={(v) => update(key, v)}
                  disabled={saving}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          Changes sync across devices. Cloud sends only what you allow.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowContent: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  rowSub: { fontSize: 12 },
  loader: { marginVertical: 24 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
