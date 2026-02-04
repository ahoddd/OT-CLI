/**
 * OrbTap Knowledge Context — Fun facts + quotes.
 * Current item (refreshed on app open / screen focus), Like/Dislike/Share/Save, Saved list.
 */

import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KnowledgeItem } from '../constants/KnowledgeBase';
import { ORBTAP_KNOWLEDGE_SHARE_SUFFIX } from '../constants/AppLinks';
import { fetchNextKnowledgeItem } from '../services/KnowledgeService';

const SAVED_KEY = 'ORBTAP_KNOWLEDGE_SAVED_V1';

interface KnowledgeContextType {
  currentItem: KnowledgeItem | null;
  loading: boolean;
  /** Call to load a new fact/quote (e.g. on screen focus). Call ensureFreshOnAppOpen() when showing the card so each app open = new. */
  refresh: () => Promise<void>;
  /** Call once when displaying the fact card; refreshes if app just came to foreground so "every app open = new". */
  ensureFreshOnAppOpen: () => void;
  like: () => void;
  dislike: () => void;
  vote: 'like' | 'dislike' | null;
  share: (item: KnowledgeItem) => Promise<void>;
  save: (item: KnowledgeItem) => void;
  unsave: (id: string) => void;
  savedItems: KnowledgeItem[];
  isSaved: (id: string) => boolean;
  next: () => Promise<void>;
}

const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);

export function KnowledgeProvider({ children }: { children: React.ReactNode }) {
  const [currentItem, setCurrentItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState<'like' | 'dislike' | null>(null);
  const [savedItems, setSavedItems] = useState<KnowledgeItem[]>([]);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const needsRefreshRef = useRef(false);

  const loadSaved = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setSavedItems([]);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const persistSaved = useCallback((items: KnowledgeItem[]) => {
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(items)).catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const item = await fetchNextKnowledgeItem();
      setCurrentItem(item);
      setVote(null);
    } catch {
      setCurrentItem(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const item = await fetchNextKnowledgeItem();
        if (!cancelled) {
          setCurrentItem(item);
        }
      } catch {
        if (!cancelled) setCurrentItem(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        needsRefreshRef.current = true;
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  const ensureFreshOnAppOpen = useCallback(() => {
    if (needsRefreshRef.current) {
      needsRefreshRef.current = false;
      refresh();
    }
  }, [refresh]);

  const like = useCallback(() => setVote((v) => (v === 'like' ? null : 'like')), []);
  const dislike = useCallback(() => setVote((v) => (v === 'dislike' ? null : 'dislike')), []);

  const share = useCallback(async (item: KnowledgeItem) => {
    const { Share } = await import('react-native');
    const authorLine = item.author ? ` — ${item.author}` : '';
    const message = item.type === 'quote'
      ? `"${item.text}"${authorLine}${ORBTAP_KNOWLEDGE_SHARE_SUFFIX}`
      : `Did you know? ${item.text}${ORBTAP_KNOWLEDGE_SHARE_SUFFIX}`;
    try {
      await Share.share({ message, title: item.type === 'quote' ? 'Quote' : 'Fun fact' });
    } catch {}
  }, []);

  const save = useCallback((item: KnowledgeItem) => {
    setSavedItems((prev) => {
      if (prev.some((s) => s.id === item.id)) return prev;
      const next = [item, ...prev];
      persistSaved(next);
      return next;
    });
  }, [persistSaved]);

  const unsave = useCallback((id: string) => {
    setSavedItems((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistSaved(next);
      return next;
    });
  }, [persistSaved]);

  const isSaved = useCallback((id: string) => savedItems.some((s) => s.id === id), [savedItems]);

  const next = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const value: KnowledgeContextType = {
    currentItem,
    loading,
    refresh,
    ensureFreshOnAppOpen,
    like,
    dislike,
    vote,
    share,
    save,
    unsave,
    savedItems,
    isSaved,
    next,
  };

  return (
    <KnowledgeContext.Provider value={value}>
      {children}
    </KnowledgeContext.Provider>
  );
}

export function useKnowledge() {
  const ctx = useContext(KnowledgeContext);
  if (ctx === undefined) throw new Error('useKnowledge must be used within KnowledgeProvider');
  return ctx;
}
