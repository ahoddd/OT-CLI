import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignal } from '../../hooks/useSignal';
import { Ionicons } from '@expo/vector-icons';

export default function SignalDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getMarket, placeForecast } = useSignal();
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);

  const market = getMarket(id as string);

  if (!market) return <View><Text>Not found</Text></View>;

  const handlePredict = () => {
    if (selectedOutcome !== null) {
        placeForecast(market.id, selectedOutcome, 100);
        alert('Forecast Submitted!');
        router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Forecast</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.question}>{market.question}</Text>
        <Text style={styles.pool}>Pool: {market.pool.toLocaleString()} PTS</Text>

        <Text style={styles.label}>SELECT OUTCOME</Text>
        
        {market.outcomes.map((outcome, idx) => (
            <TouchableOpacity 
                key={idx} 
                style={[
                    styles.option, 
                    selectedOutcome === idx && styles.optionSelected,
                    { borderColor: idx === 0 ? '#4ade80' : '#f87171' }
                ]}
                onPress={() => setSelectedOutcome(idx)}
            >
                <Text style={[styles.optionText, selectedOutcome === idx && { color: '#fff' }]}>
                    {outcome}
                </Text>
                <Text style={styles.percent}>{market.percentages[idx]}%</Text>
            </TouchableOpacity>
        ))}

        <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
                Predictions use OT Points only. Points have no cash value. 
                Correct forecasts earn reputation and point multipliers.
            </Text>
        </View>

        <TouchableOpacity 
            style={[styles.btn, !selectedOutcome === null && styles.btnDisabled]} 
            onPress={handlePredict}
            disabled={selectedOutcome === null}
        >
            <Text style={styles.btnText}>CONFIRM FORECAST (100 PTS)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  question: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  pool: { color: '#fbbf24', fontSize: 16, marginBottom: 40 },
  label: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
  option: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  optionSelected: { backgroundColor: '#222' },
  optionText: { color: '#888', fontSize: 18, fontWeight: 'bold' },
  percent: { color: '#fff', fontWeight: 'bold' },
  disclaimer: { marginTop: 40, padding: 16, backgroundColor: '#111', borderRadius: 8 },
  disclaimerText: { color: '#444', fontSize: 12, textAlign: 'center' },
  btn: { marginTop: 20, backgroundColor: '#fff', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontWeight: 'bold', letterSpacing: 1 },
});
