/**
 * MealVerifiedReviewCTA — post check-in prompt to leave a verified review.
 * Linked to proofId; one verified review per (uid, partnerId, proofId).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useReviews } from '../hooks/useReviews';
import { containsExternalContent, MEAL_REVIEW_TEXT_MIN } from '../constants/MealProposals';
import { SPACE, RADIUS } from '../constants/DesignTokens';

interface MealVerifiedReviewCTAProps {
  partnerId: string;
  partnerName: string;
  proofId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function MealVerifiedReviewCTA({ partnerId, partnerName, proofId, visible, onDismiss }: MealVerifiedReviewCTAProps) {
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
    if (text.length > 0 && text.length < MEAL_REVIEW_TEXT_MIN) {
      Alert.alert('Too short', `Review text must be at least ${MEAL_REVIEW_TEXT_MIN} characters.`);
      return;
    }
    if (containsExternalContent(text)) {
      Alert.alert('Content blocked', 'Links, emails, and phone numbers are not allowed in reviews.');
      return;
    }
    setSubmitting(true);
    try {
      await addReview(partnerId, rating, text, proofId);
      Alert.alert('Review submitted', 'Your verified review has been posted.');
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
        <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
        <Text style={[styles.title, { color: colors.text }]}>Leave a verified review</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Verified via Meal Check-in at {partnerName}
      </Text>

      {/* Star rating */}
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
        placeholder="Write a short review (optional, min 8 chars)..."
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={3}
        maxLength={500}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Ionicons name="checkmark" size={18} color="#000" />
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Verified Review'}</Text>
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
  title: { fontSize: 15, fontWeight: '800', flex: 1 },
  sub: { fontSize: 12, marginBottom: SPACE.base },
  stars: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.base, justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACE.md, fontSize: 14, minHeight: 60, textAlignVertical: 'top', marginBottom: SPACE.base },
  actions: { gap: SPACE.sm },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.md },
  submitBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
  skipBtn: { alignItems: 'center', paddingVertical: SPACE.sm },
  skipText: { fontSize: 13, fontWeight: '600' },
});
