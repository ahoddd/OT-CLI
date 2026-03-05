/**
 * Tab bar button that opens a sub-menu on long-press.
 * Normal tap: navigate to tab. Long-press (SUBMENU_LONG_PRESS_MS = orb - 0.5s): open quick actions modal.
 */

import React, { useRef, useEffect } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useTabSubmenu } from '../context/TabSubmenuContext';
import { SUBMENU_LONG_PRESS_MS } from './TabBarOrb';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import type { TabId } from '../constants/AdminConfig';
import { TAB_SUBMENU_ACTIONS } from '../constants/TabSubmenus';

interface TabBarButtonWithSubmenuProps {
  tabId: TabId;
  children: React.ReactNode;
  onPress?: (e?: any) => void;
  style?: StyleProp<ViewStyle>;
  [key: string]: unknown;
}

export function TabBarButtonWithSubmenu({ tabId, children, onPress, style, ...rest }: TabBarButtonWithSubmenuProps) {
  const submenu = useTabSubmenu();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const clearTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePressIn = () => {
    longPressFired.current = false;
    clearTimer();
    const hasActions = (TAB_SUBMENU_ACTIONS[tabId]?.length ?? 0) > 0;
    if (hasActions && submenu) {
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        longPressFired.current = true;
        safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        submenu.openSubmenu(tabId);
      }, SUBMENU_LONG_PRESS_MS);
    }
  };

  const handlePressOut = () => {
    clearTimer();
  };

  const handlePress = () => {
    clearTimer();
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    if (typeof onPress === 'function') (onPress as (...args: unknown[]) => void)();
  };

  useEffect(() => () => clearTimer(), []);

  return (
    <Pressable
      {...rest}
      style={style as StyleProp<ViewStyle>}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {children}
    </Pressable>
  );
}
