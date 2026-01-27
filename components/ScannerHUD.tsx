import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/Colors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const BOX_SIZE = 280;

export const ScannerHUD = () => {
  const scanLine = useSharedValue(0);

  useEffect(() => {
    scanLine.value = withRepeat(
      withTiming(BOX_SIZE, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedLine = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value }]
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Darkened Backgrounds */}
      <View style={styles.maskTop} />
      <View style={styles.maskBottom} />
      <View style={styles.maskLeft} />
      <View style={styles.maskRight} />

      {/* Center Reticle */}
      <View style={styles.reticleBox}>
        {/* Corners */}
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />

        {/* Scanning Laser */}
        <Animated.View style={[styles.laser, animatedLine]}>
           <LinearGradient
            colors={['transparent', COLORS.neonBlue[0], 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: '100%', height: 2 }}
           />
        </Animated.View>

        <Text style={styles.status}>SEARCHING FOR SIGNAL...</Text>
      </View>

      <View style={styles.footer}>
         <Text style={styles.instruction}>ALIGN QR CODE WITHIN FRAME</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  maskTop: { position: 'absolute', top: 0, left: 0, right: 0, height: (height - BOX_SIZE) / 2 - 50, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: (height - BOX_SIZE) / 2 + 50, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskLeft: { position: 'absolute', top: (height - BOX_SIZE) / 2 - 50, bottom: (height - BOX_SIZE) / 2 + 50, left: 0, width: (width - BOX_SIZE) / 2, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskRight: { position: 'absolute', top: (height - BOX_SIZE) / 2 - 50, bottom: (height - BOX_SIZE) / 2 + 50, right: 0, width: (width - BOX_SIZE) / 2, backgroundColor: 'rgba(0,0,0,0.6)' },
  
  reticleBox: {
    position: 'absolute',
    top: (height - BOX_SIZE) / 2 - 50,
    left: (width - BOX_SIZE) / 2,
    width: BOX_SIZE,
    height: BOX_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: COLORS.neonBlue[0], borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  
  laser: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, shadowColor: COLORS.neonBlue[0], shadowOpacity: 1, shadowRadius: 10 },
  status: { color: COLORS.neonBlue[0], fontFamily: 'monospace', fontSize: 10, marginTop: 10, position: 'absolute', bottom: -30, letterSpacing: 2 },
  
  footer: { position: 'absolute', bottom: 120, width: '100%', alignItems: 'center' },
  instruction: { color: '#fff', fontWeight: 'bold', letterSpacing: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 }
});
