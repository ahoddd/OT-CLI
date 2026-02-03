import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList, SafeAreaView } from 'react-native';
import { OrbTapMap } from '../../components/OrbTapMap'; // NEW IMPORT
import { OrbSheet } from '../../components/OrbSheet';
import { FlashDrop } from '../../components/FlashDrop';
import { MasterDirectory } from '../../components/MasterDirectory';
import { Partner, MOCK_PARTNERS, TIER_COLORS } from '../../constants/MockData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';

export default function MapScreenEntry() {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [isDirectoryVisible, setIsDirectoryVisible] = useState(false);
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { flags } = useFlags();

  // If map is disabled via admin, force grid
  const effectiveViewMode = flags.mapProvider === 'none' ? 'grid' : viewMode;

  const toggleView = () => {
    setViewMode(prev => prev === 'map' ? 'grid' : 'map');
  };

  const renderGridItem = ({ item }: { item: Partner }) => (
    <TouchableOpacity 
      style={[styles.gridItem, { 
        borderColor: TIER_COLORS[item.tier],
        backgroundColor: colors.surface 
      }]}
      onPress={() => router.push(`/partner/${item.id}` as any)}
    >
        <View style={[styles.gridDot, { backgroundColor: TIER_COLORS[item.tier] }]} />
        <Text style={[styles.gridName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.gridCat, { color: colors.textSecondary }]}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {effectiveViewMode === 'map' ? (
          <>
            <OrbTapMap 
              onSelectPartner={setSelectedPartner} 
              selectedId={selectedPartner?.id || null} 
            />
            {/* THE HYPE COMPONENT */}
            <FlashDrop />
            
            {selectedPartner && (
              <OrbSheet 
                partner={selectedPartner} 
                onClose={() => setSelectedPartner(null)} 
                onSelectPartner={setSelectedPartner}
              />
            )}
          </>
        ) : (
          <View style={styles.gridContainer}>
              <Text style={[styles.gridHeader, { color: colors.textSecondary }]}>NEARBY ORBS</Text>
              <FlatList
                  data={MOCK_PARTNERS}
                  keyExtractor={item => item.id}
                  renderItem={renderGridItem}
                  numColumns={2}
                  columnWrapperStyle={styles.row}
                  contentContainerStyle={styles.listContent}
              />
          </View>
        )}

        {/* Floating Toggle Button (Only if map is enabled) */}
        {flags.mapProvider !== 'none' && (
          <View style={styles.toggleContainer}>
              <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.blurWrapper}>
                  <TouchableOpacity onPress={toggleView} style={styles.toggleBtn}>
                      <Ionicons 
                          name={effectiveViewMode === 'map' ? "grid" : "map"} 
                          size={24} 
                          color={colors.text} 
                      />
                  </TouchableOpacity>
              </BlurView>
          </View>
        )}

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setIsDirectoryVisible(true)}
        >
          <Ionicons name="menu" size={30} color="white" />
        </TouchableOpacity>
      </View>
      <MasterDirectory visible={isDirectoryVisible} onClose={() => setIsDirectoryVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  menuButton: { position: 'absolute', top: 0, right: 20, padding: 8, zIndex: 10 },
  toggleContainer: { position: 'absolute', top: 60, right: 20, borderRadius: 20, overflow: 'hidden' },
  blurWrapper: { padding: 10 },
  toggleBtn: { alignItems: 'center', justifyContent: 'center' },
  
  gridContainer: { flex: 1, paddingTop: 120, paddingHorizontal: 20 },
  gridHeader: { fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },
  listContent: { paddingBottom: 100 },
  row: { gap: 12, marginBottom: 12 },
  gridItem: { 
    flex: 1, 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    height: 100, 
    justifyContent: 'center'
  },
  gridDot: { position: 'absolute', top: 12, right: 12, width: 6, height: 6, borderRadius: 3 },
  gridName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  gridCat: { fontSize: 10 }
});
