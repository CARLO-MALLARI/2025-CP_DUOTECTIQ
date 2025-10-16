import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import LoadingOverlay from '../../components/LoadingOverlay';

type AuthNav = NativeStackNavigationProp<AuthStackParamList>;

const SignupScreen: React.FC = () => {
  const navigation = useNavigation<AuthNav>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match!');
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        role,
        address,
        city,
        state,
        zip,
        email: email.trim(),
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Login');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Signup Error', err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.row}>
        <TextInput placeholder="First Name" style={styles.inputHalf} value={firstName} onChangeText={setFirstName} />
        <TextInput placeholder="Last Name" style={styles.inputHalf} value={lastName} onChangeText={setLastName} />
      </View>

      <View style={styles.row}>
        <TextInput
          placeholder="Email"
          style={styles.inputHalf}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Role"
          style={styles.inputHalf}
          value={role}
          onChangeText={setRole}
        />
      </View>

      <View style={styles.row}>
        <TextInput
          placeholder="Password"
          style={styles.inputHalf}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          placeholder="Confirm Password"
          style={styles.inputHalf}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.row}>
        <TextInput placeholder="Address" style={styles.inputHalf} value={address} onChangeText={setAddress} />
        <TextInput placeholder="City" style={styles.inputHalf} value={city} onChangeText={setCity} />
      </View>

      <View style={styles.row}>
        <TextInput placeholder="State" style={styles.inputHalf} value={state} onChangeText={setState} />
        <TextInput
          placeholder="Zip Code"
          style={styles.inputHalf}
          value={zip}
          onChangeText={setZip}
          keyboardType="numeric"
        />
      </View>

      <Button title="Sign Up" onPress={handleSignup} />
      <View style={{ marginTop: 10 }}>
        <Button title="Already have an account? Login" onPress={() => navigation.navigate('Login')} />
      </View>
      <LoadingOverlay visible={loading} message="Creating account..." />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  inputHalf: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
  },
});

export default SignupScreen;
