import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';

interface ReviewSheetProps {
  partnerName: string;
  onSubmit: (rating: number, text: string) => void;
  onCancel: () => void;
}

export const ReviewSheet = ({ partnerName, onSubmit, onCancel }: ReviewSheetProps) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Rate {partnerName}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>How was your experience?</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={rating >= star ? "star" : "star-outline"}
              size={32}
              color={themeGold}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: colors.surfaceHighlight, color: colors.text }]}
        placeholder="Share your thoughts (optional)..."
        placeholderTextColor={colors.textSecondary}
        multiline
        value={text}
        onChangeText={setText}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: COLORS.neonBlue[0] }, rating === 0 && { opacity: 0.5 }]}
          disabled={rating === 0}
          onPress={() => onSubmit(rating, text)}
        >
          <Text style={[styles.submitText, { color: '#000' }]}>Post Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, borderRadius: 24, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: 20 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  input: { padding: 16, borderRadius: 12, height: 100, textAlignVertical: 'top', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  cancelText: { fontWeight: 'bold' },
  submitBtn: { flex: 2, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitText: { fontWeight: 'bold' }
});
