import { useWalletContext } from '../context/WalletContext';

// This hook now acts as a simple bridge to the Global Context
// This ensures we don't have to rewrite imports in every component
export const useWallet = () => {
  return useWalletContext();
};
