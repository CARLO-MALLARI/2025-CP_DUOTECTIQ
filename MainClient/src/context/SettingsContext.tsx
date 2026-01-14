import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_URL = 'http://192.168.100.33:5000';

type SettingsContextType = {
  serverUrl: string;
  setServerUrl: (url: string) => Promise<void>;
  reloadUrl: () => Promise<void>;
  isLoading: boolean;
};

export const SettingsContext = createContext<SettingsContextType>({
  serverUrl: DEFAULT_URL,
  setServerUrl: async () => {},
  reloadUrl: async () => {},
  isLoading: true,
});

export const SettingsProvider = ({children}: {children: ReactNode}) => {
  const [serverUrl, setServerUrlState] = useState<string>(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(true);
  const STORAGE_KEY = 'server_url';

  // Load URL from AsyncStorage on mount
  const loadUrl = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedUrl = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedUrl && savedUrl.startsWith('http')) {
        setServerUrlState(savedUrl);
        console.log('✅ Loaded server URL from storage:', savedUrl);
      } else {
        setServerUrlState(DEFAULT_URL);
        console.log('ℹ️ No saved URL, using default:', DEFAULT_URL);
      }
    } catch (error) {
      console.error('❌ Failed to load server URL:', error);
      setServerUrlState(DEFAULT_URL);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUrl();
  }, [loadUrl]);

  // Save URL to AsyncStorage and update state
  const setServerUrl = useCallback(async (url: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, url.trim());
      setServerUrlState(url.trim());
      console.log('💾 Server URL saved locally:', url.trim());
    } catch (error) {
      console.error('❌ Failed to save server URL:', error);
    }
  }, []);

  // Manual reload
  const reloadUrl = useCallback(async () => {
    console.log('🔄 Reloading server URL from storage');
    await loadUrl();
  }, [loadUrl]);

  const value = {
    serverUrl,
    setServerUrl,
    reloadUrl,
    isLoading,
  };

  if (isLoading) return null; // or a loading spinner

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
