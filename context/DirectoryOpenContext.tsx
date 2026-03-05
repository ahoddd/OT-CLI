import React, { createContext, useContext, useRef, useCallback } from 'react';

type OpenDirectoryFn = () => void;

type DirectoryOpenContextValue = {
  registerOpen: (fn: OpenDirectoryFn) => () => void;
  requestOpen: () => void;
};

const DirectoryOpenContext = createContext<DirectoryOpenContextValue | null>(null);

export function DirectoryOpenProvider({ children }: { children: React.ReactNode }) {
  const openRef = useRef<OpenDirectoryFn | null>(null);

  const registerOpen = useCallback((fn: OpenDirectoryFn) => {
    openRef.current = fn;
    return () => {
      openRef.current = null;
    };
  }, []);

  const requestOpen = useCallback(() => {
    openRef.current?.();
  }, []);

  return (
    <DirectoryOpenContext.Provider value={{ registerOpen, requestOpen }}>
      {children}
    </DirectoryOpenContext.Provider>
  );
}

export function useDirectoryOpen() {
  const ctx = useContext(DirectoryOpenContext);
  if (!ctx) return null;
  return ctx;
}
