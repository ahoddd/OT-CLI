/**
 * OrbOpportunities — Browse published opportunities (user).
 * Gated by isOrbOpportunitiesEnabled.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { useOpportunities, type SortOption } from '../../hooks/useOpportunities';
import { useAuth } from '../../context/AuthContext';
import { OPPORTUNITY_TYPE_LABELS } from '../../constants/Opportunities';
import type { Opportunity, OpportunityType } from '../../constants/Opportunities';
import { COLORS } from '../../constants/Colors';
import { LIST_OPTIMIZATION } from '../../constants/DesignTokens';
import { PageHero } from '../../components/PageHero';
import { GuidedTutorialOverlay } from '../../components/GuidedTutorialOverlay';
import { useTutorial } from '../../context/TutorialContext';
import { useI18n } from '../../context/I18nContext';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function compensationLabel(opp: Opportunity): string {
  const c = opp.compensation;
  if (c.type === 'pay_range' && c.payMin != null && c.payMax != null) return `$${c.payMin}–${c.payMax}/hr`;
  if (c.type === 'perk_value' && c.perkValue) return c.perkValue;
  if (c.type === 'fixed' && c.fixedLabel) return c.fixedLabel;
  return 'See details';
}

export default function OpportunitiesListScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<SortOption>('newest');
  const [typeFilter, setTypeFilter] = useState<OpportunityType | null>(null);
  const { opportunities, loading, refresh } = useOpportunities({
    sort,
    type: typeFilter ?? undefined,
  });
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();
  const [showOpportunitiesTutorial, setShowOpportunitiesTutorial] = useState(false);

  React.useEffect(() => {
    if (shouldShowTutorial('opportunities')) setShowOpportunitiesTutorial(true);
  }, [shouldShowTutorial]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (!flags.isOrbOpportunitiesEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Opportunities</Text>
        </View>
        <GuidedTutorialOverlay
          visible={showOpportunitiesTutorial}
          tutorialId="opportunities"
          onClose={() => { markCompleted('opportunities'); setShowOpportunitiesTutorial(false); }}
          onSkipAll={() => { setSkipAllTutorials(); setShowOpportunitiesTutorial(false); }}
        />
        <View style={styles.offState}>
          <Ionicons name="briefcase-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.offText, { color: colors.text }]}>OrbOpportunities is off</Text>
          <Text style={[styles.offSub, { color: colors.textSecondary }]}>Enable in Admin Hub.</Text>
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
        <Text style={[styles.title, { color: colors.text }]}>Opportunities</Text>
        <TouchableOpacity
          onPress={() => user && router.push('/opportunities/my-applications' as any)}
          style={styles.myAppsBtn}
        >
          <Ionicons name="list" size={22} color={colors.text} />
          <Text style={[styles.myAppsText, { color: colors.text }]}>My applications</Text>
        </TouchableOpacity>
      </View>

      <GuidedTutorialOverlay
        visible={showOpportunitiesTutorial}
        tutorialId="opportunities"
        onClose={() => { markCompleted('opportunities'); setShowOpportunitiesTutorial(false); }}
        onSkipAll={() => { setSkipAllTutorials(); setShowOpportunitiesTutorial(false); }}
      />

      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.toolbarLabel, { color: colors.textSecondary }]}>Sort</Text>
        {(['newest', 'soonest'] as SortOption[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sortPill, sort === s && { backgroundColor: themeGold }, { borderColor: colors.border }]}
            onPress={() => setSort(s)}
          >
            <Text style={[styles.sortPillText, { color: sort === s ? '#000' : colors.text }]}>{s === 'newest' ? 'Newest' : 'Soonest'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={opportunities}
        keyExtractor={(o) => o.id}
        contentContainerStyle={[styles.list, { paddingBottom: 24 + insets.bottom }]}
        removeClippedSubviews={LIST_OPTIMIZATION.removeClippedSubviews}
        maxToRenderPerBatch={LIST_OPTIMIZATION.maxToRenderPerBatch}
        windowSize={LIST_OPTIMIZATION.windowSize}
        initialNumToRender={LIST_OPTIMIZATION.initialNumToRender}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}
        ListHeaderComponent={
          <PageHero
            icon="briefcase"
            iconColor={themeGold}
            title="Real work, verified pay"
            description="Partners post one-off gigs and roles. Apply in one tap; completion is verified so you get credit and proof. Check My applications for status."
            trustLine="Verified completion · Proof-backed receipts"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No published opportunities right now.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/opportunities/[id]', params: { id: item.id } } as any)}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.typePill, { backgroundColor: themeGold + '25' }]}>
                <Text style={[styles.typePillText, { color: themeGold }]}>{OPPORTUNITY_TYPE_LABELS[item.type]}</Text>
              </View>
            </View>
            <Text style={[styles.cardComp, { color: colors.textSecondary }]}>{compensationLabel(item)}</Text>
            <Text style={[styles.cardDate, { color: colors.textSecondary }]}>Starts {formatDate(item.startAt)}</Text>
            {item.requirementsTags.length > 0 && (
              <Text style={[styles.cardTags, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.requirementsTags.join(' · ')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
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
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  myAppsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  myAppsText: { fontSize: 13, fontWeight: '600' },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  toolbarLabel: { fontSize: 12, fontWeight: '600', marginRight: 8 },
  sortPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  sortPillText: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  typePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typePillText: { fontSize: 11, fontWeight: '700' },
  cardComp: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardDate: { fontSize: 12, marginBottom: 4 },
  cardTags: { fontSize: 11 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  offSub: { fontSize: 14, marginTop: 4 },
});
