import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const VerifiedBadge = ({ size = 16 }: { size?: number }) => {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.check, { fontSize: size * 0.6 }]}>✓</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#38bdf8', // Light blue
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  check: {
    color: '#000',
    fontWeight: 'bold',
  },
});
