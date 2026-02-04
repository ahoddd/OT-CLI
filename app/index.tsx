import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { OrbTapLogoImage } from '../components/AppLogos';
import { COLORS } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn, FadeOut, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const IDLE_BUBBLE_DELAY_MS = 2000;

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showBubble, setShowBubble] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownBubbleRef = useRef(false);

  const dismissBubble = useCallback(() => {
    setShowBubble(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (loading || user || hasShownBubbleRef.current) return;
    idleTimerRef.current = setTimeout(() => {
      hasShownBubbleRef.current = true;
      setShowBubble(true);
    }, IDLE_BUBBLE_DELAY_MS);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [loading, user]);

  const goSignup = () => {
    dismissBubble();
    router.push('/auth/signup');
  };

  const goLogin = () => {
    dismissBubble();
    router.push('/auth/login');
  };

  if (loading) return null;
  if (user) return <Redirect href="/(tabs)" />;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0a0a12', '#050510', '#000000']} style={styles.background} />
      <View style={styles.orbGlow} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={dismissBubble}
        scrollEventThrottle={16}
      >
        <Animated.View entering={FadeInDown.duration(700)} style={styles.hero}>
          <OrbTapLogoImage width={140} height={105} />
          <Text style={styles.tagline}>THE FUTURE OF LOCAL REWARDS</Text>
          <Text style={styles.heroSub}>
            Tap orbs. Earn points. Redeem perks at real places. Only on OrbTap.
          </Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>12k+ explorers in your city</Text>
          </View>
        </Animated.View>

        {/* Idle pun bubble — "I'd Tap That!" 👇 pointing down at GET STARTED button */}
        {showBubble && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.bubbleWrap}
          >
            <TouchableOpacity activeOpacity={1} onPress={dismissBubble} style={styles.bubbleTouch}>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>I'd Tap That!</Text>
                <Text style={styles.bubbleEmoji}>👇</Text>
                <View style={styles.bubbleArrow} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={goSignup}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
              style={styles.primaryBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>GET STARTED FREE</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={goLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.learnBtn}
            onPress={() => router.push('/learn')}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={18} color={COLORS.neonBlue[0]} />
            <Text style={styles.learnBtnText}>Learn what only OrbTap offers</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(500).duration(600)} style={styles.teaser}>
          <Text style={styles.teaserTitle}>Map · Scan · Earn · Redeem</Text>
          <Text style={styles.teaserSub}>Partner perks, Orb Score™ reviews, streaks & more.</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { position: 'absolute', width: '100%', height: '100%' },
  orbGlow: {
    position: 'absolute',
    top: -80,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: COLORS.neonBlue[0],
    opacity: 0.12,
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 48 },
  hero: { alignItems: 'center', marginBottom: 40 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 2.5, marginTop: 16 },
  heroSub: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
    maxWidth: 320,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginRight: 8 },
  liveText: { color: '#4ade80', fontSize: 12, fontWeight: '700' },

  bubbleWrap: { alignItems: 'center', marginBottom: 6 },
  bubbleTouch: { alignSelf: 'center' },
  bubble: {
    backgroundColor: 'rgba(30, 38, 58, 0.94)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
    alignItems: 'center',
    shadowColor: COLORS.neonBlue[0],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bubbleText: { color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  bubbleEmoji: { fontSize: 20, marginTop: 2 },
  bubbleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(30, 38, 58, 0.94)',
    marginTop: 4,
  },
  ctaSection: { gap: 14, marginBottom: 32 },
  primaryBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: COLORS.neonBlue[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  primaryBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, paddingHorizontal: 24 },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 14 },
  secondaryBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  learnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    borderRadius: 14,
    marginTop: 8,
  },
  learnBtnText: { color: COLORS.neonBlue[0], fontSize: 14, fontWeight: '700' },

  teaser: { alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  teaserTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  teaserSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 },
});
