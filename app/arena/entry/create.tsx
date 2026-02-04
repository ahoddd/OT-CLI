/**
 * OrbArena™ — Create entry: prefilled from Proof (verifiedActionId + partner).
 * Category + caption; media optional (MVP: caption only).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useArena } from '../../../hooks/useArena';
import { useFlags } from '../../../components/FlagContext';
import { ARENA_CATEGORIES, getCategoryLabel, type ArenaCategory } from '../../../constants/Arena';
import { COLORS } from '../../../constants/Colors';

const colors = COLORS?.dark
  ? { bg: COLORS.dark.background, card: COLORS.dark.surface, text: COLORS.dark.text, muted: COLORS.dark.textSecondary, accent: '#4ade80' }
  : { bg: '#0f0f12', card: '#1a1a20', text: '#fff', muted: '#888', accent: '#4ade80' };

export default function ArenaEntryCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verifiedActionId?: string; partner?: string }>();
  const { flags } = useFlags();
  const { contest, canSubmit, submitEntry, refresh } = useArena();

  const verifiedActionId = params.verifiedActionId ?? '';
  const partnerId = params.partner ?? 'Partner';
  const [category, setCategory] = useState<ArenaCategory>(ARENA_CATEGORIES[0]);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!flags.isOrbArenaEnabled || !flags.isOrbArenaSubmitEnabled) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Enter OrbArena</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.muted }]}>OrbArena or submit is off.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contest || !verifiedActionId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Enter OrbArena</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.muted }]}>
            Need a proof to enter. Open a Proof Card first, then tap Enter OrbArena.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    const trimmed = caption.trim();
    if (!trimmed) {
      setError('Add a short caption.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const entry = await submitEntry({
        contestId: contest.id,
        verifiedActionId,
        category,
        caption: trimmed,
        partnerId,
      });
      await refresh();
      if (entry) {
        router.replace({ pathname: '/arena/entry/[id]', params: { id: entry.id } } as any);
      } else {
        setError('Already entered this category this week, or proof not found.');
      }
    } catch {
      setError('Could not submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const eligible = canSubmit && (contest.status === 'LIVE' || contest.status === 'VOTING');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Enter OrbArena</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.muted }]}>Proof</Text>
            <Text style={[styles.proofId, { color: colors.text }]} numberOfLines={1}>
              {verifiedActionId.slice(-12).toUpperCase()} · {partnerId}
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.muted, marginTop: 16 }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
            {ARENA_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.catPill, category === c && styles.catPillActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.catText, category === c && styles.catTextActive]}>{getCategoryLabel(c)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.muted, marginTop: 16 }]}>Caption</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="What made this moment special?"
            placeholderTextColor={colors.muted}
            value={caption}
            onChangeText={setCaption}
            maxLength={200}
            multiline
            numberOfLines={3}
          />
          <Text style={[styles.hint, { color: colors.muted }]}>{caption.length}/200</Text>

          {error ? <Text style={styles.errText}>{error}</Text> : null}

          {!eligible && (
            <Text style={[styles.hint, { color: colors.muted, marginTop: 8 }]}>
              Entry window may be closed. Check OrbArena hub for current contest.
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.accent },
              (!eligible || submitting) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!eligible || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Ionicons name="trophy" size={20} color="#000" />
                <Text style={styles.submitBtnText}>Submit entry</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 14, textAlign: 'center' },
  keyboard: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a30' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  proofId: { fontSize: 14, fontVariant: ['tabular-nums'] },
  catScroll: { marginHorizontal: -16 },
  catRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  catPillActive: { backgroundColor: '#4ade80' },
  catText: { color: '#888', fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#000' },
  input: {
    borderWidth: 1,
    borderColor: '#2a2a30',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  hint: { fontSize: 12, marginTop: 4 },
  errText: { color: '#ef4444', fontSize: 13, marginTop: 12 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
