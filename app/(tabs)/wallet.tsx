import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet, LedgerEntry } from '../../hooks/useWallet';
import { TIER_COLORS } from '../../constants/MockData';
import { useRouter } from 'expo-router';

export default function WalletScreen() {
  const { balance, ledger } = useWallet();
  const router = useRouter();

  const handlePress = (item: LedgerEntry) => {
    if (item.type === 'earn') {
      router.push({
        pathname: `/proof/${item.id}` as any,
        params: {
          amount: item.amount,
          partner: 'OrbTap Partner', 
          perk: item.title,
          tier: item.tier,
          date: new Date(item.timestamp).toLocaleDateString()
        }
      });
    }
  };

  const renderItem = ({ item }: { item: LedgerEntry }) => (
    <TouchableOpacity onPress={() => handlePress(item)} style={styles.row}>
      <View>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={[styles.rowTier, { color: TIER_COLORS[item.tier] }]}>{item.tier.toUpperCase()}</Text>
      </View>
      <View style={styles.rightSide}>
        <Text style={[styles.amount, { color: item.type === 'earn' ? '#4ade80' : '#f87171' }]}>
            {item.type === 'earn' ? '+' : '-'}{item.amount}
        </Text>
        {item.type === 'earn' && <Text style={styles.viewProof}>VIEW PROOF ›</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.label}>TOTAL BALANCE</Text>
        <Text style={styles.balance}>{balance.toLocaleString()}</Text>
        <Text style={styles.unit}>OT POINTS</Text>
      </View>

      <View style={styles.ledger}>
        <Text style={styles.sectionTitle}>HISTORY</Text>
        <FlatList
          data={ledger}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { alignItems: 'center', padding: 40, borderBottomWidth: 1, borderBottomColor: '#222' },
  label: { color: '#888', letterSpacing: 2, fontSize: 12, marginBottom: 8 },
  balance: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  unit: { color: '#4ade80', fontWeight: 'bold', marginTop: 8 },
  ledger: { flex: 1, padding: 20 },
  sectionTitle: { color: '#666', marginBottom: 16, fontSize: 12, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#111' },
  rowTitle: { color: '#fff', fontSize: 16, fontWeight: '500' },
  rowTier: { fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  rightSide: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: 'bold' },
  viewProof: { color: '#666', fontSize: 10, marginTop: 4 },
  empty: { color: '#444', textAlign: 'center', marginTop: 40 },
});
