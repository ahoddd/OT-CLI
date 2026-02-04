import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSphereTierForXp, getSphereProgressToNext, type SphereTier } from '../constants/SphereLevels';

const SPHERE_GRADIENT = ['#8B5CF6', '#A78BFA', '#7C3AED'];

interface SphereXpBarProps {
  sphereXp: number;
  levelTitle?: string;
  compact?: boolean;
  showPerk?: boolean;
}

export function SphereXpBar({ sphereXp, levelTitle, compact = false, showPerk = false }: SphereXpBarProps) {
  const tier = getSphereTierForXp(sphereXp);
  const progress = getSphereProgressToNext(sphereXp);
  const title = levelTitle ?? tier.title;
  const percent = progress ? progress.progress * 100 : 100;

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        <View style={styles.compactRow}>
          <View style={[styles.compactBadge, { backgroundColor: SPHERE_GRADIENT[0] + '40' }]}>
            <Text style={styles.compactLevel}>Lv{tier.level}</Text>
          </View>
          <Text style={styles.compactTitle}>{title}</Text>
          <Text style={styles.compactXp}>{sphereXp} XP</Text>
        </View>
        <View style={styles.compactTrack}>
          <LinearGradient
            colors={SPHERE_GRADIENT as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.compactFill, { width: `${percent}%` }]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: SPHERE_GRADIENT[0] }]}>
          <Text style={styles.badgeText}>Lv{tier.level}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.xpText}>{sphereXp.toLocaleString()} XP</Text>
        </View>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={SPHERE_GRADIENT as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${percent}%` }]}
        />
      </View>
      {progress && (
        <Text style={styles.nextText}>
          Next: <Text style={styles.nextBold}>{progress.nextTitle}</Text> — {progress.nextPerk}
        </Text>
      )}
      {showPerk && <Text style={styles.perkText}>{tier.perkShort}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  badge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  headerRight: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  xpText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  track: { height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  nextText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  nextBold: { color: '#A78BFA', fontWeight: '800' },
  perkText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  compactWrap: { width: '100%' },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  compactBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  compactLevel: { fontSize: 10, fontWeight: '800', color: '#A78BFA' },
  compactTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: '#FFF' },
  compactXp: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  compactTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  compactFill: { height: '100%', borderRadius: 3 },
});
