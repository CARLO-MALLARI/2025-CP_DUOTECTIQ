import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {auth, db} from '../lib/firebase';
import {onAuthStateChanged} from 'firebase/auth';

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
  const [userId, setUserId] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      console.log('👤 Auth state changed:', user?.uid);
      setUserId(user?.uid || null);
    });

    return () => unsubscribe();
  }, []);

  // Load URL from Firestore when userId changes
  const loadUrl = useCallback(async () => {
    if (!userId) {
      console.log('ℹ️  No user logged in, using default URL');
      setServerUrlState(DEFAULT_URL);
      setIsLoading(false);
      return;
    }

    try {
      console.log('📥 Loading URL from Firestore for user:', userId);
      const docRef = doc(db, 'userSettings', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const savedUrl = data.serverUrl;
        console.log('📥 Retrieved URL:', savedUrl);

        if (savedUrl && savedUrl.startsWith('http')) {
          setServerUrlState(savedUrl);
          console.log('✅ URL loaded:', savedUrl);
        } else {
          console.log('ℹ️  No valid saved URL, using default');
          setServerUrlState(DEFAULT_URL);
        }
      } else {
        console.log('ℹ️  No settings document found, using default');
        setServerUrlState(DEFAULT_URL);
      }
    } catch (error) {
      console.error('❌ Failed to load URL:', error);
      setServerUrlState(DEFAULT_URL);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load URL when userId changes
  useEffect(() => {
    loadUrl();
  }, [loadUrl]);

  // Save URL to Firestore and update state
  const setServerUrl = useCallback(
    async (url: string) => {
      if (!userId) {
        throw new Error('User must be logged in to save settings');
      }

      try {
        console.log('💾 Saving new URL:', url);

        // Save to Firestore
        const docRef = doc(db, 'userSettings', userId);
        await setDoc(
          docRef,
          {
            serverUrl: url,
            updatedAt: new Date().toISOString(),
          },
          {merge: true},
        );

        console.log('✅ URL saved to Firestore');

        // Verify it was saved
        const verification = await getDoc(docRef);
        const savedUrl = verification.data()?.serverUrl;
        console.log('🔍 Verification:', savedUrl);

        if (savedUrl !== url) {
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
    },
    [userId],
  );

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
