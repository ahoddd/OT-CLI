/**
 * Stamp success — shown after user scans partner QR and earns a stamp.
 * Shows "Stamp added" / "Reward earned!" and optional verified review CTA.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { usePartners } from '../../context/PartnersContext';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS, MOTION } from '../../constants/DesignTokens';
import { COLORS } from '../../constants/Colors';
import { StampVerifiedReviewCTA } from '../../components/StampVerifiedReviewCTA';
import { useI18n } from '../../context/I18nContext';

export default function StampSuccessScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { getPartner } = usePartners();
  const params = useLocalSearchParams<{
    partnerId?: string;
    partnerName?: string;
    rewardEarned?: string;
    stampCount?: string;
    actionId?: string;
  }>();
  const partnerId = params.partnerId ?? '';
  const partnerName = params.partnerName ?? getPartner(partnerId)?.name ?? 'this partner';
  const rewardEarned = params.rewardEarned === 'true';
  const stampCount = parseInt(params.stampCount ?? '0', 10);
  const actionId = params.actionId ?? '';

  const [reviewDismissed, setReviewDismissed] = useState(false);
  const showReviewCta = Boolean(partnerId && actionId && !reviewDismissed);

  const successColor = COLORS.success ?? '#22c55e';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Stamp</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(MOTION.enter)} style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: successColor + '22', borderColor: successColor + '55' }]}>
            <Ionicons name={rewardEarned ? 'gift' : 'checkmark-circle'} size={64} color={successColor} />
          </View>
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(80).duration(350)} style={[styles.title, { color: colors.text }]}>
          {rewardEarned ? 'Reward earned!' : 'Stamp added'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(140).duration(350)} style={[styles.subtitle, { color: colors.textSecondary }]}>
          {rewardEarned
            ? 'Your stamp card is complete. Claim your reward below — proof-backed, only in OrbTap.'
            : `You're one step closer. ${stampCount} stamp(s) on your card.`}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/stamp-cards' as any)}
            activeOpacity={0.88}
          >
            <Ionicons name={rewardEarned ? 'gift' : 'wallet'} size={20} color="#fff" />
            <Text style={styles.btnPrimaryText}>{rewardEarned ? 'Claim reward' : 'View stamp card'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSecondary, { borderColor: colors.border }]}
            onPress={() => router.back()}
            activeOpacity={0.88}
          >
            <Text style={[styles.btnSecondaryText, { color: colors.text }]}>Done</Text>
          </TouchableOpacity>
        </Animated.View>

        {showReviewCta && (
          <Animated.View entering={FadeInDown.delay(280).duration(350)} style={styles.reviewSection}>
            <StampVerifiedReviewCTA
              partnerId={partnerId}
              partnerName={partnerName}
              proofId={actionId}
              visible
              onDismiss={() => setReviewDismissed(true)}
            />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.lg,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: SPACE.xl, paddingTop: SPACE.xxl },
  iconWrap: { alignItems: 'center', marginBottom: SPACE.xl },
  iconCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: SPACE.sm },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: SPACE.xxl },
  buttons: { gap: SPACE.base },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.base, borderRadius: RADIUS.md },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnSecondary: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACE.base, borderRadius: RADIUS.md, borderWidth: 1 },
  btnSecondaryText: { fontSize: 16, fontWeight: '600' },
  reviewSection: { marginTop: SPACE.xxl },
});
