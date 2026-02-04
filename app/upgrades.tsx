import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../context/GameContext';
import { useGamification } from '../hooks/useGamification';
import { OTPointsBadge } from '../components/OTPointsBadge';
import { COLORS } from '../constants/Colors';
import * as Haptics from 'expo-haptics';

const UPGRADES = [
  { id: 'signal', title: 'Signal Boost', cost: 50, powerIncrease: 1 },
  { id: 'neural', title: 'Neural Link', cost: 250, powerIncrease: 5 },
  { id: 'void', title: 'Void Amplifier', cost: 1000, powerIncrease: 25 },
] as const;

export default function UpgradesScreen() {
  const router = useRouter();
  const { points, tapPower, purchaseUpgrade } = useGame();
  const { rank } = useGamification();

  const handleBuy = (cost: number, powerIncrease: number) => {
    const success = purchaseUpgrade(cost, powerIncrease);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Upgrades</Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.pointsLabel}>OT Points</Text>
        <View style={styles.pointsRow}>
          <OTPointsBadge amount={points} size={36} label="pts" compact textColor="#FFF" />
        </View>
        <Text style={styles.powerLabel}>Tap Power</Text>
        <Text style={styles.powerValue}>{tapPower}</Text>
      </View>

      <View style={styles.levelCard}>
        <Text style={styles.levelCardTitle}>Level {rank.level} · {rank.title}</Text>
        <View style={styles.levelBarBg}>
          <View style={[styles.levelBarFill, { width: `${(rank.progress * 100).toFixed(0)}%` }]} />
        </View>
        <Text style={styles.levelCardXp}>{rank.xp.toLocaleString()} / {rank.nextLevelXp.toLocaleString()} XP</Text>
        {!rank.isMaxLevel && rank.nextLevelPerk && (
          <Text style={styles.levelCardNext}>Next: {rank.nextLevelPerk}</Text>
        )}
        <Text style={styles.levelCardEarn}>Earn XP by scanning & tapping at partners</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {UPGRADES.map((item) => {
          const canAfford = points >= item.cost;
          return (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCost}>{item.cost} pts</Text>
              <Text style={styles.cardPower}>+{item.powerIncrease} Power</Text>
              <TouchableOpacity
                style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                onPress={() => handleBuy(item.cost, item.powerIncrease)}
                disabled={!canAfford}
              >
                <Text style={styles.buyText}>Buy</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
  },
  backBtn: { padding: 8 },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pointsRow: { marginTop: 8 },
  pointsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
  },
  powerLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
  },
  powerValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 4,
  },
  levelCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  levelCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.neonBlue[0],
    letterSpacing: 1,
    marginBottom: 10,
  },
  levelBarBg: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: COLORS.neonBlue[0],
    borderRadius: 4,
  },
  levelCardXp: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 4,
  },
  levelCardNext: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '600',
    marginBottom: 6,
  },
  levelCardEarn: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  cardCost: {
    fontSize: 14,
    color: '#FBBF24',
    marginBottom: 4,
  },
  cardPower: {
    fontSize: 12,
    color: '#34D399',
    marginBottom: 16,
  },
  buyBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyBtnDisabled: {
    backgroundColor: '#333',
    opacity: 0.7,
  },
  buyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
