/**
 * Optimized full-screen ScrollView with consistent content padding.
 * Use on any screen that scrolls to avoid repeated contentContainerStyle and improve layout consistency.
 */

import React, { memo } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { SCROLL_CONTENT, SPACE } from '../constants/DesignTokens';

export interface ScreenScrollProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  /** Override default content padding. */
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  /** Extra bottom padding (e.g. for tab bar). */
  bottomPad?: number;
  /** When true, content fills at least the screen (flexGrow: 1). */
  flexGrow?: boolean;
}

const DEFAULT_CONTENT: Record<string, number> = {
  flexGrow: 1,
  paddingHorizontal: SCROLL_CONTENT.paddingHorizontal,
  paddingBottom: SCROLL_CONTENT.paddingBottom + SPACE.xxl,
};

function ScreenScrollInner({
  contentContainerStyle,
  bottomPad = 0,
  flexGrow = true,
  ...rest
}: ScreenScrollProps) {
  const baseContent = flexGrow ? DEFAULT_CONTENT : { paddingHorizontal: SCROLL_CONTENT.paddingHorizontal, paddingBottom: SCROLL_CONTENT.paddingBottom };
  const contentStyle = [
    baseContent,
    bottomPad > 0 ? { paddingBottom: (baseContent.paddingBottom ?? 0) + bottomPad } : undefined,
    contentContainerStyle,
  ].filter(Boolean) as ScrollViewProps['contentContainerStyle'];
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentStyle}
      {...rest}
    />
  );
}

export const ScreenScroll = memo(ScreenScrollInner);
