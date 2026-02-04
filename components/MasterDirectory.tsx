import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { isAdminEmail } from '../constants/Admin';
import { useFlags } from './FlagContext';

type DirectoryItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
  color: string;
};

const DIRECTORY_ITEMS: DirectoryItem[] = [
  { id: 'map', label: 'Map', icon: 'map', route: '/(tabs)', description: 'Explore nearby orbs and partners.', color: '#22C55E' },
  { id: 'pulse', label: 'OrbPulse Live', icon: 'pulse', route: '/pulse', description: "City's live heartbeat — verified momentum only.", color: '#4ADE80' },
  { id: 'orb', label: 'The Orb', icon: 'planet', route: '/(tabs)/orb', description: 'Core tapping experience.', color: '#60A5FA' },
  { id: 'missions', label: 'Missions', icon: 'flag', route: '/missions', description: 'Daily missions — earn OT Points.', color: '#FBBF24' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', route: '/(tabs)/wallet', description: 'Assets, Earn next, Spend power-ups.', color: '#FBBF24' },
  { id: 'bookmarks', label: 'Bookmarks', icon: 'bookmark', route: '/bookmarks', description: 'Saved partners and perks.', color: '#F59E0B' },
  { id: 'upgrades', label: 'Upgrades', icon: 'flash', route: '/upgrades', description: 'Boost your tap power.', color: '#F59E0B' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy', route: '/leaderboard', description: 'Global rankings.', color: '#A78BFA' },
  { id: 'orbsignal', label: 'Orb Signal', icon: 'radio', route: '/orbsignal', description: 'Predict. Vote. Earn.', color: '#EF4444' },
  { id: 'spheres', label: 'Spheres', icon: 'people', route: '/spheres', description: 'Invite-only groups. Pool points, share experiences.', color: '#8B5CF6' },
  { id: 'stats', label: 'Stats', icon: 'stats-chart', route: '/stats', description: 'Your impact — points, streak, missions, badges.', color: '#22C55E' },
  { id: 'knowledge', label: 'Knowledge', icon: 'bulb', route: '/knowledge', description: 'Fun facts & motivational quotes — like, share, save.', color: '#FBBF24' },
  { id: 'premium', label: 'Premium', icon: 'diamond', route: '/premium', description: 'Unlock your full potential — badge, stats, early access.', color: '#FBBF24' },
  { id: 'compare-accounts', label: 'Compare plans', icon: 'git-compare', route: '/compare-accounts', description: 'Free vs Premium — see what you get with each.', color: '#A78BFA' },
  { id: 'settings', label: 'Settings', icon: 'settings-sharp', route: '/settings', description: 'Preferences and system.', color: '#9CA3AF' },
];

const ADMIN_ITEM: DirectoryItem = {
  id: 'admin',
  label: 'Admin Hub',
  icon: 'construct',
  route: '/admin',
  description: 'Feature flags, map provider, audit log.',
  color: '#FBBF24',
};

const ARENA_ITEM: DirectoryItem = {
  id: 'arena',
  label: 'OrbArena',
  icon: 'trophy',
  route: '/arena',
  description: 'Compete with proof. Weekly challenges, verified voting.',
  color: '#F59E0B',
};

/** Page-specific mini visual for each directory tile — map, orb, missions, wallet, etc. */
function DirectoryVisual({ id, color }: { id: string; color: string }) {
  const c = color;
  const dot = { width: 5, height: 5, borderRadius: 3, backgroundColor: c, opacity: 0.9 };
  const line = { height: 2, backgroundColor: c, opacity: 0.6, borderRadius: 1 };

  switch (id) {
    case 'map':
      return (
        <View style={dirStyles.mapWrap}>
          <View style={[dirStyles.mapGrid, { borderColor: c + '60' }]}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={dirStyles.mapRow}>
                {[0, 1, 2].map((col) => (
                  <View key={col} style={[dot, { marginHorizontal: 2, marginVertical: 2 }]} />
                ))}
              </View>
            ))}
          </View>
          <View style={[dirStyles.mapRoad, { backgroundColor: c + '80' }]} />
        </View>
      );
    case 'pulse':
      return (
        <View style={dirStyles.pulseWrap}>
          <View style={[dirStyles.pulseBar, dirStyles.pulse1, { backgroundColor: c }]} />
          <View style={[dirStyles.pulseBar, dirStyles.pulse2, { backgroundColor: c, opacity: 0.8 }]} />
          <View style={[dirStyles.pulseBar, dirStyles.pulse3, { backgroundColor: c, opacity: 0.5 }]} />
        </View>
      );
    case 'orb':
      return (
        <View style={[dirStyles.orbOuter, { borderColor: c }]}>
          <View style={[dirStyles.orbMid, { borderColor: c, opacity: 0.7 }]} />
          <View style={[dirStyles.orbInner, { backgroundColor: c }]} />
        </View>
      );
    case 'missions':
      return (
        <View style={dirStyles.flagWrap}>
          <View style={[dirStyles.flagPole, { backgroundColor: c }]} />
          <View style={[dirStyles.flagFlag, { borderColor: c, backgroundColor: c + '40' }]} />
        </View>
      );
    case 'wallet':
      return (
        <View style={dirStyles.walletWrap}>
          <View style={[dirStyles.coin, dirStyles.coin1, { backgroundColor: c }]} />
          <View style={[dirStyles.coin, dirStyles.coin2, { backgroundColor: c, opacity: 0.85 }]} />
          <View style={[dirStyles.coin, dirStyles.coin3, { backgroundColor: c, opacity: 0.6 }]} />
        </View>
      );
    case 'bookmarks':
      return (
        <View style={[dirStyles.bookmarkShape, { borderColor: c }]}>
          <View style={[dirStyles.bookmarkFold, { backgroundColor: c + '99' }]} />
        </View>
      );
    case 'upgrades':
      return (
        <View style={dirStyles.boltWrap}>
          <View style={[dirStyles.boltSegment, dirStyles.boltTop, { backgroundColor: c }]} />
          <View style={[dirStyles.boltSegment, dirStyles.boltMid, { backgroundColor: c, opacity: 0.9 }]} />
          <View style={[dirStyles.boltSegment, dirStyles.boltBottom, { backgroundColor: c }]} />
        </View>
      );
    case 'leaderboard':
      return (
        <View style={dirStyles.podiumWrap}>
          <View style={[dirStyles.podiumBar, dirStyles.podium2, { backgroundColor: c, opacity: 0.6 }]} />
          <View style={[dirStyles.podiumBar, dirStyles.podium1, { backgroundColor: c }]} />
          <View style={[dirStyles.podiumBar, dirStyles.podium3, { backgroundColor: c, opacity: 0.5 }]} />
        </View>
      );
    case 'orbsignal':
      return (
        <View style={dirStyles.signalWrap}>
          <View style={[dirStyles.signalArc, { borderColor: c }]} />
          <View style={[dirStyles.signalArc, dirStyles.signalArc2, { borderColor: c, opacity: 0.6 }]} />
          <View style={[dirStyles.signalArc, dirStyles.signalArc3, { borderColor: c, opacity: 0.3 }]} />
        </View>
      );
    case 'stats':
      return (
        <View style={dirStyles.chartWrap}>
          <View style={[dirStyles.chartBar, dirStyles.chart1, { backgroundColor: c }]} />
          <View style={[dirStyles.chartBar, dirStyles.chart2, { backgroundColor: c, opacity: 0.8 }]} />
          <View style={[dirStyles.chartBar, dirStyles.chart3, { backgroundColor: c, opacity: 0.5 }]} />
        </View>
      );
    case 'knowledge':
      return (
        <View style={dirStyles.knowledgeWrap}>
          <View style={[dirStyles.knowledgeBulb, { backgroundColor: c + '40' }]}>
            <View style={[dirStyles.knowledgeGlow, { backgroundColor: c }]} />
          </View>
        </View>
      );
    case 'premium':
      return (
        <View style={[dirStyles.diamondWrap, { borderColor: c }]}>
          <View style={[dirStyles.diamondInner, { backgroundColor: c }]} />
        </View>
      );
    case 'compare-accounts':
      return (
        <View style={dirStyles.compareWrap}>
          <View style={[dirStyles.compareBox, { borderColor: c }]} />
          <View style={[dirStyles.compareBox, dirStyles.compareBoxPremium, { borderColor: c }]} />
        </View>
      );
    case 'arena':
      return (
        <View style={dirStyles.podiumWrap}>
          <View style={[dirStyles.podiumBar, dirStyles.podium2, { backgroundColor: c, opacity: 0.6 }]} />
          <View style={[dirStyles.podiumBar, dirStyles.podium1, { backgroundColor: c }]} />
          <View style={[dirStyles.podiumBar, dirStyles.podium3, { backgroundColor: c, opacity: 0.5 }]} />
        </View>
      );
    case 'admin':
      return (
        <View style={[dirStyles.gearOuter, { borderColor: c }]}>
          <Ionicons name="construct" size={18} color={c} />
        </View>
      );
    case 'settings':
      return (
        <View style={[dirStyles.gearOuter, { borderColor: c }]}>
          <View style={[dirStyles.gearInner, { borderColor: c, opacity: 0.7 }]} />
        </View>
      );
    default:
      return null;
  }
}

const dirStyles = StyleSheet.create({
  mapWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mapGrid: { width: 28, height: 28, borderWidth: 1.5, borderRadius: 4, padding: 4, justifyContent: 'space-between' },
  mapRow: { flexDirection: 'row', justifyContent: 'space-between' },
  mapRoad: { position: 'absolute', width: 4, height: 20, borderRadius: 2, transform: [{ rotate: '-45deg' }] },
  orbOuter: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  orbMid: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  orbInner: { width: 12, height: 12, borderRadius: 6 },
  flagWrap: { width: 28, height: 32, flexDirection: 'row', alignItems: 'flex-end' },
  flagPole: { width: 3, height: 28, borderRadius: 2 },
  flagFlag: { width: 18, height: 12, borderWidth: 1.5, borderLeftWidth: 0, marginLeft: 2 },
  walletWrap: { width: 36, height: 28, alignItems: 'center', justifyContent: 'center' },
  coin: { width: 18, height: 10, borderRadius: 5, position: 'absolute' },
  coin1: { left: 4, top: 2 },
  coin2: { left: 10, top: 6 },
  coin3: { left: 16, top: 10 },
  bookmarkShape: { width: 20, height: 28, borderWidth: 2, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  bookmarkFold: { position: 'absolute', bottom: -2, left: 6, width: 8, height: 10, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  boltWrap: { width: 18, height: 26, alignItems: 'center', justifyContent: 'center' },
  boltSegment: { width: 4, borderRadius: 2, position: 'absolute' },
  boltTop: { height: 8, top: 0, transform: [{ rotate: '25deg' }] },
  boltMid: { height: 10, top: 7, transform: [{ rotate: '-25deg' }] },
  boltBottom: { height: 8, top: 16, transform: [{ rotate: '25deg' }] },
  podiumWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 28, gap: 4 },
  podiumBar: { width: 10, borderRadius: 2 },
  podium1: { height: 22 },
  podium2: { height: 14 },
  podium3: { height: 10 },
  signalWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  signalArc: { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 1.5 },
  signalArc2: { width: 32, height: 32, borderRadius: 16 },
  signalArc3: { width: 40, height: 40, borderRadius: 20 },
  spheresWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sphereDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  sphereDot2: { top: 2, left: 4 },
  sphereDot3: { bottom: 2, right: 4 },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 24, gap: 6 },
  chartBar: { width: 8, borderRadius: 2 },
  chart1: { height: 20 },
  chart2: { height: 14 },
  knowledgeWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  knowledgeBulb: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  knowledgeGlow: { width: 10, height: 10, borderRadius: 5 },
  chart3: { height: 8 },
  gearOuter: { width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
  gearInner: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, position: 'absolute' },
  diamondWrap: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  diamondInner: { width: 16, height: 20, transform: [{ rotate: '45deg' }], borderRadius: 2 },
  compareWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compareBox: { width: 12, height: 16, borderRadius: 4, borderWidth: 1.5 },
  compareBoxPremium: { borderWidth: 2, opacity: 0.9 },
  pulseWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 24, gap: 4 },
  pulseBar: { width: 6, borderRadius: 2 },
  pulse1: { height: 12 },
  pulse2: { height: 18 },
  pulse3: { height: 10 },
});

interface MasterDirectoryProps {
  visible: boolean;
  onClose: () => void;
}

export default function MasterDirectory({ visible, onClose }: MasterDirectoryProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { flags } = useFlags();
  const isAdmin = isAdminEmail(user?.email);
  const items = useMemo(() => {
    const base = [...DIRECTORY_ITEMS];
    if (flags.isOrbArenaEnabled) base.push(ARENA_ITEM);
    if (isAdmin) base.push(ADMIN_ITEM);
    return base;
  }, [isAdmin, flags.isOrbArenaEnabled]);

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
            <View style={styles.headerBrand}>
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.title}>OrbTap</Text>
                <Text style={styles.subtitle}>Master Directory</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.gridContainer}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.88}
                  onPress={() => handlePress(item.route)}
                  style={styles.cardOuter}
                >
                  <LinearGradient
                    colors={[item.color + '28', item.color + '08', 'transparent']}
                    style={[styles.cardGradient, { borderLeftColor: item.color }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardVisualRow}>
                      <View style={[styles.cardVisual, { backgroundColor: item.color + '22' }]}>
                        <DirectoryVisual id={item.id} color={item.color} />
                        <View style={[styles.iconBadge, { backgroundColor: item.color + '35' }]}>
                          <Ionicons name={item.icon} size={24} color={item.color} />
                        </View>
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: '#FFF' }]}>{item.label}</Text>
                        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                    </View>
                  </LinearGradient>
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
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 44,
    height: 36,
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
  cardOuter: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardGradient: {
    borderRadius: 15,
    padding: 14,
    borderLeftWidth: 4,
  },
  cardVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardVisual: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#444',
    fontSize: 12,
    marginTop: 20,
    fontFamily: 'Courier',
  },
});
