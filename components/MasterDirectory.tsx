import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

type DirectoryItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
  color: string;
};

const DIRECTORY_ITEMS: DirectoryItem[] = [
  { id: 'orb', label: 'The Orb', icon: 'planet', route: '/(tabs)/orb', description: 'Return to the core tapping experience.', color: '#60A5FA' },
  { id: 'map', label: 'Tactical Map', icon: 'map', route: '/(tabs)/map', description: 'Find nearby drops and allies.', color: '#34D399' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', route: '/(tabs)/wallet', description: 'Manage your assets and points.', color: '#FBBF24' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy', route: '/leaderboard', description: 'Global rankings.', color: '#A78BFA' },
  { id: 'orbsignal', label: 'Orb Signal', icon: 'radio', route: '/orbsignal', description: 'Broadcast status to the network.', color: '#EF4444' },
  { id: 'settings', label: 'System', icon: 'settings-sharp', route: '/settings', description: 'App preferences.', color: '#9CA3AF' }
];

interface MasterDirectoryProps {
  visible: boolean;
  onClose: () => void;
}

export default function MasterDirectory({ visible, onClose }: MasterDirectoryProps) {
  const router = useRouter();

  const handlePress = (route: string) => {
    onClose();
    setTimeout(() => {
        router.push(route as any);
    }, 100);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>OrbTap</Text>
              <Text style={styles.subtitle}>Master Directory</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.gridContainer}>
                {DIRECTORY_ITEMS.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={[styles.card, { borderColor: item.color }]}
                    onPress={() => handlePress(item.route)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon} size={32} color={item.color} />
                    </View>
                    <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: item.color }]}>{item.label}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                        {item.description}
                    </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#555" style={styles.arrow} />
                </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.footerText}>System Version 1.0.0 • Stable</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  gridContainer: {
    padding: 20,
    gap: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  arrow: {
    marginLeft: 8,
  },
  footerText: {
    textAlign: 'center',
    color: '#444',
    fontSize: 12,
    marginTop: 20,
    fontFamily: 'Courier',
  },
});
