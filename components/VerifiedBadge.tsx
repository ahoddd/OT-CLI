import React from 'react';
import { View } from 'react-native';
import { OrbTapShield } from './AppLogos';
import { Ionicons } from '@expo/vector-icons';

// We upgrade the standard checkmark to the OrbTap Shield for a premium feel
export const VerifiedBadge = ({ size = 16 }: { size?: number }) => {
  return (
    <View style={{ marginLeft: 4 }}>
      <OrbTapShield size={size} />
    </View>
  );
};
