/**
 * Tonight — Real-time view of what's open and active tonight.
 * Powered by partner hours + OrbPilot active windows.
 * Sprint 19: Phase C dead-end fix — replaced redirect with real screen.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { usePartners } from '../context/PartnersContext';
import { PartnerGridCard } from '../components/PartnerGridCard';
import { COLORS } from '../constants/Colors';
import { safeHaptics } from '../utils/safeHaptics';
import type { Partner } from '../constants/MockData';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Returns true if the partner hours string mentions today's day or is open late. */
function isOpenTonight(partner: Partner): boolean {
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const hours = (partner as any).hours as string | undefined;
  if (!hours) return false;
  const h = hours.toLowerCase();
  // Check for day name or common "open daily" / "every day" patterns
  if (h.includes(dayName.toLowerCase())) return true;
  if (h.includes('daily') || h.includes('every day') || h.includes('mon–sun') || h.includes('mon-sun')) return true;
  // Friday/Saturday nights — check for weekend terms
  if (now.getDay() === 5 || now.getDay() === 6) {
    if (h.includes('weekend') || h.includes('fri') || h.includes('sat')) return true;
  }
  return false;
}

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

const isEvening = new Date().getHours() >= 17;

export default function TonightScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { getGridPartnersOrdered } = usePartners();

  const tonightPartners = useMemo(() => {
    const all = getGridPartnersOrdered();
    const open = all.filter(isOpenTonight);
    // Sort gold/premium first, then alphabetically
    return open.sort((a, b) => {
      const tierRank = (t: string) => t === 'gold' ? 0 : t === 'silver' ? 1 : 2;
      const diff = tierRank(a.tier) - tierRank(b.tier);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [getGridPartnersOrdered]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tonight's Best</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{formatDate()}</Text>
        </View>
        <TouchableOpacity
          style={styles.pulseBtn}
          onPress={() => { safeHaptics.selectionAsync(); router.push('/pulse' as any); }}
        >
          <Ionicons name="pulse" size={22} color={themeGold} />
        </TouchableOpacity>
      </View>

      {/* Evening CTA pill */}
      {isEvening && tonightPartners.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.eveningPill, { backgroundColor: themeGold + '18', borderColor: themeGold + '44' }]}>
          <Ionicons name="flame" size={16} color={themeGold} />
          <Text style={[styles.eveningPillText, { color: themeGold }]}>
            {Math.min(tonightPartners.length, 10)} spots are live right now
          </Text>
        </Animated.View>
      )}

      {/* Partner list or empty state */}
      {tonightPartners.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(500)} style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="moon-outline" size={48} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No active spots tonight</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Check back at 5pm — Tonight's Top 10 drops every evening.
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/pulse' as any); }}
          >
            <Ionicons name="pulse" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>See OrbPulse instead</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <FlatList
          data={tonightPartners}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            // CLOSING SOON: show badge if partner has closingHour within 2h of now
            const nowHour = new Date().getHours();
            const closingHour = (item as any).closingHour as number | undefined;
            const isClosingSoon = closingHour != null && closingHour > nowHour && closingHour - nowHour <= 2;
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).duration(300).springify()} style={{ position: 'relative' }}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => {
                    safeHaptics.selectionAsync();
                    router.push({ pathname: '/partner/[id]', params: { id: item.id } } as any);
                  }}
                >
                  <PartnerGridCard partner={item} />
                  {isClosingSoon && (
                    <View style={styles.closingSoonBadge}>
                      <Ionicons name="time-outline" size={11} color="#92400e" />
                      <Text style={styles.closingSoonText}>CLOSING SOON</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          }}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  closingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  closingSoonText: { fontSize: 10, fontWeight: '800', color: '#92400e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 1 },
  pulseBtn: { padding: 4 },
  eveningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  eveningPillText: { fontSize: 14, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
