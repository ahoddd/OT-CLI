/**
 * Partner Menus: documents, versions, reports, drop drafts.
 * Persists to AsyncStorage; auto-flag NEEDS_REVIEW when thresholds met.
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import type {
  MenuDocument,
  MenuVersion,
  MenuReport,
  DropSuggestionDraft,
  MenuDocumentStatus,
  MenuReportType,
  MenuReportStatus,
} from '../constants/PartnerMenu';
import {
  PARTNER_MENUS_STORAGE_KEY,
  MENU_REPORTS_STORAGE_KEY,
  DROP_SUGGESTION_DRAFTS_STORAGE_KEY,
  NEEDS_REVIEW_OPEN_REPORTS_THRESHOLD,
  NEEDS_REVIEW_WRONG_PRICE_SAME_ITEM_THRESHOLD,
  NEEDS_REVIEW_DAYS_WINDOW,
} from '../constants/PartnerMenu';

const getReporterUid = () => auth.currentUser?.uid ?? 'anon';

interface MenuContextType {
  documents: MenuDocument[];
  versions: MenuVersion[];
  reports: MenuReport[];
  dropDrafts: DropSuggestionDraft[];
  loading: boolean;
  getMenuForPartner: (partnerId: string) => MenuDocument | null;
  getVersion: (versionId: string) => MenuVersion | null;
  getCurrentVersion: (doc: MenuDocument) => MenuVersion | null;
  createDraftMenu: (partnerId: string, version: MenuVersion) => { doc: MenuDocument; version: MenuVersion };
  updateMenuVersion: (menuId: string, version: MenuVersion) => void;
  publishMenu: (menuId: string, updatedByUid: string, summary: string) => void;
  setMenuStatus: (menuId: string, status: MenuDocumentStatus) => void;
  addReport: (report: Omit<MenuReport, 'id' | 'createdAt' | 'status'>) => MenuReport;
  resolveReportsForMenu: (menuId: string) => void;
  addDropDraft: (draft: Omit<DropSuggestionDraft, 'id' | 'createdAt'>) => DropSuggestionDraft;
  refresh: () => Promise<void>;
  persist: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

function applyNeedsReviewRules(
  documents: MenuDocument[],
  reports: MenuReport[]
): MenuDocument[] {
  const now = Date.now();
  const cutoff = now - NEEDS_REVIEW_DAYS_WINDOW * 24 * 60 * 60 * 1000;
  const openInWindow = reports.filter(
    (r) => r.status === 'OPEN' && r.createdAt >= cutoff
  );
  const byMenu = new Map<string, MenuReport[]>();
  for (const r of openInWindow) {
    const list = byMenu.get(r.menuId) ?? [];
    list.push(r);
    byMenu.set(r.menuId, list);
  }
  const wrongPriceByItem = new Map<string, number>();
  for (const r of openInWindow.filter((r) => r.type === 'WRONG_PRICE')) {
    const key = r.itemId ? `${r.menuId}:${r.itemId}` : r.menuId;
    wrongPriceByItem.set(key, (wrongPriceByItem.get(key) ?? 0) + 1);
  }

  return documents.map((doc) => {
    if (doc.status !== 'PUBLISHED') return doc;
    const menuReports = byMenu.get(doc.id) ?? [];
    const openCount = menuReports.length;
    const anyItemWrongPrice = Array.from(wrongPriceByItem.entries()).some(
      ([k, count]) => k.startsWith(doc.id + ':') && count >= NEEDS_REVIEW_WRONG_PRICE_SAME_ITEM_THRESHOLD
    );
    if (
      openCount >= NEEDS_REVIEW_OPEN_REPORTS_THRESHOLD ||
      anyItemWrongPrice
    ) {
      return { ...doc, status: 'NEEDS_REVIEW' as MenuDocumentStatus };
    }
    return doc;
  });
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<MenuDocument[]>([]);
  const [versions, setVersions] = useState<MenuVersion[]>([]);
  const [reports, setReports] = useState<MenuReport[]>([]);
  const [dropDrafts, setDropDrafts] = useState<DropSuggestionDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [docRaw, verRaw, repRaw, draftRaw] = await Promise.all([
        AsyncStorage.getItem(PARTNER_MENUS_STORAGE_KEY),
        AsyncStorage.getItem(PARTNER_MENUS_STORAGE_KEY + '_versions'),
        AsyncStorage.getItem(MENU_REPORTS_STORAGE_KEY),
        AsyncStorage.getItem(DROP_SUGGESTION_DRAFTS_STORAGE_KEY),
      ]);
      const docList = docRaw ? (JSON.parse(docRaw) as MenuDocument[]) : [];
      const verList = verRaw ? (JSON.parse(verRaw) as MenuVersion[]) : [];
      const repList = repRaw ? (JSON.parse(repRaw) as MenuReport[]) : [];
      const draftList = draftRaw ? (JSON.parse(draftRaw) as DropSuggestionDraft[]) : [];
      setDocuments(Array.isArray(docList) ? docList : []);
      setVersions(Array.isArray(verList) ? verList : []);
      setReports(Array.isArray(repList) ? repList : []);
      setDropDrafts(Array.isArray(draftList) ? draftList : []);
    } catch (e) {
      if (__DEV__) console.warn('MenuContext load:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(async () => {
    try {
      const docsToSave = applyNeedsReviewRules(documents, reports);
      await Promise.all([
        AsyncStorage.setItem(PARTNER_MENUS_STORAGE_KEY, JSON.stringify(docsToSave)),
        AsyncStorage.setItem(PARTNER_MENUS_STORAGE_KEY + '_versions', JSON.stringify(versions)),
        AsyncStorage.setItem(MENU_REPORTS_STORAGE_KEY, JSON.stringify(reports)),
        AsyncStorage.setItem(DROP_SUGGESTION_DRAFTS_STORAGE_KEY, JSON.stringify(dropDrafts)),
      ]);
    } catch (e) {
      if (__DEV__) console.warn('MenuContext persist:', e);
    }
  }, [documents, versions, reports, dropDrafts]);

  useEffect(() => {
    if (loading) return;
    setDocuments((prev) => applyNeedsReviewRules(prev, reports));
  }, [reports, loading]);

  useEffect(() => {
    if (loading) return;
    persist();
  }, [loading, documents, versions, reports, dropDrafts, persist]);

  const getMenuForPartner = useCallback(
    (partnerId: string) => documents.find((d) => d.partnerId === partnerId) ?? null,
    [documents]
  );

  const getVersion = useCallback(
    (versionId: string) => versions.find((v) => v.id === versionId) ?? null,
    [versions]
  );

  const getCurrentVersion = useCallback(
    (doc: MenuDocument) => getVersion(doc.currentVersionId),
    [getVersion]
  );

  const createDraftMenu = useCallback(
    (partnerId: string, version: MenuVersion): { doc: MenuDocument; version: MenuVersion } => {
      const now = Date.now();
      const menuId = `menu_${now}_${Math.random().toString(36).slice(2, 9)}`;
      const doc: MenuDocument = {
        id: menuId,
        partnerId,
        status: 'DRAFT',
        verified: false,
        currentVersionId: version.id,
        createdAt: now,
        updatedAt: now,
      };
      const ver = { ...version, menuId, partnerId };
      setDocuments((prev) => [...prev.filter((d) => d.partnerId !== partnerId), doc]);
      setVersions((prev) => [...prev.filter((v) => v.menuId !== menuId), ver]);
      return { doc, version: ver };
    },
    []
  );

  const updateMenuVersion = useCallback((menuId: string, version: MenuVersion) => {
    setVersions((prev) => prev.filter((v) => v.id !== version.id).concat(version));
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === menuId ? { ...d, currentVersionId: version.id, updatedAt: Date.now() } : d
      )
    );
  }, []);

  const publishMenu = useCallback(
    (menuId: string, updatedByUid: string, summary: string) => {
      const doc = documents.find((d) => d.id === menuId);
      if (!doc) return;
      const ver = versions.find((v) => v.id === doc.currentVersionId);
      if (!ver) return;
      const updatedVersion: MenuVersion = {
        ...ver,
        changeLog: {
          updatedByUid,
          summary,
          diffStats: { sectionsChanged: 0, itemsChanged: 0, pricesChanged: 0 },
        },
      };
      setVersions((prev) => prev.map((v) => (v.id === ver.id ? updatedVersion : v)));
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === menuId
            ? {
                ...d,
                status: 'PUBLISHED',
                verified: true,
                updatedAt: Date.now(),
              }
            : d
        )
      );
    },
    [documents, versions]
  );

  const setMenuStatus = useCallback((menuId: string, status: MenuDocumentStatus) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === menuId ? { ...d, status, updatedAt: Date.now() } : d))
    );
  }, []);

  const addReport = useCallback(
    (report: Omit<MenuReport, 'id' | 'createdAt' | 'status'>): MenuReport => {
      const now = Date.now();
      const r: MenuReport = {
        ...report,
        id: `rep_${now}`,
        createdAt: now,
        status: 'OPEN',
      };
      setReports((prev) => [...prev, r]);
      return r;
    },
    []
  );

  const resolveReportsForMenu = useCallback((menuId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.menuId === menuId ? { ...r, status: 'RESOLVED' as MenuReportStatus } : r))
    );
  }, []);

  const addDropDraft = useCallback(
    (draft: Omit<DropSuggestionDraft, 'id' | 'createdAt'>): DropSuggestionDraft => {
      const now = Date.now();
      const d: DropSuggestionDraft = {
        ...draft,
        id: `dsd_${now}`,
        createdAt: now,
      };
      setDropDrafts((prev) => [...prev, d]);
      return d;
    },
    []
  );

  const value: MenuContextType = {
    documents,
    versions,
    reports,
    dropDrafts,
    loading,
    getMenuForPartner,
    getVersion,
    getCurrentVersion,
    createDraftMenu,
    updateMenuVersion,
    publishMenu,
    setMenuStatus,
    addReport,
    resolveReportsForMenu,
    addDropDraft,
    refresh: load,
    persist,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenuContext(): MenuContextType {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenuContext must be used within MenuProvider');
  return ctx;
}
