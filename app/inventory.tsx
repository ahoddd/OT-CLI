import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../context/GameContext';
import * as Haptics from 'expo-haptics';

const SKINS = [
  { id: 'default', name: 'Default', color: '#333', cost: 0 },
  { id: 'crimson-core', name: 'Crimson Core', color: '#EF4444', cost: 500 },
  { id: 'neon-vibe', name: 'Neon Vibe', color: '#06B6D4', cost: 2000 },
] as const;

export default function InventoryScreen() {
  const router = useRouter();
  const { points, ownedSkins, equippedSkin, unlockSkin, equipSkin } = useGame();

  const handleBuy = (skinId: string, cost: number) => {
    const success = unlockSkin(skinId, cost);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleEquip = (skinId: string) => {
    if (!ownedSkins.includes(skinId)) return;
    equipSkin(skinId);
    Haptics.selectionAsync();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Orb Skins</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Orb Skins</Text>
        <View style={styles.grid}>
          {SKINS.map((skin) => {
            const owned = ownedSkins.includes(skin.id);
            const isEquipped = equippedSkin === skin.id;
            const canBuy = !owned && skin.cost > 0 && points >= skin.cost;
            return (
              <View key={skin.id} style={[styles.card, { borderColor: skin.color }]}>
                <View style={[styles.orbPreview, { backgroundColor: skin.color }]} />
                <Text style={styles.cardName}>{skin.name}</Text>
                {owned ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, isEquipped && styles.equippedBtn]}
                    onPress={() => handleEquip(skin.id)}
                    disabled={isEquipped}
                  >
                    <Text style={styles.actionText}>
                      {isEquipped ? 'Equipped' : 'Equip'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.buyBtn, !canBuy && styles.buyBtnDisabled]}
                    onPress={() => handleBuy(skin.id, skin.cost)}
                    disabled={!canBuy}
                  >
                    <Text style={styles.actionText}>
                      {skin.cost === 0 ? 'Owned' : `Buy (${skin.cost})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
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
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    width: '30%',
    minWidth: 100,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  orbPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  cardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#333',
  },
  equippedBtn: {
    backgroundColor: '#34D399',
    opacity: 1,
  },
  buyBtn: {
    backgroundColor: '#F59E0B',
  },
  buyBtnDisabled: {
    backgroundColor: '#333',
    opacity: 0.6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
});
