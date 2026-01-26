import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_FLAGS, FeatureFlags, FlagKey } from '../constants/Flags';

type FlagContextType = {
  flags: FeatureFlags;
  setFlag: (key: FlagKey, value: boolean) => void;
  resetFlags: () => void;
  loading: boolean;
};

const FlagContext = createContext<FlagContextType>({
  flags: DEFAULT_FLAGS,
  setFlag: () => {},
  resetFlags: () => {},
  loading: true,
});

export const useFlags = () => useContext(FlagContext);

export const FlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlagsState] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const stored = await AsyncStorage.getItem('ORBTAP_FLAGS');
      if (stored) {
        setFlagsState({ ...DEFAULT_FLAGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load flags', e);
    } finally {
      setLoading(false);
    }
  };

  const saveFlags = async (newFlags: FeatureFlags) => {
    try {
      await AsyncStorage.setItem('ORBTAP_FLAGS', JSON.stringify(newFlags));
    } catch (e) {
      console.error('Failed to save flags', e);
    }
  };

  const setFlag = (key: FlagKey, value: boolean) => {
    const newFlags = { ...flags, [key]: value };
    setFlagsState(newFlags);
    saveFlags(newFlags);
  };

  const resetFlags = () => {
    setFlagsState(DEFAULT_FLAGS);
    saveFlags(DEFAULT_FLAGS);
  };

  return (
    <FlagContext.Provider value={{ flags, setFlag, resetFlags, loading }}>
      {children}
    </FlagContext.Provider>
  );
};
