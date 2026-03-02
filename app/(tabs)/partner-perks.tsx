/**
 * Partner tab: Perks hub — manage perks, view partner page; frosted glass tiles.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { SPACE } from '../../constants/DesignTokens';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { safeHaptics } from '../../utils/safeHaptics';
import { PartnerFrostedCard } from '../../components/PartnerFrostedCard';

export default function PartnerPerksTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const { partners, getPerksForPartner } = usePartners();
  const { testPartnerTier } = useEffectiveTier();
  const { myPartnerId, myPartner } = useMyPartner();
  const partnerId = myPartnerId ?? partners[0]?.id ?? 'p1';
  const partner = myPartner ?? partners[0] ?? null;
  const tierColor = testPartnerTier
    ? PARTNER_TIER_COLORS[testPartnerTier]
    : (partner?.tier ? PARTNER_TIER_COLORS[partner.tier as keyof typeof PARTNER_TIER_COLORS] : PARTNER_TIER_COLORS.silver);

  const activeCount = getPerksForPartner(partnerId).filter((p) => p.active !== false).length;

  const items = [
    { label: 'View your page', sub: 'See how customers see you', route: `/partner/${partnerId}` as any, icon: 'eye-outline' as const },
    {
      label: 'Manage perks',
      sub: activeCount === 0 ? 'No active perks yet' : `${activeCount} active perk${activeCount !== 1 ? 's' : ''}`,
      route: '/partner/perks' as any,
      icon: 'pricetag-outline' as const,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { borderBottomColor: tierColor + '50' }]}>
          <Text style={[styles.title, { color: colors.text }]}>Perks</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PartnerFrostedCard borderColor={tierColor} style={styles.instructionCard}>
            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              Create and manage perks customers redeem with OT Points. View your public page to see how they see you.
            </Text>
          </PartnerFrostedCard>
          {items.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => { safeHaptics.selectionAsync(); router.push(item.route); }}
              activeOpacity={0.88}
            >
              <PartnerFrostedCard borderColor={tierColor} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconWrap, { backgroundColor: tierColor + '22' }]}>
                    <Ionicons name={item.icon} size={24} color={tierColor} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{item.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </PartnerFrostedCard>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  instructionCard: { padding: 16, marginBottom: 16 },
  instruction: { fontSize: 13, lineHeight: 20 },
  content: { padding: SPACE.base, paddingBottom: 32 },
  card: { padding: 16, marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  cardSub: { fontSize: 13 },
});
