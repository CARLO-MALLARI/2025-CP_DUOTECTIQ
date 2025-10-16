import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useUserStore } from '../stores/useUserStore';
import { doc, onSnapshot } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const uid = useUserStore((s) => s.uid);
  const email = useUserStore((s) => s.email);
  const displayName = useUserStore((s) => s.displayName);
  const setSettings = useUserStore((s) => s.setSettings);
  
  const [remoteData, setRemoteData] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!uid) return;
    
    const docRef = doc(db, 'users', uid);
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : null;
        setRemoteData(data);
        if (data?.darkMode !== undefined) {
          setDarkMode(data.darkMode);
        }
      },
      (err) => console.warn('snapshot err', err)
    );
    
    return () => unsub();
  }, [uid]); // Only depend on uid

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    setSettings({ darkMode: newDarkMode });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello {displayName ?? email}</Text>
      <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
      <Button title="Sign out" onPress={handleSignOut} />
      <Button 
        title={`Toggle dark mode (${darkMode ? 'ON' : 'OFF'})`}
        onPress={handleToggleDarkMode} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 12 },
});

export default HomeScreen;