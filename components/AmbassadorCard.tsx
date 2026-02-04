import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { OrbTapLogoImage } from './AppLogos';
import * as Haptics from 'expo-haptics';

export const AmbassadorCard = () => {
  const handleInvite = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: 'Join me on OrbTap. Use code [EXPLORER-X] to unlock Level 1 instantly. https://orbtap.com/invite/EXPLORER-X',
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111', '#000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <LinearGradient
            colors={[COLORS.gold[0], 'transparent']}
            style={styles.glow}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
        />
        
        <View style={styles.content}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>AMBASSADOR</Text>
                    <Text style={styles.sub}>Invite & Earn</Text>
                </View>
                <OrbTapLogoImage width={56} height={44} />
            </View>

            <View style={styles.middle}>
                <Text style={styles.desc}>
                    Earn <Text style={{color: COLORS.gold[0]}}>500 XP</Text> + <Text style={{color: COLORS.success}}>250 PTS</Text> for every verified explorer you recruit.
                </Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleInvite}>
                <LinearGradient
                    colors={[COLORS.gold[0], COLORS.gold[1]]}
                    style={styles.btnGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Ionicons name="share-social" size={16} color="#000" />
                    <Text style={styles.btnText}>DEPLOY INVITE CODE</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, marginBottom: 10 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  glow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, opacity: 0.2, borderRadius: 75 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  sub: { color: COLORS.gold[0], fontSize: 12, fontWeight: 'bold' },
  middle: { marginBottom: 20 },
  desc: { color: '#888', fontSize: 13, lineHeight: 20 },
  btn: { borderRadius: 12, overflow: 'hidden' },
  btnGrad: { padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});
