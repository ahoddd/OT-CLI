/**
 * In-app notification center — real-time inbox, trash, mark read, empty trash.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  listInbox,
  listTrash,
  subscribeInbox,
  markRead as markReadService,
  moveToTrash as moveToTrashService,
  emptyTrash as emptyTrashService,
  getUnreadCount,
  type AppNotification,
} from '../services/userNotifications';
import { useAuth } from '../context/AuthContext';

type Tab = 'inbox' | 'trash';

export function useNotifications() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState<AppNotification[]>([]);
  const [trash, setTrash] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('inbox');

  useEffect(() => {
    if (!user?.uid) {
      setInbox([]);
      setTrash([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    const unsub = subscribeInbox(user.uid, (items) => {
      setInbox(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    });
    return () => unsub();
  }, [user?.uid]);

  const refreshTrash = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const list = await listTrash(user.uid);
      setTrash(list);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid && tab === 'trash') refreshTrash();
  }, [user?.uid, tab, refreshTrash]);

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!user?.uid) return;
      await markReadService(user.uid, notificationId);
      setInbox((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [user?.uid]
  );

  const moveToTrash = useCallback(
    async (notificationId: string) => {
      if (!user?.uid) return;
      await moveToTrashService(user.uid, notificationId);
      if (tab === 'trash') refreshTrash();
    },
    [user?.uid, tab, refreshTrash]
  );

  const emptyTrash = useCallback(async (): Promise<number> => {
    if (!user?.uid) return 0;
    const count = await emptyTrashService(user.uid);
    setTrash([]);
    return count;
  }, [user?.uid]);

  return {
    inbox,
    trash,
    unreadCount,
    loading,
    tab,
    setTab,
    markRead,
    moveToTrash,
    emptyTrash,
    refreshTrash,
  };
}
