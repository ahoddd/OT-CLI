import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, ScrollViewProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../hooks/useTheme';

interface KitScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
  /** ScrollView props when scroll=true */
  scrollProps?: ScrollViewProps;
  /** Extra bottom padding (in addition to safe area). Use token spacing. */
  bottomPadding?: number;
}

export function KitScreen({ children, style, scroll = false, scrollProps, bottomPadding }: KitScreenProps) {
  const { colors, isDark, tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const paddingBottom = (bottomPadding ?? tokens.spacing.xl) + insets.bottom;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { paddingBottom }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1 },
});
