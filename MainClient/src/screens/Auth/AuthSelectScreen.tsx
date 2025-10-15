import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useNavigation } from '@react-navigation/native';

type AuthSelectScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'AuthSelect'
>;

const AuthSelectScreen: React.FC = () => {
  const navigation = useNavigation<AuthSelectScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Please choose an option</Text>
      <View style={styles.btnRow}>
        <Button title="Login" onPress={() => navigation.navigate('Login')} />
        <Button title="Sign Up" onPress={() => navigation.navigate('Signup')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-around' },
});

export default AuthSelectScreen;
