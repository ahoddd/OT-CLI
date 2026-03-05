/**
 * Shared image component for partner/feed cards. Uses RN Image for reliability.
 * Optional: add expo-image and use it here for caching + placeholder when installed.
 */

import React from 'react';
import { Image, ImageProps as RNImageProps } from 'react-native';

export interface OptimizedImageProps extends Omit<RNImageProps, 'source'> {
  source: RNImageProps['source'];
  placeholder?: string | null;
  transition?: number;
}

export function OptimizedImage({
  source,
  style,
  onError,
  resizeMode = 'cover',
  ...rest
}: OptimizedImageProps) {
  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={onError}
      {...rest}
    />
  );
}
