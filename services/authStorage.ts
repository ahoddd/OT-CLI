/**
 * Remember me (email) + biometric credential storage.
 * Email in AsyncStorage; biometric creds use SecureStore when available, else AsyncStorage.
 * Works without expo-secure-store installed so the app always bundles.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBER_EMAIL_KEY = 'ORBTAP_REMEMBER_EMAIL';
const BIOMETRIC_CREDS_KEY = 'ORBTAP_BIOMETRIC_CREDS';
const BIOMETRIC_ENABLED_KEY = 'ORBTAP_BIOMETRIC_ENABLED';

let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // expo-secure-store not installed — use AsyncStorage fallback
}

const useSecure = () => SecureStore != null;

export async function getRememberedEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
  } catch {
    return null;
  }
}

export async function setRememberedEmail(email: string | null): Promise<void> {
  try {
    if (email) {
      await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  } catch {}
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    if (useSecure()) {
      const v = await SecureStore!.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return v === '1';
    }
    const v = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      if (useSecure()) {
        await SecureStore!.setItemAsync(BIOMETRIC_ENABLED_KEY, '1');
      } else {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, '1');
      }
    } else {
      if (useSecure()) {
        await SecureStore!.deleteItemAsync(BIOMETRIC_CREDS_KEY);
        await SecureStore!.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      } else {
        await AsyncStorage.multiRemove([BIOMETRIC_CREDS_KEY, BIOMETRIC_ENABLED_KEY]);
      }
    }
  } catch {}
}

export async function saveBiometricCreds(email: string, password: string): Promise<void> {
  try {
    const payload = JSON.stringify({ email, password });
    if (useSecure()) {
      await SecureStore!.setItemAsync(BIOMETRIC_CREDS_KEY, payload);
      await SecureStore!.setItemAsync(BIOMETRIC_ENABLED_KEY, '1');
    } else {
      await AsyncStorage.setItem(BIOMETRIC_CREDS_KEY, payload);
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, '1');
    }
  } catch {}
}

export async function getBiometricCreds(): Promise<{ email: string; password: string } | null> {
  try {
    let raw: string | null;
    if (useSecure()) {
      raw = await SecureStore!.getItemAsync(BIOMETRIC_CREDS_KEY);
    } else {
      raw = await AsyncStorage.getItem(BIOMETRIC_CREDS_KEY);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; password?: string };
    if (parsed?.email && parsed?.password) return { email: parsed.email, password: parsed.password };
    return null;
  } catch {
    return null;
  }
}

export async function clearBiometricCreds(): Promise<void> {
  try {
    if (useSecure()) {
      await SecureStore!.deleteItemAsync(BIOMETRIC_CREDS_KEY);
      await SecureStore!.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    } else {
      await AsyncStorage.multiRemove([BIOMETRIC_CREDS_KEY, BIOMETRIC_ENABLED_KEY]);
    }
  } catch {}
}
