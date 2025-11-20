import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'serverUrl';
const DEFAULT_URL = 'http://192.168.100.35:5000';

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

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [serverUrl, setServerUrlState] = useState<string>(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(true);

  // Load URL from storage on mount
  const loadUrl = useCallback(async () => {
    try {
      console.log('📥 Loading URL from AsyncStorage...');
      const savedUrl = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('📥 Retrieved URL:', savedUrl);
      
      if (savedUrl && savedUrl.startsWith('http')) {
        setServerUrlState(savedUrl);
        console.log('✅ URL loaded:', savedUrl);
      } else {
        console.log('ℹ️  No valid saved URL, using default');
      }
    } catch (error) {
      console.error('❌ Failed to load URL:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadUrl();
  }, [loadUrl]);

  // Save URL to storage and update state
  const setServerUrl = useCallback(async (url: string) => {
    try {
      console.log('💾 Saving new URL:', url);
      
      // Save to AsyncStorage first
      await AsyncStorage.setItem(STORAGE_KEY, url);
      console.log('✅ URL saved to AsyncStorage');
      
      // Verify it was saved
      const verification = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('🔍 Verification:', verification);
      
      if (verification !== url) {
        throw new Error('Verification failed - URL not saved correctly');
      }
      
      // Update state - this will trigger re-renders
      setServerUrlState(url);
      console.log('✅ State updated to:', url);
      
      // Give React time to process the state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ Failed to save URL:', error);
      throw error;
    }
  }, []);

  // Manual reload function
  const reloadUrl = useCallback(async () => {
    console.log('🔄 Manual reload triggered');
    await loadUrl();
  }, [loadUrl]);

  // Log state changes
  useEffect(() => {
    console.log('🌐 Context serverUrl is now:', serverUrl);
  }, [serverUrl]);

  const value = {
    serverUrl,
    setServerUrl,
    reloadUrl,
    isLoading,
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};