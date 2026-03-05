/**
 * Partner referral — share your link to invite other businesses. Earn $10 credit when they're approved.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useMyPartner } from '../../hooks/useMyPartner';
import { partnerReferralUrl } from '../../constants/AppLinks';
import { COLORS } from '../../constants/Colors';
import { safeHaptics } from '../../utils/safeHaptics';
import * as Clipboard from 'expo-clipboard';
import { useI18n } from '../../context/I18nContext';

export default function PartnerReferralScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { myPartnerId, myPartner } = useMyPartner();
  const referralCode = myPartnerId ?? myPartner?.id ?? '';
  const referralUrl = referralCode ? partnerReferralUrl(referralCode) : '';

  const handleShare = async () => {
    safeHaptics.selectionAsync();
    try {
      await Share.share({
        message: `List your business on OrbTap — the app that drives real foot traffic. Use my link: ${referralUrl}`,
        url: referralUrl,
        title: 'Join OrbTap — Get more customers',
      });
    } catch {}
  };

  const handleCopy = async () => {
    safeHaptics.selectionAsync();
    if (referralUrl) {
      await Clipboard.setStringAsync(referralUrl);
    }
  };

  if (!myPartnerId) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Refer a business</Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Link your business first to get your referral link.
          </Text>
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/partner-apply' as any)}
            activeOpacity={0.88}
          >
            <Text style={styles.applyBtnText}>Apply to join</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Refer a business</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: (colors.gold ?? COLORS.gold[0]) + '25' }]}>
            <Ionicons name="gift" size={32} color={colors.gold ?? COLORS.gold[0]} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Get $10 credit</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Share your referral link. When a business signs up and gets approved, you earn 100 OT Points and $10 off your next OrbTap bill.
          </Text>
        </View>
        <View style={[styles.urlCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.urlLabel, { color: colors.textSecondary }]}>Your referral link</Text>
          <Text style={[styles.urlText, { color: colors.text }]} numberOfLines={2} selectable>
            {referralUrl || 'Generating…'}
          </Text>
          <View style={styles.urlRow}>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: colors.primary }]}
              onPress={handleCopy}
              activeOpacity={0.9}
            >
              <Ionicons name="copy-outline" size={18} color="#fff" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, { borderColor: colors.border }]}
              onPress={handleShare}
              activeOpacity={0.9}
            >
              <Ionicons name="share-outline" size={18} color={colors.text} />
              <Text style={[styles.shareBtnText, { color: colors.text }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  empty: { textAlign: 'center', fontSize: 15 },
  scroll: { padding: 20, paddingBottom: 40 },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  cardSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  urlCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  urlLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  urlText: { fontSize: 13, marginBottom: 16 },
  urlRow: { flexDirection: 'row', gap: 12 },
  copyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  copyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  shareBtnText: { fontWeight: '700', fontSize: 14 },
  applyBtn: { marginTop: 20, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
