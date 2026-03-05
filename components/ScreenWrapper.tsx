import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../hooks/useTheme';
import { SPACE } from '../constants/DesignTokens';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
}

function ScreenWrapperInner({ children, style, title, headerLeft, headerRight }: ScreenWrapperProps) {
  const { colors, isDark, typography } = useTheme();
  const headerTitleStyle = {
    ...typography.heading,
    color: colors.text,
    letterSpacing: 0.3,
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {title != null ? (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          {headerLeft ?? null}
          <Text style={[styles.headerTitle, headerTitleStyle]} numberOfLines={1}>{title}</Text>
          {headerRight ?? null}
        </View>
      ) : null}
      {children}
    </SafeAreaView>
  );
}

export const ScreenWrapper = memo(ScreenWrapperInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.lg,
    borderBottomWidth: 1,
    gap: SPACE.md,
    minHeight: 56,
  },
  headerTitle: {
    flex: 1,
  },
});
