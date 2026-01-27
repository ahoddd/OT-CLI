import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MapProvider = 'mapbox' | 'native' | 'none';

interface Flags {
  isMapboxEnabled: boolean;
  mapProvider: MapProvider;
  useMockLocation: boolean;
}

interface FlagContextType {
  flags: Flags;
  setMapProvider: (provider: MapProvider) => void;
  toggleMockLocation: () => void;
}

const FlagContext = createContext<FlagContextType | undefined>(undefined);

export const FlagProvider = ({ children }: { children: React.ReactNode }) => {
  // DEFAULT TO 'native' (Apple Maps) TO AVOID CRASH
  const [flags, setFlags] = useState<Flags>({
    isMapboxEnabled: false,
    mapProvider: 'native', 
    useMockLocation: true,
  });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const saved = await AsyncStorage.getItem('ORBTAP_FLAGS');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Force override if it was set to mapbox previously
        if (parsed.mapProvider === 'mapbox') parsed.mapProvider = 'native';
        setFlags(parsed);
      }
    } catch (e) { console.log(e); }
  };

  const saveFlags = async (newFlags: Flags) => {
    setFlags(newFlags);
    await AsyncStorage.setItem('ORBTAP_FLAGS', JSON.stringify(newFlags));
  };

  const setMapProvider = (provider: MapProvider) => {
    saveFlags({ ...flags, mapProvider: provider, isMapboxEnabled: provider === 'mapbox' });
  };

  const toggleMockLocation = () => {
    saveFlags({ ...flags, useMockLocation: !flags.useMockLocation });
  };

  return (
    <FlagContext.Provider value={{ flags, setMapProvider, toggleMockLocation }}>
      {children}
    </FlagContext.Provider>
  );
};

export const useFlags = () => {
  const context = useContext(FlagContext);
  if (!context) throw new Error("useFlags must be used within FlagProvider");
  return context;
};
