/**
 * Partner tab: Feed hub — create posts, view commerce feed; frosted glass tiles.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { SPACE } from '../../constants/DesignTokens';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { safeHaptics } from '../../utils/safeHaptics';
import { PartnerFrostedCard } from '../../components/PartnerFrostedCard';

export default function PartnerFeedTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { partners } = usePartners();
  const { myPartner } = useMyPartner();
  const { testPartnerTier } = useEffectiveTier();
  const partner = myPartner ?? partners[0] ?? null;
  const tierColor = testPartnerTier
    ? PARTNER_TIER_COLORS[testPartnerTier]
    : (partner?.tier ? PARTNER_TIER_COLORS[partner.tier as keyof typeof PARTNER_TIER_COLORS] : PARTNER_TIER_COLORS.silver);

  const items: { label: string; sub: string; route: any; icon: 'newspaper-outline' | 'create-outline' | 'list-outline' }[] = [
    { label: 'Create post', sub: 'Commerce Feed — drops, events, products', route: '/partner/posts/create', icon: 'create-outline' },
    { label: 'My Posts', sub: 'Drafts and published posts', route: '/partner/posts', icon: 'list-outline' },
    { label: 'Commerce Feed', sub: 'View feed as customers see it', route: '/feed', icon: 'newspaper-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { borderBottomColor: tierColor + '50' }]}>
          <Text style={[styles.title, { color: colors.text }]}>Feed</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PartnerFrostedCard borderColor={tierColor} style={styles.instructionCard}>
            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              Post drops, events, and products to the Commerce Feed. Members see your posts when they open the app.
            </Text>
          </PartnerFrostedCard>
          {flags.isOrbFeedEnabled && flags.isOrbFeedPartnerComposerEnabled
            ? items.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => { safeHaptics.selectionAsync(); router.push(item.route as any); }}
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
              ))
            : (
              <PartnerFrostedCard borderColor={tierColor} style={styles.card}>
                <Text style={[styles.cardLabel, { color: colors.text }]}>Feed</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Partner posts are not enabled. Create posts from Command when enabled.</Text>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)/partner-dashboard' as any)}
                >
                  <Text style={styles.btnText}>Go to Dashboard</Text>
                </TouchableOpacity>
              </PartnerFrostedCard>
            )}
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
  btn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' },
  btnText: { color: '#000', fontWeight: '700' },
});
