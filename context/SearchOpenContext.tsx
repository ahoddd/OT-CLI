import React, { createContext, useContext, useState, useCallback } from 'react';

export type SearchScope = 'map' | 'all' | 'businesses' | 'members' | 'pages';

type SearchOpenContextValue = {
  searchVisible: boolean;
  defaultScope: SearchScope;
  openSearch: (scope?: SearchScope) => void;
  closeSearch: () => void;
};

const SearchOpenContext = createContext<SearchOpenContextValue | null>(null);

export function SearchOpenProvider({ children }: { children: React.ReactNode }) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [defaultScope, setDefaultScope] = useState<SearchScope>('all');
  const openSearch = useCallback((scope: SearchScope = 'all') => {
    setDefaultScope(scope);
    setSearchVisible(true);
  }, []);
  const closeSearch = useCallback(() => setSearchVisible(false), []);
  return (
    <SearchOpenContext.Provider value={{ searchVisible, defaultScope, openSearch, closeSearch }}>
      {children}
    </SearchOpenContext.Provider>
  );
}

export function useSearchOpen() {
  const ctx = useContext(SearchOpenContext);
  if (!ctx) return null;
  return ctx;
}
