import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';
import { OrbTapLogo } from '../../components/AppLogos';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ProofScreen() {
  const { id, partner, points, tier } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    // SUCCESS HAPTIC PATTERN
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Just secured ${points} XP at ${partner} on OrbTap. Leveling up my Neural Link. 🚀`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
       <LinearGradient
        colors={['#000', '#1a1a1a']}
        style={styles.background}
       />

       {/* SUCCESS HEADER */}
       <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <View style={styles.iconBox}>
                <Ionicons name="checkmark" size={40} color={COLORS.success} />
            </View>
            <Text style={styles.title}>VERIFIED WIN</Text>
            <Text style={styles.sub}>Secure connection established.</Text>
       </Animated.View>

       {/* THE ARTIFACT CARD */}
       <Animated.View entering={ZoomIn.duration(600)} style={styles.cardContainer}>
            <LinearGradient
                colors={['#111', '#000']}
                style={styles.card}
            >
                <View style={[styles.tierBar, { backgroundColor: COLORS.gold[0] }]} />
                
                <View style={styles.cardContent}>
                    <View style={styles.row}>
                        <OrbTapLogo width={80} />
                        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.center}>
                        <Text style={styles.points}>+{points}</Text>
                        <Text style={styles.xpLabel}>XP ACQUIRED</Text>
                    </View>

                    <View style={styles.footer}>
                        <View>
                            <Text style={styles.label}>LOCATION</Text>
                            <Text style={styles.val}>{partner}</Text>
                        </View>
                        <View>
                            <Text style={styles.label}>TIER</Text>
                            <Text style={[styles.val, { color: COLORS.gold[0] }]}>{tier}</Text>
                        </View>
                    </View>
                </View>

                {/* Holographic Overlay */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'transparent']}
                    style={styles.gloss}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </LinearGradient>
       </Animated.View>

       {/* ACTIONS */}
       <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <LinearGradient
                    colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
                    style={styles.gradBtn}
                >
                    <Ionicons name="share-social" size={20} color="#fff" />
                    <Text style={styles.btnText}>SHARE PROOF</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(tabs)/wallet')}>
                <Text style={styles.closeText}>STASH IN VAULT</Text>
            </TouchableOpacity>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  background: { position: 'absolute', width: '100%', height: '100%' },
  
  header: { alignItems: 'center', marginBottom: 40 },
  iconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(74, 222, 128, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.success },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  sub: { color: '#888', fontSize: 12, marginTop: 4 },

  cardContainer: { width: width * 0.85, height: 400, shadowColor: COLORS.gold[0], shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: {width:0,height:0} },
  card: { flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  tierBar: { height: 6, width: '100%' },
  cardContent: { flex: 1, padding: 30, justifyContent: 'space-between' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: '#666', fontSize: 12, fontFamily: 'monospace' },
  
  center: { alignItems: 'center' },
  points: { color: '#fff', fontSize: 64, fontWeight: '900' },
  xpLabel: { color: COLORS.neonBlue[0], fontSize: 14, fontWeight: 'bold', letterSpacing: 4 },

  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  val: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  
  gloss: { position: 'absolute', width: '100%', height: '100%' },

  actions: { position: 'absolute', bottom: 60, width: '100%', paddingHorizontal: 40, gap: 16 },
  shareBtn: { borderRadius: 16, overflow: 'hidden' },
  gradBtn: { padding: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 20, alignItems: 'center' },
  closeText: { color: '#666', fontWeight: 'bold', letterSpacing: 1 }
});
