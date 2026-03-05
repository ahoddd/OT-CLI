/**
 * Admin layout state: tab bar order/visibility and master directory order.
 * Persisted to AsyncStorage so only the admin needs to configure once.
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  loadAdminLayout,
  saveAdminLayout,
  defaultLayout,
  DEFAULT_TAB_ORDER,
  DEFAULT_QUICK_ACTIONS,
  MAX_NAVBAR_TABS,
  MAX_QUICK_ACTIONS,
  QUICK_ACTION_KEYS,
  getDefaultDisplayName,
  type AdminLayoutState,
  type TabId,
  type QuickActionId,
  type TestAccountType,
  TAB_IDS,
} from '../constants/AdminConfig';

interface AdminLayoutContextType extends AdminLayoutState {
  setTabOrder: (order: TabId[]) => void;
  setTabAt: (index: number, tabId: TabId) => void;
  setTabHidden: (hidden: TabId[]) => void;
  setDirectoryOrder: (order: string[]) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  toggleTabHidden: (tabId: TabId) => void;
  moveDirectoryItem: (fromIndex: number, toIndex: number) => void;
  setQuickActions: (ids: QuickActionId[]) => void;
  setQuickActionAt: (index: number, key: QuickActionId) => void;
  setTestAccountType: (value: TestAccountType) => void;
  /** Persist current test account type and return whether save succeeded. Use for Save button + success/fail message. */
  saveTestAccountType: (value: TestAccountType) => Promise<{ ok: boolean; error?: string }>;
  resetLayout: () => void;
  getDisplayName: (key: string, defaultVal?: string) => string;
  setDisplayName: (key: string, value: string) => void;
  loading: boolean;
}

const AdminLayoutContext = createContext<AdminLayoutContextType | undefined>(undefined);

export function AdminLayoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminLayoutState>(() => defaultLayout);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminLayout().then((loaded) => {
      setState(loaded);
      setLoading(false);
    });
  }, []);

  const persist = useCallback(async (next: AdminLayoutState) => {
    try {
      await saveAdminLayout(next);
    } catch (e) {
      if (__DEV__) console.warn('AdminLayout persist error:', e);
    }
  }, []);

  const setTabOrder = useCallback(
    (order: TabId[]) => {
      const valid = order.filter((t) => TAB_IDS.includes(t));
      const merged = [...valid, ...TAB_IDS.filter((t) => !valid.includes(t))];
      setState((prev) => {
        const next = { ...prev, tabOrder: merged };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const setTabHidden = useCallback(
    (hidden: TabId[]) => {
      setState((prev) => {
        const next = { ...prev, tabHidden: hidden };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const toggleTabHidden = useCallback(
    (tabId: TabId) => {
      setState((prev) => {
        const hidden = prev.tabHidden.includes(tabId)
          ? prev.tabHidden.filter((t) => t !== tabId)
          : [...prev.tabHidden, tabId];
        const next = { ...prev, tabHidden: hidden };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const setTabAt = useCallback(
    (index: number, tabId: TabId) => {
      if (!TAB_IDS.includes(tabId) || index < 0 || index >= MAX_NAVBAR_TABS) return;
      setState((prev) => {
        const order = [...prev.tabOrder.slice(0, MAX_NAVBAR_TABS)];
        while (order.length < MAX_NAVBAR_TABS) {
          const fill = DEFAULT_TAB_ORDER.find((t) => !order.includes(t));
          if (fill) order.push(fill);
          else break;
        }
        const oldId = order[index];
        const existingIdx = order.findIndex((id, i) => i !== index && id === tabId);
        order[index] = tabId;
        if (existingIdx !== -1) order[existingIdx] = oldId;
        const tabOrder = order.slice(0, MAX_NAVBAR_TABS);
        const next = { ...prev, tabOrder };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const moveTab = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= MAX_NAVBAR_TABS || toIndex >= MAX_NAVBAR_TABS) return;
      setState((prev) => {
        const order = [...prev.tabOrder.slice(0, MAX_NAVBAR_TABS)];
        while (order.length < MAX_NAVBAR_TABS) {
          const fill = DEFAULT_TAB_ORDER.find((t) => !order.includes(t));
          if (fill) order.push(fill);
          else break;
        }
        const [removed] = order.splice(fromIndex, 1);
        if (removed) order.splice(toIndex, 0, removed);
        const tabOrder = order.slice(0, MAX_NAVBAR_TABS);
        const next = { ...prev, tabOrder };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const setDirectoryOrder = useCallback(
    (order: string[]) => {
      setState((prev) => {
        const next = { ...prev, directoryOrder: order };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const moveDirectoryItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      setState((prev) => {
        const order = [...prev.directoryOrder];
        const [removed] = order.splice(fromIndex, 1);
        if (removed) order.splice(toIndex, 0, removed);
        const next = { ...prev, directoryOrder: order };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const setQuickActions = useCallback(
    (ids: QuickActionId[]) => {
      const valid = ids.filter((k) => QUICK_ACTION_KEYS.includes(k)).slice(0, MAX_QUICK_ACTIONS);
      setState((prev) => {
        const next = { ...prev, quickActionIds: valid };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const setQuickActionAt = useCallback(
    (index: number, key: QuickActionId) => {
      if (!QUICK_ACTION_KEYS.includes(key) || index < 0 || index >= MAX_QUICK_ACTIONS) return;
      setState((prev) => {
        const ids = [...(prev.quickActionIds ?? DEFAULT_QUICK_ACTIONS)];
        while (ids.length < MAX_QUICK_ACTIONS && ids.length <= index) {
          ids.push(DEFAULT_QUICK_ACTIONS[ids.length % DEFAULT_QUICK_ACTIONS.length]);
        }
        const oldKey = ids[index];
        const existingIdx = ids.findIndex((k, i) => i !== index && k === key);
        ids[index] = key;
        if (existingIdx !== -1) ids[existingIdx] = oldKey;
        const quickActionIds = ids.slice(0, MAX_QUICK_ACTIONS);
        const next = { ...prev, quickActionIds };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const setTestAccountType = useCallback(
    (value: TestAccountType) => {
      setState((prev) => {
        const next = { ...prev, testAccountType: value };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const saveTestAccountType = useCallback(
    async (value: TestAccountType): Promise<{ ok: boolean; error?: string }> => {
      try {
        setState((prev) => {
          const next = { ...prev, testAccountType: value };
          return next;
        });
        const next = { ...state, testAccountType: value };
        await saveAdminLayout(next);
        return { ok: true };
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        return { ok: false, error };
      }
    },
    [state]
  );

  const resetLayout = useCallback(() => {
    setState(defaultLayout);
    persist(defaultLayout).catch(() => {});
  }, [persist]);

  const getDisplayName = useCallback(
    (key: string, defaultVal?: string) => {
      const val = state.displayNames?.[key];
      if (val != null && val.trim() !== '') return val.trim();
      return defaultVal ?? getDefaultDisplayName(key);
    },
    [state.displayNames]
  );

  const setDisplayName = useCallback(
    (key: string, value: string) => {
      setState((prev) => {
        const next = {
          ...prev,
          displayNames: { ...(prev.displayNames ?? {}), [key]: value },
        };
        persist(next).catch(() => {});
        return next;
      });
    },
    [persist]
  );

  const value: AdminLayoutContextType = {
    ...state,
    setTabOrder,
    setTabAt,
    setTabHidden,
    setDirectoryOrder,
    moveTab,
    toggleTabHidden,
    moveDirectoryItem,
    setQuickActions,
    setQuickActionAt,
    setTestAccountType,
    saveTestAccountType,
    resetLayout,
    getDisplayName,
    setDisplayName,
    loading,
  };

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout(): AdminLayoutContextType {
  const ctx = useContext(AdminLayoutContext);
  if (!ctx) throw new Error('useAdminLayout must be used within AdminLayoutProvider');
  return ctx;
}
