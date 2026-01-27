import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Partner, MOCK_PARTNERS, TIER_COLORS } from '../constants/MockData';
import { COLORS } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

interface TacticalMapProps {
  onSelectPartner: (p: Partner) => void;
  selectedId: string | null;
}

export const TacticalMap = ({ onSelectPartner, selectedId }: TacticalMapProps) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const radarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Dark Grid Background */}
      <View style={styles.grid}>
        {[...Array(10)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, { left: i * 40 }]} />
        ))}
        {[...Array(20)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, { width: width, height: 1, top: i * 40 }]} />
        ))}
      </View>

      {/* Rotating Radar Scanner */}
      <View style={styles.radarContainer}>
         <Animated.View style={[styles.radar, radarStyle]}>
            <LinearGradient 
                colors={['rgba(74, 222, 128, 0)', 'rgba(74, 222, 128, 0.3)']} 
                style={styles.radarGradient} 
            />
         </Animated.View>
      </View>

      {/* Partners as Tactical Nodes */}
      {MOCK_PARTNERS.map((p, index) => {
        // Pseudo-random positioning for the grid (since we lack real GPS in mock)
        const top = 150 + (index * 80) + (index % 2 === 0 ? 20 : -20);
        const left = 50 + (index * 60) + (index % 2 === 0 ? 100 : 0);
        const isSelected = selectedId === p.id;
        const color = TIER_COLORS[p.tier];

        return (
          <TouchableOpacity
            key={p.id}
            style={[styles.node, { top, left, borderColor: isSelected ? '#fff' : color }]}
            onPress={() => onSelectPartner(p)}
          >
            <View style={[styles.core, { backgroundColor: color }]} />
            {isSelected && <Text style={styles.label}>{p.name}</Text>}
          </TouchableOpacity>
        );
      })}

      <View style={styles.hud}>
        <Text style={styles.hudText}>TACTICAL VIEW // ONLINE</Text>
        <Text style={styles.hudSub}>Scanning Sector 7...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', overflow: 'hidden' },
  grid: { position: 'absolute', width: '100%', height: '100%', opacity: 0.2 },
  gridLine: { position: 'absolute', backgroundColor: '#333', width: 1, height: '100%' },
  radarContainer: { position: 'absolute', top: height/2 - 200, left: width/2 - 200, width: 400, height: 400, justifyContent: 'center', alignItems: 'center' },
  radar: { width: 400, height: 400, borderRadius: 200, overflow: 'hidden' },
  radarGradient: { width: '50%', height: '50%', position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: 200 },
  node: { 
    position: 'absolute', 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10
  },
  core: { width: 8, height: 8, borderRadius: 4 },
  label: { 
    position: 'absolute', 
    top: -25, 
    width: 120, 
    textAlign: 'center', 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: 'bold', 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    padding: 4,
    borderRadius: 4
  },
  hud: { position: 'absolute', top: 60, left: 20 },
  hudText: { color: '#4ade80', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  hudSub: { color: '#666', fontSize: 10, letterSpacing: 1, marginTop: 4 },
});
