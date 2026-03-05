/**
 * Current user's public profile from Firestore (displayName, username, photoURL).
 * Single source of truth so name/username reflect app-wide after profile edit.
 * Refetches when app comes to foreground so updates propagate.
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';

export interface CurrentUserProfile {
  displayName: string | null;
  username: string | null;
  photoURL: string | null;
  /** Set in Firestore when user completes onboarding; used so returning users on new devices skip onboarding. */
  onboardingComplete: boolean;
}

export function useCurrentUserProfile(): CurrentUserProfile & { loading: boolean; refresh: () => Promise<void> } {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user?.uid) {
      setDisplayName(user?.displayName ?? null);
      setUsername(null);
      setPhotoURL(user?.photoURL ?? null);
      setOnboardingComplete(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const snap = await getDocFromServer(doc(db, 'users', user.uid));
      const d = snap.data();
      setDisplayName((d?.displayName as string) ?? user.displayName ?? null);
      setUsername((d?.username as string) ?? null);
      setPhotoURL((d?.photoURL as string) ?? user?.photoURL ?? null);
      setOnboardingComplete(d?.onboardingComplete === true);
    } catch {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const d = snap.data();
        setDisplayName((d?.displayName as string) ?? user.displayName ?? null);
        setUsername((d?.username as string) ?? null);
        setPhotoURL((d?.photoURL as string) ?? user?.photoURL ?? null);
        setOnboardingComplete(d?.onboardingComplete === true);
      } catch {
        setDisplayName(user?.displayName ?? null);
        setUsername(null);
        setPhotoURL(user?.photoURL ?? null);
        setOnboardingComplete(false);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.displayName, user?.photoURL]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') fetchProfile();
    });
    return () => sub.remove();
  }, [fetchProfile]);

  return {
    displayName: displayName ?? user?.displayName ?? null,
    username: username ?? null,
    photoURL: photoURL ?? user?.photoURL ?? null,
    onboardingComplete,
    loading,
    refresh: fetchProfile,
  };
}
