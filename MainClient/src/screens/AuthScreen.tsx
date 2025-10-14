import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged listener will handle redirect
    } catch (err: any) {
      Alert.alert('Sign in error', err.message || 'Unknown error');
    }
  };

  const signUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      Alert.alert('Sign up error', err.message || 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome — Sign in</Text>
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <View style={styles.btnRow}>
        <Button title="Sign In" onPress={signIn} />
        <Button title="Create Account" onPress={signUp} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 6, borderColor: '#ccc' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
});

export default AuthScreen;
