/**
 * When admin has "Test as" set in Admin Hub, shows a sticky banner so they know
 * they're viewing the app as another account type. Tapping opens Admin Hub to change.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { Ionicons } from '@expo/vector-icons';

export function AdminTestModeBanner() {
  const { isTestMode, tier } = useEffectiveTier();
  const router = useRouter();
  const pathname = usePathname();

  if (!isTestMode) return null;
  if (pathname?.startsWith('/admin')) return null;

  const label = tier === 'free' ? 'Free' : tier === 'premium' ? 'Premium' : 'Pro';
  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => router.push('/admin' as any)}
      activeOpacity={0.9}
      accessibilityLabel={`Viewing app as ${label} user. Tap to open Admin Hub.`}
      accessibilityRole="button"
    >
      <Ionicons name="eye" size={16} color="#000" />
      <Text style={styles.text}>Viewing as {label} user</Text>
      <Text style={styles.hint}>Tap to change in Admin Hub</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef08a',
    borderBottomWidth: 1,
    borderBottomColor: '#eab308',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  hint: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.7)',
  },
});
