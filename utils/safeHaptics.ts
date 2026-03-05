/**
 * Safe haptics wrapper — avoids crashes when the iOS Simulator, web, or a device
 * without haptic support can't load the haptic API. Use this instead of calling
 * expo-haptics directly.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

const isSimulator = !Constants.isDevice;
const isWeb = Platform.OS === 'web';

function safe(fn: () => void | Promise<void>) {
  if (isSimulator || isWeb) return;
  try {
    const out = fn();
    if (out && typeof (out as Promise<void>).catch === 'function') {
      (out as Promise<void>).catch(() => {});
    }
  } catch {
    // Device without haptic support
  }
}

export const safeHaptics = {
  selectionAsync: () => safe(() => Haptics.selectionAsync()),
  impactAsync: (style?: Haptics.ImpactFeedbackStyle) =>
    safe(() => Haptics.impactAsync(style ?? Haptics.ImpactFeedbackStyle.Light)),
  notificationAsync: (type?: Haptics.NotificationFeedbackType) =>
    safe(() => Haptics.notificationAsync(type ?? Haptics.NotificationFeedbackType.Success)),
};

export { Haptics };
