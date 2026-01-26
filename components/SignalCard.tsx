import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Market } from '../hooks/useSignal';

export const SignalCard = ({ market, onPress }: { market: Market; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.category}>{market.category.toUpperCase()}</Text>
        <Text style={styles.pool}>{market.pool.toLocaleString()} PTS</Text>
      </View>
      
      <Text style={styles.question}>{market.question}</Text>
      
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${market.percentages[0]}%`, backgroundColor: '#4ade80' }]} />
        <View style={[styles.bar, { width: `${market.percentages[1]}%`, backgroundColor: '#f87171' }]} />
      </View>
      
      <View style={styles.labels}>
        <Text style={styles.outcome}>{market.outcomes[0]} {market.percentages[0]}%</Text>
        <Text style={styles.outcome}>{market.outcomes[1]} {market.percentages[1]}%</Text>
      </View>

      <Text style={styles.timer}>Ends: {market.endsAt}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  category: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  pool: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
  question: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  barContainer: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  bar: { height: '100%' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  outcome: { color: '#ccc', fontSize: 12 },
  timer: { color: '#444', fontSize: 10, fontStyle: 'italic' },
});
