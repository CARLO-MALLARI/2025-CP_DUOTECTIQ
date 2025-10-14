import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useUserStore } from '../stores/useUserStore';
import { doc, onSnapshot } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const user = useUserStore((s) => ({ uid: s.uid, email: s.email, displayName: s.displayName }));
  const setSettings = useUserStore((s) => s.setSettings);
  const [remoteData, setRemoteData] = useState<any>(null);

  useEffect(() => {
    if (!user.uid) return;
    const docRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        setRemoteData(snapshot.exists() ? snapshot.data() : null);
      },
      (err) => console.warn('snapshot err', err)
    );
    return () => unsub();
  }, [user.uid]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello {user.displayName ?? user.email}</Text>
      <Text>Remote data (from Firestore): {JSON.stringify(remoteData)}</Text>
      <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
      <Button
        title="Sign out"
        onPress={async () => {
          await signOut(auth);
        }}
      />
      <Button title="Toggle dark mode (local cache)" onPress={() => setSettings({ darkMode: !Boolean(remoteData?.darkMode) })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 12 },
});

export default HomeScreen;
