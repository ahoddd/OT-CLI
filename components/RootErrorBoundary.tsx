/**
 * Global error boundary — catches unhandled React errors and shows a recovery screen
 * instead of a blank/crash screen. Uses fixed dark theme so it renders even if context fails.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { reportError } from '../services/analytics';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  retryKey: number;
}

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) console.error('RootErrorBoundary caught:', error?.message ?? error, errorInfo?.componentStack);
    reportError(error, { componentStack: errorInfo?.componentStack });
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, retryKey: prev.retryKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning" size={48} color={COLORS.danger} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>We've hit a snag. Tap below to try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry} accessibilityLabel="Try again" accessibilityRole="button">
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return <View key={this.state.retryKey} style={{ flex: 1 }}>{this.props.children}</View>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#0a0a0f',
  },
  iconWrap: {
    backgroundColor: COLORS.danger + '22',
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center', color: '#fff' },
  sub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32, color: '#888' },
  retryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: COLORS.neonBlue[0],
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const, userSelect: 'none' as const } : {}),
  },
  retryBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
