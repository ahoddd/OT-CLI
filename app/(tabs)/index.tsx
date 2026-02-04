import React, { useState, Suspense } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList, SafeAreaView, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { OrbSheet } from '../../components/OrbSheet';
import { TierLegend } from '../../components/TierLegend';
import { FlashDrop } from '../../components/FlashDrop';
import MasterDirectory from '../../components/MasterDirectory';
import { MapErrorBoundary } from '../../components/MapErrorBoundary';
import { Partner, MOCK_PERKS, getGridPartnersOrdered } from '../../constants/MockData';
import { PerkGridModal } from '../../components/PerkGridModal';
import { PremiumPerkTile } from '../../components/PremiumPerkTile';
import type { PerkSlotType } from '../../components/PremiumPerkTile';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';
import { useGame } from '../../context/GameContext';
import { useWallet } from '../../hooks/useWallet';
import { usePulse } from '../../hooks/usePulse';
import { usePreferences } from '../../hooks/usePreferences';
import { useOrbScope, getOrbScopeActionRoute } from '../../hooks/useOrbScope';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { OrbScopeCard } from '../../components/OrbScopeCard';
import { COLORS } from '../../constants/Colors';

const isExpoGo = Constants.appOwnership === 'expo';
const LazyOrbTapMap = React.lazy(() =>
  import('../../components/OrbTapMap').then((m) => ({ default: m.OrbTapMap }))
);

export default function MapScreenEntry() {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [gridModalPartner, setGridModalPartner] = useState<Partner | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [isDirectoryVisible, setIsDirectoryVisible] = useState(false);
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { flags } = useFlags();
  const { balance } = useWallet();
  const { incrementPoints } = useGame();
  const { liveTiles } = usePulse();
  const { prefs } = usePreferences();
  const { daily: orbScopeDaily, streak: orbScopeStreak, recordView: orbScopeRecordView, loading: orbScopeLoading } = useOrbScope();
  const orbScopeEnabled = Boolean(flags.isOrbScopeEnabled && prefs.orbScopeEnabled);

  // If map is disabled via admin, force grid
  const effectiveViewMode = flags.mapProvider === 'none' ? 'grid' : viewMode;

  const toggleView = () => {
    setViewMode(prev => prev === 'map' ? 'grid' : 'map');
  };

  const gridPartners = getGridPartnersOrdered();
  const getPartnerPerks = (partnerId: string) => MOCK_PERKS.filter((p) => p.partnerId === partnerId);
  const getSlotType = (index: number): PerkSlotType => {
    if (index === 0) return 'featured';
    if (index === 1) return 'sponsored';
    return null;
  };
  const renderGridItem = ({ item, index }: { item: Partner; index: number }) => {
    const perks = getPartnerPerks(item.id);
    const primaryPerk = perks[0] ?? null;
    return (
      <PremiumPerkTile
        partner={item}
        primaryPerk={primaryPerk}
        onPress={() => setGridModalPartner(item)}
        slotType={getSlotType(index)}
      />
    );
  };

  const gridView = (
    <View style={styles.gridContainer}>
      <View style={styles.gridHeaderRow}>
        <Text style={[styles.gridHeader, { color: colors.textSecondary }]}>NEARBY ORBS</Text>
        <Text style={[styles.gridSubHeader, { color: colors.textSecondary }]}>Featured · Sponsored · Tap any tile</Text>
      </View>
      <FlatList
        data={gridPartners}
        keyExtractor={item => item.id}
        renderItem={renderGridItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.partnerApplyCta, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/partner-apply' as any)}
          >
            <Ionicons name="business" size={20} color={colors.textSecondary} />
            <View style={styles.partnerApplyTextWrap}>
              <Text style={[styles.partnerApplyTitle, { color: colors.text }]}>Partners: Apply for Featured or Sponsored</Text>
              <Text style={[styles.partnerApplySub, { color: colors.textSecondary }]}>Guided tutorials · Get prime placement</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />
    </View>
  );

  const mapContent = isExpoGo ? (
    gridView
  ) : (
    <MapErrorBoundary fallback={gridView}>
      <Suspense fallback={gridView}>
        <LazyOrbTapMap
          onSelectPartner={(partner) => {
            setSelectedPartner(partner);
            incrementPoints();
          }}
          selectedId={selectedPartner?.id || null}
        />
      </Suspense>
    </MapErrorBoundary>
  );

  const mapView = (
    <>
      {mapContent}
      <FlashDrop />
      {selectedPartner && (
        <OrbSheet
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onSelectPartner={setSelectedPartner}
        />
      )}
      <TierLegend />
    </>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Single header row: no overlap, clear hierarchy */}
        <View style={[styles.headerBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={[styles.pointsBadge, { backgroundColor: colors.surface }]}>
            <OTPointsBadge amount={balance} size={28} label="pts" compact textColor={colors.text} />
          </View>
          <View style={styles.headerSpacer} />
          {flags.isOrbPulseEnabled && liveTiles.length > 0 && (
            <TouchableOpacity
              style={styles.headerSeeAllWrap}
              onPress={() => router.push('/pulse' as any)}
              hitSlop={12}
            >
              <Text style={[styles.headerSeeAll, { color: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.neonBlue?.[0] ?? '#60a5fa'} />
            </TouchableOpacity>
          )}
          {flags.mapProvider !== 'none' && (
            <View style={styles.toggleContainer}>
              <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.blurWrapper}>
                <TouchableOpacity onPress={toggleView} style={styles.toggleBtn}>
                  <Ionicons
                    name={effectiveViewMode === 'map' ? 'grid' : 'map'}
                    size={22}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </BlurView>
            </View>
          )}
          <TouchableOpacity style={styles.menuButton} onPress={() => setIsDirectoryVisible(true)}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* OrbScope: Daily Vibe — one card, only when enabled */}
        {orbScopeEnabled && !orbScopeLoading && orbScopeDaily && (
          <View style={[styles.orbScopeWrap, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <OrbScopeCard
              daily={orbScopeDaily}
              streak={orbScopeStreak}
              onDoIt={() => router.push(getOrbScopeActionRoute(orbScopeDaily.actionType) as any)}
              onView={orbScopeRecordView}
              shareCardEnabled={flags.isOrbScopeShareCardEnabled}
              streakEnabled={flags.isOrbScopeStreakEnabled}
            />
          </View>
        )}

        {/* Live Pulse strip: below header, no overlap */}
        {flags.isOrbPulseEnabled && liveTiles.length > 0 && (
          <View style={[styles.livePulseWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.livePulseTitle, { color: colors.text }]}>Live Pulse</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.livePulseScroll}
            >
              {liveTiles.slice(0, 6).map((tile) => (
                <TouchableOpacity
                  key={tile.id}
                  style={[styles.livePulseTile, { borderColor: colors.border }]}
                  onPress={() => {
                    if (tile.type === 'partner') {
                      router.push({ pathname: '/partner/[id]', params: { id: tile.entityId } } as any);
                    } else if (tile.drop) {
                      router.push({ pathname: '/partner/[id]', params: { id: tile.drop!.partnerId } } as any);
                    }
                  }}
                >
                  <Text style={[styles.livePulseTileTitle, { color: colors.text }]} numberOfLines={2}>{tile.title}</Text>
                  <Text style={styles.livePulseWhy}>{tile.whyTrending}</Text>
                  <View style={styles.livePulseTrust}>
                    <Ionicons name="shield-checkmark" size={12} color="#4ade80" />
                    <Text style={styles.livePulseTrustText}>Verified Momentum</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Map or grid: takes remaining space, no overlap */}
        {effectiveViewMode === 'map' ? mapView : gridView}
      </View>
      <MasterDirectory visible={isDirectoryVisible} onClose={() => setIsDirectoryVisible(false)} />
      {gridModalPartner && (
        <PerkGridModal
          visible={!!gridModalPartner}
          partner={gridModalPartner}
          onClose={() => setGridModalPartner(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  pointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSpacer: { flex: 1, minWidth: 8 },
  headerSeeAllWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerSeeAll: { fontSize: 13, fontWeight: '600', marginRight: 2 },
  toggleContainer: { borderRadius: 20, overflow: 'hidden', marginRight: 8 },
  blurWrapper: { padding: 8 },
  toggleBtn: { alignItems: 'center', justifyContent: 'center' },
  menuButton: { padding: 8 },
  orbScopeWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  orbPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointsLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  pointsValue: { fontSize: 18, fontWeight: '800' },
  gridContainer: { flex: 1, paddingTop: 20, paddingHorizontal: 16 },
  gridHeaderRow: { marginBottom: 14 },
  gridHeader: { fontWeight: '800', letterSpacing: 2, fontSize: 12 },
  gridSubHeader: { fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.8 },
  listContent: { paddingBottom: 100 },
  row: { gap: 10, marginBottom: 10 },
  partnerApplyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 24,
  },
  partnerApplyTextWrap: { flex: 1, marginLeft: 12 },
  partnerApplyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  partnerApplySub: { fontSize: 11, fontWeight: '600' },
  livePulseWrap: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  livePulseTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  livePulseScroll: { paddingRight: 16, gap: 10 },
  livePulseTile: {
    width: 160,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  livePulseTileTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  livePulseWhy: { color: '#4ade80', fontSize: 11, marginBottom: 6 },
  livePulseTrust: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  livePulseTrustText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' },
});
