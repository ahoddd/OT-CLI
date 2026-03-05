/**
 * Stamp Cards™ — Partner profile module: progress, next eligible, Scan to stamp CTA.
 * For OrbTap Universe (admin demo partner), shows a dedicated demo stamp card with "View full card".
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import { getActiveStampProgramForPartner, getStampUserState } from '../services/stampCardsApi';
import type { StampProgram } from '../constants/StampCards';
import { ORBTAP_UNIVERSE_PARTNER_ID } from '../constants/MockData';
import {
  DEMO_STAMP_PROGRAM_ORBTAP_UNIVERSE,
  DEMO_STAMP_STATE_ORBTAP_UNIVERSE,
  getDemoStampCardWithProgram,
} from '../constants/DemoStampCard';
import type { StampCardWithProgram } from '../hooks/useStampCards';

interface PartnerStampCardModuleProps {
  partnerId: string;
  partnerName?: string;
  enabled: boolean;
  /** When provided and this partner is OrbTap Universe demo, "View full card" opens the detail modal with this callback. */
  onViewCard?: (card: StampCardWithProgram) => void;
}

export function PartnerStampCardModule({ partnerId, partnerName, enabled, onViewCard }: PartnerStampCardModuleProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [program, setProgram] = useState<(StampProgram & { id: string }) | null>(null);
  const [state, setState] = useState<{ stampCount: number; lastStampAt: number | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const isOrbTapUniverse = partnerId === ORBTAP_UNIVERSE_PARTNER_ID;

  useEffect(() => {
    if (!enabled || !partnerId) {
      setLoading(false);
      return;
    }
    if (isOrbTapUniverse) {
      setProgram(DEMO_STAMP_PROGRAM_ORBTAP_UNIVERSE);
      setState({
        stampCount: DEMO_STAMP_STATE_ORBTAP_UNIVERSE.stampCount,
        lastStampAt: DEMO_STAMP_STATE_ORBTAP_UNIVERSE.lastStampAt,
      });
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getActiveStampProgramForPartner(partnerId);
      if (cancelled) return;
      if (res.success && res.program) {
        setProgram(res.program);
        const stateRes = await getStampUserState(res.program.id);
        if (cancelled) return;
        if (stateRes.success && 'state' in stateRes && stateRes.state) {
          setState({ stampCount: stateRes.state.stampCount, lastStampAt: stateRes.state.lastStampAt });
        } else {
          setState({ stampCount: 0, lastStampAt: null });
        }
      } else {
        setProgram(null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [enabled, partnerId, isOrbTapUniverse]);

  if (!enabled || loading || !program) return null;

  const stampsRequired = program.stampsRequired ?? 10;
  const cooldownHours = program.cooldownHours ?? 24;
  const nextEligible = state?.lastStampAt ? state.lastStampAt + cooldownHours * 60 * 60 * 1000 : 0;
  const canStamp = !nextEligible || Date.now() >= nextEligible;
  const progress = state?.stampCount ?? 0;

  return (
    <View style={[styles.module, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{program.name}</Text>
        <Text style={[styles.progress, { color: colors.textSecondary }]}>{progress}/{stampsRequired} stamps</Text>
      </View>
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${Math.min(100, (progress / stampsRequired) * 100)}%`, backgroundColor: program.design?.colors?.primary ?? '#3b82f6' }]} />
      </View>
      <Text style={[styles.next, { color: colors.textSecondary }]}>
        {canStamp ? 'Ready to stamp' : `Next stamp in ${Math.ceil((nextEligible - Date.now()) / (60 * 60 * 1000))}h`}
      </Text>
      <Text style={[styles.differentiator, { color: colors.textSecondary }]}>Earn stamps and unlock rewards — only in OrbTap.</Text>
      <View style={styles.ctaRow}>
        {isOrbTapUniverse && onViewCard && (
          <TouchableOpacity
            style={[styles.ctaSecondary, { borderColor: (program.design?.colors?.primary ?? '#3b82f6') + '60' }]}
            onPress={() => onViewCard(getDemoStampCardWithProgram())}
            accessibilityLabel="View full card"
            accessibilityRole="button"
          >
            <Ionicons name="card" size={20} color={program.design?.colors?.primary ?? '#3b82f6'} />
            <Text style={[styles.ctaText, { color: program.design?.colors?.primary ?? '#3b82f6' }]}>View full card</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: (program.design?.colors?.primary ?? '#3b82f6') + '22', borderColor: (program.design?.colors?.primary ?? '#3b82f6') + '60' }]}
          onPress={() => router.push('/(tabs)/scan' as any)}
          accessibilityLabel="Scan to stamp"
          accessibilityRole="button"
        >
          <Ionicons name="qr-code" size={20} color={program.design?.colors?.primary ?? '#3b82f6'} />
          <Text style={[styles.ctaText, { color: program.design?.colors?.primary ?? '#3b82f6' }]}>Scan to stamp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  module: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE.base,
    marginHorizontal: SPACE.base,
    marginVertical: SPACE.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.sm },
  title: { fontSize: 17, fontWeight: '700', flex: 1 },
  progress: { fontSize: 14, fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: SPACE.sm },
  progressFill: { height: '100%', borderRadius: 3 },
  next: { fontSize: 13, marginBottom: SPACE.xs },
  differentiator: { fontSize: 11, fontWeight: '600', marginBottom: SPACE.sm, fontStyle: 'italic' },
  ctaRow: { flexDirection: 'row', gap: SPACE.sm, flexWrap: 'wrap' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.base,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    flex: 1,
    minWidth: 140,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.base,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    flex: 1,
    minWidth: 140,
  },
  ctaText: { fontSize: 15, fontWeight: '700' },
});
