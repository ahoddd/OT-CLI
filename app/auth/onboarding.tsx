import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { UserBadge } from '../../components/GamificationUI';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#111']} style={styles.background} />
      <SafeAreaView style={styles.content}>
        
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
            <Text style={styles.welcome}>WELCOME TO</Text>
            <Text style={styles.brand}>ORBTAP</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.center}>
            <View style={styles.badgeWrapper}>
                <UserBadge level={1} size={150} />
            </View>
            <Text style={styles.rank}>RANK: SCOUT</Text>
            <Text style={styles.desc}>Your neural link is active. Begin scanning Orbs to increase your clearance level.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.footer}>
            <TouchableOpacity style={styles.btn} onPress={handleContinue}>
                <Text style={styles.btnText}>ENTER THE GRID</Text>
            </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { position: 'absolute', width: '100%', height: '100%' },
  content: { flex: 1, padding: 30, justifyContent: 'space-between' },
  header: { marginTop: 40 },
  welcome: { color: '#666', fontSize: 14, letterSpacing: 4, fontWeight: 'bold' },
  brand: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  
  center: { alignItems: 'center' },
  badgeWrapper: { marginBottom: 30, shadowColor: COLORS.neonBlue[0], shadowOpacity: 0.5, shadowRadius: 40, shadowOffset: {width:0, height:0} },
  rank: { color: COLORS.neonBlue[0], fontSize: 18, fontWeight: 'bold', letterSpacing: 4, marginBottom: 16 },
  desc: { color: '#888', textAlign: 'center', lineHeight: 24, fontSize: 14, maxWidth: '80%' },

  footer: { marginBottom: 20 },
  btn: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '900', letterSpacing: 2 }
});
