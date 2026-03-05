/**
 * Cross-platform alert and confirm.
 * On web, Alert.alert from react-native is not available or behaves poorly;
 * we use window.alert and window.confirm instead.
 */

import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export type AlertButton = { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void | Promise<void> };

/**
 * Show an alert. On web uses window.alert; on native uses React Native Alert.
 */
export function alert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (isWeb && typeof window !== 'undefined') {
    const msg = message ? `${title}\n\n${message}` : title;
    if (buttons && buttons.length > 1) {
      const confirmBtn = buttons.find((b) => b.style !== 'cancel');
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      const confirmed = window.confirm(msg);
      if (confirmed && confirmBtn?.onPress) {
        const out = confirmBtn.onPress();
        if (out && typeof (out as Promise<unknown>).then === 'function') {
          (out as Promise<unknown>).catch(() => {});
        }
      } else if (!confirmed && cancelBtn?.onPress) {
        cancelBtn.onPress();
      }
      return;
    }
    window.alert(msg);
    buttons?.[0]?.onPress?.();
    return;
  }
  const { Alert } = require('react-native');
  Alert.alert(title, message ?? undefined, buttons);
}

/**
 * Show an error alert with a clear, dismissible "OK" button.
 * Use specific titles and messages (e.g. "Push settings couldn't be saved" + "Check your connection and try again.")
 * so users understand what went wrong and how to proceed.
 */
export function showErrorAlert(
  title: string,
  message: string,
  onDismiss?: () => void
): void {
  const buttons: AlertButton[] = [
    { text: 'OK', onPress: onDismiss },
  ];
  alert(title, message, buttons);
}

/**
 * Promise-based confirm for async flows. Returns true if user confirmed, false if cancelled.
 * On web uses window.confirm; on native uses Alert.alert with two buttons.
 */
export function confirm(
  title: string,
  message: string,
  options?: { confirmText?: string; cancelText?: string }
): Promise<boolean> {
  const confirmText = options?.confirmText ?? 'OK';
  const cancelText = options?.cancelText ?? 'Cancel';
  if (isWeb && typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    const { Alert } = require('react-native');
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, onPress: () => resolve(true) },
    ]);
  });
}
