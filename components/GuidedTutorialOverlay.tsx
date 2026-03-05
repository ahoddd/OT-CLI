/**
 * Guided tutorial overlay — one step at a time, Skip / Skip all.
 * Used on first visit and from Settings > Tutorials replay.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';
import { getTutorialById, type TutorialDef } from '../constants/Tutorials';

interface GuidedTutorialOverlayProps {
  visible: boolean;
  tutorialId: string;
  onClose: () => void;
  onSkipAll?: () => void;
  /** When true, "Skip" only closes this tutorial (replay from Settings). */
  replayMode?: boolean;
}

export function GuidedTutorialOverlay({
  visible,
  tutorialId,
  onClose,
  onSkipAll,
  replayMode = false,
}: GuidedTutorialOverlayProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);

  const tutorial = getTutorialById(tutorialId);
  const step = tutorial?.steps[stepIndex];
  const isLastStep = tutorial && stepIndex === tutorial.steps.length - 1;

  useEffect(() => {
    if (visible) setStepIndex(0);
  }, [visible, tutorialId]);

  if (!tutorial) return null;

  const handleNext = () => {
    if (isLastStep) onClose();
    else setStepIndex((i) => i + 1);
  };

  const handleSkip = () => {
    onClose();
  };

  const handleSkipAll = () => {
    onSkipAll?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleSkip}>
        <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.header}>
              <View style={[styles.dotRow, { marginBottom: 8 }]}>
                {tutorial.steps.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i === stepIndex ? COLORS.neonBlue[0] : colors.border },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>{step?.title ?? ''}</Text>
            </View>
            <Text style={[styles.stepBody, { color: colors.textSecondary }]}>{step?.body ?? ''}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: COLORS.neonBlue[0] }]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>{isLastStep ? 'Done' : 'Next'}</Text>
              </TouchableOpacity>
              <View style={styles.secondaryRow}>
                <TouchableOpacity onPress={handleSkip} style={styles.textBtn}>
                  <Text style={[styles.textBtnLabel, { color: colors.textSecondary }]}>
                    {replayMode ? 'Close' : 'Skip this tutorial'}
                  </Text>
                </TouchableOpacity>
                {!replayMode && onSkipAll && (
                  <TouchableOpacity onPress={handleSkipAll} style={styles.textBtn}>
                    <Text style={[styles.textBtnLabel, { color: colors.textSecondary }]}>Skip all tutorials</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  header: {},
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stepTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stepBody: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  actions: { marginTop: 24 },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  secondaryRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
  textBtn: { padding: 8 },
  textBtnLabel: { fontSize: 13 },
});
