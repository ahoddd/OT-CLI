import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function ScreenWrapper({ children, style, title, headerLeft, headerRight }: ScreenWrapperProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={['top']}>
      <StatusBar style="light" />
      {title != null ? (
        <View style={styles.header}>
          {headerLeft ?? null}
          <Text style={styles.headerTitle}>{title}</Text>
          {headerRight ?? null}
        </View>
      ) : null}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
