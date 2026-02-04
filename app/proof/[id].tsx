import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Image, Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TIER_COLORS } from '../../constants/MockData';
import type { Tier } from '../../constants/MockData';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { useFlags } from '../../components/FlagContext';

const TIER_OPTIONS: Tier[] = ['common', 'rare', 'apex', 'legendary'];

function getTierColor(tier: string): string {
  const t = TIER_OPTIONS.includes(tier as Tier) ? (tier as Tier) : 'rare';
  return TIER_COLORS[t];
}

function partialId(id: string): string {
  if (!id || id.length <= 8) return id;
  return id.slice(-8).toUpperCase();
}

function formatTimestamp(createdAt: string): string {
  const n = parseInt(createdAt, 10);
  if (Number.isNaN(n)) return new Date().toLocaleString();
  return new Date(n).toLocaleString();
}

const APP_LINK = 'https://orbtap.app';
const SHARE_MESSAGE = (partner: string, points: string) =>
  `Just earned ${points} OT Points at ${partner} on OrbTap — discover rewards near you. ${APP_LINK}`;

export default function ProofScreen() {
  const router = useRouter();
  const { flags } = useFlags();
  const cardRef = useRef<ViewShot>(null);
  const params = useLocalSearchParams<{
    id?: string;
    proofId?: string;
    partner?: string;
    points?: string;
    tier?: string;
    createdAt?: string;
  }>();

  const proofId = params.id ?? params.proofId ?? '';
  const partner = params.partner ?? 'Partner';
  const points = params.points ?? '0';
  const tier = params.tier ?? 'rare';
  const createdAt = params.createdAt ?? String(Date.now());

  const tierColor = getTierColor(tier);

  const handleShare = async () => {
    try {
      let imageUri: string | undefined;
      if (cardRef.current?.capture) {
        imageUri = await cardRef.current.capture();
      }
      const message = SHARE_MESSAGE(partner, points);
      if (imageUri && Platform.OS !== 'web') {
        await Share.share({
          message: message + '\n\n' + APP_LINK,
          url: imageUri,
          title: 'OrbTap Proof',
        });
      } else {
        await Share.share({
          message: message,
          title: 'OrbTap Proof',
        });
      }
    } catch {
      // User cancelled or share failed
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Image source={require('../../assets/images/icon.png')} style={styles.topBarLogo} resizeMode="contain" />
        <Text style={styles.topBarTitle}>Proof</Text>
      </View>

      <ViewShot
        ref={cardRef}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        style={styles.shotWrap}
      >
        <View style={[styles.card, { borderColor: tierColor + '44' }]}>
          <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
            <Text style={styles.headerTitle}>VERIFIED PROOF</Text>
          </View>
          <Text style={styles.partnerName}>{partner}</Text>
          <Text style={[styles.tierLabel, { color: tierColor }]}>{tier.toUpperCase()} TIER</Text>
          <View style={styles.earnedRow}>
            <Text style={styles.earnedLabel}>Earned </Text>
            <OTPointsBadge amount={points} size={28} label="pts" compact textColor="#fff" />
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(createdAt)}</Text>
          <View style={styles.footer}>
            <Text style={styles.orbIdLabel}>OrbTap ID</Text>
            <Text style={styles.orbIdValue}>{partialId(proofId) || '—'}</Text>
          </View>
          <View style={styles.cardLogoWrap}>
            <Image source={require('../../assets/images/icon.png')} style={styles.cardLogo} resizeMode="contain" />
          </View>
        </View>
      </ViewShot>

      <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#22C55E' }]} onPress={handleShare} activeOpacity={0.8}>
        <Ionicons name="share-social" size={22} color="#000" />
        <Text style={styles.shareBtnText}>SHARE PROOF</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(tabs)/wallet')} activeOpacity={0.8}>
        <Text style={styles.closeBtnText}>Close</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
  },
  backBtn: { padding: 8 },
  topBarLogo: { width: 36, height: 30 },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', flex: 1 },
  shotWrap: { marginHorizontal: 24, marginTop: 24, marginBottom: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    overflow: 'hidden',
  },
  tierBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  partnerName: { color: '#FFF', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  tierLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 20 },
  earnedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  earnedLabel: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  timestamp: { color: '#888', fontSize: 14, marginBottom: 20 },
  footer: { paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  orbIdLabel: { color: '#666', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  orbIdValue: { color: '#AAA', fontSize: 14, fontVariant: ['tabular-nums'] },
  cardLogoWrap: { position: 'absolute', bottom: 20, right: 20 },
  cardLogo: { width: 48, height: 40 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  shareBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  arenaBtn: { backgroundColor: '#F59E0B' },
  closeBtn: { paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: '#888', fontSize: 16 },
});
