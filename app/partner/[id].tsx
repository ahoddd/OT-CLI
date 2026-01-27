import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PARTNERS, MOCK_PERKS, TIER_COLORS } from '../../constants/MockData';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { PartnerBadge } from '../../components/GamificationUI';
import { TerritoryControl } from '../../components/TerritoryControl';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../../hooks/useSocial';
import { useReviews } from '../../hooks/useReviews';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function PartnerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isFollowing, toggleFollow } = useSocial();
  const { getPartnerReviews } = useReviews();
  const { colors, isDark } = useTheme();
  
  const partner = MOCK_PARTNERS.find(p => p.id === id);
  const perks = MOCK_PERKS.filter(p => p.partnerId === id);
  const reviews = getPartnerReviews(partner?.id || '');

  if (!partner) return <View style={styles.container}><Text>Error</Text></View>;

  const tierColor = TIER_COLORS[partner.tier];
  const following = isFollowing(partner.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* BRAND HERO */}
        <View style={styles.heroContainer}>
            <LinearGradient
                colors={[tierColor, isDark ? '#000' : '#fff']}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="share-social" size={24} color="#fff" />
                    </TouchableOpacity>
                </SafeAreaView>

                <Animated.View entering={FadeInDown.duration(800)} style={styles.heroContent}>
                    <View style={styles.badgeWrapper}>
                         <PartnerBadge tier={partner.tier} size={40} />
                    </View>
                    <Text style={styles.heroText}>{partner.name.toUpperCase()}</Text>
                    <View style={styles.tierPill}>
                         <Text style={[styles.tierText, { color: tierColor }]}>{partner.tier.toUpperCase()} AUTHORITY</Text>
                    </View>
                </Animated.View>
            </LinearGradient>
        </View>

        {/* CONTENT SHEET */}
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.infoRow}>
                <View style={{flex: 1}}>
                    <Text style={[styles.address, { color: colors.textSecondary }]}>{partner.address}</Text>
                    <View style={styles.verifiedRow}>
                        {partner.verified && <VerifiedBadge size={16} />}
                        <Text style={[styles.verifiedText, { color: colors.text }]}>Verified Location</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    style={[styles.followBtn, { backgroundColor: following ? colors.surface : colors.text }]}
                    onPress={() => { Haptics.selectionAsync(); toggleFollow(partner.id); }}
                >
                    <Text style={[styles.followText, { color: following ? colors.text : colors.background }]}>
                        {following ? 'Following' : 'Follow'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* THE WAR COMPONENT */}
            <TerritoryControl sphereName="Neon Raiders" />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIVE MISSIONS</Text>
            {perks.map((perk, i) => (
                <Animated.View 
                    key={perk.id} 
                    entering={FadeInDown.delay(i*100).duration(500)}
                    style={[styles.missionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                    <View style={[styles.missionLeft, { backgroundColor: TIER_COLORS[perk.tier] }]}>
                        <Ionicons name="gift" size={24} color="#000" />
                    </View>
                    <View style={styles.missionCenter}>
                        <Text style={[styles.missionTitle, { color: colors.text }]}>{perk.title}</Text>
                        <Text style={[styles.missionDesc, { color: colors.textSecondary }]} numberOfLines={1}>{perk.description}</Text>
                    </View>
                    <TouchableOpacity style={[styles.claimBtn, { borderColor: colors.border }]}>
                        <Text style={[styles.claimText, { color: colors.text }]}>CLAIM</Text>
                    </TouchableOpacity>
                </Animated.View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { height: 350 },
  heroGradient: { flex: 1, paddingBottom: 60, justifyContent: 'space-between' },
  safeHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  heroContent: { paddingHorizontal: 24, alignItems: 'center' },
  badgeWrapper: { marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20 },
  heroText: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: -1, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  tierPill: { marginTop: 12, backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tierText: { fontWeight: 'bold', fontSize: 10, letterSpacing: 2 },
  
  sheet: { marginTop: -40, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: 500 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  address: { fontSize: 14, marginBottom: 4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedText: { fontSize: 12, fontWeight: 'bold' },
  followBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  followText: { fontWeight: 'bold', fontSize: 14 },
  
  divider: { height: 1, marginBottom: 24, marginTop: 24 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
  
  missionCard: { flexDirection: 'row', borderRadius: 16, padding: 12, marginBottom: 12, alignItems: 'center', borderWidth: 1 },
  missionLeft: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  missionCenter: { flex: 1, paddingHorizontal: 12 },
  missionTitle: { fontWeight: 'bold', fontSize: 16 },
  missionDesc: { fontSize: 12, marginTop: 2 },
  claimBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  claimText: { fontWeight: '900', fontSize: 10, letterSpacing: 1 }
});
