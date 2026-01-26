import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Partner, MOCK_PARTNERS } from '../constants/MockData';

interface OrbMapProps {
  onSelectPartner: (p: Partner) => void;
  selectedId: string | null;
}

export const OrbMap = ({ onSelectPartner, selectedId }: OrbMapProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MAP DISABLED (NO NATIVE)</Text>
      <View style={styles.list}>
        {MOCK_PARTNERS.map(p => (
          <TouchableOpacity 
            key={p.id} 
            style={[styles.item, selectedId === p.id && styles.selected]} 
            onPress={() => onSelectPartner(p)}
          >
            <View style={[styles.dot, { backgroundColor: p.verified ? '#38bdf8' : '#94a3b8' }]} />
            <Text style={styles.itemName}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#666', fontWeight: 'bold', marginBottom: 20 },
  list: { width: '80%' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#222', marginBottom: 8, borderRadius: 8 },
  selected: { borderColor: '#fff', borderWidth: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  itemName: { color: '#fff', fontWeight: 'bold' }
});
