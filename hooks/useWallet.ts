import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LedgerEntry {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  title: string;
  timestamp: number;
  tier: 'common' | 'rare' | 'apex' | 'legendary';
}

const STORAGE_KEY = 'ORBTAP_WALLET_V1';

export const useWallet = () => {
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setBalance(parsed.balance || 0);
        setLedger(parsed.ledger || []);
      }
    } catch (e) {
      console.error('Wallet load failed', e);
    } finally {
      setLoading(false);
    }
  };

  const saveWallet = async (newBalance: number, newLedger: LedgerEntry[]) => {
    try {
      const data = JSON.stringify({ balance: newBalance, ledger: newLedger });
      await AsyncStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      console.error('Wallet save failed', e);
    }
  };

  const addTransaction = (amount: number, title: string, tier: LedgerEntry['tier'], type: 'earn' | 'spend') => {
    const newBalance = type === 'earn' ? balance + amount : balance - amount;
    const entry: LedgerEntry = {
      id: Date.now().toString(),
      type,
      amount,
      title,
      tier,
      timestamp: Date.now(),
    };
    
    const newLedger = [entry, ...ledger];
    setBalance(newBalance);
    setLedger(newLedger);
    saveWallet(newBalance, newLedger);
  };

  return { balance, ledger, loading, addTransaction };
};
