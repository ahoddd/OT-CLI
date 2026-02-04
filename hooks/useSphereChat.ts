/**
 * Sphere group chat with E2E-style encryption. Messages stored in Firestore as ciphertext;
 * only members with the sphere invite code can decrypt. Uses services/chatCrypto.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { encryptMessage, decryptMessage } from '../services/chatCrypto';
import { useAuth } from '../context/AuthContext';

export interface ChatMessage {
  id: string;
  plaintext: string;
  at: number;
  senderId: string;
  senderDisplayName: string;
  isFromMe: boolean;
}

export function useSphereChat(sphereId: string | undefined, inviteCode: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sphereId || !inviteCode) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const col = collection(db, 'spheres', sphereId, 'messages');
    const q = query(col, orderBy('at', 'asc'), limit(200));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ChatMessage[] = [];
        snap.docs.forEach((d) => {
          const data = d.data();
          const ciphertext = data.ciphertext as string;
          const plaintext = decryptMessage(ciphertext, inviteCode, sphereId);
          const at = data.at instanceof Timestamp ? data.at.toMillis() : (data.at as number) || 0;
          list.push({
            id: d.id,
            plaintext,
            at,
            senderId: (data.senderId as string) || '',
            senderDisplayName: (data.senderDisplayName as string) || 'Unknown',
            isFromMe: user ? data.senderId === user.uid : false,
          });
        });
        setMessages(list);
        setError(null);
      },
      (err) => {
        setError(err?.message ?? 'Failed to load messages');
        setMessages([]);
      }
    );
    setLoading(false);
    return () => unsub();
  }, [sphereId, inviteCode, user?.uid]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sphereId || !inviteCode || !user || !text.trim()) return;
      setSending(true);
      setError(null);
      try {
        const ciphertext = encryptMessage(text.trim(), inviteCode, sphereId);
        const col = collection(db, 'spheres', sphereId, 'messages');
        await addDoc(col, {
          ciphertext,
          at: serverTimestamp(),
          senderId: user.uid,
          senderDisplayName: user.displayName || user.email?.split('@')[0] || 'Explorer',
        });
      } catch (e: any) {
        setError(e?.message ?? 'Failed to send');
      } finally {
        setSending(false);
      }
    },
    [sphereId, inviteCode, user]
  );

  return { messages, loading, sending, error, sendMessage };
}
