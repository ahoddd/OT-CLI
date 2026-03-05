/**
 * Partner Hot Spot Activation — Phase 6 revenue feature.
 * Partners pay to activate a 2× OT hot spot window (duration tiers: 2h/$15, 6h/$35, 24h/$79).
 * Stripe checkout → webhook → sets Firestore hotspot doc with expiry.
 * Home/map shows real hot spots. Push notification to nearby users when activated.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useMyPartner } from '../../hooks/useMyPartner';
import { partnerActivateHotspot } from '../../services/partnerRevenue';
import { COLORS } from '../../constants/Colors';
import { SPACE } from '../../constants/DesignTokens';
import { showErrorAlert } from '../../utils/alert';
import { alert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

export default function HotSpotActivateScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { myPartnerId, myPartner, loading } = useMyPartner();
  const [activating, setActivating] = useState<string | null>(null);

  const handleActivate = async (durationHours: number) => {
    if (!myPartnerId) return;
    setActivating(`${durationHours}`);
    try {
      const res = await partnerActivateHotspot({ partnerId: myPartnerId, durationHours });
      if (res.success) {
        alert(
          'Hot Spot active',
          `2× OT is now live for ${durationHours} hours. Nearby users will see your venue as a Hot Spot.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        showErrorAlert('Activation failed', res.message ?? 'Please try again.');
      }
    } catch (e) {
      showErrorAlert('Activation failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setActivating(null);
    }
  };

  if (loading || !myPartnerId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Activate Hot Spot</Text>
          </View>
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const tiers = [
    { duration: '2 hours', price: 15, label: '2h', durationHours: 2, hint: 'Best for lunch & happy hour rushes' },
    { duration: '6 hours', price: 35, label: '6h', durationHours: 6, hint: 'Most popular · $5.83/hr' },
    { duration: '24 hours', price: 79, label: '24h', durationHours: 24, hint: 'Full day · save 42% vs hourly' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Activate Hot Spot</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.hero, { backgroundColor: themeGold + '18', borderColor: themeGold + '44' }]}>
            <View style={[styles.heroIcon, { backgroundColor: themeGold + '30' }]}>
              <Ionicons name="flash" size={32} color={themeGold} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>2× OT for 2 hours</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              Push nearby users when you activate. Drive instant foot traffic to {myPartner?.name ?? 'your venue'}.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose duration</Text>
          {tiers.map((tier) => {
            const isActivating = activating === String(tier.durationHours);
            return (
              <TouchableOpacity
                key={tier.label}
                style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleActivate(tier.durationHours)}
                disabled={!!activating}
                activeOpacity={0.88}
              >
                <View style={styles.tierLeft}>
                  <Text style={[styles.tierDuration, { color: colors.text }]}>{tier.duration}</Text>
                  <Text style={[styles.tierHint, { color: colors.textSecondary }]}>
                    {tier.hint}
                  </Text>
                </View>
                {isActivating ? (
                  <ActivityIndicator size="small" color={themeGold} />
                ) : (
                  <>
                    <Ionicons name="chevron-forward" size={20} color={themeGold} />
                    <Text style={[styles.tierPrice, { color: themeGold }]}>${tier.price}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}

          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            Payment processed via Stripe. Hot Spot activates immediately after payment. Nearby users receive a push notification.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
  },
  backBtn: { padding: SPACE.xs },
  headerTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 14 },
  content: { padding: SPACE.base },
  hero: {
    padding: SPACE.lg,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACE.lg,
    alignItems: 'center',
  },
  heroIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.sm },
  heroTitle: { fontSize: 20, fontWeight: '800', marginBottom: SPACE.xs },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: SPACE.sm },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.base,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: SPACE.sm,
  },
  tierLeft: { flex: 1 },
  tierDuration: { fontSize: 16, fontWeight: '700' },
  tierHint: { fontSize: 12, marginTop: 2 },
  tierPrice: { fontSize: 18, fontWeight: '800', marginLeft: SPACE.sm },
  disclaimer: { fontSize: 12, marginTop: SPACE.lg, lineHeight: 18 },
});
