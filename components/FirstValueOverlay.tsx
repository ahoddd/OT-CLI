/**
 * First-value moment after onboarding: show nearest partner or generic CTA.
 * Dismiss on tap then navigate to tabs.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/Colors';
import { PREAUTH } from '../constants/PreAuthTheme';

export interface FirstValueOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  isPartner: boolean;
  /** When set, show "Your nearest partner: [name] — X mi" */
  partnerName?: string | null;
  distanceLabel?: string | null;
}

export function FirstValueOverlay({
  visible,
  onDismiss,
  isPartner,
  partnerName,
  distanceLabel,
}: FirstValueOverlayProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const hasNearest = !isPartner && partnerName && distanceLabel;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
        accessibilityLabel="Tap to continue"
        accessibilityRole="button"
      >
        <View style={[styles.card, { marginTop: insets.top + 40, marginBottom: insets.bottom + 40 }]}>
          <View style={[styles.iconWrap, { backgroundColor: COLORS.neonBlue[0] + '22' }]}>
            <Ionicons name={hasNearest ? 'location' : 'map'} size={36} color={COLORS.neonBlue[0]} />
          </View>
          <Text style={styles.title}>
            {hasNearest ? 'Your nearest partner' : 'You\'re all set'}
          </Text>
          <Text style={styles.body}>
            {hasNearest
              ? `${partnerName} — ${distanceLabel}. Tap to see on the map.`
              : 'Tap the map to discover partners near you. Scan at any venue to earn your first OT Points.'}
          </Text>
          <Text style={styles.cta}>Tap anywhere to continue</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: PREAUTH.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    padding: 24,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { maxWidth: 360, alignSelf: 'center' as const } : {}),
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: PREAUTH.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: PREAUTH.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  cta: {
    fontSize: 12,
    fontWeight: '600',
    color: PREAUTH.primary,
    letterSpacing: 0.5,
  },
});
