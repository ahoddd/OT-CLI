import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing 
} from 'react-native-reanimated';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Brand logo image — shield/gold logo used everywhere (transparent PNG). */
export const OrbTapLogoImage = ({
  width = 80,
  height,
  style,
}: {
  width?: number;
  height?: number;
  style?: object;
}) => {
  const h = height ?? width * (120 / 100);
  return (
    <Image
      source={require('../assets/images/logo-orbtap.png')}
      style={[{ width, height: h }, style]}
      resizeMode="contain"
    />
  );
};

interface LogoProps {
  width?: number;
  height?: number;
  animated?: boolean;
}

export const OrbTapLogo = ({ width = 120, height = 40, animated = false }: LogoProps) => {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  return (
    <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      <Svg viewBox="0 0 300 80" width="100%" height="100%">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={COLORS.neonBlue[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={COLORS.neonBlue[1]} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={themeGold} stopOpacity="1" />
            <Stop offset="1" stopColor="#b45309" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* --- THE ICON (The "Singularity" Orb) --- */}
        <G x="20" y="10">
            {/* Outer Ring (The Network) */}
            <Path 
                d="M30,5 A25,25 0 1,1 5,30" 
                fill="none" 
                stroke="url(#grad)" 
                strokeWidth="6" 
                strokeLinecap="round" 
            />
            {/* Inner Ring (The Value) */}
            <Path 
                d="M50,30 A20,20 0 1,1 30,50" 
                fill="none" 
                stroke="url(#goldGrad)" 
                strokeWidth="6" 
                strokeLinecap="round" 
                opacity="0.9"
            />
            {/* The Core (The Spark) */}
            <Circle cx="30" cy="30" r="6" fill="#fff" />
        </G>

        {/* --- THE WORDMARK (Custom Geometric Type) --- */}
        <G x="90" y="22">
            {/* O */}
            <Path d="M15,0 A15,15 0 1,0 15,30 A15,15 0 1,0 15,0 M15,6 A9,9 0 1,1 15,24 A9,9 0 1,1 15,6" fill="#fff" />
            {/* R */}
            <Path d="M40,0 L40,30 M40,15 L50,0 M40,15 L50,30 M40,0 L50,0" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
            {/* B */}
            <Path d="M65,0 L65,30 M65,0 L75,0 A7.5,7.5 0 0,1 65,15 A7.5,7.5 0 0,1 65,30 L75,30" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" />
            
            {/* T (Accented) */}
            <Path d="M100,0 L120,0 M110,0 L110,30" stroke="url(#grad)" strokeWidth="6" strokeLinecap="round" />
            {/* A */}
            <Path d="M130,30 L140,0 L150,30 M135,20 L145,20" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* P */}
            <Path d="M165,30 L165,0 L175,0 A7.5,7.5 0 0,1 165,15" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" />
        </G>
      </Svg>
    </View>
  );
};

export const OrbIcon = ({ size = 60 }: { size?: number }) => {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  return (
    <View style={{ width: size, height: size }}>
       <Svg viewBox="0 0 100 100" width="100%" height="100%">
          <Defs>
            <LinearGradient id="blue" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={COLORS.neonBlue[0]} />
                <Stop offset="1" stopColor={COLORS.neonBlue[1]} />
            </LinearGradient>
          </Defs>
          
          {/* Static Core */}
          <Circle cx="50" cy="50" r="15" fill="#fff" />
          
          {/* Rotating Rings */}
          <AnimatedCircle 
            cx="50" 
            cy="50" 
            r="35" 
            stroke="url(#blue)" 
            strokeWidth="8" 
            strokeDasharray="60 40"
            strokeLinecap="round"
            fill="none"
            animatedProps={animatedProps}
            origin="50, 50"
          />
          <Circle cx="50" cy="50" r="45" stroke={themeGold} strokeWidth="2" opacity="0.5" strokeDasharray="4 4" />
       </Svg>
    </View>
  );
};
