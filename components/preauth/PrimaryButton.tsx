/**
 * Pre-auth primary CTA — electric blue, full width. Used on landing, login, signup.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PREAUTH } from '../../constants/PreAuthTheme';

interface PrimaryButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function PrimaryButton({
  onPress,
  label,
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  textStyle,
  accessibilityLabel,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
      style={[
        styles.btn,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color="#000" />
      ) : (
        <>
          {icon != null && <Ionicons name={icon} size={20} color="#000" style={styles.iconLeft} />}
          <Text style={[styles.label, textStyle]} numberOfLines={1}>{label}</Text>
          {iconRight != null && <Ionicons name={iconRight} size={18} color="#000" style={styles.iconRight} />}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: PREAUTH.primary,
    minHeight: PREAUTH.minButtonHeight,
    borderRadius: PREAUTH.radiusButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  btnDisabled: { opacity: 0.5 },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  label: { fontSize: 16, fontWeight: '700', color: '#000' },
});
