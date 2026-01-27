import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLET_KEY = 'ORBTAP_WALLET_V2';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'earn' | 'spend';
}

interface WalletContextType {
  balance: number;
  history: Transaction[];
  addTransaction: (amount: number, description: string) => Promise<void>;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const data = await AsyncStorage.getItem(WALLET_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setBalance(parsed.balance || 0);
        setHistory(Array.isArray(parsed.history) ? parsed.history : []);
      } else {
        // Initial Bonus
        const initialTx = { id: 'init', amount: 100, description: 'Welcome Bonus', date: new Date().toLocaleDateString(), type: 'earn' as const };
        setBalance(100);
        setHistory([initialTx]);
      }
    } catch (e) {
      console.error("Wallet load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (amount: number, description: string) => {
    const newTx: Transaction = {
      id: Date.now().toString(),
      amount,
      description,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      type: amount > 0 ? 'earn' : 'spend'
    };
    
    const newHistory = [newTx, ...history];
    const newBalance = balance + amount;
    
    setBalance(newBalance);
    setHistory(newHistory);
    
    try {
        await AsyncStorage.setItem(WALLET_KEY, JSON.stringify({ balance: newBalance, history: newHistory }));
    } catch (e) {
        console.error("Failed to save wallet:", e);
    }
  };

  return (
    <WalletContext.Provider value={{ balance, history, addTransaction, loading }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWalletContext must be used within a WalletProvider");
  return context;
};
