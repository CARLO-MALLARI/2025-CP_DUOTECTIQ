import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsContextType = {
  serverUrl: string;
  setServerUrl: (url: string) => void;
};

export const SettingsContext = createContext<SettingsContextType>({
  serverUrl: 'http://10.160.65.143:5000',
  setServerUrl: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [serverUrl, setServerUrlState] = useState('http://10.160.65.143:5000');

  useEffect(() => {
    (async () => {
      const savedUrl = await AsyncStorage.getItem('serverUrl');
      if (savedUrl) setServerUrlState(savedUrl);
    })();
  }, []);

  const setServerUrl = async (url: string) => {
    setServerUrlState(url);
    await AsyncStorage.setItem('serverUrl', url);
  };

  return (
    <SettingsContext.Provider value={{ serverUrl, setServerUrl }}>
      {children}
    </SettingsContext.Provider>
  );
};
