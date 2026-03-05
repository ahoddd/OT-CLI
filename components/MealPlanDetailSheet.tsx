/**
 * MealPlanDetailSheet — post-fuse plan steps screen.
 * Step 1: Navigate, Step 2: QR Check-in, Step 3: Leave verified review.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { MEAL_TYPE_LABELS, formatCents, type MealPlan, type MealProposal } from '../constants/MealProposals';
import { SPACE, RADIUS } from '../constants/DesignTokens';

interface MealPlanDetailSheetProps {
  plan: MealPlan | null;
  proposal: MealProposal | null;
  visible: boolean;
  onClose: () => void;
  onStartNavigation: () => void;
  onCheckIn: () => void;
}

export function MealPlanDetailSheet({ plan, proposal, visible, onClose, onStartNavigation, onCheckIn }: MealPlanDetailSheetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  if (!plan || !proposal) return null;

  const scopeLabel = plan.scope === 'SPHERE' ? 'Sphere Plan' : 'Solo Plan';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.headerRow}>
            <Ionicons name="flash" size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Meal Plan</Text>
            <View style={[styles.scopeBadge, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.scopeText, { color: colors.primary }]}>{scopeLabel}</Text>
            </View>
          </View>

          <Text style={[styles.proposalTitle, { color: colors.text }]}>{proposal.title}</Text>
          <Text style={[styles.partnerName, { color: colors.textSecondary }]}>{proposal.partnerName} · {MEAL_TYPE_LABELS[proposal.mealType]}</Text>

          <View style={[styles.costRow, { backgroundColor: colors.primary + '0c', borderColor: colors.primary + '33' }]}>
            <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Party of {plan.partySizeChosen} · Est. total</Text>
            <Text style={[styles.costValue, { color: colors.primary }]}>{formatCents(plan.budgetCents)}</Text>
          </View>

          {/* Steps */}
          <View style={styles.stepsSection}>
            {plan.steps.map((step, i) => {
              const icon = step.type === 'NAVIGATE_TO_PARTNER' ? 'navigate'
                : step.type === 'QR_REDEEM' ? 'qr-code'
                : step.type === 'DROP_RESERVE' ? 'bookmark'
                : 'star';
              return (
                <View key={i} style={[styles.stepRow, { borderColor: colors.border }]}>
                  <View style={[styles.stepIcon, { backgroundColor: step.completed ? '#22c55e22' : colors.primary + '14' }]}>
                    <Ionicons
                      name={step.completed ? 'checkmark-circle' : (icon as any)}
                      size={22}
                      color={step.completed ? '#22c55e' : colors.primary}
                    />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, { color: colors.text }]}>Step {i + 1}</Text>
                    <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{step.label}</Text>
                  </View>
                  {!step.completed && i === 0 && (
                    <TouchableOpacity style={[styles.stepCta, { backgroundColor: colors.primary }]} onPress={onStartNavigation}>
                      <Text style={styles.stepCtaText}>Go</Text>
                    </TouchableOpacity>
                  )}
                  {!step.completed && step.type === 'QR_REDEEM' && (
                    <TouchableOpacity style={[styles.stepCta, { backgroundColor: colors.primary }]} onPress={onCheckIn}>
                      <Text style={styles.stepCtaText}>Scan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {plan.status === 'COMPLETED' && (
            <View style={[styles.completedBanner, { backgroundColor: '#22c55e22', borderColor: '#22c55e44' }]}>
              <Ionicons name="checkmark-done-circle" size={24} color="#22c55e" />
              <Text style={[styles.completedText, { color: '#22c55e' }]}>Plan completed! Check your proof receipt.</Text>
            </View>
          )}

          <View style={styles.ctaRow}>
            {plan.status === 'ACTIVE' && (
              <TouchableOpacity
                style={[styles.primaryCta, { backgroundColor: colors.primary }]}
                onPress={onStartNavigation}
              >
                <Ionicons name="navigate" size={18} color="#000" />
                <Text style={styles.primaryCtaText}>Start Now</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.secondaryCta, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryCtaText, { color: colors.text }]}>
                {plan.status === 'COMPLETED' ? 'Done' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, borderWidth: 1, borderBottomWidth: 0, padding: SPACE.xl, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: SPACE.base },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  scopeBadge: { paddingVertical: 3, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs },
  scopeText: { fontSize: 11, fontWeight: '700' },
  proposalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  partnerName: { fontSize: 13, marginBottom: SPACE.base },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACE.base, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACE.lg },
  costLabel: { fontSize: 13, fontWeight: '600' },
  costValue: { fontSize: 20, fontWeight: '800' },
  stepsSection: { marginBottom: SPACE.lg },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.md, borderBottomWidth: 1 },
  stepIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: SPACE.base },
  stepContent: { flex: 1 },
  stepLabel: { fontSize: 12, fontWeight: '700' },
  stepDesc: { fontSize: 13, marginTop: 1 },
  stepCta: { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.base, borderRadius: RADIUS.sm },
  stepCtaText: { color: '#000', fontSize: 13, fontWeight: '800' },
  completedBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, padding: SPACE.base, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACE.base },
  completedText: { fontSize: 13, fontWeight: '700', flex: 1 },
  ctaRow: { flexDirection: 'row', gap: SPACE.sm },
  primaryCta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.md },
  primaryCtaText: { color: '#000', fontSize: 15, fontWeight: '800' },
  secondaryCta: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1 },
  secondaryCtaText: { fontSize: 15, fontWeight: '700' },
});
