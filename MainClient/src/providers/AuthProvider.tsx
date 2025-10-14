import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useUserStore } from '../stores/useUserStore';
import LoadingScreen from '../components/LoadingScreen';

type AuthContextType = {
  user: FirebaseUser | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  initializing: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  const setUserStore = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    // Watch Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // persist minimal info in Zustand (which uses AsyncStorage)
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
    <AuthContext.Provider value={{ user, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
