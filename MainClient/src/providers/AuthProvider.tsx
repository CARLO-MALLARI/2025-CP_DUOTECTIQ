import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useUserStore } from '../stores/useUserStore';
import LoadingScreen from '../components/LoadingScreen';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type AuthContextType = {
  user: FirebaseUser | null;
  initializing: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  initializing: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  const setUserStore = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  const handleSignOut = async () => {
    try {
      // 1. Google Sign-Out (clears native picker)
      await GoogleSignin.signOut();
      
      // 2. Firebase Sign-Out (triggers onAuthStateChanged)
      await auth.signOut();
      
      console.log('✅ Complete sign-out successful');
    } catch (error) {
      console.error('❌ Sign-out error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setUserStore({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? null,
          displayName: firebaseUser.displayName ?? null,
        });
      } else {
        clearUser();
      }

      setInitializing(false);
    });

    return unsubscribe;
  }, [setUserStore, clearUser]);

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, initializing, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
