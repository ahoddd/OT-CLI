import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/** Capitalize first character if it's a letter (professional look). */
function capitalizeFirstLetter(text: string): string {
  if (!text || text.length === 0) return text;
  if (/^[a-z]/.test(text)) return text[0].toUpperCase() + text.slice(1);
  return text;
}

interface KitInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  /** When true (default), first letter of input is auto-capitalized. */
  capitalizeFirst?: boolean;
}

export function KitInput({ label, error, onChangeText, capitalizeFirst: doCapitalize = true, ...rest }: KitInputProps) {
  const { colors, tokens } = useTheme();
  const handleChange = React.useCallback(
    (text: string) => {
      const value = doCapitalize ? capitalizeFirstLetter(text) : text;
      onChangeText?.(value);
    },
    [onChangeText, doCapitalize]
  );
  return (
    <View style={[styles.wrap, { marginBottom: tokens.spacing.md }]}>
      {label != null && (
        <Text style={[styles.label, { color: colors.textSecondary, marginBottom: tokens.spacing.xs }]}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        autoCapitalize={doCapitalize ? 'sentences' : undefined}
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceHighlight,
            borderColor: error ? (colors.error ?? colors.primary) : colors.border,
            color: colors.text,
            padding: tokens.spacing.md,
            borderRadius: tokens.radius.md,
          },
        ]}
        {...rest}
        onChangeText={handleChange}
      />
      {error != null && (
        <Text style={[styles.error, { color: colors.error ?? colors.primary, marginTop: tokens.spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, fontSize: 16 },
  error: { fontSize: 12 },
});
