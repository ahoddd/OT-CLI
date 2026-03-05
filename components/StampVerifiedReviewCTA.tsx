/**
 * StampVerifiedReviewCTA — post-stamp prompt to leave a verified review.
 * Casual, calm copy; one verified review per (uid, partnerId, proofId).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useReviews } from '../hooks/useReviews';
import { containsExternalContent } from '../constants/MealProposals';
import { SPACE, RADIUS } from '../constants/DesignTokens';

const REVIEW_TEXT_MIN = 8;

interface StampVerifiedReviewCTAProps {
  partnerId: string;
  partnerName: string;
  proofId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function StampVerifiedReviewCTA({ partnerId, partnerName, proofId, visible, onDismiss }: StampVerifiedReviewCTAProps) {
  const { colors } = useTheme();
  const { addReview, getPartnerReviews } = useReviews();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!visible) return null;

  const existingReviews = getPartnerReviews(partnerId);
  const alreadyReviewed = existingReviews.some((r) => r.proofId === proofId);
  if (alreadyReviewed) return null;

  const handleSubmit = async () => {
    if (text.length > 0 && text.length < REVIEW_TEXT_MIN) {
      Alert.alert('Too short', `Review text must be at least ${REVIEW_TEXT_MIN} characters.`);
      return;
    }
    if (containsExternalContent(text)) {
      Alert.alert('Content blocked', 'Links, emails, and phone numbers are not allowed in reviews.');
      return;
    }
    setSubmitting(true);
    try {
      await addReview(partnerId, rating, text, proofId);
      Alert.alert('Thanks!', 'Your review helps others discover this place.');
      onDismiss();
    } catch (e) {
      Alert.alert('Error', 'Could not submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="star" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Your visit helps others discover them</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>Leave a quick review for {partnerName} — optional.</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity key={s} onPress={() => setRating(s)} hitSlop={4}>
            <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={28} color={s <= rating ? '#f59e0b' : colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        value={text}
        onChangeText={setText}
        placeholder="Write a short review (optional)..."
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={2}
        maxLength={500}
      />
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Leave a review'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACE.base },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.xs },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
  sub: { fontSize: 13, marginBottom: SPACE.base },
  stars: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.base, justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACE.md, fontSize: 14, minHeight: 56, textAlignVertical: 'top', marginBottom: SPACE.base },
  actions: { gap: SPACE.sm },
  submitBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACE.md, borderRadius: RADIUS.md },
  submitBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: SPACE.sm },
  skipText: { fontSize: 13, fontWeight: '600' },
});
