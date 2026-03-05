import React, { memo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { TAP_TARGET_MIN } from '../../constants/DesignTokens';
import { safeHaptics } from '../../utils/safeHaptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface KitButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Ionicons icon name rendered to the left of the title. */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Ionicons icon name rendered to the right of the title. */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** Stretch to fill parent width. */
  fullWidth?: boolean;
  /** Fire haptic feedback on press. Default true for primary/destructive. */
  haptic?: boolean;
  style?: ViewStyle;
}

function KitButtonInner({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  haptic,
  style,
}: KitButtonProps) {
  const { colors, tokens } = useTheme();

  const isGhost = variant === 'ghost';
  const isDestructive = variant === 'destructive';
  const isSecondary = variant === 'secondary';

  const shouldHaptic = haptic ?? (variant === 'primary' || variant === 'destructive');

  const bg =
    isDestructive ? (colors.error ?? '#ef4444') :
    isGhost       ? 'transparent' :
    isSecondary   ? (colors.surfaceHighlight ?? colors.surface) :
    colors.primary;

  const labelColor =
    isGhost      ? colors.primary :
    isSecondary  ? colors.text :
    '#fff';

  const borderColor = isSecondary ? colors.border : isGhost ? colors.primary : 'transparent';

  const vertPad =
    size === 'sm' ? tokens.spacing.sm :
    size === 'lg' ? tokens.spacing.lg :
    tokens.spacing.md;

  const fontSize =
    size === 'sm' ? 13 :
    size === 'lg' ? 17 :
    15;

  const iconSize =
    size === 'sm' ? 15 :
    size === 'lg' ? 20 :
    17;

  const handlePress = () => {
    if (shouldHaptic) safeHaptics.selectionAsync();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.78}
      style={[
        styles.btn,
        {
          backgroundColor: disabled ? (colors.surfaceHighlight ?? colors.border) : bg,
          borderWidth: isSecondary || isGhost ? 1 : 0,
          borderColor,
          paddingVertical: vertPad,
          paddingHorizontal: tokens.spacing.base,
          borderRadius: tokens.radius.base,
          minHeight: TAP_TARGET_MIN,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost || isSecondary ? colors.primary : '#fff'} size="small" />
      ) : (
        <View style={styles.inner}>
          {leftIcon != null && (
            <Ionicons name={leftIcon} size={iconSize} color={labelColor} style={styles.leftIcon} />
          )}
          <Text style={[styles.text, { color: labelColor, fontSize }]}>{title}</Text>
          {rightIcon != null && (
            <Ionicons name={rightIcon} size={iconSize} color={labelColor} style={styles.rightIcon} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIcon: { marginRight: 7 },
  rightIcon: { marginLeft: 7 },
});

export const KitButton = memo(KitButtonInner);
