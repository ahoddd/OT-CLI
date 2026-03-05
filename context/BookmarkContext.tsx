import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = 'ORBTAP_BOOKMARKS_V1';

export type BookmarkType = 'partner' | 'perk';

export interface BookmarkItem {
  type: BookmarkType;
  id: string; // partnerId or perkId
  addedAt: number;
}

interface BookmarkState {
  partners: string[];
  perks: string[];
}

interface BookmarkContextType {
  bookmarkedPartners: string[];
  bookmarkedPerks: string[];
  isPartnerBookmarked: (id: string) => boolean;
  isPerkBookmarked: (id: string) => boolean;
  togglePartner: (id: string) => void;
  togglePerk: (id: string) => void;
  getItems: () => BookmarkItem[];
  loading: boolean;
}

const defaultState: BookmarkState = { partners: [], perks: [] };

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [partners, setPartners] = useState<string[]>(defaultState.partners);
  const [perks, setPerks] = useState<string[]>(defaultState.perks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
        if (raw) {
          const data = JSON.parse(raw) as BookmarkState;
          setPartners(Array.isArray(data.partners) ? data.partners : []);
          setPerks(Array.isArray(data.perks) ? data.perks : []);
        }
      } catch (e) {
        if (__DEV__) console.error('Bookmarks load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify({ partners, perks })).catch(() => {});
  }, [partners, perks, loading]);

  const togglePartner = useCallback((id: string) => {
    setPartners((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const togglePerk = useCallback((id: string) => {
    setPerks((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const isPartnerBookmarked = (id: string) => partners.includes(id);
  const isPerkBookmarked = (id: string) => perks.includes(id);

  const getItems = useCallback((): BookmarkItem[] => {
    const items: BookmarkItem[] = [];
    partners.forEach((id) => items.push({ type: 'partner', id, addedAt: 0 }));
    perks.forEach((id) => items.push({ type: 'perk', id, addedAt: 0 }));
    return items.sort((a, b) => b.addedAt - a.addedAt);
  }, [partners, perks]);

  const value: BookmarkContextType = {
    bookmarkedPartners: partners,
    bookmarkedPerks: perks,
    isPartnerBookmarked,
    isPerkBookmarked,
    togglePartner,
    togglePerk,
    getItems,
    loading,
  };

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
