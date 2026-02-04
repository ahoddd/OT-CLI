import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOrbinomics } from './OrbinomicsContext';
import { applyFeeRate as applyFeeRateFn, DEFAULT_ORBINOMICS } from '../constants/Orbinomics';
import {
  DEFAULT_ORBINOMICS_POLICY,
  LEDGER_REASON,
  type OrbinomicsPolicy,
} from '../constants/OrbinomicsPolicy';

const WALLET_KEY = 'ORBTAP_WALLET_V3';
const ACTIONS_KEY = 'ORBTAP_VERIFIED_ACTIONS';

export interface TransactionRef {
  actionId?: string;
  perkId?: string;
  partnerId?: string;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'adjust';
  amount: number;
  reason: string;
  ref?: TransactionRef;
  createdAt: number;
}

/** @deprecated Legacy field; use reason + createdAt for display */
function normalizeTx(raw: Record<string, unknown>): Transaction {
  const id = typeof raw.id === 'string' ? raw.id : Date.now().toString();
  const amount = typeof raw.amount === 'number' ? raw.amount : 0;
  const type = raw.type === 'earn' || raw.type === 'spend' || raw.type === 'adjust'
    ? raw.type
    : (amount > 0 ? 'earn' : 'spend');
  const reason = typeof raw.reason === 'string' ? raw.reason : (typeof raw.description === 'string' ? raw.description : '');
  const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : (raw.date ? new Date(String(raw.date)).getTime() : Date.now());
  const ref = raw.ref && typeof raw.ref === 'object' && !Array.isArray(raw.ref)
    ? {
        actionId: typeof (raw.ref as Record<string, unknown>).actionId === 'string' ? (raw.ref as TransactionRef).actionId : undefined,
        perkId: typeof (raw.ref as Record<string, unknown>).perkId === 'string' ? (raw.ref as TransactionRef).perkId : undefined,
        partnerId: typeof (raw.ref as Record<string, unknown>).partnerId === 'string' ? (raw.ref as TransactionRef).partnerId : undefined,
      }
    : undefined;
  return { id, type, amount, reason, ref, createdAt };
}

export interface VerifiedActionRecord {
  id: string;
  partnerId: string;
  perkId: string;
  pointsAwarded: number;
  createdAt: number;
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const DAILY_CAP = 5;

const PRODUCT_TO_REASON: Record<string, string> = {
  drop_reserve_fee: LEDGER_REASON.BURN_DROP_RESERVE_FEE,
  early_access_unlock: LEDGER_REASON.BURN_EARLY_ACCESS_UNLOCK,
  quest_reroll: LEDGER_REASON.BURN_QUEST_REROLL,
  quest_booster: LEDGER_REASON.BURN_QUEST_BOOSTER,
  streak_shield: LEDGER_REASON.BURN_STREAK_SHIELD,
  multiplier_24h: LEDGER_REASON.BURN_MULTIPLIER_24H,
  receipt_cosmetics: LEDGER_REASON.BURN_RECEIPT_COSMETICS,
  circle_bonus_pool: LEDGER_REASON.BURN_CIRCLE_BONUS_POOL,
  pulse_alerts_filters: LEDGER_REASON.BURN_PULSE_ALERTS_FILTERS,
};

export type CanRedeemResult = { allowed: true } | { allowed: false; reason: string };

export type SpendResult =
  | { success: true; balance: number }
  | { success: false; reason: string };

interface WalletContextType {
  balance: number;
  history: Transaction[];
  verifiedActions: VerifiedActionRecord[];
  addTransaction: (params: {
    type: 'earn' | 'spend' | 'adjust';
    amount: number;
    reason: string;
    ref?: TransactionRef;
  }) => Promise<void>;
  /** Orbinomics V1: server-authoritative spend (policy + caps). */
  spend: (params: {
    productKey: string;
    refType?: string;
    refId?: string;
    amountExpected: number;
    clientNonce?: string;
  }) => Promise<SpendResult>;
  createVerifiedAction: (partnerId: string, perkId: string, points: number) => Promise<VerifiedActionRecord>;
  canRedeem: (perkId: string) => CanRedeemResult;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function isSameCalendarDay(ts: number): boolean {
  const d = new Date(ts);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const orbinomics = useOrbinomics();
  const config = orbinomics?.config ?? DEFAULT_ORBINOMICS;
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [verifiedActions, setVerifiedActions] = useState<VerifiedActionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const data = await AsyncStorage.getItem(WALLET_KEY);
      const actionsData = await AsyncStorage.getItem(ACTIONS_KEY);
      const actionsList: VerifiedActionRecord[] = actionsData ? JSON.parse(actionsData) : [];
      setVerifiedActions(Array.isArray(actionsList) ? actionsList : []);

      if (data) {
        const parsed = JSON.parse(data) as { balance?: number; history?: unknown[] };
        const rawHistory = Array.isArray(parsed.history) ? parsed.history : [];
        const historyNorm = rawHistory.map((raw) => normalizeTx(raw as Record<string, unknown>));
        setBalance(typeof parsed.balance === 'number' ? parsed.balance : 0);
        setHistory(historyNorm);
      } else {
        const welcome: Transaction = {
          id: 'init',
          type: 'earn',
          amount: 100,
          reason: 'Welcome Bonus',
          createdAt: Date.now(),
        };
        setBalance(100);
        setHistory([welcome]);
        await AsyncStorage.setItem(WALLET_KEY, JSON.stringify({ balance: 100, history: [welcome] }));
      }
    } catch (e) {
      console.error('Wallet load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const persist = useCallback(async (newBalance: number, newHistory: Transaction[]) => {
    try {
      await AsyncStorage.setItem(WALLET_KEY, JSON.stringify({ balance: newBalance, history: newHistory }));
    } catch (e) {
      console.error('Wallet persist error:', e);
    }
  }, []);

  const addTransaction = useCallback(
    async (params: {
      type: 'earn' | 'spend' | 'adjust';
      amount: number;
      reason: string;
      ref?: TransactionRef;
    }) => {
      const { type, reason, ref: refIn } = params;
      let amount = params.amount;
      if (type === 'earn') {
        const { net } = applyFeeRateFn(amount, config);
        amount = net;
      }
      const newTx: Transaction = {
        id: Date.now().toString(),
        type,
        amount,
        reason,
        ref: refIn,
        createdAt: Date.now(),
      };
      const newHistory = [newTx, ...history];
      const delta = type === 'spend' || type === 'adjust' ? -amount : amount;
      const newBalance = balance + delta;
      setBalance(newBalance);
      setHistory(newHistory);
      await persist(newBalance, newHistory);
    },
    [balance, history, persist, config]
  );

  const canRedeem = useCallback(
    (perkId: string): CanRedeemResult => {
      const now = Date.now();
      // Rule 1: Cooldown — same perk in last 24h
      const lastForPerk = verifiedActions.find((a) => a.perkId === perkId);
      if (lastForPerk && now - lastForPerk.createdAt < COOLDOWN_MS) {
        return { allowed: false, reason: 'Cooldown active' };
      }
      // Rule 2: Daily cap — more than 5 redemptions today
      const todayCount = verifiedActions.filter((a) => isSameCalendarDay(a.createdAt)).length;
      if (todayCount >= DAILY_CAP) {
        return { allowed: false, reason: 'Daily limit reached' };
      }
      return { allowed: true };
    },
    [verifiedActions]
  );

  const createVerifiedAction = useCallback(
    async (partnerId: string, perkId: string, points: number): Promise<VerifiedActionRecord> => {
      const actionId = `va_${Date.now()}`;
      const record: VerifiedActionRecord = {
        id: actionId,
        partnerId,
        perkId,
        pointsAwarded: points,
        createdAt: Date.now(),
      };
      const ref: TransactionRef = { actionId, partnerId, perkId };
      await addTransaction({
        type: 'earn',
        amount: points,
        reason: 'Verified Redemption',
        ref,
      });
      setVerifiedActions((prev) => [record, ...prev].slice(0, 100));
      try {
        const existing = await AsyncStorage.getItem(ACTIONS_KEY);
        const list: VerifiedActionRecord[] = existing ? JSON.parse(existing) : [];
        list.unshift(record);
        await AsyncStorage.setItem(ACTIONS_KEY, JSON.stringify(list.slice(0, 100)));
      } catch (e) {
        console.warn('Verified actions persist:', e);
      }
      return record;
    },
    [addTransaction]
  );

  const spend = useCallback(
    async (params: {
      productKey: string;
      refType?: string;
      refId?: string;
      amountExpected: number;
      clientNonce?: string;
    }): Promise<SpendResult> => {
      const policy: OrbinomicsPolicy = DEFAULT_ORBINOMICS_POLICY;
      const rule = policy.burnRules.find((r) => r.productKey === params.productKey);
      if (!rule) {
        return { success: false, reason: 'Product not found' };
      }
      if (params.amountExpected !== rule.costPoints) {
        return { success: false, reason: 'Amount mismatch' };
      }
      if (balance < params.amountExpected) {
        return { success: false, reason: 'Insufficient balance' };
      }
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartMs = todayStart.getTime();
      const reasonCode = PRODUCT_TO_REASON[params.productKey] ?? params.productKey;
      const spendsToday = history.filter(
        (t) => t.type === 'spend' && t.reason === reasonCode && t.createdAt >= todayStartMs
      );
      if (rule.maxPerDay != null && spendsToday.length >= rule.maxPerDay) {
        return { success: false, reason: `Max ${rule.maxPerDay} per day` };
      }
      if (rule.cooldownDays != null) {
        const cooldownMs = rule.cooldownDays * 24 * 60 * 60 * 1000;
        const lastSpend = history.find((t) => t.type === 'spend' && t.reason === reasonCode);
        if (lastSpend && now - lastSpend.createdAt < cooldownMs) {
          return { success: false, reason: `Cooldown: ${rule.cooldownDays} days` };
        }
      }
      const ref: TransactionRef = {};
      if (params.refType === 'drop' && params.refId) ref.perkId = params.refId;
      else if (params.refType === 'quest' && params.refId) ref.actionId = params.refId;
      await addTransaction({
        type: 'spend',
        amount: params.amountExpected,
        reason: reasonCode,
        ref: ref.perkId ?? ref.actionId ? ref : undefined,
      });
      const newBalance = balance - params.amountExpected;
      return { success: true, balance: newBalance };
    },
    [balance, history, addTransaction]
  );

  return (
    <WalletContext.Provider value={{ balance, history, verifiedActions, addTransaction, spend, createVerifiedAction, canRedeem, loading }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWalletContext must be used within a WalletProvider');
  return context;
};
