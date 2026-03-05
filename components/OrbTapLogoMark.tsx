/**
 * OrbTap logo mark — shield/gold logo used everywhere. Single logo, no light-mode variant.
 * Uses transparent PNG (logo-orbtap.png) so it works on any background.
 */

import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

const LOGO_SOURCE = require('../assets/images/logo-orbtap.png');

export type OrbTapLogoMarkVariant = 'hero' | 'watermark' | 'small';

interface OrbTapLogoMarkProps {
  variant?: OrbTapLogoMarkVariant;
  /** Override source if needed */
  source?: ImageSourcePropType;
  /** Override width */
  width?: number;
  /** Override height */
  height?: number;
}

const SIZES: Record<OrbTapLogoMarkVariant, { width: number; height: number; opacity?: number }> = {
  hero: { width: 72, height: 62, opacity: 1 },
  watermark: { width: 44, height: 38, opacity: 0.72 },
  small: { width: 28, height: 24, opacity: 0.9 },
};

export function OrbTapLogoMark({ variant = 'watermark', source = LOGO_SOURCE, width: widthProp, height: heightProp }: OrbTapLogoMarkProps) {
  const base = SIZES[variant];
  const width = widthProp ?? base.width;
  const height = heightProp ?? base.height;
  const opacity = base.opacity ?? 1;
  return (
    <View style={[styles.wrap, { width, height }]} pointerEvents="none">
      <Image
        source={source}
        style={[styles.img, { width, height, opacity }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  img: {},
});
