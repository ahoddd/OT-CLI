import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';

interface ReviewSheetProps {
  partnerName: string;
  onSubmit: (rating: number, text: string) => void;
  onCancel: () => void;
}

export const ReviewSheet = ({ partnerName, onSubmit, onCancel }: ReviewSheetProps) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate {partnerName}</Text>
      <Text style={styles.subtitle}>How was your experience?</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons 
              name={rating >= star ? "star" : "star-outline"} 
              size={32} 
              color={COLORS.gold[0]} 
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Share your thoughts (optional)..."
        placeholderTextColor="#666"
        multiline
        value={text}
        onChangeText={setText}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.submitBtn, rating === 0 && { opacity: 0.5 }]} 
            disabled={rating === 0}
            onPress={() => onSubmit(rating, text)}
        >
            <Text style={styles.submitText}>Post Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#111', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#333' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 20 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  input: { backgroundColor: '#222', color: '#fff', padding: 16, borderRadius: 12, height: 100, textAlignVertical: 'top', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: 'bold' },
  submitBtn: { flex: 2, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#000', fontWeight: 'bold' }
});
