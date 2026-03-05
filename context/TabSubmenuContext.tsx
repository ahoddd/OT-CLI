/**
 * Context for tab bar long-press sub-menus.
 * Layout provides open/close and modal; tab buttons call open on long-press.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TabId } from '../constants/AdminConfig';
import { TabSubmenuModal } from '../components/TabSubmenuModal';

type TabSubmenuContextValue = {
  openSubmenu: (tabId: TabId) => void;
  closeSubmenu: () => void;
};

const TabSubmenuContext = createContext<TabSubmenuContextValue | null>(null);

export function useTabSubmenu() {
  const ctx = useContext(TabSubmenuContext);
  return ctx;
}

export function TabSubmenuProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [tabId, setTabId] = useState<TabId | null>(null);

  const openSubmenu = useCallback((id: TabId) => {
    setTabId(id);
    setVisible(true);
  }, []);

  const closeSubmenu = useCallback(() => {
    setVisible(false);
    setTabId(null);
  }, []);

  const value: TabSubmenuContextValue = { openSubmenu, closeSubmenu };

  return (
    <TabSubmenuContext.Provider value={value}>
      {children}
      <TabSubmenuModal visible={visible} tabId={tabId} onClose={closeSubmenu} />
    </TabSubmenuContext.Provider>
  );
}
