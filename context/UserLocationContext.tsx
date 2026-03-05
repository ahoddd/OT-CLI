/**
 * UserLocationContext — Provides device location for distance-to-partner and map centering.
 * Respects Preferences "Location access"; requests system permission when needed.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { usePreferences } from '../hooks/usePreferences';

export interface UserLocationCoords {
  latitude: number;
  longitude: number;
}

type UserLocationContextType = {
  /** Current user position when permission granted and location fetched. */
  userLocation: UserLocationCoords | null;
  /** True while checking permission or getting position. */
  loading: boolean;
  /** Error message if permission denied or position unavailable. */
  error: string | null;
  /** System permission granted (foreground). */
  permissionGranted: boolean;
  /** Request permission and optionally fetch position. Returns true if granted. */
  requestPermission: () => Promise<boolean>;
  /** Fetch current position and update state. No-op if permission not granted. */
  refreshLocation: () => Promise<void>;
  /** Clear error. */
  clearError: () => void;
};

const UserLocationContext = createContext<UserLocationContextType | undefined>(undefined);

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  const { prefs } = usePreferences();
  const [userLocation, setUserLocation] = useState<UserLocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!prefs.location) {
      setError('Enable Location access in Settings to see distance and use the map.');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }
      setPermissionGranted(status === 'granted');
      if (status !== 'granted') {
        setError(status === 'denied' ? 'Location denied. Enable in Settings to see distance and use the map.' : 'Location permission required.');
        setUserLocation(null);
        return false;
      }
      return true;
    } catch (e) {
      setError('Could not check location permission.');
      setPermissionGranted(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [prefs.location]);

  const refreshLocation = useCallback(async () => {
    if (!prefs.location) return;
    const granted = permissionGranted || (await requestPermission());
    if (!granted) return;
    setLoading(true);
    setError(null);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (e) {
      setError('Location unavailable. Try again or check Settings.');
      setUserLocation(null);
    } finally {
      setLoading(false);
    }
  }, [prefs.location, permissionGranted, requestPermission]);

  useEffect(() => {
    if (!prefs.location) {
      setUserLocation(null);
      setPermissionGranted(false);
      return;
    }
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionGranted(status === 'granted');
    })();
  }, [prefs.location]);

  const value: UserLocationContextType = {
    userLocation,
    loading,
    error,
    permissionGranted,
    requestPermission,
    refreshLocation,
    clearError,
  };

  return (
    <UserLocationContext.Provider value={value}>
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocation(): UserLocationContextType {
  const ctx = useContext(UserLocationContext);
  if (ctx === undefined) throw new Error('useUserLocation must be used within UserLocationProvider');
  return ctx;
}
