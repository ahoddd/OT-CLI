import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { OrbTapShield } from './AppLogos';

// We upgrade the standard checkmark to the OrbTap Shield for a premium feel
export const VerifiedBadge = ({ size = 16 }: { size?: number }) => {
  return (
    <View style={{ marginLeft: 4 }}>
      <Ionicons name='shield-checkmark' size={size} />
    </View>
  );
};
