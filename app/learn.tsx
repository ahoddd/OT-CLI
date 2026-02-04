import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OrbTapLogoImage } from '../components/AppLogos';
import { COLORS } from '../constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH;

const FEATURES = [
  {
    id: 'welcome',
    type: 'hero' as const,
    icon: null,
    image: true,
    title: 'Only on OrbTap',
    subtitle: 'The future of local rewards is here. Tap orbs, earn points, redeem real perks at real places.',
  },
  {
    id: 'map',
    type: 'feature' as const,
    icon: 'map' as const,
    image: false,
    title: 'Discover Orbs Near You',
    subtitle: 'See partner venues on the map. Tap any orb to see perks, hours, and Orb Score™ reviews—only on OrbTap.',
  },
  {
    id: 'scan',
    type: 'feature' as const,
    icon: 'qr-code' as const,
    image: false,
    title: 'Scan & Earn Instantly',
    subtitle: 'Check in at partners with one tap. Earn OT points and build your streak. Proof is verified on the spot.',
  },
  {
    id: 'perks',
    type: 'feature' as const,
    icon: 'gift' as const,
    image: false,
    title: 'Redeem Real Perks',
    subtitle: 'Use your points for discounts, free items, and exclusive offers. Bookmark your favorites and come back anytime.',
  },
  {
    id: 'reviews',
    type: 'feature' as const,
    icon: 'star' as const,
    image: false,
    title: 'Orb Score™ — Only Here',
    subtitle: 'Reviews from verified visits count more. See how real explorers rate each spot. No fake reviews.',
  },
  {
    id: 'levels',
    type: 'feature' as const,
    icon: 'trophy' as const,
    image: false,
    title: 'Level Up & Unlock More',
    subtitle: 'Earn XP, climb ranks, and unlock perks like 2× Grid View, multipliers, and Black Tier venues.',
  },
  {
    id: 'join',
    type: 'cta' as const,
    icon: 'rocket' as const,
    image: false,
    title: 'Join 12k+ Explorers',
    subtitle: 'Start free. No credit card. Tap below and claim your spot in under a minute.',
  },
];

export default function LearnScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    if (i >= 0 && i < FEATURES.length) setIndex(i);
  };

  const renderSlide = ({ item, index: i }: { item: typeof FEATURES[0]; index: number }) => {
    const isHero = item.type === 'hero';
    const isCta = item.type === 'cta';
    return (
      <View style={[styles.slide, { width: SLIDE_WIDTH }]}>
        <LinearGradient
          colors={isCta ? [COLORS.neonBlue[0] + '22', '#000', '#000'] : ['#050510', '#0a0a18', '#000']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.slideContent}>
          {isHero && (
            <View style={styles.heroImageWrap}>
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          )}
          {!isHero && item.icon && (
            <View style={[styles.iconWrap, isCta && styles.iconWrapCta]}>
              <Ionicons name={item.icon} size={56} color={isCta ? COLORS.neonBlue[0] : '#fff'} />
            </View>
          )}
          <Text style={[styles.slideTitle, isCta && styles.slideTitleCta]}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#0a0a12', '#000']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <OrbTapLogoImage width={80} height={60} />
          <View style={styles.placeholder} />
        </View>

        <FlatList
          ref={listRef}
          data={FEATURES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {FEATURES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>
          <Text style={styles.swipeHint}>Swipe to see more</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/auth/signup')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.neonBlue[0], COLORS.neonBlue[1]]}
              style={styles.primaryBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Get started free</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  placeholder: { width: 40 },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  slideContent: { alignItems: 'center', maxWidth: 320 },
  heroImageWrap: { marginBottom: 24 },
  heroImage: { width: 120, height: 120 },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  iconWrapCta: { backgroundColor: 'rgba(96, 165, 250, 0.25)', borderColor: COLORS.neonBlue[0] },
  slideTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 },
  slideTitleCta: { color: COLORS.neonBlue[0] },
  slideSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  dotActive: { backgroundColor: COLORS.neonBlue[0], width: 20 },
  swipeHint: { color: '#555', fontSize: 11, textAlign: 'center', marginBottom: 20 },
  primaryBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 12 },
  secondaryBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
});
