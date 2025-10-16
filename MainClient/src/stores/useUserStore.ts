import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserSettings {
  darkMode?: boolean;
}

export type UserState = {
  uid?: string | null;
  email?: string | null;
  displayName?: string | null;
  token?: string | null;
  settings: { darkMode: boolean };
  setUser: (user: Partial<UserState>) => void;
  clearUser: () => void;
  setSettings: (partial: Partial<UserState['settings']>) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      uid: null,
      email: null,
      displayName: null,
      token: null,
      settings: { darkMode: false },

      setUser: (user: Partial<UserState>) =>
        set((s: UserState) => ({
          ...s,
          ...user,
        })),

      clearUser: () =>
        set(() => ({
          uid: null,
          email: null,
          displayName: null,
          token: null,
        })),

      setSettings: (partial: Partial<UserState['settings']>) =>
        set((s: UserState) => ({
          settings: { ...s.settings, ...partial },
        })),
    }),
    {
      name: 'users',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
