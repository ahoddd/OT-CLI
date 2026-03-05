/**
 * Pre-auth input — glass style, same border/radius as cards. For login/signup.
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { PREAUTH } from '../../constants/PreAuthTheme';
import { SPACE } from '../../constants/DesignTokens';

interface PreAuthInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
}

export function PreAuthInput({ label, error, ...rest }: PreAuthInputProps) {
  return (
    <View style={styles.wrap}>
      {label != null && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={PREAUTH.textMuted}
        style={[styles.input, error ? styles.inputError : null]}
        {...rest}
      />
      {error != null && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACE.md },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: PREAUTH.textSecondary,
    marginBottom: SPACE.xs,
  },
  input: {
    backgroundColor: PREAUTH.inputBackground,
    borderWidth: 1,
    borderColor: PREAUTH.inputBorder,
    borderRadius: PREAUTH.radiusButton,
    padding: SPACE.md,
    fontSize: 16,
    color: PREAUTH.text,
  },
  inputError: { borderColor: PREAUTH.primary },
  error: { fontSize: 12, color: PREAUTH.primary, marginTop: SPACE.xs },
});
