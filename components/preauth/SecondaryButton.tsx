/**
 * Pre-auth secondary button — outline/ghost. Used for "I have an account" etc.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { PREAUTH } from '../../constants/PreAuthTheme';

interface SecondaryButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function SecondaryButton({
  onPress,
  label,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.88}
      style={[styles.btn, disabled && styles.btnDisabled, style]}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      <Text style={[styles.label, textStyle]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: PREAUTH.minButtonHeight,
    borderRadius: PREAUTH.radiusButton,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  btnDisabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '600', color: PREAUTH.textSecondary },
});
